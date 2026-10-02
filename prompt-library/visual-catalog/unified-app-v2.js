/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';

  const runtimeStartedAt = performance.now();

  const index = window.UNIFIED_INDEX_V2 || { entries: [], entry_count: 0, facets: {}, content_hash: 'missing', generated_at: '' };
  const core = window.UnifiedSearchCoreV2;
  const technicalMarkerRegistry = window.TECHNICAL_MARKER_REGISTRY || { records: [] };
  const entries = Array.isArray(index.entries) ? index.entries : [];
  const DISABLED_SOURCE_ID = '';
  const privateEntryCount = 0;
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const technicalMarkerById = new Map(asArraySafe(technicalMarkerRegistry.records).map((record) => [record.id, record]));
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function asArraySafe(value) {
    return Array.isArray(value) ? value : [];
  }

  const elements = {
    view: $('#unified-view'),
    query: $('#unified-query'),
    form: $('#unified-search-form'),
    results: $('#unified-results'),
    empty: $('#unified-empty'),
    count: $('#unified-result-count'),
    activeState: $('#unified-active-state'),
    loadMore: $('#unified-load-more'),
    clear: $('#unified-clear'),
    sort: $('#unified-sort'),
    filterSummary: $('#unified-filter-summary'),
    detail: $('#unified-detail-dialog'),
    guide: $('#guided-dialog'),
    compareTray: $('#compare-tray'),
    compareDialog: $('#compare-dialog'),
    compareGrid: $('#compare-grid'),
    copyStatus: $('#unified-copy-status')
  };

  const filterElements = Object.freeze({
    content_type: $('#unified-content-type'),
    output_type: $('#unified-output-type'),
    style: $('#unified-style'),
    interaction: $('#unified-interaction'),
    technology: $('#unified-technology'),
    source: $('#unified-source'),
    license: $('#unified-license'),
    offline: $('#unified-offline'),
    preview_available: $('#unified-preview'),
    execution_level: $('#unified-execution'),
    example_status: $('#unified-example-status')
  });

  const CONTENT_LABELS = Object.freeze({
    prompt: '提示詞', 'live-ui': '即時介面', 'artifact-example': '成果實例', workflow: '工作流',
    skill: '技能', 'design-system': '設計系統', theme: '主題', template: '範本',
    'external-reference': '外部參考'
  });
  const OUTPUT_LABELS = Object.freeze({
    'web-page': '網頁', 'ui-component': '介面元件', 'motion-effect': '動效', pptx: 'PPTX', image: '圖片',
    video: '影片', audio: '音訊', '3d': '3D', 'comfy-workflow': 'ComfyUI Workflow',
    'github-profile': 'GitHub Profile', readme: 'README', document: '文件', 'analysis-text': '分析文字',
    'code-project': '程式專案', other: '其他'
  });
  const EXECUTION_LABELS = Object.freeze({
    READY_OFFLINE: '可直接離線查看', LOCAL_BUILD_REQUIRED: '需要本機建置', EXTERNAL_APP_REQUIRED: '需要外部應用程式',
    MODEL_ASSETS_REQUIRED: '需要模型資產', HOSTED_SERVICE_REQUIRED: '需要託管服務', METADATA_ONLY: '僅中繼資料'
  });
  const EXAMPLE_LABELS = Object.freeze({
    VERIFIED: '成果已驗證', AVAILABLE: '成果可用', PENDING: '等待代表性成果', BLOCKED: '成果受阻',
    STALE: '成果已過期', NOT_APPLICABLE: '未附成果預覽'
  });
  const PREVIEW_LABELS = Object.freeze({
    'live-iframe': '即時互動預覽', 'static-screenshot': '靜態截圖', 'artifact-html': '本機成果',
    'slide-thumbnails': '投影片縮圖', 'workflow-graph': '工作流圖', 'image-preview': '圖片預覽',
    'video-preview': '影片預覽', 'before-after': '前後比較', 'source-preview': '來源預覽',
    'metadata-only': '未附成果預覽', none: '無預覽'
  });
  const INTENT_LABELS = Object.freeze({
    general: '跨類型搜尋', web: '網頁體驗', ui: '介面元件', motion: '互動與動效', ppt: '簡報成果',
    'comfy-workflow': 'ComfyUI 工作流', 'github-profile': 'GitHub / README', 'design-system': '設計系統',
    skill: 'Agent 技能', image: '圖片產出', 'video-audio-3d': '影片／音訊／3D'
  });
  const VIEW_LABELS = Object.freeze({
    explore: '全部成果', outcomes: '成果實例與工作流', systems: '技能與設計系統', prompt: '提示詞', live: '即時介面／動效'
  });
  const PPT_KIND_LABELS = Object.freeze({
    ENTRY_SPECIFIC_DECK: '實際簡報成果',
    ENTRY_SPECIFIC_CORRECTED_DECK: '實際簡報成果 · 本機修正版',
    STYLE_SPECIFIC_REUSABLE_TEMPLATE: '風格專屬模板',
    GLOBAL_LANDSCAPE_TEMPLATE: '通用橫式模板',
    GLOBAL_PORTRAIT_TEMPLATE: '通用直式模板',
    SOURCE_FILE: '簡報來源規格',
    PROMPT_OR_SKILL_INSTRUCTION: '簡報 Prompt／Skill',
    NO_PPTX_AVAILABLE: '尚無實際 PPTX'
  });

  const state = {
    view: 'explore',
    ranked: [],
    visible: 48,
    selected: null,
    compareIds: [],
    guideStep: 0,
    renderQueued: false,
    lastSearchMs: 0
  };

  const INLINE_PREVIEW_MAX_ACTIVE = 6;
  const INLINE_PREVIEW_WARM_ITEM_LIMIT = 33;
  const INLINE_PREVIEW_ROOT_MARGIN = '960px 0px';
  const inlinePreviewHosts = new Set();
  const inlinePreviewActive = new Set();
  const inlinePreviewLoadStarted = new WeakMap();
  const inlinePreviewLoadTimes = [];
  const inlinePreviewFrameTimes = [];
  const inlinePreviewVisibleReadyTimes = [];
  const inlinePreviewLongTaskDurations = [];
  const inlinePreviewVisibleStarted = new WeakMap();
  let inlinePreviewObserver = null;
  let inlinePreviewFrame = 0;
  let inlinePreviewScheduledAt = 0;
  let inlinePreviewScrollY = window.scrollY;
  let inlinePreviewScrollDirection = 0;
  if ('PerformanceObserver' in window) {
    try {
      const inlinePreviewLongTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => inlinePreviewLongTaskDurations.push(entry.duration));
        if (inlinePreviewLongTaskDurations.length > 240) inlinePreviewLongTaskDurations.splice(0, inlinePreviewLongTaskDurations.length - 240);
      });
      inlinePreviewLongTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (_) { /* Long Task API is optional. */ }
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function nonEmpty(value, fallback = '—') {
    const text = String(value ?? '').trim();
    return text || fallback;
  }

  function makeElement(tag, className = '', text = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== '') element.textContent = String(text);
    return element;
  }

  function appendTextList(container, values, className = 'chip', limit = 8) {
    const list = [...new Set(asArray(values).map((value) => String(value || '').trim()).filter(Boolean))].slice(0, limit);
    if (!list.length) {
      container.append(makeElement('span', className, '未標記'));
      return;
    }
    list.forEach((value) => container.append(makeElement('span', className, value)));
  }

  const MARKER_CLASS_LABELS = Object.freeze({
    INFO: '資訊', LIMITATION: '下載後限制', BLOCKED: 'Library 內封鎖', FIXED: '已處理', EXCLUDED: '已排除'
  });

  function renderTechnicalMarkers(container, entry) {
    const dependencyList = [...new Set(asArray(entry.dependencies).map((value) => String(value || '').trim()).filter(Boolean))];
    dependencyList.forEach((value) => container.append(makeElement('span', 'chip', value)));
    const storedMarkers = new Map(asArray(entry.technical_markers).map((record) => [String(record?.key || ''), record]));
    const uniqueMarkerIds = [...new Set(asArray(entry.risk_flags).map((value) => String(value || '').trim()).filter(Boolean))];
    uniqueMarkerIds.forEach((id) => {
      const record = technicalMarkerById.get(id);
      if (!record) {
        const unresolved = makeElement('span', 'badge badge-marker badge-marker-blocked', `未分類技術標記 · ${id}`);
        unresolved.dataset.markerKey = id;
        unresolved.dataset.markerClass = 'UNCLASSIFIED';
        container.append(unresolved);
        return;
      }
      const classification = String(record.classification || 'INFO');
      const classLabel = MARKER_CLASS_LABELS[classification] || classification;
      const stored = storedMarkers.get(id) || {};
      const labelZhTw = nonEmpty(stored.name_zh_tw || record.name_zh_tw, '已驗證技術提醒');
      const labelEn = nonEmpty(stored.name_en || record.name_en, 'Verified technical note');
      const behaviorZhTw = nonEmpty(stored.entry_specific_note_zh_tw || stored.remediation_zh_tw || record.library_behavior_zh_tw, '此標記不會觸發未揭露的 Library 行為。');
      const behaviorEn = nonEmpty(stored.entry_specific_note_en || stored.remediation_en || record.library_behavior_en, 'This marker triggers no undisclosed Library behavior.');
      const marker = makeElement('span', `badge badge-marker badge-marker-${classification.toLowerCase()}`, `已驗證提醒（${classLabel}） · ${labelZhTw}：${behaviorZhTw}`);
      marker.dataset.markerKey = id;
      marker.dataset.markerClass = classification;
      marker.title = `${labelZhTw}／${labelEn} — ${behaviorZhTw} / ${behaviorEn}`;
      container.append(marker);
    });
    if (!dependencyList.length && !uniqueMarkerIds.length) container.append(makeElement('span', 'chip', '無額外相依或技術提醒'));
  }

  function labelFor(map, value) {
    return map[value] || nonEmpty(value);
  }

  function licenseStatusLabel(value) {
    const status = String(value || '');
    const labels = {
      verified_official_site_declaration: '已依官方固定版本授權聲明完成驗證／Verified against the pinned official license declaration',
      verified: '授權已驗證／License verified',
      'verified-inherited-root': '已依固定版本根授權驗證／Verified from the pinned root license',
      'verified-item-declaration': '已依固定項目授權聲明驗證／Verified from the pinned item declaration'
    };
    return labels[status] || (/^verified(?:$|[-_])/iu.test(status) ? '授權已驗證／License verified' : nonEmpty(status));
  }

  function sourceDisplay(entry) {
    return entry.source_id === DISABLED_SOURCE_ID ? '公開內容' : nonEmpty(entry.source_name, entry.source_id);
  }

  function externalSourceUrl(value) {
    try {
      const url = new URL(String(value || ''));
      if (url.protocol !== 'https:' || url.username || url.password) return '';
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) return '';
      return url.href;
    } catch (_) { return ''; }
  }

  function sourceStatusLabel(value) {
    const labels = {
      PINNED_ENTRY_FILE_LINK_PLUS_PROJECT_LINK: '固定版本的單筆來源與上游專案／Pinned entry source and upstream project',
      OFFLINE_FIRST_PARTY_ENTRY_PROOF_PLUS_LOCAL_PROJECT_CATALOG: '本機原創來源證明／Local first-party source proof',
      PROJECT_LINK_PLUS_LOCAL_FIXED_SOURCE_PROOF: '上游專案與本機來源證明／Upstream project and local source proof',
      OFFLINE_ENTRY_PROOF_PLUS_PINNED_DATASET_LINK: '離線單筆來源證明與固定版本完整資料集／Offline entry proof and pinned full dataset',
      PINNED_SOURCE_AND_OFFLINE_ENTRY_MAPPING_VERIFIED: '固定來源與本機單筆對應已核對／Pinned source and local entry mapping checked',
      LOCAL_FIRST_PARTY_SOURCE_MAPPING_VERIFIED: '本機原創來源對應已核對／Local first-party source mapping checked',
      UPSTREAM_DID_NOT_SUPPLY_ENTRY_LEVEL_CREATOR: '上游未提供個別作者／Individual creator not supplied by upstream',
      UPSTREAM_EXPLICIT_ENTRY_AUTHOR: '上游明確署名作者／Explicitly credited upstream creator',
      FIRST_PARTY_PROJECT_CREATOR: '本專案原創內容／Created by this project',
      LOCAL_ADAPTATION_SEPARATELY_LABELED_FROM_UPSTREAM_SOURCE: '本機改作另行標示／Local adaptation disclosed separately',
      SANITIZED_LOCAL_ADAPTATION: '已清理本機絕對路徑（SANITIZED_LOCAL_ADAPTATION）',
      FIXED_UPSTREAM_CONTENT_WITHOUT_CREATOR_REASSIGNMENT: '保留固定版本原文與來源角色／Pinned original text and source roles preserved',
      FIRST_PARTY_ORIGINAL_NOT_AN_UPSTREAM_ADAPTATION: '本專案原創／First-party original'
    };
    return labels[value] || (/^[A-Z][A-Z0-9_]+$/.test(String(value || '')) ? '詳見單筆來源證明／See the entry source proof' : nonEmpty(value));
  }

  function originalLanguage(value) {
    const text = String(value || '');
    if (/[个这为发与实动产开关现进过还从对将应会经数画网见标签类场预输结说线赖远软据页变体择击达条显览东门间时点处样让组许无复设图库边项档层声总术统维归压测简师趋]/u.test(text)) return 'zh-Hans';
    return /[\u3400-\u9fff]/u.test(text) ? 'zh-Hant' : 'en';
  }

  function pathIsLocal(path) {
    const value = String(path || '').trim();
    return Boolean(value)
      && !/^(?:[a-z][a-z0-9+.-]*:|[\/#?])/i.test(value)
      && !value.includes('\\')
      && !value.includes('\0');
  }

  function runtimePreviewPath(value) {
    const previewPath = String(value || '');
    return previewPath;
  }

  function exampleStatus(entry) {
    return core.exampleFreshness ? core.exampleFreshness(entry).status : entry.example_status;
  }

  function previewIsAvailable(entry) {
    return entry.action_capabilities?.can_preview === true
      && pathIsLocal(entry.example_path)
      && !['metadata-only', 'none'].includes(String(entry.preview_type || ''))
      && !['BLOCKED', 'PENDING', 'NOT_APPLICABLE', 'STALE'].includes(String(exampleStatus(entry) || ''));
  }

  function setLink(link, href, label) {
    link.textContent = label;
    link.hidden = !href;
    link.removeAttribute('aria-disabled');
    if (href) {
      link.href = href;
      link.dataset.atlasAction = 'OPEN_PREVIEW';
      link.removeAttribute('aria-disabled');
      link.tabIndex = 0;
    } else {
      link.removeAttribute('href');
      link.removeAttribute('data-atlas-action');
      link.tabIndex = -1;
    }
  }

  function setDirectAssetLink(selector, asset, fallbackLabel) {
    const link = $(selector);
    const downloadable = asset && pathIsLocal(asset.path) && asset.download === true;
    const configured = downloadable && window.ATLAS_DOWNLOAD_RUNTIME?.configureLink(link, asset);
    link.hidden = !configured;
    if (!configured) {
      window.ATLAS_DOWNLOAD_RUNTIME?.clearLink(link);
      return;
    }
    link.textContent = nonEmpty(asset.label_zh_tw, fallbackLabel);
  }

  function setOpenAssetLink(selector, asset, fallbackLabel) {
    const link = $(selector);
    const href = asset && pathIsLocal(asset.path) ? asset.path : '';
    link.hidden = !href;
    setLink(link, href, nonEmpty(asset?.label_zh_tw, fallbackLabel));
  }

  function renderDirectUse(entry) {
    const panel = $('#unified-direct-use-panel');
    const capabilities = entry.action_capabilities || {};
    const assets = asArray(entry.direct_use_assets).filter((asset) => pathIsLocal(asset.path));
    const downloadIds = new Set(asArray(capabilities.download_record_ids));
    const downloadAssets = capabilities.can_download === true ? assets.filter((asset) => downloadIds.has(asset.download_record_id)) : [];
    const first = (type) => downloadAssets.find((asset) => asset.type === type);
    panel.hidden = false;
    $('#unified-direct-use-count').textContent = assets.length ? `${assets.length} 項資產` : '尚無資產';
    $('#unified-direct-use-note').textContent = entry.output_type === 'pptx' && entry.ppt_description?.direct_use_summary
      ? entry.ppt_description.direct_use_summary
      : assets.length
        ? `已驗證 ${assets.length} 個本機資產；只顯示符合「${labelFor(CONTENT_LABELS, entry.content_type)}」型別的操作。`
        : '這個項目尚無可直接使用的本機資產。';
    setDirectAssetLink('#unified-download-prompt', first('prompt-file'), '下載 Prompt');
    setDirectAssetLink('#unified-download-code', first('source-code'), '下載程式碼');
    setDirectAssetLink('#unified-download-workflow', first('workflow-json'), '下載 Workflow JSON');
    setDirectAssetLink('#unified-download-pptx', first('pptx'), '下載 PPTX');
    setDirectAssetLink('#unified-download-generic', first('artifact-file') || first('source-file'), '下載可直接使用檔案');
    setDirectAssetLink('#unified-download-manifest', first('manifest-file'), '下載套件 Manifest');
    setDirectAssetLink('#unified-download-landscape-template', first('ppt-template-landscape'), '下載橫式模板');
    setDirectAssetLink('#unified-download-portrait-template', first('ppt-template-portrait'), '下載直式模板');
    const extraDownloads = $('#unified-extra-downloads');
    extraDownloads.textContent = '';
    const represented = new Set([...panel.querySelectorAll('a[data-download-record-id]')].filter((link) => !link.hidden).map((link) => link.dataset.downloadRecordId));
    downloadAssets.forEach((asset) => {
      if (represented.has(asset.download_record_id)) return;
      const link = makeElement('a', 'button-link action-primary', nonEmpty(asset.label_zh_tw, `下載 ${asset.download_filename}`));
      if (window.ATLAS_DOWNLOAD_RUNTIME?.configureLink(link, asset)) extraDownloads.append(link);
      represented.add(asset.download_record_id);
    });
    setOpenAssetLink('#unified-open-local-source', capabilities.can_open_local_source === true ? { path: capabilities.local_source_path } : null, '開啟本機來源檔');
    setOpenAssetLink('#unified-open-local-executable', capabilities.can_open_local_executable === true ? { path: capabilities.local_executable_path } : null, '開啟本機可執行範例');
    const copyIds = new Set(asArray(capabilities.copy_download_record_ids));
    const copyAsset = capabilities.can_copy === true && assets.find((asset) => copyIds.has(asset.download_record_id) && asset.can_copy_text
      && ['prompt-file', 'source-code', 'workflow-json', 'source-file', 'artifact-file', 'manifest-file'].includes(asset.type));
    const liveCodeCopy = capabilities.can_copy === true && capabilities.copy_payload_kind === 'live-code';
    const copyButton = $('#unified-copy-direct-text');
    copyButton.hidden = !copyAsset && !liveCodeCopy;
    copyButton.dataset.assetPath = liveCodeCopy ? capabilities.copy_payload_source : copyAsset?.path || '';
    copyButton.dataset.assetType = liveCodeCopy ? 'live-code' : copyAsset?.type || '';
    copyButton.dataset.copyPayloadKind = capabilities.copy_payload_kind || 'download-text';
    copyButton.dataset.copyDataKey = copyAsset?.copy_data_key || '';
    copyButton.dataset.copyDelivery = copyAsset?.delivery_mode || '';
    copyButton.dataset.copyPayloadShard = copyAsset?.payload_shard || '';
    copyButton.dataset.copyPayloadKey = copyAsset?.payload_key || '';
    copyButton.dataset.copyPayloadPath = copyAsset?.payload_path || '';
    copyButton.dataset.copyBytes = String(copyAsset?.bytes || 0);
    copyButton.dataset.copySha256 = liveCodeCopy ? capabilities.copy_payload_sha256 : copyAsset?.sha256 || '';
    copyButton.textContent = liveCodeCopy ? '複製完整程式碼' : copyAsset?.type === 'prompt-file' ? '複製 Prompt 正文'
      : copyAsset?.type === 'workflow-json' ? '複製 Workflow JSON'
        : copyAsset?.type === 'source-code' ? '複製主要程式碼' : '複製完整來源內容';
    panel.hidden = ![...panel.querySelectorAll('.direct-use-actions a, .direct-use-actions button')].some((action) => !action.hidden);
  }

  async function renderOriginalText(entry) {
    const panel = $('#unified-prompt-original-panel');
    const body = $('#unified-prompt-original-body');
    const status = $('#unified-prompt-original-status');
    const capabilities = entry.action_capabilities || {};
    const isPrompt = entry.content_type === 'prompt';
    const showOriginal = isPrompt || entry.content_type !== 'skill' && capabilities.can_preview !== true && capabilities.can_copy === true && capabilities.copy_payload_kind === 'download-text';
    panel.hidden = !showOriginal;
    panel.dataset.entryId = showOriginal ? entry.id : '';
    panel.dataset.loadState = panel.hidden ? 'not-applicable' : 'loading';
    delete panel.dataset.originalSha256;
    body.textContent = '';
    $('#unified-prompt-original-title').textContent = isPrompt ? 'Prompt 來源正文／Prompt source body' : '完整來源內容／Complete source content';
    body.setAttribute('aria-label', isPrompt ? '完整 Prompt 來源正文' : '完整來源內容');
    status.textContent = panel.hidden ? '' : '載入來源正文中…';
    if (panel.hidden) return;
    const asset = asArray(entry.direct_use_assets).find((candidate) => candidate.can_copy_text && candidate.path === capabilities.copy_payload_source && asArray(capabilities.copy_download_record_ids).includes(candidate.download_record_id));
    try {
      if (!asset || capabilities.can_copy !== true) throw new Error('Original prompt asset is not verified.');
      const original = await window.ATLAS_DOWNLOAD_RUNTIME.readAssetText(asset);
      if (!original) throw new Error('Original prompt is empty.');
      if (panel.dataset.entryId !== entry.id) return;
      body.textContent = original;
      panel.dataset.loadState = 'ready';
      panel.dataset.originalSha256 = asset.sha256;
      status.textContent = entry.local_adaptation_status === 'SANITIZED_LOCAL_ADAPTATION' ? '公開清理衍生正文／Sanitized public body' : '完整來源正文／Complete source body';
    } catch (_) {
      if (panel.dataset.entryId !== entry.id) return;
      panel.dataset.loadState = 'error';
      status.textContent = '來源正文載入失敗；請使用上方下載或開啟本機來源檔。';
    }
  }

  function renderPptDescription(entry) {
    const panel = $('#unified-ppt-description-panel');
    const isPpt = entry.output_type === 'pptx';
    panel.hidden = !isPpt;
    panel.dataset.entryId = isPpt ? entry.id : '';
    panel.dataset.pptDescriptionRendered = isPpt ? 'true' : 'false';
    if (!isPpt) return;
    const description = entry.ppt_description || {};
    $('#unified-ppt-entry-kind').textContent = PPT_KIND_LABELS[entry.ppt_entry_kind] || entry.ppt_entry_kind || 'PPT 條目';
    const fields = {
      '#unified-ppt-what-is': 'what_is',
      '#unified-ppt-can-do': 'can_do',
      '#unified-ppt-suitable-for': 'suitable_for',
      '#unified-ppt-how-to-use': 'how_to_use',
      '#unified-ppt-expected-output': 'expected_output',
      '#unified-ppt-direct-use': 'direct_use_summary',
      '#unified-ppt-requirements': 'requirements',
      '#unified-ppt-source-license': 'source_and_license',
      '#unified-ppt-orientation': 'orientation',
      '#unified-ppt-slide-count': 'slide_count'
    };
    Object.entries(fields).forEach(([selector, key]) => {
      $(selector).textContent = String(description[key] || '').trim();
      $(selector).dataset.pptDescriptionField = key;
    });
  }

  function renderSkillTextFirst(entry) {
    const panel = $('#unified-skill-text-panel');
    const isSkill = entry.content_type === 'skill';
    panel.hidden = !isSkill;
    panel.dataset.entryId = isSkill ? entry.id : '';
    panel.dataset.skillPresentationMode = isSkill ? nonEmpty(entry.skill_presentation_mode, 'TEXT_FIRST') : '';
    panel.dataset.skillPowerpointRequired = String(isSkill && entry.skill_powerpoint_required === true);
    if (!isSkill) return;
    const fields = {
      '#unified-skill-purpose': 'skill_purpose_zh_tw',
      '#unified-skill-when': 'skill_when_to_use_zh_tw',
      '#unified-skill-inputs': 'skill_required_inputs_zh_tw',
      '#unified-skill-process': 'skill_process_zh_tw',
      '#unified-skill-outputs': 'skill_outputs_zh_tw',
      '#unified-skill-tools': 'skill_tools_platforms_zh_tw',
      '#unified-skill-install': 'skill_installation_usage_zh_tw',
      '#unified-skill-limitations': 'skill_limitations_zh_tw',
      '#unified-skill-body': 'skill_body_or_artifact_zh_tw',
      '#unified-skill-attribution': 'skill_source_attribution_zh_tw'
    };
    Object.entries(fields).forEach(([selector, key]) => {
      $(selector).textContent = nonEmpty(entry[key], '完整固定版本資料未提供此欄位。');
      $(selector).dataset.skillTextField = key;
    });
  }

  function addOptions(select, records, labeler = (value) => value) {
    const fragment = document.createDocumentFragment();
    records.forEach((record) => {
      const option = document.createElement('option');
      option.value = record.value;
      option.textContent = `${labeler(record.value)} (${Number(record.count || 0).toLocaleString('zh-TW')})`;
      fragment.append(option);
    });
    select.append(fragment);
  }

  function facetRecords(field, limit = 250) {
    return core.facetValues(entries, field).slice(0, limit);
  }

  function populateFilters() {
    addOptions(filterElements.content_type, facetRecords('content_type'), (value) => labelFor(CONTENT_LABELS, value));
    addOptions(filterElements.output_type, facetRecords('output_type'), (value) => labelFor(OUTPUT_LABELS, value));
    addOptions(filterElements.style, facetRecords('style_tags'));
    addOptions(filterElements.interaction, facetRecords('interaction_tags'));
    addOptions(filterElements.technology, facetRecords('technology_stack'));

    const sourceNames = new Map();
    entries.forEach((entry) => {
      if (!sourceNames.has(entry.source_id)) sourceNames.set(entry.source_id, sourceDisplay(entry));
    });
    addOptions(filterElements.source, facetRecords('source_id'), (value) => sourceNames.get(value) || value);
    addOptions(filterElements.license, facetRecords('license'));
    addOptions(filterElements.offline, facetRecords('offline_status'), (value) => value.replaceAll('-', ' '));
    addOptions(filterElements.execution_level, facetRecords('execution_level'), (value) => labelFor(EXECUTION_LABELS, value));
    addOptions(filterElements.example_status, facetRecords('example_status'), (value) => labelFor(EXAMPLE_LABELS, value));
  }

  function currentFilters() {
    const filters = {};
    Object.entries(filterElements).forEach(([key, element]) => {
      if (element.value) filters[key] = element.value;
      element.classList.toggle('has-value', Boolean(element.value));
    });
    if (filters.source === 'gitskins-official' || filters.output_type === 'pptx') filters.include_blocked = true;
    return filters;
  }

  function searchPool() {
    if (state.view === 'outcomes') {
      return entries.filter((entry) => ['artifact-example', 'workflow', 'template'].includes(entry.content_type));
    }
    if (state.view === 'systems') {
      return entries.filter((entry) => ['skill', 'design-system', 'theme'].includes(entry.content_type));
    }
    return entries;
  }

  function activeConditions(filters) {
    const labels = [];
    if (elements.query.value.trim()) labels.push(`「${elements.query.value.trim()}」`);
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'include_blocked') return;
      const select = filterElements[key];
      labels.push(select?.selectedOptions?.[0]?.textContent?.replace(/ \([\d,]+\)$/, '') || String(value));
    });
    return labels;
  }

  function sortRanked(items) {
    const mode = elements.sort.value;
    if (mode === 'title') {
      items.sort((left, right) => nonEmpty(left.entry.display_title_zh_tw, left.entry.title).localeCompare(nonEmpty(right.entry.display_title_zh_tw, right.entry.title), 'zh-Hant'));
    } else if (mode === 'source') {
      items.sort((left, right) => sourceDisplay(left.entry).localeCompare(sourceDisplay(right.entry), 'zh-Hant') || right.score - left.score);
    } else if (mode === 'example') {
      const priority = { VERIFIED: 0, AVAILABLE: 1, PENDING: 2, NOT_APPLICABLE: 3, STALE: 4, BLOCKED: 5 };
      items.sort((left, right) => (priority[left.entry.example_status] ?? 9) - (priority[right.entry.example_status] ?? 9) || right.score - left.score);
    }
    return items;
  }

  function scheduleSearch(resetVisible = true) {
    if (resetVisible) state.visible = 48;
    if (state.renderQueued) return;
    state.renderQueued = true;
    requestAnimationFrame(() => {
      state.renderQueued = false;
      runSearch();
    });
  }

  function runSearch() {
    const filters = currentFilters();
    const started = performance.now();
    state.ranked = sortRanked(core.searchEntries(searchPool(), elements.query.value, filters));
    state.lastSearchMs = performance.now() - started;
    document.documentElement.dataset.atlasSearchMs = state.lastSearchMs.toFixed(2);
    renderResults();
    updateSearchState(filters);
  }

  function evidenceItem(label, value) {
    const element = makeElement('span');
    element.append(makeElement('b', '', label), document.createTextNode(nonEmpty(value)));
    return element;
  }

  function percentile(values, percentileValue) {
    if (!values.length) return 0;
    const sorted = [...values].sort((left, right) => left - right);
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * percentileValue) - 1))];
  }

  function previewBinding(entry) {
    const provenance = entry.example_provenance || {};
    return {
      entryId: entry.id,
      contentHash: nonEmpty(entry.content_hash),
      artifactHash: nonEmpty(provenance.artifact_hash || entry.example_hash, '尚無成果'),
      provenanceEntryId: nonEmpty(provenance.entry_id, entry.id)
    };
  }

  function applyPreviewBinding(element, entry) {
    const binding = previewBinding(entry);
    element.dataset.entryId = binding.entryId;
    element.dataset.contentHash = binding.contentHash;
    element.dataset.artifactHash = binding.artifactHash;
    element.dataset.provenanceEntryId = binding.provenanceEntryId;
    element.dataset.bindingStatus = binding.entryId === binding.provenanceEntryId ? 'PASS' : 'FAIL';
  }

  function inlinePreviewHost(entry) {
    const host = makeElement('section', 'inline-artifact-preview');
    applyPreviewBinding(host, entry);
    host.dataset.previewType = nonEmpty(entry.preview_type, 'none');
    host.dataset.previewPath = previewIsAvailable(entry) ? entry.example_path : '';
    host.dataset.previewState = previewIsAvailable(entry) ? 'UNLOADED' : 'UNAVAILABLE';
    host.setAttribute('aria-label', `${nonEmpty(entry.display_title_zh_tw, entry.title)} 成果預覽`);

    const heading = makeElement('div', 'inline-preview-heading');
    heading.append(
      makeElement('strong', '', labelFor(PREVIEW_LABELS, entry.preview_type)),
      makeElement('span', 'inline-preview-status', previewIsAvailable(entry) ? '接近畫面時載入' : labelFor(EXAMPLE_LABELS, exampleStatus(entry)))
    );
    const stage = makeElement('div', 'inline-preview-stage');
    stage.append(makeElement('p', 'inline-preview-placeholder', previewIsAvailable(entry)
      ? '成果已綁定此筆資料，捲動接近後會在本機載入。'
      : previewUnavailableMessage(entry)));
    host.append(heading, stage);
    return host;
  }

  function inlineHostDistance(host) {
    const rect = host.getBoundingClientRect();
    return Math.abs((rect.top + rect.bottom) / 2 - window.innerHeight / 2);
  }

  function inlineHostVisible(host) {
    const rect = host.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function inlineHostRetained(host) {
    const rect = host.getBoundingClientRect();
    const margin = window.innerHeight * 2;
    return rect.bottom > -margin && rect.top < window.innerHeight + margin;
  }

  function updateInlinePreviewMetrics() {
    const warmItems = [...inlinePreviewHosts].filter((host) => host.dataset.warmPreview === 'true');
    const visibleHosts = [...inlinePreviewHosts].filter((host) => host.isConnected && inlineHostVisible(host));
    const visibleReady = visibleHosts.filter((host) => host.dataset.previewState === 'READY');
    const visibleWaiting = visibleHosts.filter((host) => host.dataset.previewPath && host.dataset.previewState !== 'READY');
    const instantiatedFrames = [...inlinePreviewActive].filter((host) => host.querySelector('iframe')).length;
    const playingFrames = [...inlinePreviewActive].filter((host) => host.dataset.previewType === 'live-iframe' && inlineHostVisible(host)).length;
    const p95 = percentile(inlinePreviewLoadTimes, .95);
    document.documentElement.dataset.atlasInlinePreviewActive = String(inlinePreviewActive.size);
    document.documentElement.dataset.atlasInlinePreviewLoadP95Ms = p95.toFixed(2);
    const metrics = {
      max_active: INLINE_PREVIEW_MAX_ACTIVE,
      warm_item_limit: INLINE_PREVIEW_WARM_ITEM_LIMIT,
      warm_item_count: warmItems.length,
      active: inlinePreviewActive.size,
      instantiated_asset_count: inlinePreviewActive.size,
      instantiated_iframe_count: instantiatedFrames,
      active_playing_count: playingFrames,
      visible_count: visibleHosts.length,
      visible_ready_count: visibleReady.length,
      visible_waiting_count: visibleWaiting.length,
      loaded_samples: inlinePreviewLoadTimes.length,
      load_p50_ms: Number(percentile(inlinePreviewLoadTimes, .5).toFixed(2)),
      load_p95_ms: Number(p95.toFixed(2)),
      load_max_ms: Number(Math.max(0, ...inlinePreviewLoadTimes).toFixed(2)),
      visible_ready_p50_ms: Number(percentile(inlinePreviewVisibleReadyTimes, .5).toFixed(2)),
      visible_ready_p95_ms: Number(percentile(inlinePreviewVisibleReadyTimes, .95).toFixed(2)),
      visible_ready_max_ms: Number(Math.max(0, ...inlinePreviewVisibleReadyTimes).toFixed(2)),
      frame_p50_ms: Number(percentile(inlinePreviewFrameTimes, .5).toFixed(2)),
      frame_p95_ms: Number(percentile(inlinePreviewFrameTimes, .95).toFixed(2)),
      frame_max_ms: Number(Math.max(0, ...inlinePreviewFrameTimes).toFixed(2)),
      long_task_count: inlinePreviewLongTaskDurations.length,
      long_task_max_ms: Number(Math.max(0, ...inlinePreviewLongTaskDurations).toFixed(2)),
      scroll_direction: inlinePreviewScrollDirection
    };
    document.documentElement.dataset.atlasInlinePreviewMetrics = JSON.stringify(metrics);
    window.__ATLAS_INLINE_PREVIEW_METRICS__ = Object.freeze(metrics);
  }

  function setInlinePreviewState(host, state, message) {
    host.dataset.previewState = state;
    const status = host.querySelector('.inline-preview-status');
    if (status) status.textContent = message;
  }

  function unloadInlinePreview(host, message = '接近畫面時載入') {
    const asset = host.querySelector('iframe, img, video');
    if (asset instanceof HTMLIFrameElement) {
      try { asset.contentWindow?.postMessage({ type: 'atlas-preview-state', state: 'pause' }, '*'); } catch (_) { /* no-op */ }
      asset.src = 'about:blank';
    }
    asset?.remove();
    inlinePreviewActive.delete(host);
    inlinePreviewVisibleStarted.delete(host);
    const stage = host.querySelector('.inline-preview-stage');
    if (stage && !stage.querySelector('.inline-preview-placeholder')) stage.append(makeElement('p', 'inline-preview-placeholder', '成果已綁定此筆資料，捲動接近後會在本機載入。'));
    setInlinePreviewState(host, 'UNLOADED', message);
    updateInlinePreviewMetrics();
  }

  function finishInlinePreviewLoad(host, asset) {
    if (!host.isConnected || !inlinePreviewActive.has(host)) return;
    const started = inlinePreviewLoadStarted.get(asset);
    if (Number.isFinite(started)) {
      inlinePreviewLoadTimes.push(performance.now() - started);
      if (inlinePreviewLoadTimes.length > 240) inlinePreviewLoadTimes.splice(0, inlinePreviewLoadTimes.length - 240);
    }
    asset.dataset.loaded = 'true';
    setInlinePreviewState(host, 'READY', '本機成果已載入');
    const visibleStartedAt = inlinePreviewVisibleStarted.get(host);
    if (Number.isFinite(visibleStartedAt) && inlineHostVisible(host)) {
      inlinePreviewVisibleReadyTimes.push(performance.now() - visibleStartedAt);
      if (inlinePreviewVisibleReadyTimes.length > 240) inlinePreviewVisibleReadyTimes.splice(0, inlinePreviewVisibleReadyTimes.length - 240);
      inlinePreviewVisibleStarted.delete(host);
    }
    if (asset instanceof HTMLIFrameElement && host.dataset.previewType === 'live-iframe') syncInlinePreviewPlayback();
    updateInlinePreviewMetrics();
  }

  function failInlinePreviewLoad(host, asset) {
    inlinePreviewActive.delete(host);
    inlinePreviewVisibleStarted.delete(host);
    asset.remove();
    const stage = host.querySelector('.inline-preview-stage');
    stage.textContent = '';
    stage.append(makeElement('p', 'inline-preview-placeholder inline-preview-error', '本機成果檔案無法解碼；已停止顯示並保留來源證據，沒有以替代圖片冒充成果。'));
    setInlinePreviewState(host, 'ERROR', '成果載入失敗');
    updateInlinePreviewMetrics();
  }

  function mountInlinePreview(host) {
    if (!host?.isConnected || inlinePreviewActive.has(host) || host.dataset.bindingStatus !== 'PASS') return;
    const entry = entryById.get(host.dataset.entryId);
    if (!entry || !previewIsAvailable(entry) || host.dataset.previewPath !== entry.example_path) return;
    const stage = host.querySelector('.inline-preview-stage');
    stage.textContent = '';
    const imageLike = entry.preview_type === 'slide-thumbnails' || /\.(?:svg|png|jpe?g|webp)(?:[?#]|$)/i.test(entry.example_path);
    const videoLike = /\.(?:mp4|webm|ogv)(?:[?#]|$)/i.test(entry.example_path);
    let asset;
    if (imageLike) {
      asset = document.createElement('img');
      asset.alt = `${nonEmpty(entry.display_title_zh_tw, entry.title)} 實際成果`;
      asset.loading = 'eager';
      asset.decoding = 'async';
      asset.addEventListener('load', () => finishInlinePreviewLoad(host, asset), { once: true });
      asset.addEventListener('error', () => failInlinePreviewLoad(host, asset), { once: true });
    } else if (videoLike) {
      asset = document.createElement('video');
      asset.controls = true;
      asset.muted = true;
      asset.preload = 'metadata';
      asset.addEventListener('loadeddata', () => finishInlinePreviewLoad(host, asset), { once: true });
      asset.addEventListener('error', () => failInlinePreviewLoad(host, asset), { once: true });
    } else {
      asset = document.createElement('iframe');
      asset.sandbox = 'allow-scripts';
      asset.loading = 'eager';
      asset.referrerPolicy = 'no-referrer';
      asset.title = `${nonEmpty(entry.display_title_zh_tw, entry.title)} 隔離成果預覽`;
      asset.addEventListener('load', () => finishInlinePreviewLoad(host, asset), { once: true });
      asset.addEventListener('error', () => failInlinePreviewLoad(host, asset), { once: true });
    }
    asset.className = 'inline-preview-asset';
    applyPreviewBinding(asset, entry);
    inlinePreviewLoadStarted.set(asset, performance.now());
    inlinePreviewActive.add(host);
    if (inlineHostVisible(host)) inlinePreviewVisibleStarted.set(host, performance.now());
    setInlinePreviewState(host, 'LOADING', '正在載入本機成果');
    stage.append(asset);
    asset.src = runtimePreviewPath(entry.example_path);
    updateInlinePreviewMetrics();
  }

  function syncInlinePreviewPlayback() {
    const pageVisible = document.visibilityState === 'visible' && !elements.detail.open && !elements.compareDialog.open;
    for (const host of inlinePreviewActive) {
      const frame = host.querySelector('iframe');
      if (!frame || host.dataset.previewType !== 'live-iframe') continue;
      const rect = host.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      try { frame.contentWindow?.postMessage({ type: 'atlas-preview-state', state: pageVisible && visible ? 'resume' : 'pause' }, '*'); } catch (_) { /* no-op */ }
    }
  }

  function reconcileInlinePreviews() {
    inlinePreviewFrame = 0;
    if (inlinePreviewScheduledAt) {
      inlinePreviewFrameTimes.push(Math.max(0, performance.now() - inlinePreviewScheduledAt));
      if (inlinePreviewFrameTimes.length > 240) inlinePreviewFrameTimes.splice(0, inlinePreviewFrameTimes.length - 240);
      inlinePreviewScheduledAt = 0;
    }
    const candidates = [...inlinePreviewHosts]
      .filter((host) => host.isConnected && host.dataset.previewPath
        && (host.dataset.nearPreview === 'true' || (inlinePreviewActive.has(host) && inlineHostRetained(host))))
      .sort((left, right) => {
        const leftVisible = inlineHostVisible(left) ? 0 : 1;
        const rightVisible = inlineHostVisible(right) ? 0 : 1;
        if (leftVisible !== rightVisible) return leftVisible - rightVisible;
        if (inlinePreviewScrollDirection) {
          const leftRect = left.getBoundingClientRect();
          const rightRect = right.getBoundingClientRect();
          const leftBehind = inlinePreviewScrollDirection > 0 ? leftRect.bottom < 0 : leftRect.top > window.innerHeight;
          const rightBehind = inlinePreviewScrollDirection > 0 ? rightRect.bottom < 0 : rightRect.top > window.innerHeight;
          if (leftBehind !== rightBehind) return Number(leftBehind) - Number(rightBehind);
        }
        return inlineHostDistance(left) - inlineHostDistance(right);
      })
      .slice(0, INLINE_PREVIEW_WARM_ITEM_LIMIT);
    inlinePreviewHosts.forEach((host) => { host.dataset.warmPreview = candidates.includes(host) ? 'true' : 'false'; });
    const desired = new Set(candidates.slice(0, INLINE_PREVIEW_MAX_ACTIVE));
    for (const host of [...inlinePreviewActive]) if (!desired.has(host)) unloadInlinePreview(host);
    for (const host of desired) mountInlinePreview(host);
    syncInlinePreviewPlayback();
    updateInlinePreviewMetrics();
  }

  function scheduleInlinePreviewReconcile() {
    if (inlinePreviewFrame) return;
    inlinePreviewScheduledAt = performance.now();
    inlinePreviewFrame = requestAnimationFrame(reconcileInlinePreviews);
  }

  function handleInlinePreviewScroll() {
    const nextScrollY = window.scrollY;
    const delta = nextScrollY - inlinePreviewScrollY;
    if (Math.abs(delta) > 1) inlinePreviewScrollDirection = Math.sign(delta);
    inlinePreviewScrollY = nextScrollY;
    scheduleInlinePreviewReconcile();
  }

  function observeInlinePreviews() {
    if (inlinePreviewObserver) inlinePreviewObserver.disconnect();
    inlinePreviewHosts.clear();
    elements.results.querySelectorAll('.inline-artifact-preview').forEach((host) => inlinePreviewHosts.add(host));
    if (!('IntersectionObserver' in window)) {
      [...inlinePreviewHosts].slice(0, INLINE_PREVIEW_MAX_ACTIVE).forEach((host) => { host.dataset.nearPreview = 'true'; });
      reconcileInlinePreviews();
      return;
    }
    inlinePreviewObserver = new IntersectionObserver((changes) => {
      changes.forEach((change) => {
        change.target.dataset.nearPreview = change.isIntersecting ? 'true' : 'false';
        if (change.isIntersecting && inlineHostVisible(change.target) && change.target.dataset.previewState !== 'READY') {
          inlinePreviewVisibleStarted.set(change.target, performance.now());
        } else if (!change.isIntersecting) {
          inlinePreviewVisibleStarted.delete(change.target);
        }
      });
      scheduleInlinePreviewReconcile();
    }, { rootMargin: INLINE_PREVIEW_ROOT_MARGIN, threshold: 0.01 });
    inlinePreviewHosts.forEach((host) => inlinePreviewObserver.observe(host));
  }

  function teardownInlinePreviews() {
    if (inlinePreviewObserver) inlinePreviewObserver.disconnect();
    inlinePreviewObserver = null;
    if (inlinePreviewFrame) cancelAnimationFrame(inlinePreviewFrame);
    inlinePreviewFrame = 0;
    for (const host of [...inlinePreviewActive]) unloadInlinePreview(host);
    inlinePreviewActive.clear();
    inlinePreviewHosts.clear();
  }

  function resultCard(item) {
    const entry = item.entry;
    const article = makeElement('article', 'unified-result');
    if (entry.source_id === DISABLED_SOURCE_ID) {
      article.classList.add('is-private-collection');
      article.dataset.privateCollection = 'true';
    }
    applyPreviewBinding(article, entry);

    const marker = makeElement('div', 'unified-result-marker');
    marker.append(
      makeElement('b', '', labelFor(CONTENT_LABELS, entry.content_type)),
      makeElement('span', '', labelFor(OUTPUT_LABELS, entry.output_type))
    );

    const main = makeElement('div', 'unified-result-main');
    const heading = makeElement('div', 'unified-result-heading');
    const headingText = makeElement('div');
    const displayTitle = nonEmpty(entry.display_title_zh_tw, entry.title);
    headingText.append(makeElement('h3', '', displayTitle));
    if (entry.title && entry.title !== displayTitle) {
      const originalTitle = makeElement('p', 'unified-result-original', `來源原題 · ${entry.title}`);
      originalTitle.lang = originalLanguage(entry.title);
      originalTitle.dataset.languageExempt = 'original-source';
      headingText.append(originalTitle);
    }
    heading.append(headingText, makeElement('span', 'unified-score', `相關度 ${Math.round(item.score)}`));
    main.append(heading);

    const chips = makeElement('div', 'chips');
    chips.append(makeElement('span', entry.source_id === DISABLED_SOURCE_ID ? 'chip badge-source' : 'chip badge-source', sourceDisplay(entry)));
    if (entry.collection) chips.append(makeElement('span', 'chip badge-collection', entry.collection));
    appendTextList(chips, [...asArray(entry.style_tags).slice(0, 2), ...asArray(entry.interaction_tags).slice(0, 2), ...asArray(entry.technology_stack).slice(0, 2)], 'chip', 6);
    main.append(chips);
    if (previewIsAvailable(entry)) main.append(inlinePreviewHost(entry));
    main.append(makeElement('p', 'unified-result-summary', entry.summary_zh_tw));

    const evidence = makeElement('div', 'unified-result-evidence');
    evidence.append(
      evidenceItem('成果證據', labelFor(EXAMPLE_LABELS, exampleStatus(entry))),
      evidenceItem('執行條件', labelFor(EXECUTION_LABELS, entry.execution_level)),
      evidenceItem('授權', `${nonEmpty(entry.license)} · ${licenseStatusLabel(entry.license_status)}`)
    );
    main.append(evidence);

    const actions = makeElement('div', 'unified-result-actions');
    const artifact = makeElement('a', 'open-inline-artifact', '開啟成果');
    if (previewIsAvailable(entry)) {
      artifact.href = entry.example_path;
      artifact.target = '_blank';
      artifact.rel = 'noopener noreferrer';
      artifact.dataset.atlasAction = 'OPEN_PREVIEW';
    }
    const open = makeElement('button', 'open-unified-detail', '查看證據與詳情');
    open.type = 'button';
    open.dataset.openUnified = entry.id;
    open.dataset.atlasAction = 'OPEN_DETAILS';
    const compare = makeElement('button', state.compareIds.includes(entry.id) ? 'toggle-unified-compare is-selected' : 'toggle-unified-compare', state.compareIds.includes(entry.id) ? '已加入比較' : '加入比較');
    compare.type = 'button';
    compare.dataset.compareUnified = entry.id;
    compare.hidden = entry.selection_eligible === false;
    if (previewIsAvailable(entry)) actions.append(artifact);
    actions.append(open, compare);
    article.append(marker, main, actions);
    return article;
  }

  function renderResults() {
    teardownInlinePreviews();
    elements.results.textContent = '';
    const visible = state.ranked.slice(0, state.visible);
    const fragment = document.createDocumentFragment();
    visible.forEach((item) => fragment.append(resultCard(item)));
    elements.results.append(fragment);
    elements.empty.hidden = state.ranked.length > 0;
    elements.results.hidden = state.ranked.length === 0;
    elements.loadMore.hidden = state.visible >= state.ranked.length;
    elements.loadMore.textContent = `再載入 ${Math.min(48, Math.max(0, state.ranked.length - state.visible))} 筆`;
    observeInlinePreviews();
  }

  function updateSearchState(filters) {
    const conditions = activeConditions(filters);
    const route = core.intentRoute(elements.query.value);
    const verified = state.ranked.reduce((count, item) => count + (item.entry.example_status === 'VERIFIED' ? 1 : 0), 0);
    elements.count.textContent = `${state.ranked.length.toLocaleString('zh-TW')} 筆結果`;
    elements.activeState.textContent = conditions.length ? conditions.join(' · ') : `${VIEW_LABELS[state.view]} · 顯示可選條目`;
    elements.filterSummary.textContent = `11 個可組合篩選維度 · 已套用 ${Object.keys(filters).filter((key) => key !== 'include_blocked').length} 個`;
    $('#route-need').textContent = elements.query.value.trim() || VIEW_LABELS[state.view];
    $('#route-capability').textContent = `${INTENT_LABELS[route.intent] || route.intent}${conditions.length ? ` · ${conditions.length} 條件` : ''}`;
    $('#route-evidence').textContent = `${state.ranked.length.toLocaleString('zh-TW')} 筆 · ${verified.toLocaleString('zh-TW')} 筆已驗證成果`;
    $('#unified-index-meta').textContent = `${entries.length.toLocaleString('zh-TW')} 筆 · ${String(index.content_hash || '').slice(0, 14)} · ${state.lastSearchMs.toFixed(1)} ms`;
    updateShortcutSelection();
  }

  function clearUnified(keepView = true) {
    elements.query.value = '';
    Object.values(filterElements).forEach((element) => { element.value = ''; });
    elements.sort.value = 'relevance';
    if (!keepView) state.view = 'explore';
    scheduleSearch(true);
  }

  function setSelectValue(select, value) {
    if (!value) return;
    const option = [...select.options].find((candidate) => candidate.value.toLocaleLowerCase() === String(value).toLocaleLowerCase());
    if (option) select.value = option.value;
  }

  function updateShortcutSelection() {
    $$('#outcome-shortcut-list button').forEach((button) => {
      const active = (button.dataset.outcome && filterElements.output_type.value === button.dataset.outcome)
        || (button.dataset.contentType && filterElements.content_type.value === button.dataset.contentType)
        || (button.dataset.source && filterElements.source.value === button.dataset.source)
        || (button.dataset.outcomeQuery && elements.query.value === button.dataset.outcomeQuery);
      button.classList.toggle('is-active', Boolean(active));
    });
  }

  function activateShortcut(button) {
    setActiveView('explore');
    clearUnified(true);
    if (button.dataset.outcome) filterElements.output_type.value = button.dataset.outcome;
    if (button.dataset.contentType) filterElements.content_type.value = button.dataset.contentType;
    if (button.dataset.source) filterElements.source.value = button.dataset.source;
    if (button.dataset.outcomeQuery) elements.query.value = button.dataset.outcomeQuery;
    scheduleSearch(true);
    elements.results.focus({ preventScroll: true });
  }

  function updateMainNavigation(view) {
    $$('button[data-atlas-view]').forEach((button) => {
      const active = button.dataset.atlasView === view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  }

  function setActiveView(view) {
    const next = ['explore', 'prompt', 'live', 'outcomes', 'systems'].includes(view) ? view : 'explore';
    state.view = next;
    document.body.dataset.atlasView = next;
    updateMainNavigation(next);

    if (next === 'prompt' || next === 'live') {
      elements.view.hidden = true;
      $(`#${next}-mode`)?.click();
      $('.skip-link').href = next === 'live' ? '#live-results' : '#results';
      return;
    }

    $('#prompt-mode')?.click();
    $('#prompt-view').hidden = true;
    $('#live-view').hidden = true;
    elements.view.hidden = false;
    elements.view.setAttribute('aria-labelledby', `atlas-nav-${next}`);
    $('.skip-link').href = '#unified-results';
    scheduleSearch(true);
  }

  function unloadPreview(container = $('#unified-preview-stage')) {
    container.querySelectorAll('iframe').forEach((frame) => {
      try { frame.contentWindow?.postMessage({ type: 'atlas-preview-state', state: 'pause' }, '*'); } catch (_) { /* no-op */ }
      frame.src = 'about:blank';
      frame.remove();
    });
    container.querySelectorAll('img,video').forEach((asset) => asset.remove());
  }

  function renderPreview(entry) {
    const shell = $('#unified-preview-shell');
    const stage = $('#unified-preview-stage');
    unloadPreview(stage);
    stage.textContent = '';
    applyPreviewBinding(stage, entry);
    shell.hidden = !previewIsAvailable(entry);
    if (!previewIsAvailable(entry)) return;
    $('#unified-preview-status').textContent = `${labelFor(PREVIEW_LABELS, entry.preview_type)} · ${labelFor(EXAMPLE_LABELS, exampleStatus(entry))}`;

    if (entry.preview_type === 'slide-thumbnails' || /\.(?:svg|png|jpe?g|webp)(?:[?#]|$)/i.test(entry.example_path)) {
      const image = document.createElement('img');
      applyPreviewBinding(image, entry);
      image.src = runtimePreviewPath(entry.example_path);
      image.alt = `${nonEmpty(entry.display_title_zh_tw, entry.title)} 代表性成果預覽`;
      stage.append(image);
      return;
    }

    const frame = document.createElement('iframe');
    applyPreviewBinding(frame, entry);
    frame.sandbox = 'allow-scripts';
    frame.title = `${nonEmpty(entry.display_title_zh_tw, entry.title)} 隔離成果預覽`;
    frame.loading = 'eager';
    frame.referrerPolicy = 'no-referrer';
    frame.src = runtimePreviewPath(entry.example_path);
    stage.append(frame);
  }

  function setLargePreview(enabled) {
    elements.detail.classList.toggle('is-preview-large', enabled);
    const button = $('#unified-preview-expand');
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = enabled ? '縮回預覽' : '放大預覽';
  }

  function populateDefinitionList(container, records) {
    container.textContent = '';
    records.forEach(([term, description]) => {
      const row = makeElement('div');
      row.append(makeElement('dt', '', term), makeElement('dd', '', nonEmpty(description)));
      container.append(row);
    });
  }

  function renderProvenance(entry) {
    const provenance = entry.example_provenance || {};
    const correction = entry.ppt_layout_fidelity || null;
    const readability = entry.ppt_readability || null;
    const isCorrected = entry.artifact_disposition === 'LOCAL_CORRECTED_DERIVATIVE';
    const container = $('#unified-detail-provenance');
    applyPreviewBinding(container, entry);
    const freshnessState = core.exampleFreshness ? core.exampleFreshness(entry) : { status: entry.example_status, stale: entry.example_status === 'STALE' };
    const freshness = freshnessState.stale
      ? 'STALE：來源／Prompt hash 已變更，禁止冒充最新版'
      : freshnessState.status === 'VERIFIED'
        ? 'VERIFIED：建置時已通過成果 hash 與來源狀態檢查'
        : `${labelFor(EXAMPLE_LABELS, freshnessState.status)}：依 queue 狀態判定`;
    const records = [
      ['條目 ID', provenance.entry_id || entry.id],
      ['來源', provenance.source || entry.source_id],
      ['來源 commit', provenance.source_commit || entry.source_commit],
      ['來源路徑', provenance.source_path || entry.relative_path],
      ['成果處置', entry.artifact_disposition || '未宣告'],
      ['Prompt hash', provenance.prompt_hash || '不適用／未宣告'],
      ['生成來源 hash', entry.example_generated_from_hash || '不適用'],
      ['成果 hash', provenance.artifact_hash || entry.example_hash || '尚無成果'],
      ['生成器', [provenance.generator_type, provenance.generator_version].filter(Boolean).join(' · ') || '不適用'],
      ['生成時間', provenance.generated_at || '不適用'],
      ['驗證狀態', provenance.validation_status || freshnessState.status],
      ['過期偵測', freshness]
    ];
    if (isCorrected && correction) {
      records.splice(5, 0,
        ['PPT 版面分類', correction.classification || '未宣告'],
        ['受影響投影片', correction.affected_slide ? `第 ${correction.affected_slide} 張` : '未宣告'],
        ['修正版說明', correction.issue_summary_zh_tw || correction.layout_adjustment || '未宣告'],
        ['來源原始 PPTX hash', entry.source_original_artifact_hash || provenance.source_original_artifact_hash || '未宣告'],
        ['本機修正版 PPTX hash', entry.corrected_artifact_hash || provenance.corrected_artifact_hash || '未宣告'],
        ['來源原檔保留', correction.source_original_preserved === true ? 'PASS' : 'FAIL']
      );
    }
    if (isCorrected && readability) {
      records.splice(5, 0,
        ['PPT 可讀性分類', readability.classification || '未宣告'],
        ['可讀性修正投影片', asArray(readability.affected_slides).map((slide) => `第 ${slide} 張`).join('、') || '未宣告'],
        ['可讀性修正 run', `${Number(readability.correction_count || 0)} 個`],
        ['承接版面修正', readability.inherits_layout_correction === true ? 'PASS' : '不適用'],
        ['來源原檔保留', readability.source_original_preserved === true ? 'PASS' : 'FAIL'],
        ['PowerPoint 原生驗證', readability.corrected_validation_status || '未宣告']
      );
    }
    populateDefinitionList(container, records);
  }

  function renderRelated(entry) {
    const container = $('#unified-related-list');
    container.textContent = '';
    const related = core.relatedEntries(entries, entry, 6);
    if (!related.length) {
      container.append(makeElement('p', '', '目前沒有跨來源且相似度足夠的條目。'));
      return;
    }
    related.forEach((item) => {
      const button = makeElement('button');
      button.type = 'button';
      button.dataset.relatedId = item.entry.id;
      button.append(
        makeElement('strong', '', nonEmpty(item.entry.display_title_zh_tw, item.entry.title)),
        makeElement('small', '', `${sourceDisplay(item.entry)} · ${labelFor(OUTPUT_LABELS, item.entry.output_type)} · 相似度 ${item.score}`)
      );
      container.append(button);
    });
  }

  function showDetail(entry, trigger = null) {
    if (!entry) return;
    const detailStartedAt = performance.now();
    state.selected = entry;
    const capabilities = entry.action_capabilities || {};
    applyPreviewBinding(elements.detail, entry);
    elements.detail.dataset.triggerId = trigger?.dataset?.openUnified || '';
    const displayTitle = nonEmpty(entry.display_title_zh_tw, entry.title);
    $('#unified-detail-title').textContent = displayTitle;
    const original = $('#unified-detail-original-title');
    original.textContent = entry.title && entry.title !== displayTitle ? `來源原題 · ${entry.title}` : '';
    original.lang = originalLanguage(entry.title);
    original.dataset.languageExempt = 'original-source';
    original.hidden = !original.textContent;
    $('#unified-detail-summary').textContent = nonEmpty(entry.summary_zh_tw, '此項目尚無摘要。');
    $('#unified-detail-types').textContent = `${labelFor(CONTENT_LABELS, entry.content_type)} / ${labelFor(OUTPUT_LABELS, entry.output_type)} / ${labelFor(PREVIEW_LABELS, entry.preview_type)}`;
    $('#unified-detail-source').textContent = `${sourceDisplay(entry)} · ${nonEmpty(entry.source_tier)}`;
    $('#unified-detail-commit').textContent = nonEmpty(entry.source_commit);
    $('#unified-detail-license').textContent = `${nonEmpty(entry.license)} · ${licenseStatusLabel(entry.license_status)}`;
    $('#unified-detail-offline').textContent = nonEmpty(entry.offline_status).replaceAll('-', ' ');
    $('#unified-detail-execution').textContent = labelFor(EXECUTION_LABELS, entry.execution_level);
    $('#unified-detail-path').textContent = nonEmpty(entry.relative_path);
    $('#unified-detail-policy').textContent = `${nonEmpty(entry.example_policy)} · ${labelFor(EXAMPLE_LABELS, exampleStatus(entry))}`;
    $('#unified-detail-example').textContent = labelFor(EXAMPLE_LABELS, exampleStatus(entry));
    $('#unified-detail-example').classList.toggle('needs-review', ['BLOCKED', 'STALE'].includes(exampleStatus(entry)));
    $('#unified-detail-how').textContent = nonEmpty(entry.how_to_zh_tw, '先閱讀來源與需求，再交給具備對應能力的工具。');
    $('#unified-detail-output').textContent = nonEmpty(entry.expected_output_zh_tw, '成果形式依來源與所用工具而定。');
    $('#unified-detail-requirements').textContent = nonEmpty(entry.requirements_zh_tw, asArray(entry.dependencies).join('、') || '無額外需求紀錄。');
    $('#unified-detail-readiness').textContent = nonEmpty(entry.execution_readiness_zh_tw, labelFor(EXECUTION_LABELS, entry.execution_level));

    const tags = $('#unified-detail-tags');
    tags.textContent = '';
    appendTextList(tags, [entry.collection, ...asArray(entry.style_tags), ...asArray(entry.interaction_tags), ...asArray(entry.technology_stack)], 'chip', 16);
    const risks = $('#unified-detail-risks');
    risks.textContent = '';
    renderTechnicalMarkers(risks, entry);

    renderPptDescription(entry);
    renderSkillTextFirst(entry);
    renderPreview(entry);
    renderProvenance(entry);
    renderRelated(entry);
    renderDirectUse(entry);
    renderOriginalText(entry);
    $('#unified-source-project').textContent = `${nonEmpty(entry.source_project_name, entry.source_name)} · ${nonEmpty(entry.source_repository_or_site)}`;
    $('#unified-source-entry-locator').textContent = nonEmpty(entry.entry_level_source_locator, `${entry.source_file || entry.relative_path} @ ${entry.source_commit_or_version || entry.source_commit}`);
    $('#unified-source-creator').textContent = nonEmpty(entry.original_creator_display, '上游未提供個別作者／Individual creator not supplied by upstream');
    $('#unified-source-contributors').textContent = asArray(entry.upstream_contributor_display_names || entry.upstream_contributor_names).join('、') || '上游未提供逐筆 contributor／Not supplied at entry level';
    $('#unified-source-publisher').textContent = nonEmpty(entry.publisher_or_maintainer);
    $('#unified-source-rights-holder').textContent = nonEmpty(entry.rights_holder);
    $('#unified-source-adapter').textContent = `${sourceStatusLabel(entry.local_adaptation_status)} · ${nonEmpty(entry.local_adapter_name_or_project)}${entry.local_adaptation_status === 'SANITIZED_LOCAL_ADAPTATION' ? ' · ' + (entry.public_sanitization_note_zh_tw || '公開版本已替換本機絕對路徑；不宣稱與上游原始位元組相同。') : ''}`;
    $('#unified-source-link-status').textContent = `${sourceStatusLabel(entry.source_link_semantics)} · ${sourceStatusLabel(entry.link_validation_status)}`;
    const localSourceNote = $('#unified-local-source-note');
    localSourceNote.textContent = [entry.local_source_usage_note_zh_tw, entry.local_source_usage_note_en].filter(Boolean).join(' ');
    localSourceNote.hidden = !localSourceNote.textContent;
    const compareButton = $('#unified-add-compare');
    compareButton.hidden = entry.selection_eligible === false;
    compareButton.disabled = false;
    compareButton.textContent = state.compareIds.includes(entry.id) ? '從比較移除' : '加入比較';
    const isCorrected = entry.artifact_disposition === 'LOCAL_CORRECTED_DERIVATIVE';
    const artifactLink = $('#unified-open-artifact');
    const artifactHref = previewIsAvailable(entry) ? runtimePreviewPath(entry.example_path) : '';
    artifactLink.hidden = !artifactHref;
    setLink(artifactLink, artifactHref, '開啟本機預覽');
    const originalArtifactLink = $('#unified-open-original-artifact');
    originalArtifactLink.hidden = !isCorrected;
    const originalAsset = asArray(entry.direct_use_assets).find((asset) => asset.path === entry.source_original_artifact_path && asset.bytes > 0 && asset.sha256);
    setLink(originalArtifactLink, isCorrected && capabilities.can_download === true && originalAsset && pathIsLocal(originalAsset.path) ? originalAsset.path : '', '開啟來源原始 PPTX');
    const upstreamLink = $('#unified-open-source');
    const upstreamHref = capabilities.can_open_entry_upstream === true ? externalSourceUrl(capabilities.entry_upstream_url) : '';
    setLink(upstreamLink, upstreamHref, '開啟此筆上游來源');
    const provenanceHref = capabilities.can_open_local_provenance === true && pathIsLocal(capabilities.provenance_record_path) ? capabilities.provenance_record_path : '';
    setLink($('#unified-open-provenance'), provenanceHref, '查看單筆來源證明');
    const datasetLink = $('#unified-open-dataset');
    const datasetHref = capabilities.can_open_upstream_project_or_dataset === true ? externalSourceUrl(capabilities.project_or_dataset_url) : '';
    setLink(datasetLink, datasetHref, capabilities.project_or_dataset_kind === 'dataset' ? '開啟完整上游資料集' : '開啟上游專案');
    const directPanel = $('#unified-direct-use-panel');
    directPanel.hidden = ![...directPanel.querySelectorAll('.direct-use-actions a, .direct-use-actions button')].some((action) => !action.hidden);
    const imageHandoff = $('#unified-copy-image-handoff');
    imageHandoff.hidden = !['web-page', 'ui-component', 'motion-effect', 'image'].includes(entry.output_type)
      && !['artifact-html', 'image-preview', 'static-screenshot', 'slide-thumbnails'].includes(entry.preview_type);
    elements.copyStatus.textContent = '';
    syncInlinePreviewPlayback();
    if (!elements.detail.open) elements.detail.showModal();
    const detailShell = elements.detail.querySelector('.unified-detail-shell');
    if (detailShell) detailShell.scrollTop = 0;
    document.documentElement.dataset.atlasDetailOpenMs = (performance.now() - detailStartedAt).toFixed(2);
  }

  function closeDetail() {
    unloadPreview();
    setLargePreview(false);
    if (elements.detail.open) elements.detail.close();
    scheduleInlinePreviewReconcile();
    const trigger = state.selected ? elements.results.querySelector(`[data-open-unified="${CSS.escape(state.selected.id)}"]`) : null;
    trigger?.focus({ preventScroll: true });
  }

  async function copyText(text, message) {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const helper = document.createElement('textarea');
        helper.className = 'clipboard-helper';
        helper.value = text;
        helper.setAttribute('readonly', '');
        document.body.append(helper);
        helper.select();
        if (!document.execCommand('copy')) throw new Error('copy command unavailable');
        helper.remove();
      }
      elements.copyStatus.textContent = message;
    } catch (_) {
      elements.copyStatus.textContent = '瀏覽器未允許自動複製；請選取文字後手動複製。';
    }
  }

  async function copyDirectAssetText() {
    const button = $('#unified-copy-direct-text');
    if (!button.dataset.assetType) return;
    try {
      let source;
      if (button.dataset.copyPayloadKind === 'live-code') {
        const entry = window.LIVE_UI_CATALOG?.entries?.find((candidate) => candidate.id === state.selected?.id);
        const access = window.LiveUiCatalogCore?.getCodeAccess(entry, window.LIVE_UI_CODE, window.LIVE_UI_CATALOG?.content_hash);
        if (!access?.allowed) throw new Error('live source access is not verified');
        source = window.LiveUiCatalogCore.buildCodeBundle(entry, access.record);
        if (window.crypto?.subtle) {
          const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
          const actual = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
          if (actual !== button.dataset.copySha256) throw new Error('live source payload hash mismatch');
        }
      } else source = await window.ATLAS_DOWNLOAD_RUNTIME?.readAssetText({
        delivery_mode: button.dataset.copyDelivery,
        copy_data_key: button.dataset.copyDataKey,
        payload_shard: button.dataset.copyPayloadShard,
        payload_key: button.dataset.copyPayloadKey,
        payload_path: button.dataset.copyPayloadPath,
        bytes: Number(button.dataset.copyBytes || 0),
        sha256: button.dataset.copySha256
      });
      if (!source) throw new Error('empty asset');
      const label = button.dataset.assetType === 'prompt-file' ? 'Prompt 正文'
        : button.dataset.assetType === 'workflow-json' ? 'Workflow JSON' : button.dataset.assetType === 'live-code' ? '完整程式碼與來源檔標頭' : '完整來源內容';
      await copyText(source, `已複製 ${label}；來源檔未被修改。`);
    } catch (_) {
      elements.copyStatus.textContent = '完整內容無法載入；請使用旁邊的下載操作。';
    }
  }

  function announce(message) {
    elements.activeState.textContent = message;
  }

  function toggleCompare(id) {
    const entry = entryById.get(id);
    if (!entry || entry.selection_eligible === false) return;
    const position = state.compareIds.indexOf(id);
    if (position >= 0) state.compareIds.splice(position, 1);
    else if (state.compareIds.length >= 4) {
      announce('比較最多 4 項；請先移除一項。');
      return;
    } else state.compareIds.push(id);
    updateCompareTray();
    renderResults();
    if (state.selected?.id === id) $('#unified-add-compare').textContent = state.compareIds.includes(id) ? '從比較移除' : '加入比較';
  }

  function updateCompareTray() {
    const selected = state.compareIds.map((id) => entryById.get(id)).filter(Boolean);
    elements.compareTray.hidden = selected.length === 0;
    $('#compare-tray-count').textContent = `${selected.length} / 4`;
    $('#compare-tray-titles').textContent = selected.map((entry) => nonEmpty(entry.display_title_zh_tw, entry.title)).join(' · ') || '尚未加入項目';
    $('#open-compare').disabled = selected.length < 2;
  }

  function comparePreview(entry) {
    const container = makeElement('div', 'compare-preview');
    if (!previewIsAvailable(entry)) {
      container.append(makeElement('p', '', labelFor(EXAMPLE_LABELS, exampleStatus(entry))));
      return container;
    }
    if (entry.preview_type === 'slide-thumbnails' || /\.(?:svg|png|jpe?g|webp)(?:[?#]|$)/i.test(entry.example_path)) {
      const image = document.createElement('img');
      image.src = runtimePreviewPath(entry.example_path);
      image.alt = `${nonEmpty(entry.display_title_zh_tw, entry.title)} 比較預覽`;
      container.append(image);
    } else {
      const frame = document.createElement('iframe');
      frame.sandbox = 'allow-scripts';
      frame.title = `${nonEmpty(entry.display_title_zh_tw, entry.title)} 比較隔離預覽`;
      frame.loading = 'eager';
      frame.referrerPolicy = 'no-referrer';
      frame.src = runtimePreviewPath(entry.example_path);
      container.append(frame);
    }
    return container;
  }

  function compareField(term, value) {
    const row = makeElement('div');
    row.append(makeElement('dt', '', term), makeElement('dd', '', nonEmpty(value)));
    return row;
  }

  function renderCompare() {
    const selected = state.compareIds.map((id) => entryById.get(id)).filter(Boolean);
    elements.compareGrid.textContent = '';
    elements.compareGrid.style.setProperty('--compare-columns', String(Math.max(2, selected.length)));
    const compatibility = core.comparisonCompatibility(selected);
    $('#compare-compatibility').textContent = compatibility.message || '加入至少兩項後可比較。';
    $('#compare-compatibility').classList.toggle('is-warning', !compatibility.compatible);
    selected.forEach((entry) => {
      const column = makeElement('article', 'compare-column');
      const header = makeElement('header');
      header.append(makeElement('p', '', `${labelFor(CONTENT_LABELS, entry.content_type)} · ${sourceDisplay(entry)}`), makeElement('h3', '', nonEmpty(entry.display_title_zh_tw, entry.title)));
      const dl = makeElement('dl');
      const previewRow = makeElement('div');
      previewRow.append(makeElement('dt', '', '成果預覽'), comparePreview(entry));
      dl.append(
        previewRow,
        compareField('主要功能', entry.summary_zh_tw),
        compareField('適用場景', asArray(entry.use_cases).join('、')),
        compareField('風格 / 互動', [...asArray(entry.style_tags), ...asArray(entry.interaction_tags)].join('、')),
        compareField('技術組合', asArray(entry.technology_stack).join('、')),
        compareField('相依項目', asArray(entry.dependencies).join('、') || '無已知相依'),
        compareField('離線狀態', entry.offline_status),
        compareField('授權', `${entry.license} · ${licenseStatusLabel(entry.license_status)}`),
        compareField('成果狀態', labelFor(EXAMPLE_LABELS, exampleStatus(entry))),
        compareField('使用方法', entry.how_to_zh_tw)
      );
      const footer = makeElement('footer');
      const detail = makeElement('button', '', '查看完整詳情');
      detail.type = 'button';
      detail.dataset.compareDetail = entry.id;
      const remove = makeElement('button', '', '從比較移除');
      remove.type = 'button';
      remove.dataset.compareRemove = entry.id;
      footer.append(detail, remove);
      column.append(header, dl, footer);
      elements.compareGrid.append(column);
    });
  }

  function openCompare() {
    if (state.compareIds.length < 2) return;
    const compareStartedAt = performance.now();
    renderCompare();
    elements.compareDialog.showModal();
    document.documentElement.dataset.atlasCompareOpenMs = (performance.now() - compareStartedAt).toFixed(2);
    syncInlinePreviewPlayback();
  }

  function closeCompare() {
    unloadPreview(elements.compareGrid);
    elements.compareGrid.textContent = '';
    if (elements.compareDialog.open) elements.compareDialog.close();
    scheduleInlinePreviewReconcile();
    $('#open-compare').focus({ preventScroll: true });
  }

  function clearCompare() {
    state.compareIds = [];
    updateCompareTray();
    renderResults();
    if (elements.compareDialog.open) closeCompare();
  }

  function showGuideStep(step) {
    state.guideStep = Math.max(0, Math.min(3, step));
    $$('.guided-step').forEach((fieldset) => { fieldset.hidden = Number(fieldset.dataset.guideStep) !== state.guideStep; });
    $('#guided-progress').textContent = `步驟 ${state.guideStep + 1} / 4`;
    $('#guided-back').disabled = state.guideStep === 0;
    $('#guided-next').hidden = state.guideStep === 3;
    $('#guided-apply').hidden = state.guideStep !== 3;
    const current = $(`.guided-step[data-guide-step="${state.guideStep}"] input:checked`) || $(`.guided-step[data-guide-step="${state.guideStep}"] input`);
    current?.focus({ preventScroll: true });
  }

  function openGuide() {
    showGuideStep(0);
    elements.guide.showModal();
  }

  function closeGuide() {
    if (elements.guide.open) elements.guide.close();
    $('#open-guided-discovery').focus({ preventScroll: true });
  }

  function applyGuide() {
    const data = new FormData($('#guided-form'));
    const answers = {
      output: data.get('guided-output') || '',
      style: data.get('guided-style') || '',
      interaction: data.get('guided-interaction') || '',
      technology: data.get('guided-technology') || ''
    };
    const guided = core.buildGuidedDiscovery(answers);
    setActiveView('explore');
    clearUnified(true);
    elements.query.value = guided.query;
    Object.entries(guided.filters).forEach(([key, value]) => {
      if (filterElements[key]) setSelectValue(filterElements[key], value);
    });
    if (answers.output === 'design-system') setSelectValue(filterElements.content_type, 'design-system');
    scheduleSearch(true);
    closeGuide();
    elements.results.focus({ preventScroll: true });
  }

  function bindEvents() {
    elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      scheduleSearch(true);
      elements.results.focus({ preventScroll: true });
    });
    elements.query.addEventListener('input', () => scheduleSearch(true));
    Object.values(filterElements).forEach((element) => element.addEventListener('change', () => scheduleSearch(true)));
    elements.sort.addEventListener('change', () => scheduleSearch(false));
    elements.clear.addEventListener('click', () => clearUnified(true));
    $('[data-unified-clear]').addEventListener('click', () => clearUnified(true));
    elements.loadMore.addEventListener('click', () => {
      const scrollRenderStartedAt = performance.now();
      state.visible += 48;
      renderResults();
      document.documentElement.dataset.atlasScrollRenderMs = (performance.now() - scrollRenderStartedAt).toFixed(2);
    });
    $('#outcome-shortcut-list').addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (button) activateShortcut(button);
    });
    elements.results.addEventListener('click', (event) => {
      const open = event.target.closest('[data-open-unified]');
      if (open) showDetail(entryById.get(open.dataset.openUnified), open);
      const compare = event.target.closest('[data-compare-unified]');
      if (compare) toggleCompare(compare.dataset.compareUnified);
    });
    $('#unified-related-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-related-id]');
      if (button) showDetail(entryById.get(button.dataset.relatedId));
    });
    $('#unified-add-compare').addEventListener('click', () => state.selected && toggleCompare(state.selected.id));
    $('#unified-copy-handoff').addEventListener('click', () => state.selected && copyText(core.buildCodexHandoff(state.selected), '已複製只讀、Top-N 限制的 Codex 安全交接。'));
    $('#unified-copy-direct-text').addEventListener('click', copyDirectAssetText);
    elements.detail.addEventListener('atlas-download-starting', (event) => {
      elements.copyStatus.textContent = `正在準備下載 ${event.detail?.filename || '檔案'}…`;
    });
    elements.detail.addEventListener('atlas-download-started', (event) => {
      elements.copyStatus.textContent = `已開始下載 ${event.detail?.filename || '檔案'}；目前頁面未切換。`;
    });
    elements.detail.addEventListener('atlas-download-failed', (event) => {
      elements.copyStatus.textContent = `下載未開始：${event.detail?.message || '資產驗證失敗'}。`;
    });
    $('#unified-copy-image-handoff').addEventListener('click', () => copyText(core.buildImageSimilarityHandoff(), '已複製圖片相似效果交接；網頁本身未呼叫 Codex API。'));
    $('#unified-preview-expand').addEventListener('click', () => setLargePreview(!elements.detail.classList.contains('is-preview-large')));
    [$('#unified-detail-close'), $('#unified-detail-close-icon')].forEach((button) => button.addEventListener('click', closeDetail));
    elements.detail.addEventListener('cancel', (event) => { event.preventDefault(); closeDetail(); });

    $('#open-guided-discovery').addEventListener('click', openGuide);
    $('#guided-close-icon').addEventListener('click', closeGuide);
    $('#guided-back').addEventListener('click', () => showGuideStep(state.guideStep - 1));
    $('#guided-next').addEventListener('click', () => showGuideStep(state.guideStep + 1));
    $('#guided-form').addEventListener('submit', (event) => { event.preventDefault(); applyGuide(); });
    elements.guide.addEventListener('cancel', (event) => { event.preventDefault(); closeGuide(); });

    $('#open-compare').addEventListener('click', openCompare);
    $('#clear-compare').addEventListener('click', clearCompare);
    $('#compare-clear-dialog').addEventListener('click', clearCompare);
    [$('#compare-close'), $('#compare-close-icon')].forEach((button) => button.addEventListener('click', closeCompare));
    elements.compareDialog.addEventListener('cancel', (event) => { event.preventDefault(); closeCompare(); });
    elements.compareGrid.addEventListener('click', (event) => {
      const detail = event.target.closest('[data-compare-detail]');
      if (detail) {
        closeCompare();
        showDetail(entryById.get(detail.dataset.compareDetail));
      }
      const remove = event.target.closest('[data-compare-remove]');
      if (remove) {
        toggleCompare(remove.dataset.compareRemove);
        if (state.compareIds.length >= 2) renderCompare();
        else closeCompare();
      }
    });

    const navButtons = $$('button[data-atlas-view]');
    navButtons.forEach((button) => {
      button.addEventListener('click', () => setActiveView(button.dataset.atlasView));
      button.addEventListener('keydown', (event) => {
        const current = navButtons.indexOf(button);
        let next = current;
        if (event.key === 'ArrowRight') next = (current + 1) % navButtons.length;
        else if (event.key === 'ArrowLeft') next = (current - 1 + navButtons.length) % navButtons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = navButtons.length - 1;
        else return;
        event.preventDefault();
        setActiveView(navButtons[next].dataset.atlasView);
        navButtons[next].focus({ preventScroll: true });
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (elements.detail.open) {
          event.preventDefault();
          closeDetail();
          return;
        }
        if (elements.guide.open) {
          event.preventDefault();
          closeGuide();
          return;
        }
        if (elements.compareDialog.open) {
          event.preventDefault();
          closeCompare();
          return;
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !['prompt', 'live'].includes(state.view)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (elements.detail.open) closeDetail();
        if (elements.guide.open) closeGuide();
        if (elements.compareDialog.open) closeCompare();
        elements.query.focus({ preventScroll: true });
      }
    }, true);
    window.addEventListener('scroll', handleInlinePreviewScroll, { passive: true });
    window.addEventListener('resize', scheduleInlinePreviewReconcile, { passive: true });
    document.addEventListener('visibilitychange', syncInlinePreviewPlayback);
  }

  function initialize() {
    if (!core || !entries.length) {
      $('#unified-index-meta').textContent = 'Unified V2 核心或索引載入失敗；舊版 Prompt / Live UI 仍可使用。';
      elements.count.textContent = '0 筆結果';
      return;
    }
    populateFilters();
    bindEvents();
    $('#header-unified-count').textContent = entries.length.toLocaleString('en-US');
    $('#nav-unified-count').textContent = entries.length.toLocaleString('en-US');
    const requested = new URLSearchParams(location.search).get('mode');
    const hashMatch = location.hash.match(/(?:^#|[&#])view=(explore|prompt|live|outcomes|systems)/i);
    const initialView = ['explore', 'prompt', 'live', 'outcomes', 'systems'].includes(requested) ? requested : (hashMatch?.[1]?.toLowerCase() || 'explore');
    setActiveView(initialView);
    document.documentElement.dataset.atlasFirstRenderMs = (performance.now() - runtimeStartedAt).toFixed(2);
  }

  initialize();
})();
