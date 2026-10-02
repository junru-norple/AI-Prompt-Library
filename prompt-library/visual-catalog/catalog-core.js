/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';

  const normalizeQuery = (value) => String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('zh-Hant')
    .replace(/[^\p{L}\p{N}+#.-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const queryTerms = (value) => normalizeQuery(value).split(/\s+/).filter(Boolean);
  const asArray = (value) => Array.isArray(value) ? value : [];
  const isVerifiedLicenseStatus = (value) => /^verified(?:$|[-_])/i.test(String(value || ''));

  function matchesFilters(entry, filters = {}) {
    if (filters.source && entry.source_id !== filters.source) return false;
    if (filters.type && entry.page_type !== filters.type) return false;
    if (filters.profile && entry.design_profile !== filters.profile) return false;
    if (filters.stack && !asArray(entry.stack).includes(filters.stack)) return false;
    if (filters.license && entry.source_license !== filters.license) return false;
    if (filters.trust && entry.source_tier !== filters.trust) return false;
    return true;
  }

  function scoreEntry(entry, terms, phrase) {
    const quality = Number(entry.quality_score || 0);
    if (!terms.length) return quality;
    const title = normalizeQuery(`${entry.normalized_title || entry.title} ${asArray(entry.tags).join(' ')}`);
    const bilingual = normalizeQuery(`${asArray(entry.bilingual_tags).join(' ')} ${asArray(entry.bilingual_search_terms).join(' ')}`);
    const fields = normalizeQuery(`${entry.prompt_type || ''} ${entry.design_profile || ''} ${entry.page_type || ''} ${asArray(entry.technology_stack || entry.stack).join(' ')}`);
    const blob = String(entry.catalog_search_text || '').toLocaleLowerCase('zh-Hant');
    let score = quality / 20;
    terms.forEach((term) => {
      if (title.includes(term)) score += 32;
      if (bilingual.includes(term)) score += 24;
      if (fields.includes(term)) score += 14;
      if (blob.includes(term)) score += 8;
    });
    if (phrase && blob.includes(phrase)) score += 12;
    return score;
  }

  function applySoftDiversity(ranked) {
    if (ranked.length < 4) return ranked;
    const firstSources = new Set(ranked.slice(0, 2).map((item) => item.entry.source_id));
    if (!firstSources.has(ranked[2].entry.source_id)) return ranked;
    const thirdScore = ranked[2].score;
    const candidateIndex = ranked.slice(3, 12).findIndex((item) =>
      !firstSources.has(item.entry.source_id) && thirdScore - item.score <= 2
    );
    if (candidateIndex < 0) return ranked;
    const actualIndex = candidateIndex + 3;
    const candidate = ranked.splice(actualIndex, 1)[0];
    ranked.splice(2, 0, candidate);
    return ranked;
  }

  function searchEntries(entries, query, filters = {}, sort = 'relevance') {
    const terms = queryTerms(query);
    const phrase = normalizeQuery(query);
    const ranked = asArray(entries).filter((entry) => {
      if (!matchesFilters(entry, filters)) return false;
      if (!terms.length) return true;
      const blob = String(entry.catalog_search_text || '').toLocaleLowerCase('zh-Hant');
      return terms.every((term) => blob.includes(term));
    }).map((entry) => ({ entry, score: scoreEntry(entry, terms, phrase) }));

    ranked.sort((left, right) => {
      const a = left.entry;
      const b = right.entry;
      if (sort === 'recent') return String(b.source_commit_date || '').localeCompare(String(a.source_commit_date || '')) || right.score - left.score;
      if (sort === 'source') return String(a.source_id || '').localeCompare(String(b.source_id || '')) || right.score - left.score;
      if (sort === 'profile') return String(a.design_profile || '').localeCompare(String(b.design_profile || '')) || right.score - left.score;
      return right.score - left.score || Number(b.quality_score || 0) - Number(a.quality_score || 0) || String(a.title || '').localeCompare(String(b.title || ''));
    });
    return sort === 'relevance' ? applySoftDiversity(ranked) : ranked;
  }

  function promptRecord(promptStore, id) {
    const records = promptStore && promptStore.entries;
    if (Array.isArray(records)) return records.find((record) => record && record.id === id) || null;
    if (records && typeof records === 'object') return records[id] || null;
    return null;
  }

  function getPromptAccess(entry, promptStore, catalogHash) {
    if (!entry) return { allowed: false, reason: '找不到目錄項目。', record: null };
    if (entry.index_enabled !== true) return { allowed: false, reason: '此來源未啟用索引。', record: null };
    if (!entry.source_license || !isVerifiedLicenseStatus(entry.license_status)) return { allowed: false, reason: '授權尚未驗證。', record: null };
    if (entry.local_prompt_available !== true) return { allowed: false, reason: '本機 Prompt 檔案不可用。', record: null };
    if (!promptStore || promptStore.content_hash !== catalogHash) return { allowed: false, reason: '全文資料與目錄索引版本不一致。', record: null };
    const record = promptRecord(promptStore, entry.id);
    if (!record) return { allowed: false, reason: '全文資料中沒有此 Prompt。', record: null };
    if (record.source_id !== entry.source_id || record.relative_path !== entry.relative_path) return { allowed: false, reason: '全文來源定位與目錄不一致。', record: null };
    if (!entry.content_hash || record.content_hash !== entry.content_hash) return { allowed: false, reason: 'Prompt 內容雜湊不一致。', record: null };
    if (typeof record.prompt_text !== 'string' || !record.prompt_text.length) return { allowed: false, reason: 'Prompt 全文為空。', record: null };
    const localPath = String(record.local_file_url || '');
    const referencePath = /^\.\.\/references\/(?:community|original)\/[A-Za-z0-9._\/-]+$/u.test(localPath)
      && !localPath.slice(3).split('/').some((segment) => segment === '.' || segment === '..' || !segment);
    const promptRecordId = entry.source_id === 'prompts-chat' && /^prompts-chat:[a-f0-9]{16}$/u.test(entry.id)
      ? entry.id.slice('prompts-chat:'.length) : '';
    const exactCsvRecordPath = Boolean(promptRecordId)
      && localPath === `../direct-use-assets/prompts/prompts-chat/${promptRecordId}.txt`
      && entry.action_capabilities?.can_copy === true
      && entry.action_capabilities?.local_source_path === localPath;
    if (!referencePath && !exactCsvRecordPath) return { allowed: false, reason: '本機來源路徑不符合安全邊界。', record: null };
    return { allowed: true, reason: '授權與本機來源均已驗證。', record };
  }

  function getOriginalPrompt(entry, promptStore, catalogHash) {
    const access = getPromptAccess(entry, promptStore, catalogHash);
    return access.allowed ? access.record.prompt_text : '';
  }

  function buildCodexHandoff(entry) {
    if (!entry) return '';
    return `使用 prompt-library，讀取來源 [${entry.source_id}]、原始路徑 [${entry.relative_path}] 的 Prompt。\n\n請依照我接下來提供的目標進行安全改寫。移除自動安裝、部署、帳號、付款、API Key、遠端素材與危險命令，保留來源與授權 metadata。\n\n先提供改寫結果，不要執行，也不要永久保存；只有我明確表示採用後才能寫入永久推薦。`;
  }

  function safeHttpsUrl(value) {
    const text = String(value || '');
    return /^https:\/\/[^\s]+$/i.test(text) ? text : '';
  }

  function upstreamUrl(entry) {
    if (!entry) return '';
    const direct = safeHttpsUrl(entry.upstream_file_url);
    if (direct) return direct;
    return safeHttpsUrl(String(entry.repo_url || '').replace(/\.git$/i, ''));
  }

  window.PromptCatalogCore = Object.freeze({
    normalizeQuery,
    queryTerms,
    searchEntries,
    isVerifiedLicenseStatus,
    getPromptAccess,
    getOriginalPrompt,
    buildCodexHandoff,
    safeHttpsUrl,
    upstreamUrl
  });
})();
