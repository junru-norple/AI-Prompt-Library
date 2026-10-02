/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';

  const synonyms = Object.freeze({
    '元件': 'component 元件', '组件': 'component 组件',
    '動畫': 'animation motion 動畫', '动画': 'animation motion 动画',
    '動效': 'animation motion 動效', '动效': 'animation motion 动效',
    '拖曳': 'drag draggable 拖曳', '拖拽': 'drag draggable 拖拽',
    '滾動': 'scroll 滾動', '滚动': 'scroll 滚动',
    '按鈕': 'button 按鈕', '按钮': 'button 按钮',
    '卡片': 'card 卡片', '輸入': 'input 輸入', '输入': 'input 输入',
    '文字': 'text typography 文字', '背景': 'background 背景',
    '離線': 'offline local 離線', '离线': 'offline local 离线'
  });

  function normalizeQuery(value) {
    let text = String(value || '').normalize('NFKC').toLocaleLowerCase('zh-Hant');
    for (const [key, replacement] of Object.entries(synonyms)) text = text.replaceAll(key, ` ${replacement} `);
    return text.replace(/[^\p{L}\p{N}+#.\-]+/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  const terms = (value) => normalizeQuery(value).split(/\s+/).filter(Boolean);
  const asArray = (value) => Array.isArray(value) ? value : [];

  function matchesFilters(entry, filters = {}) {
    if (filters.source && entry.source_id !== filters.source) return false;
    if (filters.type && entry.animation_type !== filters.type && entry.component_type !== filters.type) return false;
    if (filters.interaction && !asArray(entry.interactions).includes(filters.interaction)) return false;
    if (filters.stack && !asArray(entry.stack).includes(filters.stack)) return false;
    if (filters.license && entry.source_license !== filters.license) return false;
    if (filters.offline && entry.offline_status !== filters.offline) return false;
    return true;
  }

  function scoreEntry(entry, queryTerms, phrase) {
    if (!queryTerms.length) return entry.source_id === 'animejs-live-ui' ? 10 : 9;
    const title = normalizeQuery(`${entry.title || ''} ${entry.title_zh || ''}`);
    const fields = normalizeQuery(`${entry.animation_type || ''} ${entry.component_type || ''} ${asArray(entry.interactions).join(' ')} ${asArray(entry.stack).join(' ')}`);
    const blob = normalizeQuery(`${entry.catalog_search_text || ''} ${entry.summary || ''} ${asArray(entry.use_cases).join(' ')}`);
    let score = 0;
    for (const term of queryTerms) {
      if (title.includes(term)) score += 34;
      if (fields.includes(term)) score += 20;
      if (blob.includes(term)) score += 10;
    }
    if (phrase && blob.includes(phrase)) score += 12;
    if (entry.offline_status === 'verified-local-preview') score += 5;
    return score;
  }

  function searchEntries(entries, query, filters = {}, sort = 'relevance') {
    const queryTerms = terms(query);
    const phrase = normalizeQuery(query);
    const ranked = asArray(entries).filter((entry) => {
      if (!matchesFilters(entry, filters)) return false;
      if (!queryTerms.length) return true;
      const blob = normalizeQuery(`${entry.catalog_search_text || ''} ${entry.title || ''} ${entry.title_zh || ''} ${entry.summary || ''}`);
      return queryTerms.every((term) => blob.includes(term));
    }).map((entry) => ({ entry, score: scoreEntry(entry, queryTerms, phrase) }));

    ranked.sort((left, right) => {
      const a = left.entry;
      const b = right.entry;
      if (sort === 'title') return String(a.title_zh || a.title).localeCompare(String(b.title_zh || b.title), 'zh-Hant');
      if (sort === 'source') return String(a.source_id).localeCompare(String(b.source_id)) || String(a.title).localeCompare(String(b.title));
      if (sort === 'type') return String(a.animation_type).localeCompare(String(b.animation_type)) || String(a.title).localeCompare(String(b.title));
      return right.score - left.score || String(a.title).localeCompare(String(b.title));
    });
    return ranked;
  }

  function codeRecord(codeStore, id) {
    const records = codeStore && codeStore.entries;
    return Array.isArray(records) ? records.find((record) => record && record.id === id) || null : null;
  }

  function getPreviewAccess(entry) {
    if (!entry) return { allowed: false, reason: '找不到 Live UI 項目。', url: '' };
    if (entry.preview_access_verified !== true) return { allowed: false, reason: '此項目尚未通過本機預覽存取驗證。', url: '' };
    const url = safeLocalPreview(entry.local_entry);
    if (!url) return { allowed: false, reason: '預覽路徑未通過本機安全驗證。', url: '' };
    return { allowed: true, reason: '本機預覽、來源範圍與路徑均已驗證。', url };
  }

  function getCodeAccess(entry, codeStore, catalogHash) {
    if (!entry) return { allowed: false, reason: '找不到 Live UI 項目。', record: null };
    if (entry.code_access_verified !== true) return { allowed: false, reason: '此項目尚未通過本機程式碼存取驗證。', record: null };
    if (!codeStore || codeStore.content_hash !== catalogHash) return { allowed: false, reason: '程式碼資料與 Live UI 索引版本不一致。', record: null };
    const record = codeRecord(codeStore, entry.id);
    if (!record || record.source_id !== entry.source_id || record.content_hash !== entry.content_hash) return { allowed: false, reason: '程式碼來源定位或雜湊不一致。', record: null };
    if (!Array.isArray(record.files) || !record.files.length || record.files.some((file) => typeof file.content !== 'string' || !file.path)) return { allowed: false, reason: '主要程式碼檔案不完整。', record: null };
    const expectedPaths = asArray(entry.source_paths);
    const recordPaths = record.files.map((file) => String(file.path));
    const unsafePath = recordPaths.some((filePath) => {
      const segments = filePath.replace(/\\/g, '/').split('/');
      return /^[A-Za-z]:|^\//.test(filePath) || segments.some((segment) => !segment || segment === '.' || segment === '..');
    });
    if (unsafePath || expectedPaths.length !== recordPaths.length || expectedPaths.some((filePath, index) => filePath !== recordPaths[index])) {
      return { allowed: false, reason: '程式碼檔案清單與來源 metadata 不一致。', record: null };
    }
    return { allowed: true, reason: '授權、來源與本機預覽均已驗證。', record };
  }

  function buildCodeBundle(entry, record) {
    if (!entry || !record) return '';
    const warning = record.requires_safety_rewrite
      ? '注意：上游程式碼含已標記的遠端素材、框架或範例風險；請先依 metadata 做安全改寫，不要原樣執行。'
      : '注意：這是可追溯的上游主要程式碼；請先檢查目標專案與相依套件，不要自動安裝或部署。';
    const header = [
      `來源：${entry.source_id}`,
      `Commit：${entry.source_commit}`,
      `授權：${entry.source_license}`,
      `來源檔案：${asArray(entry.source_paths).join(', ')}`,
      warning
    ].join('\n');
    const body = record.files.map((file) => `\n\n===== ${file.path} =====\n${file.content}`).join('');
    return `${header}${body}`;
  }

  function buildCodexHandoff(entry) {
    if (!entry) return '';
    const files = asArray(entry.source_paths).map((file) => `- ${file}`).join('\n');
    const dependencies = asArray(entry.dependency_manifest).map((dependency) =>
      `- ${dependency.name}${dependency.version ? ` @ ${dependency.version}` : ''}｜${dependency.license || '授權待確認'}｜${dependency.scope || 'project-only'}`
    ).join('\n');
    const risks = asArray(entry.risk_flags).length ? asArray(entry.risk_flags).join(', ') : '無額外標記';
    return `使用 prompt-library 的 Live UI 動畫庫，安全整合來源 [${entry.source_id}] 的 [${entry.title}]。\n\n來源 repository：${entry.source_repository}\nCommit：${entry.source_commit}\n授權：${entry.source_license}\n來源定位：\n${files}\n\n必要相依：\n${dependencies}\n\n已知風險：${risks}\n\n請先讀取我指定的目標專案與現有技術棧，再做最小必要修改。移除或替換遠端素材、Pro／付款／登入／部署／外部服務連結與不必要的安裝指令；保留來源、commit、授權與檔案清單。多檔元件必須列出並處理全部必要檔案，不得暗示只複製單一檔案即可。\n\n預期產出：${entry.expected_output}\n查看方式：${entry.how_to_view_result}\n\n先提供整合計畫與改寫後程式碼，不要執行、不要部署、不要寫入永久推薦；只有我明確授權後才能修改目標專案。`;
  }

  function safeHttpsUrl(value) {
    const text = String(value || '');
    try {
      const url = new URL(text);
      if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com' || url.username || url.password) return '';
      const repository = url.pathname.split('/').filter(Boolean).slice(0, 2).join('/').toLowerCase();
      const allowedRepositories = new Set([
        'greensock/gsap',
        'juliangarnier/anime',
        'kokonut-labs/kokonutui',
        'neobrutalism/neobrutalism',
        'magicuidesign/magicui',
        'educlopez/smoothui'
      ]);
      return allowedRepositories.has(repository) ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function safeLocalPreview(value) {
    const text = String(value || '').trim();
    if (!text || text.includes('\\') || text.includes('\0') || !/^[A-Za-z0-9._~!$&'()*+,;=:@/?#%-]+$/u.test(text)) return '';
    const pathname = text.split(/[?#]/u)[0];
    const originalPreview = /^\.\.\/references\/original\/cinematic-web\/packages\/[A-Za-z0-9._-]+\/index\.html$/u.test(pathname);
    if (originalPreview) return text;
    let decodedPath = '';
    try { decodedPath = decodeURIComponent(pathname); } catch (_) { return ''; }
    const segments = decodedPath.split('/');
    if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return '';
    const atlasPreview = /^(?:live-ui|unified-previews)\/[A-Za-z0-9._/-]+$/u.test(pathname);
    return atlasPreview ? text : '';
  }

  function safeLocalSource(value) {
    const text = String(value || '').trim();
    if (!text || text.includes('\\') || text.includes('\0')) return '';
    const match = text.match(/^\.\.\/references\/(?:community\/(?:animejs-live-ui|kokonut-ui-oss|retro-ui-oss|magic-ui-oss|smooth-ui-oss|kinetics|aether-css)|original\/cinematic-web)\/(?<path>[A-Za-z0-9._/-]+)$/u);
    if (!match) return '';
    const segments = match.groups.path.split('/');
    return segments.every((segment) => segment && !segment.startsWith('.') && segment !== 'node_modules') ? text : '';
  }

  window.LiveUiCatalogCore = Object.freeze({
    normalizeQuery,
    searchEntries,
    getPreviewAccess,
    getCodeAccess,
    buildCodeBundle,
    buildCodexHandoff,
    safeHttpsUrl,
    safeLocalPreview,
    safeLocalSource
  });
})();
