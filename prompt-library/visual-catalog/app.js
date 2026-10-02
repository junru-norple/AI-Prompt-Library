/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';

  const catalog = window.PROMPT_CATALOG || { entries: [], content_hash: 'missing', generated_at: '' };
  const promptStore = window.PROMPT_CATALOG_PROMPTS || { entries: [], content_hash: 'missing' };
  const core = window.PromptCatalogCore;
  const liveCatalog = window.LIVE_UI_CATALOG || { entries: [], content_hash: 'missing', generated_at: '' };
  const liveCodeStore = window.LIVE_UI_CODE || { entries: [], content_hash: 'missing' };
  const liveCore = window.LiveUiCatalogCore;
  const technicalMarkerRegistry = window.TECHNICAL_MARKER_REGISTRY || { records: [] };
  const localization = window.VISUAL_CATALOG_ZH_TW || { prompt_entries: [], live_ui_entries: [], labels: {} };
  const entries = Array.isArray(catalog.entries) ? catalog.entries : [];
  const liveEntries = Array.isArray(liveCatalog.entries) ? liveCatalog.entries : [];
  const DISABLED_SOURCE_ID = '';
  const privateLiveEntryCount = 0;
  const liveSourceDisplay = (entry) => entry.source_name || entry.source_id;
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const liveEntryById = new Map(liveEntries.map((entry) => [entry.id, entry]));
  const promptLocalizationById = new Map(asArraySafe(localization.prompt_entries).map((entry) => [entry.entry_id, entry]));
  const liveLocalizationById = new Map(asArraySafe(localization.live_ui_entries).map((entry) => [entry.entry_id, entry]));
  const technicalMarkerById = new Map(asArraySafe(technicalMarkerRegistry.records).map((entry) => [entry.id, entry]));
  const localizedLabels = localization.labels || {};
  const $ = (selector) => document.querySelector(selector);
  const query = $('#query');
  const results = $('#results');
  const empty = $('#empty');
  const count = $('#result-count');
  const dialog = $('#prompt-dialog');
  const liveQuery = $('#live-query');
  const liveResults = $('#live-results');
  const liveEmpty = $('#live-empty');
  const liveCount = $('#live-result-count');
  const liveDialog = $('#live-ui-dialog');
  const controls = {
    source: $('#source-filter'), type: $('#type-filter'), profile: $('#profile-filter'),
    stack: $('#stack-filter'), license: $('#license-filter'), trust: $('#trust-filter'), sort: $('#sort')
  };
  const liveControls = {
    source: $('#live-source-filter'), type: $('#live-type-filter'), interaction: $('#live-interaction-filter'),
    stack: $('#live-stack-filter'), license: $('#live-license-filter'), offline: $('#live-offline-filter'), sort: $('#live-sort')
  };
  let selectedEntry = null;
  let selectedAccess = null;
  let lastTrigger = null;
  let selectedLiveEntry = null;
  let selectedLiveAccess = null;
  let lastLiveTrigger = null;
  let currentMode = 'prompt';
  let promptRendered = false;
  let liveRendered = false;
  const TARGET_WARM_PREVIEW_SLOTS = 33;
  const MIN_ACCEPTABLE_WARM_PREVIEW_SLOTS = 30;
  const EFFECTIVE_WARM_PREVIEW_SLOTS = 33;
  const WARM_PREVIEW_NEUTRAL_BEFORE = 16;
  const WARM_PREVIEW_FORWARD_BEFORE = 5;
  const WARM_PREVIEW_REVERSE_BEFORE = 27;
  const MAX_INSTANTIATED_PREVIEWS_DESKTOP = 12;
  const MAX_INSTANTIATED_PREVIEWS_TABLET = 8;
  const MAX_INSTANTIATED_PREVIEWS_MOBILE = 4;
  const MAX_PLAYING_PREVIEWS = 4;
  const PREVIEW_LOAD_TIMEOUT_MS = 8000;
  const instantiatedPreviews = new Set();
  const visiblePreviews = new Set();
  const previewLoads = new WeakMap();
  const previewScheduleWaitTimes = [];
  const previewLoadTimes = [];
  const previewScrollFrameTimes = [];
  const previewVisibleReadyTimes = [];
  const previewLongTaskDurations = [];
  const previewVisibleStarted = new WeakMap();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let previewObserver = null;
  let previewLoadToken = 0;
  let warmPreviewFrame = 0;
  let warmPreviewScheduledAt = 0;
  let previewScrollY = window.scrollY;
  let previewScrollDirection = 0;
  if ('PerformanceObserver' in window) {
    try {
      const previewLongTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => previewLongTaskDurations.push(entry.duration));
        if (previewLongTaskDurations.length > 240) previewLongTaskDurations.splice(0, previewLongTaskDurations.length - 240);
      });
      previewLongTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (_) { /* Long Task API is optional. */ }
  }
  const usageModeLabels = Object.freeze({
    'web-project': '網站專案',
    'code-project': '程式專案',
    'chat-role': '對話角色',
    'analysis-writing': '分析／寫作',
    'image-generation': '圖片生成',
    other: '其他用途'
  });
  const usageCardCopy = Object.freeze({
    'web-project': { how: '貼給可存取專案的 Coding Agent。', output: '網站頁面與元件，實際檔案依專案技術棧決定。' },
    'code-project': { how: '貼給可存取目標程式專案的 Coding Agent。', output: '程式碼、設定、測試或文件，依現有專案結構決定。' },
    'chat-role': { how: '貼到對話型 AI，再輸入你的問題或資料。', output: 'AI 對話回覆；通常不會建立本機檔案。' },
    'analysis-writing': { how: '連同要分析或撰寫的資料交給合適的 AI。', output: '文章、分析、計畫、報告、摘要或結構化文字。' },
    'image-generation': { how: '貼入相容的圖片生成工具並設定比例與風格。', output: '圖片或圖片變體，格式與解析度由工具決定。' },
    other: { how: '先閱讀完整 Prompt，再交給具備相應能力的 AI。', output: '依 Prompt 內容與所用工具能力產出。' }
  });

  function asArraySafe(value) {
    return Array.isArray(value) ? value : [];
  }

  if (!core) {
    $('#index-meta').textContent = '目錄核心載入失敗';
    count.textContent = '0 PROMPTS';
    return;
  }

  if (!liveCore) {
    const liveModeButton = $('[data-mode="live"]');
    if (liveModeButton) {
      liveModeButton.disabled = true;
      liveModeButton.setAttribute('aria-disabled', 'true');
      liveModeButton.title = 'Live UI 目錄核心載入失敗；Prompt Database 仍可使用。';
    }
    $('#live-index-meta').textContent = 'Live UI 目錄核心載入失敗';
    liveCount.textContent = '0 LIVE UI';
  }

  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
  const asArray = (value) => Array.isArray(value) ? value : [];
  const hasCjk = (value) => /[\u3400-\u9fff]/u.test(String(value || ''));
  const missingAuthor = (value) => !String(value || '').trim() || /^(?:未標示|unknown|n\/a|none)$/iu.test(String(value || '').trim());
  const authorDisplay = (entry) => missingAuthor(entry?.original_creator_display)
    ? '上游未提供個別作者／Individual creator not supplied by upstream'
    : entry.original_creator_display;
  const labelFor = (group, value, fallback = '') => localizedLabels[group]?.[value] || fallback || `技術標記：${value}`;
  const markerClassLabels = Object.freeze({ INFO: '資訊', LIMITATION: '下載後限制', BLOCKED: 'Library 內封鎖', FIXED: '已處理', EXCLUDED: '已排除' });
  const markerCopy = Object.freeze({
    'account-or-payment': '下載後使用的第三方服務可能需要帳號或費用；Library 瀏覽、Preview、Copy 與 Download 不需要。',
    'auto-deploy': '原始內容提及部署；Library 與 Preview 不會自動部署，執行前必須由使用者明確確認。',
    'missing-reduced-motion': '原始內容未完整要求 reduced motion；Atlas 正式 Preview 已獨立支援並驗證。',
    'remote-asset': '上游內容提及遠端素材；Atlas 正式 Preview 已本機化，斷網時不會退回遠端內容。'
  });
  const markerBlocked = new Set(['auto-deploy', 'dangerous-command', 'untrusted-download', 'secret-placeholder-required']);
  const markerLimitations = new Set(['account-or-payment', 'missing-accessibility', 'missing-reduced-motion', 'package-install', 'package-source-requires-dependency-install', 'remote-asset']);
  const markerFixed = new Set(['local-generated-example', 'no-remote-assets', 'offline-dependency-free-static-adaptation', 'offline-preview-is-dependency-free', 'remote-assets-replaced-in-preview', 'remote-preview-excluded', 'source-animation-replaced-with-bounded-css-preview', 'unverified-font-assets-excluded-use-system-font', 'upstream-canvas-or-webgl-represented-by-bounded-adapter', 'upstream-framework-dependencies-not-executed-by-adapter', 'upstream-media-replaced-with-local-geometry', 'upstream-network-api-not-executed', 'upstream-remote-reference-replaced-with-local-data']);

  function markerClassification(key) {
    if (/license-(?:unknown|unavailable)|blocked.*license/iu.test(String(key || ''))) return 'EXCLUDED';
    if (markerBlocked.has(key)) return 'BLOCKED';
    if (markerLimitations.has(key)) return 'LIMITATION';
    if (markerFixed.has(key)) return 'FIXED';
    return 'INFO';
  }

  function technicalMarkersFor(entry, localizedItems = []) {
    const labels = new Map(asArray(localizedItems).map((item) => [item?.key, item?.label_zh_tw]));
    const stored = new Map(asArray(entry.technical_markers).map((item) => [item?.key, item]));
    return [...new Set(asArray(entry.risk_flags))].map((key) => {
      const record = stored.get(key) || {};
      const registry = technicalMarkerById.get(key) || {};
      const classification = registry.classification || record.classification || markerClassification(key);
      return {
        key,
        classification,
        label_zh_tw: record.name_zh_tw || registry.name_zh_tw || markerCopy[key] || labels.get(key) || labelFor('risk', key),
        label_en: record.name_en || registry.name_en || 'Verified technical note',
        remediation_zh_tw: record.entry_specific_note_zh_tw || record.remediation_zh_tw || registry.library_behavior_zh_tw || '',
        remediation_en: record.entry_specific_note_en || record.remediation_en || registry.library_behavior_en || ''
      };
    });
  }

  function markerBadgeMarkup(marker) {
    const kind = String(marker.classification || 'INFO').toLowerCase();
    const classLabel = markerClassLabels[marker.classification] || marker.classification;
    const title = `${marker.label_zh_tw}／${marker.label_en} — ${marker.remediation_zh_tw}${marker.remediation_en ? ` / ${marker.remediation_en}` : ''}`;
    return `<span class="badge badge-marker badge-marker-${escapeHtml(kind)}" data-marker-key="${escapeHtml(marker.key)}" data-marker-class="${escapeHtml(marker.classification)}" title="${escapeHtml(title)}">已驗證提醒（${escapeHtml(classLabel)}） · ${escapeHtml(marker.label_zh_tw)}：${escapeHtml(marker.remediation_zh_tw)}</span>`;
  }

  function licenseStatusLabel(status) {
    if (status === 'verified_official_site_declaration') return '已依官方固定版本授權聲明完成驗證／Verified against the pinned official license declaration';
    return core.isVerifiedLicenseStatus?.(status) ? '授權已驗證／License verified' : labelFor('license_status', status, '詳見來源授權說明／See source license details');
  }
  const promptLocalization = (entry) => {
    const record = promptLocalizationById.get(entry.id);
    const valid = record
      && record.source_id === entry.source_id
      && record.upstream_relative_path === entry.relative_path
      && record.localized_from_hash === entry.content_hash;
    if (valid) return record;
    const usageLabel = labelFor('usage_mode', entry.usage_mode, '此 Prompt');
    return {
      entry_id: entry.id,
      display_title_zh_tw: entry.display_title || entry.title,
      function_summary_zh_tw: hasCjk(entry.function_summary) ? entry.function_summary : `${usageLabel}的功能摘要目前採保守說明，使用前請閱讀完整 Prompt。`,
      prompt_summary_zh_tw: hasCjk(entry.prompt_summary) ? entry.prompt_summary : `這是一份${usageLabel}；實際範圍以完整 Prompt 與提供的資料為準。`,
      use_cases_zh_tw: asArray(entry.use_cases).filter(hasCjk).length ? asArray(entry.use_cases).filter(hasCjk) : [`使用於${usageLabel}需求`],
      how_to_use_zh_tw: hasCjk(entry.how_to_use) ? entry.how_to_use : '先閱讀完整 Prompt，再交給具備所需權限與能力的 AI；執行檔案、安裝或部署操作前必須再次確認。',
      expected_output_zh_tw: hasCjk(entry.expected_output) ? entry.expected_output : '產出形式依完整 Prompt、輸入資料與所用工具能力而定。',
      how_to_view_result_zh_tw: hasCjk(entry.how_to_view_result) ? entry.how_to_view_result : '在所用 AI 的對話或目標專案既有預覽方式中查看結果。',
      tool_compatibility_note_zh_tw: hasCjk(entry.tool_compatibility_note) ? entry.tool_compatibility_note : '請先確認所用 AI 是否具備目標檔案、專案或生成工具的必要權限。',
      type_label_zh_tw: `${labelFor('prompt_type', entry.prompt_type, `Prompt 類型：${entry.prompt_type}`)}／${labelFor('page_type', entry.page_type, `頁面類型：${entry.page_type}`)}`,
      profile_label_zh_tw: labelFor('design_profile', entry.design_profile, `設計分類：${entry.design_profile}`),
      risk_labels_zh_tw: asArray(entry.risk_flags).map((key) => ({ key, label_zh_tw: labelFor('risk', key) })),
      original_english_fields: [],
      localization_status: [entry.function_summary, entry.prompt_summary, entry.how_to_use, entry.expected_output].every(hasCjk) ? 'complete' : 'review_required'
    };
  };
  const liveLocalization = (entry) => {
    const record = liveLocalizationById.get(entry.id);
    const currentHash = entry.source_hash || entry.content_hash;
    const currentPath = entry.upstream_relative_path || entry.source_position;
    const valid = record
      && record.source_id === entry.source_id
      && record.upstream_relative_path === currentPath
      && record.localized_from_hash === currentHash;
    if (valid) return record;
    const title = entry.title_zh || entry.title;
    return {
      entry_id: entry.id,
      display_title_zh_tw: title,
      function_summary_zh_tw: hasCjk(entry.summary) ? entry.summary : `「${title}」是 ${liveSourceDisplay(entry)} 的介面預覽項目；目前使用保守繁中說明，來源變更後需重新產生本地化內容。`,
      use_cases_zh_tw: asArray(entry.use_cases).length ? asArray(entry.use_cases) : ['檢視隔離的本機預覽', '確認固定版本的來源與互動狀態'],
      how_to_use_zh_tw: hasCjk(entry.how_to_use) ? entry.how_to_use : '先開啟隔離預覽，再檢視完整來源檔清單；整合前請讓 Coding Agent 讀取現有專案，不要直接執行上游安裝、部署、登入或付款指令。',
      expected_output_zh_tw: hasCjk(entry.expected_output) ? entry.expected_output : '取得可追溯的專案整合素材與來源清單；實際檔案及相依設定由目標專案架構決定。',
      how_to_view_result_zh_tw: hasCjk(entry.how_to_view_result) ? entry.how_to_view_result : '在 Visual Prompt Atlas 的「Live UI」中查看隔離預覽。',
      tool_compatibility_note_zh_tw: hasCjk(entry.tool_compatibility_note) ? entry.tool_compatibility_note : '本機預覽不代表上游相依套件可直接執行；整合前仍需由 Coding Agent 檢查目標專案。',
      interaction_labels_zh_tw: asArray(entry.interactions).map((key) => ({ key, label_zh_tw: labelFor('interaction', key) })),
      risk_labels_zh_tw: asArray(entry.risk_flags).map((key) => ({ key, label_zh_tw: labelFor('risk', key) })),
      type_label_zh_tw: labelFor('live_type', entry.component_type || entry.animation_type, `技術類型：${entry.component_type || entry.animation_type}`),
      offline_label_zh_tw: labelFor('offline_status', entry.offline_status, `離線狀態：${entry.offline_status}`),
      stack_labels_zh_tw: asArray(entry.stack).map((key) => ({ key, label_zh_tw: labelFor('stack', key, key) })),
      original_english_fields: [],
      localization_status: hasCjk(entry.summary) && hasCjk(entry.how_to_use) ? 'complete' : 'review_required'
    };
  };
  const valuesFrom = (items, selector) => [...new Set(items.flatMap(selector).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));
  const addOptions = (element, list, labeler = (value) => value) => list.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = labeler(value);
    element.append(option);
  });

  addOptions(controls.source, valuesFrom(entries, (entry) => [entry.source_id]));
  addOptions(controls.type, valuesFrom(entries, (entry) => [entry.page_type]), (value) => labelFor('page_type', value, value));
  addOptions(controls.profile, valuesFrom(entries, (entry) => [entry.design_profile]), (value) => labelFor('design_profile', value, value));
  addOptions(controls.stack, valuesFrom(entries, (entry) => entry.technology_stack || entry.stack || []));
  addOptions(controls.license, valuesFrom(entries, (entry) => [entry.source_license]));
  addOptions(controls.trust, valuesFrom(entries, (entry) => [entry.source_tier]), (value) => labelFor('source_tier', value, value));
  addOptions(liveControls.source, valuesFrom(liveEntries, (entry) => [entry.source_id]), (value) => value === DISABLED_SOURCE_ID ? '公開內容' : value);
  addOptions(liveControls.type, valuesFrom(liveEntries, (entry) => [entry.animation_type, entry.component_type]), (value) => labelFor('live_type', value, value));
  addOptions(liveControls.interaction, valuesFrom(liveEntries, (entry) => entry.interactions || []), (value) => labelFor('interaction', value, value));
  addOptions(liveControls.stack, valuesFrom(liveEntries, (entry) => entry.stack || []), (value) => labelFor('stack', value, value));
  addOptions(liveControls.license, valuesFrom(liveEntries, (entry) => [entry.source_license]));
  addOptions(liveControls.offline, valuesFrom(liveEntries, (entry) => [entry.offline_status]), (value) => labelFor('offline_status', value, value));

  $('#header-prompt-count').textContent = entries.length.toLocaleString('en-US');
  $('#header-live-count').textContent = liveEntries.length.toLocaleString('en-US');
  $('#prompt-mode-count').textContent = entries.length.toLocaleString('en-US');
  $('#live-mode-count').textContent = liveEntries.length.toLocaleString('en-US');
  $('#index-meta').textContent = `${entries.length} 筆 · ${String(catalog.content_hash || '').slice(0, 14)} · ${catalog.generated_at || '建置時間未知'}`;
  if (liveCore) $('#live-index-meta').textContent = `${liveEntries.length} 筆 · Public Edition · ${String(liveCatalog.content_hash || '').slice(0, 14)}`;

  function palette(profile) {
    return ({
      motion: ['#51467d', '#7a6cab'], dashboard: ['#245955', '#4d827b'], component: ['#28566f', '#4f7e98'],
      ecommerce: ['#9a4b35', '#c57855'], editorial: ['#43565c', '#72878c'], landing: ['#315f72', '#63899a']
    })[profile] || ['#3d5962', '#6f878e'];
  }

  function card(entry, position) {
    const localized = promptLocalization(entry);
    const [toneA, toneB] = palette(entry.design_profile);
    const risk = technicalMarkersFor(entry, localized.risk_labels_zh_tw).slice(0, 4).map(markerBadgeMarkup).join('');
    const profileBadge = entry.design_profile ? `<span class="badge badge-type">風格 · ${escapeHtml(localized.profile_label_zh_tw)}</span>` : '';
    const pageTypeBadge = entry.page_type ? `<span class="badge badge-type">類型 · ${escapeHtml(labelFor('page_type', entry.page_type, entry.page_type))}</span>` : '';
    const stackBadges = asArray(entry.stack).slice(0, 3)
      .map((tag) => `<span class="badge badge-stack">技術棧 · ${escapeHtml(tag)}</span>`).join('');
    const tags = `${profileBadge}${pageTypeBadge}${stackBadges}`;
    const promptAccess = core.getPromptAccess(entry, promptStore, catalog.content_hash);
    const availability = promptAccess.allowed ? '全文可用 · 授權已驗證' : `內容不可用 · ${promptAccess.reason}`;
    const displayTitle = localized.display_title_zh_tw || entry.display_title || entry.title || '未命名 Prompt';
    const author = authorDisplay(entry);
    const functionSummary = localized.function_summary_zh_tw || entry.function_summary || '功能摘要以完整原始內容為準。';
    const promptSummary = localized.prompt_summary_zh_tw || entry.prompt_summary || '內容摘要以完整原始內容為準。';
    const summaryState = localized.localization_status === 'complete' ? '繁中內容已複核／Traditional Chinese reviewed' : '繁中內容未進入公開完整項目';
    const usageMode = usageCardCopy[entry.usage_mode] ? entry.usage_mode : 'other';
    const usage = usageCardCopy[usageMode];
    const usageState = entry.usage_status === 'review_required' ? '使用方式依原始內容與安全說明呈現' : usageModeLabels[usageMode];
    const sourceLicense = escapeHtml(entry.source_license);
    return `<article class="card" data-prompt-entry-id="${escapeHtml(entry.id)}" data-full-text-available="${promptAccess.allowed}" style="--tone-a:${toneA};--tone-b:${toneB}">
      <button class="card-open" type="button" data-prompt-id="${escapeHtml(entry.id)}" aria-label="查看 ${escapeHtml(displayTitle)} 詳情">
        <span class="visual"><span class="visual-code">Prompt ${String(position + 1).padStart(2, '0')} · ${escapeHtml(localized.profile_label_zh_tw)}／${escapeHtml(labelFor('page_type', entry.page_type, entry.page_type))}</span></span>
        <span class="card-body">
          <span class="card-meta"><span class="badge badge-source">來源 · ${escapeHtml(entry.source_id)}</span><span class="badge badge-license">授權 · ${sourceLicense}</span><span class="badge badge-quality">品質 · Q${escapeHtml(entry.quality_score)}</span></span>
          <span class="card-field card-heading"><span class="field-label">標題</span><span class="card-title">${escapeHtml(displayTitle)}</span></span>
          <span class="card-field"><span class="field-label">作者</span><span>${escapeHtml(author)}</span></span>
          <span class="card-field"><span class="field-label">功能</span><span>${escapeHtml(functionSummary)}</span></span>
          <span class="card-field card-prompt-summary"><span class="field-label">Prompt 簡介</span><span>${escapeHtml(promptSummary)}</span></span>
          <span class="card-field card-usage-field"><span class="field-label">使用方式</span><span>${escapeHtml(usage.how)}</span></span>
          <span class="card-field card-usage-field card-usage-output"><span class="field-label">預期產出</span><span>${escapeHtml(usage.output)}</span></span>
          <span class="chips" aria-label="Prompt 狀態標籤">${tags}${risk}</span>
          <span class="card-footer"><span>${escapeHtml(availability)} · ${escapeHtml(summaryState)} · ${escapeHtml(usageState)}</span><span>查看 Prompt →</span></span>
        </span>
      </button>
    </article>`;
  }

  function filterState() {
    return {
      source: controls.source.value,
      type: controls.type.value,
      profile: controls.profile.value,
      stack: controls.stack.value,
      license: controls.license.value,
      trust: controls.trust.value
    };
  }

  function updateFilterPresentation(input, controlSet, sortId, stateSelector, clearSelector) {
    const filterElements = Object.values(controlSet).filter((element) => element.id !== sortId);
    const hasQuery = input.value.trim().length > 0;
    const activeFilters = filterElements.filter((element) => Boolean(element.value));
    input.closest('.query-box')?.classList.toggle('has-value', hasQuery);
    filterElements.forEach((element) => element.classList.toggle('has-value', Boolean(element.value)));
    const activeCount = activeFilters.length + (hasQuery ? 1 : 0);
    $(stateSelector).textContent = activeCount ? `${activeCount} 個條件使用中` : '顯示全部條目';
    const clearButton = $(clearSelector);
    clearButton.disabled = activeCount === 0;
    clearButton.setAttribute('aria-label', activeCount ? `重設 ${activeCount} 個搜尋條件` : '目前沒有可重設的搜尋條件');
  }

  function render() {
    const ranked = core.searchEntries(entries, query.value, filterState(), controls.sort.value);
    count.textContent = `${ranked.length} / ${entries.length} PROMPTS`;
    results.innerHTML = ranked.map(({ entry }, index) => card(entry, index)).join('');
    empty.hidden = ranked.length !== 0;
    results.hidden = ranked.length === 0;
    updateFilterPresentation(query, controls, 'sort', '#prompt-active-state', '#clear');
    promptRendered = true;
  }

  function clearAll() {
    query.value = '';
    Object.values(controls).forEach((element) => { element.value = element.id === 'sort' ? 'relevance' : ''; });
    render();
    query.focus({ preventScroll: true });
  }

  function liveCard(entry, position) {
    const localized = liveLocalization(entry);
    const interactionTags = asArray(localized.interaction_labels_zh_tw).slice(0, 2).map((item) => item.label_zh_tw);
    const stackTags = asArray(localized.stack_labels_zh_tw).slice(0, 2).map((item) => item.label_zh_tw);
    const tags = [localized.type_label_zh_tw, ...interactionTags, ...stackTags]
      .filter(Boolean).map((tag) => `<span class="badge badge-stack">${escapeHtml(tag)}</span>`).join('');
    const risks = technicalMarkersFor(entry, localized.risk_labels_zh_tw).slice(0, 3).map(markerBadgeMarkup).join('');
    const excludedItem = entry.source_id === DISABLED_SOURCE_ID;
    const privateBadge = excludedItem ? '<span class="badge badge-source">本機私人</span>' : '';
    const previewAccess = liveCore.getPreviewAccess(entry);
    const previewUrl = entry.action_capabilities?.can_preview === true && previewAccess.allowed ? previewAccess.url : '';
    const previewState = previewAccess.allowed ? 'unloaded' : 'error';
    const previewSlotState = 'UNLOADED';
    const previewMessage = previewAccess.allowed ? '尚未進入暖機範圍' : previewAccess.reason;
    const offlineBadge = previewAccess.allowed ? '離線 · 已驗證' : '預覽 · 已封鎖';
    const offlineClass = previewAccess.allowed ? 'badge-offline' : 'badge-blocked';
    return `<article class="card live-card${excludedItem ? ' is-private-collection' : ''}" data-live-card-index="${position}" data-live-entry-id="${escapeHtml(entry.id)}" data-private-collection="${excludedItem}">
      <div class="live-preview-shell" ${previewUrl ? '' : 'hidden'} data-preview-index="${position}" data-preview-entry-id="${escapeHtml(entry.id)}" data-preview-title="${escapeHtml(localized.display_title_zh_tw || entry.title_zh || entry.title)}" data-preview-url="${escapeHtml(previewUrl)}" data-preview-state="${previewState}" data-preview-slot-state="${previewSlotState}" data-preview-message="${escapeHtml(previewMessage)}" aria-label="${escapeHtml(previewMessage)}"></div>
      <div class="card-body">
        <div class="card-meta"><span class="badge ${excludedItem ? 'badge-source' : 'badge-source'}">來源 · ${escapeHtml(liveSourceDisplay(entry))}</span>${privateBadge}<span class="badge badge-license">授權 · ${escapeHtml(entry.source_license)}</span><span class="badge ${offlineClass}">${offlineBadge}</span></div>
        <h3 class="card-title">${escapeHtml(localized.display_title_zh_tw || entry.title_zh || entry.title)}</h3>
        <p class="live-card-summary">${escapeHtml(localized.function_summary_zh_tw)}</p>
        <div class="chips" aria-label="Live UI 狀態標籤">${tags}${risks}</div>
        <div class="live-card-actions">
          <span class="card-footer"><span>Commit · ${escapeHtml(entry.source_commit.slice(0, 10))}</span></span>
          <button class="live-card-open" type="button" data-live-ui-id="${escapeHtml(entry.id)}" data-atlas-action="OPEN_DETAILS" aria-label="查看 ${escapeHtml(localized.display_title_zh_tw || entry.title_zh || entry.title)} Live UI 詳情">查看 Live UI 詳情</button>
        </div>
      </div>
    </article>`;
  }

  function liveFilterState() {
    return {
      source: liveControls.source.value,
      type: liveControls.type.value,
      interaction: liveControls.interaction.value,
      stack: liveControls.stack.value,
      license: liveControls.license.value,
      offline: liveControls.offline.value
    };
  }

  function postPreviewState(frame, action) {
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'prompt-library-preview', action }, '*');
  }

  function previewShell(target) {
    if (target?.classList?.contains('live-preview-shell')) return target;
    return target?.closest?.('.live-preview-shell') || target?.parentElement?.closest?.('.live-preview-shell') || null;
  }

  function setPreviewState(target, state, message) {
    const shell = previewShell(target);
    if (!shell) return;
    shell.dataset.previewState = state;
    shell.dataset.previewMessage = message;
    shell.setAttribute('aria-label', message);
  }

  function percentile(values, percentileValue) {
    if (!values.length) return 0;
    const sorted = [...values].sort((left, right) => left - right);
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * percentileValue) - 1))];
  }

  function setPreviewSlotState(target, state, message) {
    const shell = previewShell(target);
    if (!shell) return;
    const normalized = ['UNLOADED', 'WARM_LOADED', 'PLAYING', 'PAUSED'].includes(state) ? state : 'UNLOADED';
    const frame = shell.querySelector('.live-preview');
    if (frame) frame.dataset.previewSlotState = normalized;
    shell.dataset.previewSlotState = normalized;
    setPreviewState(shell, normalized.toLowerCase().replaceAll('_', '-'), message);
  }

  function previewIndex(target) {
    return Number(previewShell(target)?.dataset?.previewIndex || target?.dataset?.previewIndex || 0);
  }

  function currentPreviewInstantiationLimit() {
    if (window.innerWidth <= 560) return MAX_INSTANTIATED_PREVIEWS_MOBILE;
    if (window.innerWidth <= 900) return MAX_INSTANTIATED_PREVIEWS_TABLET;
    return MAX_INSTANTIATED_PREVIEWS_DESKTOP;
  }

  function previewDistance(target) {
    const rect = previewShell(target)?.getBoundingClientRect();
    return rect ? Math.abs((rect.top + rect.bottom) / 2 - window.innerHeight / 2) : Number.POSITIVE_INFINITY;
  }

  function previewIsVisible(target) {
    const rect = previewShell(target)?.getBoundingClientRect();
    return Boolean(rect && rect.bottom > 0 && rect.top < window.innerHeight);
  }

  function previewIsNear(target) {
    const rect = previewShell(target)?.getBoundingClientRect();
    const margin = window.innerHeight * 0.75;
    return Boolean(rect && rect.bottom > -margin && rect.top < window.innerHeight + margin);
  }

  function publishWarmPreviewMetrics(warmFrames = []) {
    const states = { UNLOADED: 0, WARM_LOADED: 0, PLAYING: 0, PAUSED: 0 };
    const shells = [...liveResults.querySelectorAll('.live-preview-shell')];
    shells.forEach((shell) => {
      const stateName = shell.dataset.previewSlotState || 'UNLOADED';
      if (Object.hasOwn(states, stateName)) states[stateName] += 1;
    });
    const instantiatedFrames = [...instantiatedPreviews].filter((frame) => frame.isConnected);
    const loadedFrames = instantiatedFrames.filter((frame) => frame.dataset.loaded === 'true');
    const playingFrames = loadedFrames.filter((frame) => frame.dataset.previewSlotState === 'PLAYING');
    const visibleShells = shells.filter(previewIsVisible);
    const nearShells = shells.filter(previewIsNear);
    const visibleReady = visibleShells.filter((shell) => shell.querySelector('.live-preview[data-loaded="true"]'));
    const nearReady = nearShells.filter((shell) => shell.querySelector('.live-preview[data-loaded="true"]'));
    const visibleWaiting = visibleShells.filter((shell) => !shell.querySelector('.live-preview[data-loaded="true"]'));
    const nearWaiting = nearShells.filter((shell) => !shell.querySelector('.live-preview[data-loaded="true"]'));
    const slotWaiting = visibleWaiting.filter((shell) => !shell.querySelector('.live-preview[data-preview-load-state="loading"]'));
    const waitP95 = percentile(previewScheduleWaitTimes, .95);
    const waitP50 = percentile(previewScheduleWaitTimes, .5);
    const loadP95 = percentile(previewLoadTimes, .95);
    const loadP50 = percentile(previewLoadTimes, .5);
    const visibleReadyP50 = percentile(previewVisibleReadyTimes, .5);
    const visibleReadyP95 = percentile(previewVisibleReadyTimes, .95);
    const scrollP50 = percentile(previewScrollFrameTimes, .5);
    const scrollP95 = percentile(previewScrollFrameTimes, .95);
    const metrics = {
      target_warm_slots: TARGET_WARM_PREVIEW_SLOTS,
      minimum_warm_slots: MIN_ACCEPTABLE_WARM_PREVIEW_SLOTS,
      effective_warm_slots: EFFECTIVE_WARM_PREVIEW_SLOTS,
      warm_item_limit: EFFECTIVE_WARM_PREVIEW_SLOTS,
      warm_count: warmFrames.length,
      warm_item_count: warmFrames.length,
      instantiated_iframe_limit: currentPreviewInstantiationLimit(),
      instantiated_iframe_count: instantiatedFrames.length,
      loaded_count: loadedFrames.length,
      active_playing_count: playingFrames.length,
      visible_count: visibleShells.length,
      visible_ready_count: visibleReady.length,
      visible_waiting_count: visibleWaiting.length,
      near_visible_count: nearShells.length,
      near_visible_ready_count: nearReady.length,
      near_visible_waiting_count: nearWaiting.length,
      warm_indices: warmFrames.map(previewIndex),
      instantiated_indices: instantiatedFrames.map(previewIndex).sort((left, right) => left - right),
      active_indices: playingFrames.map(previewIndex).sort((left, right) => left - right),
      visible_indices: visibleShells.map(previewIndex).sort((left, right) => left - right),
      waiting_for_isolated_preview_slot: slotWaiting.length,
      wait_p50_ms: Number(waitP50.toFixed(2)),
      wait_p95_ms: Number(waitP95.toFixed(2)),
      wait_max_ms: Number(Math.max(0, ...previewScheduleWaitTimes).toFixed(2)),
      load_p50_ms: Number(loadP50.toFixed(2)),
      load_p95_ms: Number(loadP95.toFixed(2)),
      load_max_ms: Number(Math.max(0, ...previewLoadTimes).toFixed(2)),
      visible_ready_p50_ms: Number(visibleReadyP50.toFixed(2)),
      visible_ready_p95_ms: Number(visibleReadyP95.toFixed(2)),
      visible_ready_max_ms: Number(Math.max(0, ...previewVisibleReadyTimes).toFixed(2)),
      frame_p50_ms: Number(scrollP50.toFixed(2)),
      scroll_p95_ms: Number(scrollP95.toFixed(2)),
      frame_p95_ms: Number(scrollP95.toFixed(2)),
      frame_max_ms: Number(Math.max(0, ...previewScrollFrameTimes).toFixed(2)),
      long_task_count: previewLongTaskDurations.length,
      long_task_max_ms: Number(Math.max(0, ...previewLongTaskDurations).toFixed(2)),
      scroll_direction: previewScrollDirection,
      states
    };
    window.__ATLAS_LIVE_PREVIEW_METRICS__ = Object.freeze(metrics);
    if (document.documentElement?.dataset) {
      document.documentElement.dataset.atlasLiveWarmCount = String(metrics.warm_count);
      document.documentElement.dataset.atlasLiveWaitP95Ms = waitP95.toFixed(2);
      document.documentElement.dataset.atlasLiveWaitingSlotCount = String(metrics.waiting_for_isolated_preview_slot);
      document.documentElement.dataset.atlasLivePreviewMetrics = JSON.stringify(metrics);
    }
  }

  function clearPreviewLoad(frame) {
    const load = previewLoads.get(frame);
    if (load) {
      clearTimeout(load.timeoutId);
      previewLoads.delete(frame);
    }
    frame.onload = null;
    frame.onerror = null;
  }

  function releasePreviewSlot(frame, message = '預覽載入失敗；其他卡片仍可使用。') {
    const shell = previewShell(frame);
    clearPreviewLoad(frame);
    instantiatedPreviews.delete(frame);
    frame.removeAttribute('data-loaded');
    frame.removeAttribute('data-preview-load-state');
    frame.removeAttribute('src');
    frame.remove();
    if (shell) setPreviewSlotState(shell, 'UNLOADED', message);
    scheduleWarmPreviewWindow();
  }

  function markPreviewReady(frame) {
    if (!instantiatedPreviews.has(frame) || !frame.isConnected) return;
    const load = previewLoads.get(frame);
    if (load?.startedAt) {
      previewLoadTimes.push(performance.now() - load.startedAt);
      if (previewLoadTimes.length > 240) previewLoadTimes.splice(0, previewLoadTimes.length - 240);
    }
    clearPreviewLoad(frame);
    frame.setAttribute('data-loaded', 'true');
    frame.removeAttribute('data-preview-load-state');
    const shell = previewShell(frame);
    const visibleStartedAt = shell ? previewVisibleStarted.get(shell) : null;
    if (Number.isFinite(visibleStartedAt) && previewIsVisible(shell)) {
      previewVisibleReadyTimes.push(performance.now() - visibleStartedAt);
      if (previewVisibleReadyTimes.length > 240) previewVisibleReadyTimes.splice(0, previewVisibleReadyTimes.length - 240);
      previewVisibleStarted.delete(shell);
    }
    syncPreviewPlayback(frame);
    scheduleWarmPreviewWindow();
  }

  function pausePreview(frame, unload = true) {
    if (unload) {
      unloadPreviewSlot(frame);
      return;
    }
    postPreviewState(frame, 'pause');
    setPreviewSlotState(frame, document.visibilityState === 'hidden' ? 'PAUSED' : 'WARM_LOADED', document.visibilityState === 'hidden' ? '頁面暫停' : '暖機完成，可快速恢復');
  }

  function unloadPreviewSlot(frame) {
    const shell = previewShell(frame);
    clearPreviewLoad(frame);
    postPreviewState(frame, 'pause');
    instantiatedPreviews.delete(frame);
    frame.removeAttribute('data-loaded');
    frame.removeAttribute('data-preview-load-state');
    frame.removeAttribute('data-warm-requested-at');
    shell?.removeAttribute('data-warm-requested-at');
    frame.removeAttribute('src');
    frame.remove();
    if (shell?.dataset.previewState !== 'error') setPreviewSlotState(shell, 'UNLOADED', '尚未進入暖機範圍');
  }

  function activatePreview(shell) {
    if (!liveCore || !shell?.isConnected || shell.dataset.warm !== 'true' || shell.querySelector('.live-preview') || liveDialog.open) return;
    if (shell.dataset.previewState === 'error' || instantiatedPreviews.size >= currentPreviewInstantiationLimit()) return;
    const url = liveCore.safeLocalPreview(shell.dataset.previewUrl);
    if (!url) {
      setPreviewSlotState(shell, 'UNLOADED', '預覽路徑未通過本機安全驗證。');
      setPreviewState(shell, 'error', '預覽路徑未通過本機安全驗證。');
      return;
    }
    const frame = document.createElement('iframe');
    frame.className = 'live-preview';
    frame.sandbox = 'allow-scripts';
    frame.loading = 'eager';
    frame.referrerPolicy = 'no-referrer';
    frame.title = `${shell.dataset.previewTitle || 'Live UI'} 隔離預覽`;
    frame.dataset.previewIndex = shell.dataset.previewIndex;
    frame.dataset.previewEntryId = shell.dataset.previewEntryId;
    frame.dataset.previewSlotState = 'UNLOADED';
    frame.dataset.previewUrl = shell.dataset.previewUrl;
    const requestedAt = Number(shell.dataset.warmRequestedAt || performance.now());
    previewScheduleWaitTimes.push(Math.max(0, performance.now() - requestedAt));
    if (previewScheduleWaitTimes.length > 240) previewScheduleWaitTimes.splice(0, previewScheduleWaitTimes.length - 240);
    instantiatedPreviews.add(frame);
    frame.dataset.previewLoadState = 'loading';
    setPreviewSlotState(shell, 'UNLOADED', '正在載入本機隔離預覽');
    const token = ++previewLoadToken;
    const timeoutId = setTimeout(() => {
      if (previewLoads.get(frame)?.token === token) releasePreviewSlot(frame, '預覽載入逾時；已釋放執行位置。');
    }, PREVIEW_LOAD_TIMEOUT_MS);
    previewLoads.set(frame, { token, timeoutId, startedAt: performance.now() });
    frame.onload = () => {
      if (previewLoads.get(frame)?.token !== token) return;
      markPreviewReady(frame);
    };
    frame.onerror = () => {
      if (previewLoads.get(frame)?.token === token) releasePreviewSlot(frame, '預覽檔案無法載入；已釋放執行位置。');
    };
    frame.src = url;
    shell.append(frame);
  }

  function syncPreviewPlayback(singleFrame = null) {
    const frames = singleFrame ? [singleFrame] : [...instantiatedPreviews];
    const canPlay = currentMode === 'live' && !liveDialog.open && document.visibilityState === 'visible' && !reducedMotion.matches;
    const playingSet = new Set(frames
      .filter((frame) => frame.dataset.loaded === 'true' && previewIsVisible(frame))
      .sort((left, right) => previewDistance(left) - previewDistance(right))
      .slice(0, MAX_PLAYING_PREVIEWS));
    for (const frame of frames) {
      if (!instantiatedPreviews.has(frame) || frame.dataset.loaded !== 'true') continue;
      if (canPlay && playingSet.has(frame)) {
        postPreviewState(frame, 'resume');
        setPreviewSlotState(frame, 'PLAYING', '可視預覽播放中');
      } else {
        postPreviewState(frame, 'pause');
        const pagePaused = document.visibilityState !== 'visible' || liveDialog.open || reducedMotion.matches;
        setPreviewSlotState(frame, pagePaused ? 'PAUSED' : 'WARM_LOADED', pagePaused ? '預覽已暫停' : '暖機完成，可快速恢復');
      }
    }
  }

  function warmPreviewCandidates(frames) {
    const visibleIndices = frames.filter(previewIsVisible).map(previewIndex).sort((left, right) => left - right);
    if (!visibleIndices.length && frames.length) {
      const nearest = [...frames].sort((left, right) => {
        return previewDistance(left) - previewDistance(right);
      })[0];
      if (nearest) visibleIndices.push(previewIndex(nearest));
    }
    const anchor = Math.round(visibleIndices.reduce((sum, index) => sum + index, 0) / Math.max(1, visibleIndices.length));
    const before = previewScrollDirection > 0
      ? WARM_PREVIEW_FORWARD_BEFORE
      : previewScrollDirection < 0 ? WARM_PREVIEW_REVERSE_BEFORE : WARM_PREVIEW_NEUTRAL_BEFORE;
    const maximumStart = Math.max(0, frames.length - EFFECTIVE_WARM_PREVIEW_SLOTS);
    let start = Math.max(0, Math.min(maximumStart, anchor - before));
    const nearIndices = frames.filter(previewIsNear).map(previewIndex).sort((left, right) => left - right);
    if (nearIndices.length) {
      const firstNear = nearIndices[0];
      const lastNear = nearIndices[nearIndices.length - 1];
      start = Math.min(start, firstNear);
      start = Math.max(start, lastNear - EFFECTIVE_WARM_PREVIEW_SLOTS + 1);
      start = Math.max(0, Math.min(maximumStart, start));
    }
    return frames.slice(start, start + EFFECTIVE_WARM_PREVIEW_SLOTS);
  }

  function instantiationCandidates(warmFrames) {
    const anchor = warmFrames.filter(previewIsVisible).map(previewIndex)[0] ?? previewIndex([...warmFrames].sort((left, right) => previewDistance(left) - previewDistance(right))[0]);
    return [...warmFrames].sort((left, right) => {
      const leftVisible = previewIsVisible(left) ? 0 : 1;
      const rightVisible = previewIsVisible(right) ? 0 : 1;
      if (leftVisible !== rightVisible) return leftVisible - rightVisible;
      const leftNear = previewIsNear(left) ? 0 : 1;
      const rightNear = previewIsNear(right) ? 0 : 1;
      if (leftNear !== rightNear) return leftNear - rightNear;
      if (previewScrollDirection) {
        const leftBehind = (previewIndex(left) - anchor) * previewScrollDirection < 0 ? 1 : 0;
        const rightBehind = (previewIndex(right) - anchor) * previewScrollDirection < 0 ? 1 : 0;
        if (leftBehind !== rightBehind) return leftBehind - rightBehind;
      }
      return previewDistance(left) - previewDistance(right) || previewIndex(left) - previewIndex(right);
    }).slice(0, currentPreviewInstantiationLimit());
  }

  function updateWarmPreviewWindow() {
    warmPreviewFrame = 0;
    if (warmPreviewScheduledAt) {
      previewScrollFrameTimes.push(Math.max(0, performance.now() - warmPreviewScheduledAt));
      if (previewScrollFrameTimes.length > 240) previewScrollFrameTimes.splice(0, previewScrollFrameTimes.length - 240);
      warmPreviewScheduledAt = 0;
    }
    if (currentMode !== 'live' || liveDialog.open || document.visibilityState !== 'visible') {
      syncPreviewPlayback();
      publishWarmPreviewMetrics([]);
      return;
    }
    const frames = [...liveResults.querySelectorAll('.live-preview-shell[data-preview-url]')].filter((shell) => shell.dataset.previewUrl);
    const warmFrames = warmPreviewCandidates(frames);
    const warmSet = new Set(warmFrames);
    const desiredFrames = instantiationCandidates(warmFrames);
    const desiredSet = new Set(desiredFrames);
    for (const shell of frames) {
      shell.dataset.warm = warmSet.has(shell) ? 'true' : 'false';
      if (!warmSet.has(shell)) shell.removeAttribute('data-warm-requested-at');
    }
    for (const frame of [...instantiatedPreviews]) {
      const shell = previewShell(frame);
      if (!shell || !desiredSet.has(shell)) unloadPreviewSlot(frame);
    }
    for (const shell of desiredFrames) {
      if (!shell.querySelector('.live-preview')) {
        shell.dataset.warmRequestedAt = String(performance.now());
        activatePreview(shell);
      }
    }
    syncPreviewPlayback();
    publishWarmPreviewMetrics(warmFrames);
  }

  function scheduleWarmPreviewWindow(measureScroll = false) {
    if (measureScroll === true && !warmPreviewScheduledAt) warmPreviewScheduledAt = performance.now();
    if (warmPreviewFrame) return;
    warmPreviewFrame = requestAnimationFrame(updateWarmPreviewWindow);
  }

  function handlePreviewScroll() {
    const nextScrollY = window.scrollY;
    const delta = nextScrollY - previewScrollY;
    if (Math.abs(delta) > 1) previewScrollDirection = Math.sign(delta);
    previewScrollY = nextScrollY;
    scheduleWarmPreviewWindow(true);
  }

  function suspendAllCardPreviews() {
    if (warmPreviewFrame) cancelAnimationFrame(warmPreviewFrame);
    warmPreviewFrame = 0;
    warmPreviewScheduledAt = 0;
    for (const frame of [...instantiatedPreviews]) unloadPreviewSlot(frame);
    instantiatedPreviews.clear();
    visiblePreviews.clear();
    liveResults.querySelectorAll('.live-preview-shell').forEach((shell) => {
      shell.dataset.visible = 'false';
      shell.dataset.warm = 'false';
      shell.removeAttribute('data-warm-requested-at');
      if (shell.dataset.previewState !== 'error') setPreviewSlotState(shell, 'UNLOADED', '尚未進入暖機範圍');
    });
    publishWarmPreviewMetrics([]);
  }

  function observeLivePreviews() {
    if (previewObserver) previewObserver.disconnect();
    const frames = [...liveResults.querySelectorAll('.live-preview-shell[data-preview-url]')].filter((shell) => shell.dataset.previewUrl);
    if (!('IntersectionObserver' in window)) {
      if (currentMode === 'live' && !liveDialog.open) {
        frames.slice(0, 3).forEach((frame) => { frame.dataset.visible = 'true'; visiblePreviews.add(frame); });
        updateWarmPreviewWindow();
      }
      return;
    }
    previewObserver = new IntersectionObserver((changes) => {
      for (const change of changes) {
        const frame = change.target;
        frame.dataset.visible = change.isIntersecting ? 'true' : 'false';
        if (change.isIntersecting) {
          visiblePreviews.add(frame);
          if (!frame.querySelector('.live-preview[data-loaded="true"]')) previewVisibleStarted.set(frame, performance.now());
        } else {
          visiblePreviews.delete(frame);
          previewVisibleStarted.delete(frame);
        }
      }
      scheduleWarmPreviewWindow();
    }, { rootMargin: '0px', threshold: 0.05 });
    frames.forEach((frame) => previewObserver.observe(frame));
    scheduleWarmPreviewWindow();
  }

  window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'prompt-library-preview-ready') return;
    const cardFrame = [...instantiatedPreviews].find((frame) => frame.contentWindow === event.source);
    if (cardFrame) {
      markPreviewReady(cardFrame);
      return;
    }
    const detailFrame = $('#live-detail-preview');
    if (detailFrame.contentWindow === event.source) {
      detailFrame.setAttribute('data-loaded', 'true');
      postPreviewState(detailFrame, reducedMotion.matches ? 'pause' : 'resume');
    }
  });

  function renderLive() {
    if (!liveCore) {
      liveCount.textContent = '0 LIVE UI';
      liveEmpty.hidden = false;
      liveResults.hidden = true;
      return;
    }
    if (previewObserver) previewObserver.disconnect();
    suspendAllCardPreviews();
    const ranked = liveCore.searchEntries(liveEntries, liveQuery.value, liveFilterState(), liveControls.sort.value);
    liveCount.textContent = `${ranked.length} / ${liveEntries.length} LIVE UI`;
    liveResults.innerHTML = ranked.map(({ entry }, position) => liveCard(entry, position)).join('');
    liveRendered = true;
    liveEmpty.hidden = ranked.length !== 0;
    liveResults.hidden = ranked.length === 0;
    updateFilterPresentation(liveQuery, liveControls, 'live-sort', '#live-active-state', '#live-clear');
    if (ranked.length && currentMode === 'live') observeLivePreviews();
  }

  function clearLive() {
    liveQuery.value = '';
    Object.values(liveControls).forEach((element) => { element.value = element.id === 'live-sort' ? 'relevance' : ''; });
    renderLive();
    liveQuery.focus({ preventScroll: true });
  }

  function setMode(mode) {
    currentMode = mode === 'live' && liveCore ? 'live' : 'prompt';
    document.body.dataset.catalogMode = currentMode;
    const promptActive = currentMode === 'prompt';
    $('#prompt-view').hidden = !promptActive;
    $('#live-view').hidden = promptActive;
    $('.skip-link').href = promptActive ? '#results' : '#live-results';
    document.querySelectorAll('[data-mode]').forEach((button) => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    if (promptActive && !promptRendered && document.body.dataset.atlasView === 'prompt') render();
    if (promptActive) suspendAllCardPreviews();
    else if (!liveRendered) renderLive();
    else observeLivePreviews();
  }

  function setText(selector, value) {
    $(selector).textContent = String(value || '—');
  }

  function renderRiskFlags(items) {
    const container = $('#detail-risks');
    container.replaceChildren();
    const list = asArray(items);
    if (!list.length) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = '無';
      container.append(chip);
      return;
    }
    list.forEach((item) => {
      const chip = document.createElement('span');
      const classification = item.classification || 'INFO';
      chip.className = `chip marker marker-${classification.toLowerCase()}`;
      chip.dataset.markerKey = item.key || '';
      chip.dataset.markerClass = classification;
      chip.textContent = `已驗證提醒（${markerClassLabels[classification] || classification}） · ${item.label_zh_tw || String(item)}`;
      if (item.key) chip.title = `${item.label_zh_tw || item.key}／${item.label_en || item.key} — ${item.remediation_zh_tw || ''}${item.remediation_en ? ` / ${item.remediation_en}` : ''}`;
      container.append(chip);
    });
  }

  function renderUseCases(useCases) {
    const container = $('#detail-use-cases');
    container.replaceChildren();
    const list = asArray(useCases).slice(0, 3);
    if (!list.length) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = '上游未提供此欄位／Not supplied by upstream';
      container.append(chip);
      return;
    }
    list.forEach((useCase) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = useCase;
      container.append(chip);
    });
  }

  function renderLiveChips(selector, values, risk = false) {
    const container = $(selector);
    container.replaceChildren();
    const list = asArray(values);
    if (!list.length) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = '無';
      container.append(chip);
      return;
    }
    list.forEach((value) => {
      const chip = document.createElement('span');
      const classification = value?.classification || 'INFO';
      chip.className = risk ? `chip marker marker-${classification.toLowerCase()}` : 'chip';
      chip.textContent = risk
        ? `已驗證提醒（${markerClassLabels[classification] || classification}） · ${value?.label_zh_tw || String(value)}`
        : value?.label_zh_tw || String(value);
      if (risk) {
        chip.dataset.markerKey = value?.key || '';
        chip.dataset.markerClass = classification;
      }
      if (value?.key) chip.title = `${value.label_zh_tw || value.key}／${value.label_en || value.key} — ${value.remediation_zh_tw || ''}${value.remediation_en ? ` / ${value.remediation_en}` : ''}`;
      container.append(chip);
    });
  }

  function renderTextList(selector, values, formatter = (value) => String(value)) {
    const container = $(selector);
    container.replaceChildren();
    asArray(values).forEach((value) => {
      const item = document.createElement('li');
      item.textContent = formatter(value);
      container.append(item);
    });
  }

  const originalFieldLabels = Object.freeze({
    function_summary_original: '功能摘要原文',
    prompt_summary_original: 'Prompt 簡介原文',
    use_cases_original: '適用場景原文',
    how_to_use_original: '使用方法原文',
    expected_output_original: '預期產出原文',
    how_to_view_result_original: '查看方式原文',
    tool_compatibility_note_original: '工具能力提醒原文'
  });

  function originalValue(entry, field) {
    const mapping = {
      function_summary_original: entry.function_summary || entry.summary || '',
      prompt_summary_original: entry.prompt_summary || '',
      use_cases_original: asArray(entry.use_cases),
      how_to_use_original: entry.how_to_use || '',
      expected_output_original: entry.expected_output || '',
      how_to_view_result_original: entry.how_to_view_result || '',
      tool_compatibility_note_original: entry.tool_compatibility_note || ''
    };
    return mapping[field];
  }

  function renderOriginalDetails(detailsSelector, contentSelector, entry, localized) {
    const details = $(detailsSelector);
    const content = $(contentSelector);
    content.replaceChildren();
    const fields = asArray(localized.original_english_fields).filter((field) => originalFieldLabels[field]);
    details.hidden = fields.length === 0;
    details.open = false;
    for (const field of fields) {
      const value = originalValue(entry, field);
      const values = Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
      if (!values.length) continue;
      const section = document.createElement('section');
      const heading = document.createElement('h4');
      heading.textContent = originalFieldLabels[field];
      section.append(heading);
      if (Array.isArray(value)) {
        const list = document.createElement('ul');
        values.forEach((item) => {
          const row = document.createElement('li');
          row.textContent = item;
          list.append(row);
        });
        section.append(list);
      } else {
        const paragraph = document.createElement('p');
        paragraph.textContent = values[0];
        section.append(paragraph);
      }
      content.append(section);
    }
    if (!content.children.length) details.hidden = true;
  }

  function localizedDependency(dependency) {
    const version = dependency.version ? labelFor('dependency_version', dependency.version, dependency.version) : '';
    const license = labelFor('dependency_license', dependency.license, dependency.license || '授權依來源與套件文件／License follows source and package documentation');
    const scope = labelFor('dependency_scope', dependency.scope, dependency.scope || '僅供專案使用');
    return `${dependency.name}${version ? ` @ ${version}` : ''} · ${license} · ${scope}`;
  }

  function setActionLink(element, url, enabled) {
    element.hidden = !(enabled && url);
    element.removeAttribute('aria-disabled');
    if (enabled && url) {
      element.href = url;
      element.dataset.atlasAction = 'OPEN_PREVIEW';
      element.removeAttribute('aria-disabled');
      element.removeAttribute('tabindex');
    } else {
      element.removeAttribute('href');
      element.removeAttribute('data-atlas-action');
      element.setAttribute('tabindex', '-1');
    }
  }

  function capabilityLocalPath(value) {
    const path = String(value || '').trim();
    return path && !/^(?:[a-z][a-z0-9+.-]*:|[\/#?])/iu.test(path) && !/[\\\0]/u.test(path) ? path : '';
  }

  function capabilityExternalUrl(value) {
    try {
      const url = new URL(String(value || ''));
      if (url.protocol !== 'https:' || url.username || url.password) return '';
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) return '';
      return url.href;
    } catch (_) { return ''; }
  }

  function bindSourceActions(entry, prefix) {
    const capabilities = entry.action_capabilities || {};
    const upstream = capabilityExternalUrl(capabilities.entry_upstream_url);
    setActionLink($(`#${prefix}upstream`), upstream, capabilities.can_open_entry_upstream === true);
    const proof = capabilityLocalPath(capabilities.provenance_record_path);
    setActionLink($(`#${prefix}provenance`), proof, capabilities.can_open_local_provenance === true);
    const dataset = capabilityExternalUrl(capabilities.project_or_dataset_url);
    const projectLink = $(prefix === 'open-' ? '#open-upstream-dataset' : '#open-live-project');
    projectLink.textContent = entry.source_id === 'prompts-chat' ? '開啟完整上游資料集' : '開啟上游專案';
    setActionLink(projectLink, dataset, capabilities.can_open_upstream_project_or_dataset === true);
  }

  function bindDownloadActions(entry, primarySelector, extraSelector, preferredType = '') {
    const capabilities = entry.action_capabilities || {};
    const verifiedIds = new Set(asArray(capabilities.download_record_ids));
    const assets = capabilities.can_download === true ? asArray(entry.direct_use_assets).filter((asset) => verifiedIds.has(asset.download_record_id)) : [];
    const primary = assets.find((asset) => asset.type === preferredType) || assets[0];
    const primaryLink = $(primarySelector);
    const configured = window.ATLAS_DOWNLOAD_RUNTIME?.configureLink(primaryLink, primary);
    if (configured) primaryLink.textContent = preferredType === 'prompt-file' && primary.type === 'prompt-file' ? '下載 Prompt 正文' : primary.label_zh_tw || `下載 ${primary.download_filename}`;
    const extra = $(extraSelector);
    extra.textContent = '';
    assets.filter((asset) => asset.download_record_id !== primary?.download_record_id).forEach((asset) => {
      const link = document.createElement('a');
      link.className = 'button-link action-primary';
      link.textContent = asset.label_zh_tw || `下載 ${asset.download_filename}`;
      if (window.ATLAS_DOWNLOAD_RUNTIME?.configureLink(link, asset)) extra.append(link);
    });
  }

  function showDetail(entry, trigger) {
    const localized = promptLocalization(entry);
    const capabilities = entry.action_capabilities || {};
    selectedEntry = entry;
    selectedAccess = core.getPromptAccess(entry, promptStore, catalog.content_hash);
    lastTrigger = trigger;
    setText('#detail-title', localized.display_title_zh_tw || entry.display_title || entry.title);
    setText('#detail-author', authorDisplay(entry));
    setText('#detail-contributors', asArray(entry.upstream_contributor_display_names || entry.upstream_contributor_names).join('、') || '上游未提供逐筆 contributor／Not supplied at entry level');
    setText('#detail-publisher', entry.publisher_or_maintainer || '上游專案維護者未提供／Not supplied');
    setText('#detail-rights-holder', entry.rights_holder || '依固定來源 License／Notice');
    setText('#detail-adapter', entry.local_adaptation_status === 'SANITIZED_LOCAL_ADAPTATION' ? '已清理本機絕對路徑（SANITIZED_LOCAL_ADAPTATION） · ' + (entry.local_adapter_name_or_project || '本專案公開衍生版本') : entry.local_adapter_name_or_project || '無本機改作者／No local adapter');
    const localSourceNote = $('#prompt-local-source-note');
    localSourceNote.textContent = [entry.local_source_usage_note_zh_tw, entry.local_source_usage_note_en, entry.local_adaptation_status === 'SANITIZED_LOCAL_ADAPTATION' ? entry.public_sanitization_note_zh_tw || '公開版本已替換本機絕對路徑；不宣稱與上游原始位元組相同。' : ''].filter(Boolean).join(' ');
    localSourceNote.hidden = !localSourceNote.textContent;
    setText('#detail-function', localized.function_summary_zh_tw || entry.function_summary || '功能摘要以完整原始內容為準。');
    setText('#detail-prompt-summary', localized.prompt_summary_zh_tw || entry.prompt_summary || '內容摘要以完整原始內容為準。');
    setText('#detail-summary-status', localized.localization_status === 'complete' ? '繁中內容已複核／Traditional Chinese reviewed' : '繁中內容未進入公開完整項目');
    $('#detail-summary-status').classList.toggle('needs-review', localized.localization_status === 'review_required');
    renderUseCases(localized.use_cases_zh_tw || entry.use_cases);
    setText('#detail-source', `${entry.source_name || entry.source_id} (${entry.source_id})`);
    setText('#detail-commit', entry.source_commit);
    const runtimeLicense = entry.runtime_license ? ` · Runtime：${entry.runtime_license}` : '';
    setText('#detail-license', `${entry.source_license} · ${licenseStatusLabel(entry.license_status)}${runtimeLicense}`);
    setText('#detail-path', `${entry.relative_path}${entry.source_locator && entry.source_locator !== entry.relative_path ? ` · ${entry.source_locator}` : ''}`);
    setText('#detail-type', localized.type_label_zh_tw);
    setText('#detail-profile', localized.profile_label_zh_tw);
    setText('#detail-stack', asArray(entry.technology_stack || entry.stack).join(', ') || '未指定');
    setText('#detail-score', `Q ${entry.quality_score}`);
    renderRiskFlags(technicalMarkersFor(entry, localized.risk_labels_zh_tw));
    setText('#detail-usage-mode', usageModeLabels[entry.usage_mode] || usageModeLabels.other);
    setText('#detail-usage-status', entry.usage_status === 'review_required' ? '依原始內容與安全說明呈現' : '已分類');
    $('#detail-usage-status').classList.toggle('needs-review', entry.usage_status === 'review_required');
    setText('#detail-how-to-use', localized.how_to_use_zh_tw || entry.how_to_use || '先閱讀完整原始內容與安全說明，再交給具備所需能力的工具。');
    setText('#detail-expected-output', localized.expected_output_zh_tw || entry.expected_output || '產出形式依完整原始內容與所用工具能力而定。');
    setText('#detail-how-to-view-result', localized.how_to_view_result_zh_tw || entry.how_to_view_result || '依所用工具或目標專案的既有預覽方式查看結果。');
    setText('#detail-tool-compatibility', localized.tool_compatibility_note_zh_tw || entry.tool_compatibility_note || '請先確認所用 AI 是否具備目標檔案或開發環境權限。');
    renderOriginalDetails('#detail-original', '#detail-original-content', entry, localized);
    $('#detail-access').textContent = selectedAccess.reason;
    $('#detail-access').classList.toggle('is-available', selectedAccess.allowed);
    $('#detail-prompt').textContent = selectedAccess.allowed ? selectedAccess.record.prompt_text : `全文未顯示：${selectedAccess.reason}`;
    $('#copy-original').disabled = false;
    $('#copy-original').hidden = !(capabilities.can_copy === true && selectedAccess.allowed);
    setActionLink($('#open-local'), capabilityLocalPath(capabilities.local_source_path), capabilities.can_open_local_source === true);
    bindDownloadActions(entry, '#download-original', '#prompt-extra-downloads', 'prompt-file');
    bindSourceActions(entry, 'open-');
    $('#copy-status').textContent = '';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeDialog() {
    if (typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    }
  }

  function showLiveDetail(entry, trigger) {
    const localized = liveLocalization(entry);
    const capabilities = entry.action_capabilities || {};
    selectedLiveEntry = entry;
    selectedLiveAccess = liveCore.getCodeAccess(entry, liveCodeStore, liveCatalog.content_hash);
    lastLiveTrigger = trigger;
    if (previewObserver) previewObserver.disconnect();
    suspendAllCardPreviews();
    setText('#live-detail-title', localized.display_title_zh_tw || entry.title_zh || entry.title);
    setText('#live-detail-author', authorDisplay(entry));
    setText('#live-detail-contributors', asArray(entry.upstream_contributor_display_names || entry.upstream_contributor_names).join('、') || '上游未提供逐筆 contributor／Not supplied at entry level');
    setText('#live-detail-publisher', entry.publisher_or_maintainer || '上游專案維護者未提供／Not supplied');
    setText('#live-detail-rights-holder', entry.rights_holder || '依固定來源 License／Notice');
    setText('#live-detail-adapter', entry.local_adapter_name_or_project || '無本機改作者／No local adapter');
    const localSourceNote = $('#live-local-source-note');
    localSourceNote.textContent = [entry.local_source_usage_note_zh_tw, entry.local_source_usage_note_en, entry.local_adaptation_status === 'SANITIZED_LOCAL_ADAPTATION' ? entry.public_sanitization_note_zh_tw || '公開版本已替換本機絕對路徑；不宣稱與上游原始位元組相同。' : ''].filter(Boolean).join(' ');
    localSourceNote.hidden = !localSourceNote.textContent;
    setText('#live-detail-type', localized.type_label_zh_tw);
    setText('#live-detail-summary', localized.function_summary_zh_tw);
    setText('#live-detail-offline', `${localized.offline_label_zh_tw} · ${localized.localization_status === 'complete' ? '繁中內容已複核／Traditional Chinese reviewed' : '繁中內容未進入公開完整項目'}`);
    $('#live-detail-offline').classList.toggle('needs-review', localized.localization_status === 'review_required');
    renderLiveChips('#live-detail-use-cases', localized.use_cases_zh_tw);
    setText('#live-detail-source', `${liveSourceDisplay(entry)} (${entry.source_id})`);
    setText('#live-detail-commit', entry.source_commit);
    setText('#live-detail-license', `${entry.source_license} · ${licenseStatusLabel(entry.license_status)}`);
    setText('#live-detail-position', entry.source_position);
    setText('#live-detail-interactions', asArray(localized.interaction_labels_zh_tw).map((item) => item.label_zh_tw).join('、') || '上游未提供互動欄位／Not supplied by upstream');
    setText('#live-detail-stack', asArray(localized.stack_labels_zh_tw).map((item) => item.label_zh_tw).join('、') || '上游未提供技術棧欄位／Not supplied by upstream');
    renderLiveChips('#live-detail-risks', technicalMarkersFor(entry, localized.risk_labels_zh_tw), true);
    setText('#live-detail-how-to-use', localized.how_to_use_zh_tw);
    setText('#live-detail-expected-output', localized.expected_output_zh_tw);
    setText('#live-detail-how-to-view', localized.how_to_view_result_zh_tw);
    setText('#live-detail-tool-note', localized.tool_compatibility_note_zh_tw);
    renderOriginalDetails('#live-detail-original', '#live-detail-original-content', entry, localized);
    renderTextList('#live-detail-files', entry.source_paths);
    const dependencyRows = asArray(entry.dependency_manifest);
    renderTextList('#live-detail-dependencies', dependencyRows.length ? dependencyRows : [{
      name: 'Library Preview Runtime／Library Preview Runtime',
      version: '無額外安裝／No additional install',
      license: entry.source_license || entry.license || '依固定來源證據／Per pinned source evidence',
      scope: entry.dependency_disclosure_zh_tw || entry.tool_compatibility_note || '離線 sandbox Preview；下載後依來源文件整合／Offline sandbox preview; follow source documentation after download'
    }], localizedDependency);
    const sourceCount = asArray(entry.source_paths).length;
    setText('#live-multifile-notice', sourceCount > 1
      ? `這是多檔項目，共 ${sourceCount} 個來源檔。整合時必須保留完整檔案與相依關係，不能只複製單一檔案。`
      : '此項目目前有一個主要來源檔；仍需依目標專案檢查匯入、樣式與相依套件。');

    const previewAccess = liveCore.getPreviewAccess(entry);
    const previewUrl = capabilities.can_preview === true && previewAccess.allowed ? previewAccess.url : '';
    const detailFrame = $('#live-detail-preview');
    detailFrame.onload = () => postPreviewState(detailFrame, reducedMotion.matches ? 'pause' : 'resume');
    detailFrame.src = previewUrl || 'about:blank';
    detailFrame.closest('.live-detail-preview-shell').hidden = !previewUrl;
    $('#copy-live-code').disabled = false;
    $('#copy-live-code').hidden = !(capabilities.can_copy === true && selectedLiveAccess.allowed);
    setActionLink($('#open-live-example'), capabilityLocalPath(capabilities.local_executable_path), capabilities.can_open_local_executable === true);
    setActionLink($('#open-live-source'), capabilityLocalPath(capabilities.local_source_path), capabilities.can_open_local_source === true);
    bindDownloadActions(entry, '#download-live-asset', '#live-extra-downloads');
    bindSourceActions(entry, 'open-live-');
    $('#live-copy-status').textContent = selectedLiveAccess.allowed ? selectedLiveAccess.reason : `程式碼不可用：${selectedLiveAccess.reason}`;
    if (typeof liveDialog.showModal === 'function') liveDialog.showModal();
    else liveDialog.setAttribute('open', '');
  }

  function cleanupLiveDetail() {
    const detailFrame = $('#live-detail-preview');
    postPreviewState(detailFrame, 'pause');
    detailFrame.src = 'about:blank';
    if (currentMode === 'live') observeLivePreviews();
  }

  function closeLiveDialog() {
    if (typeof liveDialog.close === 'function') liveDialog.close();
    else {
      liveDialog.removeAttribute('open');
      cleanupLiveDetail();
      if (lastLiveTrigger) lastLiveTrigger.focus({ preventScroll: true });
    }
  }

  async function copyText(value) {
    if (!value) throw new Error('沒有可複製的內容。');
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch (_) {
        // file:// may not expose the async Clipboard API; use the local fallback below.
      }
    }
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.className = 'clipboard-helper';
    document.body.append(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('瀏覽器拒絕剪貼簿存取。');
  }

  async function copyWithStatus(value, success, statusSelector = '#copy-status') {
    const status = $(statusSelector);
    try {
      await copyText(value);
      status.textContent = success;
    } catch (error) {
      status.textContent = `${error.message} 請手動選取文字複製。`;
    }
  }

  query.addEventListener('input', render);
  Object.values(controls).forEach((element) => element.addEventListener('change', render));
  $('#clear').addEventListener('click', clearAll);
  document.querySelector('[data-clear]').addEventListener('click', clearAll);
  liveQuery.addEventListener('input', renderLive);
  Object.values(liveControls).forEach((element) => element.addEventListener('change', renderLive));
  $('#live-clear').addEventListener('click', clearLive);
  document.querySelector('[data-live-clear]').addEventListener('click', clearLive);
  const modeButtons = [...document.querySelectorAll('[data-mode]')];
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
    button.addEventListener('keydown', (event) => {
      const current = modeButtons.indexOf(button);
      let next = current;
      if (event.key === 'ArrowRight') next = (current + 1) % modeButtons.length;
      else if (event.key === 'ArrowLeft') next = (current - 1 + modeButtons.length) % modeButtons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = modeButtons.length - 1;
      else return;
      event.preventDefault();
      setMode(modeButtons[next].dataset.mode);
      modeButtons[next].focus({ preventScroll: true });
    });
  });
  results.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-prompt-id]');
    if (!trigger) return;
    const entry = entryById.get(trigger.dataset.promptId);
    if (entry) showDetail(entry, trigger);
  });
  liveResults.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-live-ui-id]');
    if (!trigger) return;
    const entry = liveEntryById.get(trigger.dataset.liveUiId);
    if (entry) showLiveDetail(entry, trigger);
  });
  $('#dialog-close').addEventListener('click', closeDialog);
  $('#dialog-close-icon').addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener('close', () => { if (lastTrigger) lastTrigger.focus({ preventScroll: true }); });
  $('#live-dialog-close').addEventListener('click', closeLiveDialog);
  $('#live-dialog-close-icon').addEventListener('click', closeLiveDialog);
  liveDialog.addEventListener('click', (event) => { if (event.target === liveDialog) closeLiveDialog(); });
  liveDialog.addEventListener('close', () => {
    cleanupLiveDetail();
    if (lastLiveTrigger) lastLiveTrigger.focus({ preventScroll: true });
  });
  $('#copy-original').addEventListener('click', () => {
    const original = core.getOriginalPrompt(selectedEntry, promptStore, catalog.content_hash);
    copyWithStatus(original, '已複製 Prompt 正文。');
  });
  $('#copy-handoff').addEventListener('click', () => {
    copyWithStatus(core.buildCodexHandoff(selectedEntry), '已複製 Codex 安全改寫指令。');
  });
  $('#copy-live-code').addEventListener('click', () => {
    const value = selectedLiveAccess?.allowed ? liveCore.buildCodeBundle(selectedLiveEntry, selectedLiveAccess.record) : '';
    copyWithStatus(value, '已複製主要程式碼與完整來源檔標頭。', '#live-copy-status');
  });
  $('#copy-live-handoff').addEventListener('click', () => {
    copyWithStatus(liveCore.buildCodexHandoff(selectedLiveEntry), '已複製完整 Codex 整合指令。', '#live-copy-status');
  });
  dialog.addEventListener('atlas-download-starting', (event) => {
    $('#copy-status').textContent = `正在準備下載 ${event.detail?.filename || 'Prompt 正文'}…`;
  });
  dialog.addEventListener('atlas-download-started', (event) => {
    $('#copy-status').textContent = `已開始下載 ${event.detail?.filename || 'Prompt 正文'}；內容與複製正文相同。`;
  });
  dialog.addEventListener('atlas-download-failed', (event) => {
    $('#copy-status').textContent = `下載未開始：${event.detail?.message || '資產驗證失敗'}。`;
  });
  liveDialog.addEventListener('atlas-download-starting', (event) => {
    $('#live-copy-status').textContent = `正在準備下載 ${event.detail?.filename || '檔案'}…`;
  });
  liveDialog.addEventListener('atlas-download-started', (event) => {
    $('#live-copy-status').textContent = `已開始下載 ${event.detail?.filename || '檔案'}；目前頁面未切換。`;
  });
  liveDialog.addEventListener('atlas-download-failed', (event) => {
    $('#live-copy-status').textContent = `下載未開始：${event.detail?.message || '資產驗證失敗'}。`;
  });
  [$('#open-local'), $('#open-upstream'), $('#open-upstream-dataset'), $('#open-live-example'), $('#open-live-source'), $('#download-live-asset'), $('#open-live-upstream')].forEach((element) => element.addEventListener('click', (event) => {
    if (element.getAttribute('aria-disabled') === 'true') event.preventDefault();
  }));
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) closeDialog();
      if (liveDialog.open) closeLiveDialog();
      (currentMode === 'live' ? liveQuery : query).focus({ preventScroll: true });
    }
  });
  const handleReducedMotionChange = () => {
    syncPreviewPlayback();
    if (liveDialog.open) postPreviewState($('#live-detail-preview'), reducedMotion.matches ? 'pause' : 'resume');
  };
  if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', handleReducedMotionChange);
  else if (typeof reducedMotion.addListener === 'function') reducedMotion.addListener(handleReducedMotionChange);
  window.addEventListener('scroll', handlePreviewScroll, { passive: true });
  window.addEventListener('resize', scheduleWarmPreviewWindow, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleWarmPreviewWindow();
    else syncPreviewPlayback();
  });
  window.addEventListener('pagehide', suspendAllCardPreviews, { once: true });
  if (document.body.dataset.atlasView !== 'explore') render();
  setMode('prompt');
})();
