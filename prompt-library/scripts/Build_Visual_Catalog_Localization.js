#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_LIBRARY_ROOT = path.resolve(__dirname, '..');
const LOCALIZATION_REVISION = 1;
const SIMPLIFIED_CHINESE_PATTERN = /[个这为发与实动产开关现进过还从对将应会经数画网见标签类场预输结说线赖远软据页变体择击达条显览东门间时点处样让组许无复设图库边项档层声总术统维归压测简级写营围绕证链决]/u;
let activeTechnicalMarkerById = new Map();

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function readAssignment(filePath, variableName) {
  const source = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').replace(/^\/\*[\s\S]*?\*\/\s*/u, '');
  const match = source.match(new RegExp(`^window\\.${variableName}\\s*=\\s*([\\s\\S]+);\\s*$`));
  assert(match, `${path.basename(filePath)} does not contain ${variableName}`);
  return JSON.parse(match[1]);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === value) return false;
  fs.writeFileSync(filePath, value, 'utf8');
  return true;
}

function hasCjk(value) {
  return /[\u3400-\u9fff]/u.test(String(value || ''));
}

function englishWordCount(value) {
  return (String(value || '').match(/[A-Za-z]{3,}/g) || []).length;
}

function cjkCount(value) {
  return (String(value || '').match(/[\u3400-\u9fff]/gu) || []).length;
}

function isEnglishDominant(value) {
  const words = englishWordCount(value);
  const cjk = cjkCount(value);
  return words >= 3 && (cjk === 0 || words >= cjk);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const simplifiedPairs = [
  ['创设情境串联知识', '創設情境串聯知識'], ['薪酬体系', '薪酬體系'],
  ['这', '這'], ['个', '個'], ['为', '為'], ['与', '與'], ['专业', '專業'], ['项目', '專案'], ['软件', '軟體'],
  ['网页', '網頁'], ['网站', '網站'], ['组件', '元件'], ['动画', '動畫'], ['视觉', '視覺'], ['设计', '設計'],
  ['适用', '適用'], ['场景', '場景'], ['预览', '預覽'], ['离线', '離線'], ['网络', '網路'], ['数据', '資料'],
  ['文件', '檔案'], ['代码', '程式碼'], ['输出', '輸出'], ['输入', '輸入'], ['用户', '使用者'], ['创建', '建立'],
  ['查看', '檢視'], ['访问', '存取'], ['设置', '設定'], ['信息', '資訊'], ['支持', '支援'], ['链接', '連結'],
  ['服务器', '伺服器'], ['应用', '應用'], ['开发', '開發'], ['运行', '執行'], ['选择', '選擇'], ['标记', '標記'],
  ['风险', '風險'], ['说明', '說明'], ['通过', '透過'], ['后', '後'], ['发', '發'], ['里', '裡']
];

function toTraditional(value) {
  let output = String(value || '').trim();
  for (const [simplified, traditional] of simplifiedPairs) output = output.replaceAll(simplified, traditional);
  return output;
}

const labels = Object.freeze({
  risk: Object.freeze({
    'account-or-payment': '內容涉及帳號或付款流程，使用前需再次確認權限與費用',
    'auto-deploy': '原始內容包含自動部署指示，執行前必須取得使用者授權',
    'brand-imitation': '內容可能仿作既有品牌風格，公開使用前需檢查商標與識別風險',
    'dangerous-command': '原始內容可能包含高風險指令，不可直接執行',
    'missing-accessibility': '原始內容未完整說明無障礙需求，實作時需補做檢查',
    'missing-reduced-motion': '原始內容未完整處理減少動態效果（reduced motion）',
    'package-install': '原始內容包含套件安裝需求，應先核對專案與授權',
    'remote-asset': '原始內容引用遠端素材，使用前需確認來源與授權',
    'secret-placeholder-required': '敏感值必須改用安全的祕密或環境變數占位符',
    'untrusted-download': '原始內容可能要求下載未驗證檔案，不可直接執行',
    'continuous-animation-throttled': '連續動畫已套用可見範圍節流，避免背景持續耗用資源',
    'isolated-event-listeners': '互動事件只在隔離預覽內運作，不會存取 Atlas 外層頁面',
    'local-file-ui-simulated-no-upload': '檔案介面僅使用本機示範資料，不會實際上傳檔案',
    'next-runtime-replaced-in-preview': '離線預覽已用本機適配取代 Next.js runtime',
    'offline-dependency-free-static-adaptation': '此預覽使用無相依套件的離線靜態適配',
    'preview-canvas-capped-72-particles-and-visibility-throttled': 'Canvas 預覽限制為 72 個粒子，並只在可見時播放',
    'preview-particle-count-downsampled-4000-to-240': '預覽粒子數已由 4,000 降為 240，以控制效能負載',
    'pro-sample-item-removed-in-preview': '預覽已移除 Pro 範例內容，只保留可驗證的免費部分',
    'remote-assets-replaced-in-preview': '遠端素材已改用本機幾何圖形或示範資料取代',
    'scroll-driven-preview': '此效果會由頁面捲動（scroll）進度觸發',
    'simulated-voice-ui-no-microphone-access': '語音介面僅為本機模擬，不會存取麥克風',
    'source-animation-replaced-with-bounded-css-preview': '上游動畫已改為負載受控的 CSS 離線預覽',
    'theme-runtime-replaced-in-preview': '主題 runtime 已由本機預覽適配取代',
    'unverified-font-assets-excluded-use-system-font': '未驗證字型素材已排除，預覽改用系統字型',
    'upstream-canvas-or-webgl-represented-by-bounded-adapter': '上游 Canvas／WebGL 效果由負載受控的本機適配呈現',
    'upstream-framework-dependencies-not-executed-by-adapter': '離線預覽未直接執行上游框架相依套件',
    'upstream-media-replaced-with-local-geometry': '上游媒體已改用本機幾何圖形呈現',
    'upstream-network-api-not-executed': '離線預覽不會呼叫上游網路 API',
    'upstream-remote-reference-replaced-with-local-data': '上游遠端參照已改用固定本機資料取代'
  }),
  interaction: Object.freeze({
    automatic: '自動播放（automatic）', click: '點擊操作（click）', controls: '控制項操作（controls）',
    drag: '拖曳操作（drag）', hover: '滑鼠懸停（hover）', input: '輸入互動（input）',
    pointer: '指標移動（pointer）', scroll: '捲動觸發（scroll）', anchor: '錨點導覽（anchor）',
    canvas: 'Canvas 互動', focus: '焦點互動（focus）', gesture: '手勢操作（gesture）',
    intersection: '可見範圍觸發（intersection）', keyboard: '鍵盤操作（keyboard）',
    'lazy-activation': '延遲啟用（lazy activation）', loop: '循環播放（loop）', navigation: '導覽操作（navigation）',
    pin: '捲動釘選（pin）', responsive: '響應式調整（responsive）', 'route-transition': '路由轉場（route transition）',
    sticky: '黏附定位（sticky）', 'text-reveal': '文字揭露（text reveal）', touch: '觸控操作（touch）',
    transition: '轉場互動（transition）'
  }),
  live_type: Object.freeze({
    ai: 'AI 互動介面', 'animation-example': '動畫範例', 'auto-layout': '自動版面動畫', background: '背景效果',
    'basic-ui': '基礎介面', button: '按鈕', card: '卡片', component: '介面元件', control: '控制元件',
    'data-visualization': '資料視覺化', 'drag-and-gesture': '拖曳與手勢', feedback: '狀態回饋',
    'generative-motion': '生成式動態', input: '輸入元件', 'motion-demo': '動態示範', navigation: '導覽元件',
    other: '其他效果', others: '其他效果', 'pointer-follow': '指標跟隨效果', 'scroll-animation': '捲動動畫',
    section: '頁面區段', 'svg-animation': 'SVG 動畫', text: '文字效果', 'text-effect': '文字特效',
    timeline: '時間軸動畫', 'visual-effect': '視覺效果', '3d': '3D 互動成果',
    'code-project': '程式專案成果', 'motion-effect': '動態效果', 'ui-component': 'UI 元件', 'web-page': '網頁成果'
  }),
  prompt_type: Object.freeze({ IMAGE: '圖片生成 Prompt', STRUCTURED: '結構化 Prompt', TEXT: '文字 Prompt', markdown: 'Markdown Prompt' }),
  page_type: Object.freeze({ component: '元件', dashboard: '儀表板', 'editorial-page': '編輯式頁面', general: '一般用途', 'landing-page': '著陸頁', 'product-page': '產品頁' }),
  design_profile: Object.freeze({ component: '元件設計', dashboard: '儀表板', ecommerce: '電子商務', editorial: '編輯風格', general: '一般風格', landing: '著陸頁', motion: '動態網站' }),
  usage_mode: Object.freeze({ 'analysis-writing': '分析／寫作', 'chat-role': '對話角色', 'code-project': '程式專案', 'image-generation': '圖片生成', other: '其他用途', 'web-project': '網站專案' }),
  offline_status: Object.freeze({
    'verified-local-preview': '離線預覽已驗證',
    'verified-first-party-offline-preview': '第一方離線預覽已驗證',
    'verified-local-sanitized-specimen': '本機安全化展示已驗證',
    'verified-local-source-preview': '本機來源預覽已驗證',
    'verified-local-user-provided-offline-safe': '本機私人內容離線預覽已驗證'
  }),
  license_status: Object.freeze({ verified: '授權已驗證', 'blocked-with-proof-license-conflict': '授權衝突，已提出阻擋證據', 'blocked-no-redistributable-source-license': '未找到可再分發的來源授權' }),
  source_tier: Object.freeze({ 'established-community': '成熟社群來源', 'experimental-community': '實驗性社群來源', 'official-curated': '官方精選來源', 'official-technical-skill': '官方技術 Skill', 'official-live-ui': '官方 Live UI 來源' }),
  stack: Object.freeze({
    'Motion where declared': 'Motion（依上游宣告使用）',
    'Motion / shadcn / GSAP where declared': 'Motion／shadcn/ui／GSAP（依上游宣告使用）',
    'dependency-free offline adapter': '離線預覽：本機 adapter 無額外相依套件',
    'Base UI / Radix-compatible registry': 'Base UI／Radix 相容 registry'
  }),
  dependency_license: Object.freeze({
    review_required: '來源未另行宣告相依授權（依主套件 License）',
    'GSAP Standard License': 'GSAP 標準授權／GSAP Standard License',
    '依來源套件 Manifest 與 License': '依來源套件 Manifest 與 License',
    'source-only dependency; not executed by offline adapter': '僅屬上游來源相依；離線預覽不會執行'
  }),
  dependency_scope: Object.freeze({
    'excluded-use-system-font-replacement': '已排除，改用系統字型',
    'packaged-local-runtime': '已封裝的本機 runtime',
    'project-local-source': '專案內來源檔',
    'project-only': '僅供目標專案使用',
    'replace-for-file-preview': 'file:// 預覽使用替代實作',
    'upstream-source-closure': '上游來源閉包',
    'downloaded-source-package-only': '只適用於下載後的來源套件'
  }),
  dependency_version: Object.freeze({
    'fixed-by-upstream-lock-at-source-commit': '由固定上游 commit 的 lockfile 鎖定',
    'upstream-example-assets': '上游範例素材'
  })
});

const semanticTokens = Object.freeze({
  accordion: '手風琴式展開內容', alert: '提示訊息', android: 'Android 裝置外觀', animated: '動態效果', animation: '動畫',
  avatar: '使用者頭像', background: '背景視覺', badge: '徽章', beam: '光束', bento: 'Bento 網格版面', blur: '模糊轉場',
  border: '邊框效果', box: '內容容器', browser: '瀏覽器外觀', button: '按鈕操作', calendar: '日曆介面', card: '卡片內容',
  carousel: '輪播內容', chart: '圖表資料', checkbox: '核取方塊', circle: '圓形視覺', combobox: '複合式選擇欄位',
  cursor: '游標效果', data: '資料呈現', date: '日期選擇', device: '裝置外觀', dialog: '對話框', dock: 'Dock 工具列',
  drawer: '抽屜面板', dropdown: '下拉選單', fade: '淡入淡出', feature: '功能介紹區塊', file: '檔案介面', flip: '翻轉效果',
  footer: '頁尾區段', form: '表單', gallery: '圖庫', glow: '發光效果', gradient: '漸層效果', grid: '網格版面',
  header: '頁首區段', hero: '首屏重點區段', hover: '滑鼠懸停回饋', icon: '圖示', image: '圖片呈現', input: '輸入欄位',
  iphone: 'iPhone 裝置外觀', kinetic: '動態文字', letter: '字母動畫', light: '光影效果', list: '清單', loader: '載入指示',
  marquee: '跑馬燈', menu: '選單', meteor: '流星效果', modal: '彈出視窗', navigation: '導覽介面', noise: '雜訊紋理',
  notification: '通知訊息', number: '數字動畫', orbit: '環繞運動', pagination: '分頁控制', particle: '粒子效果', popover: '彈出內容',
  pricing: '價格方案區塊', progress: '進度顯示', radio: '單選控制', reveal: '內容揭露', ripple: '漣漪效果', safari: 'Safari 瀏覽器外觀',
  scroll: '捲動效果', search: '搜尋欄位', section: '頁面區段', select: '選擇欄位', shader: '著色器視覺', shine: '光澤掃過效果',
  shimmer: '微光效果', sidebar: '側邊欄', slider: '滑桿', sparkle: '閃爍效果', spinner: '旋轉載入指示', stack: '堆疊版面',
  stats: '統計資料', switch: '切換開關', table: '表格', tabs: '分頁標籤', team: '團隊介紹區塊', template: '頁面範本',
  testimonial: '使用者推薦區塊', text: '文字', timeline: '時間軸', toast: '浮動通知', toggle: '切換控制', tooltip: '提示內容',
  transition: '轉場效果', tree: '樹狀結構', type: '文字輸入動畫', typing: '打字效果', upload: '上傳介面', video: '影片外觀', warp: '扭曲效果',
  word: '詞語動畫'
});

function technicalLabel(group, value) {
  if (group === 'risk' && activeTechnicalMarkerById.has(value)) return activeTechnicalMarkerById.get(value).name_zh_tw;
  return labels[group]?.[value] || `技術標記：${value}`;
}

function hasTechnicalLabel(value) {
  return activeTechnicalMarkerById.has(value) || Boolean(labels.risk[value]);
}

function semanticPurpose(entry) {
  const slug = String(entry.original_name || entry.preview_variant || entry.source_position || '').toLowerCase();
  const purposes = unique(slug.split(/[^a-z0-9]+/).map((token) => semanticTokens[token]));
  return purposes.slice(0, 3).join('、') || labels.live_type[entry.component_type] || labels.live_type[entry.animation_type] || '介面視覺與互動狀態';
}

function liveSummary(entry) {
  if (hasCjk(entry.function_summary || entry.summary)) return toTraditional(entry.function_summary || entry.summary);
  if (entry.source_id === 'magic-ui-oss' && entry.original_name === 'text-reveal') {
    return '文字會隨頁面向下捲動逐步淡入顯示，適合用於內容揭露、敘事段落或需要引導閱讀節奏的文字效果。';
  }
  if (entry.source_id === 'magic-ui-oss' && entry.original_name === 'dia-text-reveal') {
    return '水平色帶會掃過文字，短暫呈現漸層光澤後回到基礎文字顏色，適合用於標題揭露與需要聚焦視線的文字效果。';
  }
  const purpose = semanticPurpose(entry);
  const interactions = unique(asArray(entry.interactions).map((value) => labels.interaction[value])).slice(0, 2);
  const interactionText = interactions.length ? `，並可觀察${interactions.join('、')}` : '';
  return `「${entry.display_title || entry.title}」呈現${purpose}，屬於${labels.live_type[entry.component_type] || labels.live_type[entry.animation_type] || '介面元件'}${interactionText}。`;
}

function englishOriginalFields(originals) {
  const fields = [];
  for (const [field, value] of Object.entries(originals)) {
    const values = Array.isArray(value) ? value : [value];
    if (values.some(isEnglishDominant)) fields.push(field);
  }
  return fields;
}

function localizePromptUseCase(value, entry, state) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (hasCjk(text)) return toTraditional(text);
  if (/^reduced motion$/i.test(text)) return '減少動態效果（reduced motion）';
  if (/deploy an anime blog/i.test(text)) return '規劃動漫風格部落格的建置與部署';
  state.reviewReasons.push(`untranslated-prompt-use-case:${text}`);
  return `${labels.usage_mode[entry.usage_mode] || '此 Prompt'}的應用情境`;
}

function promptField(value, fallback, state) {
  const text = String(value || '').trim();
  if (hasCjk(text)) return toTraditional(text);
  if (!text) return fallback;
  state.reviewReasons.push('english-prompt-description-fallback');
  return fallback;
}

function makePromptRecord(entry, previous) {
  const currentHash = entry.content_hash;
  const originals = {
    function_summary_original: entry.function_summary || '',
    prompt_summary_original: entry.prompt_summary || '',
    use_cases_original: asArray(entry.use_cases),
    how_to_use_original: entry.how_to_use || '',
    expected_output_original: entry.expected_output || '',
    how_to_view_result_original: entry.how_to_view_result || '',
    tool_compatibility_note_original: entry.tool_compatibility_note || ''
  };
  const originalsCurrent = previous && Object.entries(originals).every(([key, value]) => JSON.stringify(previous[key]) === JSON.stringify(value));
  if (previous && originalsCurrent && previous.localization_revision === LOCALIZATION_REVISION
    && previous.localized_from_hash === currentHash && previous.localization_status === 'complete') return previous;
  const state = { reviewReasons: [] };
  const useCases = asArray(entry.use_cases).map((value) => localizePromptUseCase(value, entry, state)).filter(Boolean);
  const riskLabels = asArray(entry.risk_flags).map((key) => ({ key, label_zh_tw: technicalLabel('risk', key), localization_status: hasTechnicalLabel(key) ? 'complete' : 'review_required' }));
  if (riskLabels.some((item) => item.localization_status === 'review_required')) state.reviewReasons.push('unknown-risk-key');
  const usageLabel = labels.usage_mode[entry.usage_mode] || '此 Prompt';
  return {
    entry_id: entry.id,
    source_id: entry.source_id,
    upstream_relative_path: entry.relative_path,
    source_hash: entry.content_hash,
    content_hash: entry.content_hash,
    display_title_zh_tw: toTraditional(entry.display_title || entry.title),
    function_summary_zh_tw: promptField(entry.function_summary, `${usageLabel}的功能摘要目前採保守說明，使用前請閱讀完整 Prompt。`, state),
    prompt_summary_zh_tw: promptField(entry.prompt_summary, `這是一份${usageLabel}；實際範圍以完整 Prompt 與提供的資料為準。`, state),
    use_cases_zh_tw: useCases.length ? useCases : [`使用於${usageLabel}需求`],
    how_to_use_zh_tw: promptField(entry.how_to_use, `先閱讀完整 Prompt，再交給具備所需權限與能力的 AI；執行任何檔案、安裝或部署操作前必須再次確認。`, state),
    expected_output_zh_tw: promptField(entry.expected_output, `產出形式依完整 Prompt、輸入資料與所用工具能力而定。`, state),
    how_to_view_result_zh_tw: promptField(entry.how_to_view_result, `在所用 AI 的對話或目標專案既有預覽方式中查看結果。`, state),
    tool_compatibility_note_zh_tw: promptField(entry.tool_compatibility_note, `請先確認所用 AI 是否具備目標檔案、專案或生成工具的必要權限。`, state),
    type_label_zh_tw: `${labels.prompt_type[entry.prompt_type] || `Prompt 類型：${entry.prompt_type}`}／${labels.page_type[entry.page_type] || `頁面類型：${entry.page_type}`}`,
    profile_label_zh_tw: labels.design_profile[entry.design_profile] || `設計分類：${entry.design_profile}`,
    risk_labels_zh_tw: riskLabels,
    original_english_fields: englishOriginalFields(originals),
    ...originals,
    localization_status: state.reviewReasons.length ? 'review_required' : 'complete',
    localization_source: hasCjk(entry.function_summary) ? 'existing-zh-TW-metadata' : 'deterministic-project-localization',
    localization_review_reasons: unique(state.reviewReasons),
    localized_from_hash: currentHash,
    previous_localized_from_hash: previous?.localized_from_hash && previous.localized_from_hash !== currentHash ? previous.localized_from_hash : '',
    localization_revision: LOCALIZATION_REVISION
  };
}

function makeLiveRecord(entry, previous) {
  const currentHash = entry.source_hash || entry.content_hash;
  const originals = {
    function_summary_original: entry.function_summary || entry.summary || '',
    prompt_summary_original: '',
    use_cases_original: asArray(entry.use_cases),
    how_to_use_original: entry.how_to_use || '',
    expected_output_original: entry.expected_output || '',
    how_to_view_result_original: entry.how_to_view_result || '',
    tool_compatibility_note_original: entry.tool_compatibility_note || ''
  };
  const originalsCurrent = previous && Object.entries(originals).every(([key, value]) => JSON.stringify(previous[key]) === JSON.stringify(value));
  if (previous && originalsCurrent && previous.localization_revision === LOCALIZATION_REVISION
    && previous.localized_from_hash === currentHash && previous.localization_status === 'complete') return previous;
  const reviewReasons = [];
  const purpose = semanticPurpose(entry);
  const useCases = asArray(entry.use_cases).every(hasCjk)
    ? asArray(entry.use_cases).map(toTraditional)
    : [`快速試作${purpose}`, '離線檢視固定版本的上游實作'];
  const risks = asArray(entry.risk_flags).map((key) => ({ key, label_zh_tw: technicalLabel('risk', key), localization_status: hasTechnicalLabel(key) ? 'complete' : 'review_required' }));
  const interactions = asArray(entry.interactions).map((key) => ({ key, label_zh_tw: technicalLabel('interaction', key), localization_status: labels.interaction[key] ? 'complete' : 'review_required' }));
  const typeKey = entry.component_type || entry.animation_type;
  if (!labels.live_type[typeKey]) reviewReasons.push(`unknown-type:${typeKey}`);
  if (risks.some((item) => item.localization_status === 'review_required')) reviewReasons.push('unknown-risk-key');
  if (interactions.some((item) => item.localization_status === 'review_required')) reviewReasons.push('unknown-interaction-key');
  const fileCount = asArray(entry.source_paths).length;
  const sourceLabel = entry.source_name || entry.source_id;
  const title = entry.display_title || entry.title_zh || entry.title;
  return {
    entry_id: entry.id,
    source_id: entry.source_id,
    upstream_relative_path: entry.upstream_relative_path || entry.source_position,
    source_hash: currentHash,
    content_hash: entry.content_hash,
    display_title_zh_tw: toTraditional(entry.title_zh || entry.title),
    function_summary_zh_tw: liveSummary(entry),
    prompt_summary_zh_tw: '',
    use_cases_zh_tw: useCases,
    how_to_use_zh_tw: `先開啟隔離預覽測試本機互動，再使用「複製主要程式碼」或「複製 Codex 交接內容」檢視固定版本的 ${sourceLabel} 來源。整合進專案前，請讓 Coding Agent 先讀取現有架構與全部 ${fileCount} 個來源檔；不要直接執行上游安裝、部署、登入或付款指令。`,
    expected_output_zh_tw: `取得可追溯至固定 commit 的「${title}」整合素材與完整來源檔清單；離線預覽不需網路、登入、API key、付款或遠端媒體。實際專案檔案與相依設定仍由目標專案架構決定。`,
    how_to_view_result_zh_tw: `在 Visual Prompt Atlas 的「Live UI」中開啟隔離預覽。預覽只在可見範圍內啟用；離開畫面、關閉詳情或啟用減少動態效果時會暫停。`,
    tool_compatibility_note_zh_tw: `Atlas 預覽使用無額外相依套件的 HTML／CSS／JavaScript 本機 adapter；複製的上游來源仍保留其 React 生態系與 metadata 所列相依套件，需由可存取目標專案的 Coding Agent 評估後整合。`,
    interaction_labels_zh_tw: interactions,
    risk_labels_zh_tw: risks,
    type_label_zh_tw: labels.live_type[typeKey] || `技術類型：${typeKey}`,
    offline_label_zh_tw: labels.offline_status[entry.offline_status] || `離線狀態：${entry.offline_status}`,
    stack_labels_zh_tw: asArray(entry.stack).map((value) => ({ key: value, label_zh_tw: labels.stack[value] || value })),
    original_english_fields: englishOriginalFields(originals),
    ...originals,
    localization_status: reviewReasons.length ? 'review_required' : 'complete',
    localization_source: hasCjk(entry.function_summary || entry.summary) ? 'existing-zh-TW-metadata' : 'deterministic-project-localization',
    localization_review_reasons: unique(reviewReasons),
    localized_from_hash: currentHash,
    previous_localized_from_hash: previous?.localized_from_hash && previous.localized_from_hash !== currentHash ? previous.localized_from_hash : '',
    localization_revision: LOCALIZATION_REVISION
  };
}

function sourceReferenceRecord(source) {
  const binding = sha256(JSON.stringify({ id: source.id, commit: source.current_commit, license_status: source.license_status, ingestion_policy: source.ingestion_policy, risk_notes: source.risk_notes }));
  if (source.id === 'unlumen-ui-public-registry') {
    return {
      entry_id: source.id,
      source_id: source.id,
      upstream_relative_path: 'LICENSE + README.md + content/docs/license.mdx + public/r/*.json',
      content_hash: binding,
      function_summary_zh_tw: 'Unlumen UI 的官方公開 repository 同時出現 MIT 授權宣告與禁止重新發布或分享元件的產品條款；適用範圍無法可靠釐清，因此 Atlas 僅保留來源與授權稽核中繼資料，不複製元件程式碼，也不提供 Live UI。',
      use_cases_zh_tw: ['查閱官方來源與授權衝突證據', '確認目前僅保留中繼資料'],
      risk_labels_zh_tw: [{ key: source.license_status, label_zh_tw: labels.license_status[source.license_status], localization_status: 'complete' }],
      original_english_fields: ['ingestion_policy_original', 'risk_notes_original'],
      ingestion_policy_original: source.ingestion_policy,
      risk_notes_original: source.risk_notes,
      localization_status: 'complete', localization_source: 'project-license-audit', localized_from_hash: binding, localization_revision: LOCALIZATION_REVISION
    };
  }
  return {
    entry_id: source.id,
    source_id: source.id,
    upstream_relative_path: 'hosted_saas_official_reference',
    content_hash: binding,
    function_summary_zh_tw: 'Animos 是瀏覽器託管的動態模板服務；目前未找到可驗證的官方公開來源 repository、OSS 授權或模板再分發授權，因此只保留官方連結與功能摘要，不抓取、不反向工程，也不保存模板。',
    use_cases_zh_tw: ['查閱官方託管服務資訊', '確認目前不得匯入或再分發模板'],
    risk_labels_zh_tw: [{ key: source.license_status, label_zh_tw: labels.license_status[source.license_status], localization_status: 'complete' }],
    original_english_fields: ['ingestion_policy_original', 'risk_notes_original'],
    ingestion_policy_original: source.ingestion_policy,
    risk_notes_original: source.risk_notes,
    localization_status: 'complete', localization_source: 'project-license-audit', localized_from_hash: binding, localization_revision: LOCALIZATION_REVISION
  };
}

function descriptiveValues(record) {
  return [
    record.function_summary_zh_tw, record.prompt_summary_zh_tw, record.how_to_use_zh_tw,
    record.expected_output_zh_tw, record.how_to_view_result_zh_tw, record.tool_compatibility_note_zh_tw,
    ...asArray(record.use_cases_zh_tw), ...asArray(record.risk_labels_zh_tw).map((item) => item.label_zh_tw),
    ...asArray(record.interaction_labels_zh_tw).map((item) => item.label_zh_tw), record.type_label_zh_tw, record.offline_label_zh_tw
  ].filter(Boolean);
}

function runtimeRecord(record) {
  const {
    function_summary_original,
    prompt_summary_original,
    use_cases_original,
    how_to_use_original,
    expected_output_original,
    how_to_view_result_original,
    tool_compatibility_note_original,
    ingestion_policy_original,
    risk_notes_original,
    ...runtime
  } = record;
  return runtime;
}

function runtimePromptRecord(record, entry) {
  const runtime = runtimeRecord(record);
  const sameArray = (left, right) => JSON.stringify(left || []) === JSON.stringify(right || []);
  if (runtime.display_title_zh_tw === (entry.display_title || entry.title)) delete runtime.display_title_zh_tw;
  if (runtime.function_summary_zh_tw === (entry.function_summary || '')) delete runtime.function_summary_zh_tw;
  if (runtime.prompt_summary_zh_tw === (entry.prompt_summary || '')) delete runtime.prompt_summary_zh_tw;
  if (sameArray(runtime.use_cases_zh_tw, entry.use_cases)) delete runtime.use_cases_zh_tw;
  if (runtime.how_to_use_zh_tw === (entry.how_to_use || '')) delete runtime.how_to_use_zh_tw;
  if (runtime.expected_output_zh_tw === (entry.expected_output || '')) delete runtime.expected_output_zh_tw;
  if (runtime.how_to_view_result_zh_tw === (entry.how_to_view_result || '')) delete runtime.how_to_view_result_zh_tw;
  if (runtime.tool_compatibility_note_zh_tw === (entry.tool_compatibility_note || '')) delete runtime.tool_compatibility_note_zh_tw;
  return runtime;
}

function build(targetLibraryRoot = DEFAULT_LIBRARY_ROOT) {
  const libraryRoot = path.resolve(targetLibraryRoot);
  const catalogRoot = path.join(libraryRoot, 'visual-catalog');
  const localizationRoot = path.join(catalogRoot, 'localization');
  const sourcePath = path.join(localizationRoot, 'zh-TW.json');
  const outputPath = path.join(catalogRoot, 'localization-zh-TW.js');
  const reportPath = path.join(libraryRoot, 'indexes', 'localization-coverage-report.json');
  const technicalRegistryPath = path.join(libraryRoot, 'publication', 'technical-marker-registry.json');
  const technicalRegistry = fs.existsSync(technicalRegistryPath) ? readJson(technicalRegistryPath) : { records: [] };
  activeTechnicalMarkerById = new Map(asArray(technicalRegistry.records).map((record) => [record.id, record]));
  const promptCatalog = readAssignment(path.join(catalogRoot, 'catalog-data.js'), 'PROMPT_CATALOG');
  const liveCatalog = readAssignment(path.join(catalogRoot, 'live-ui-data.js'), 'LIVE_UI_CATALOG');
  const registryCandidates = [
    path.join(libraryRoot, 'references', 'community', 'source-registry.json'),
    path.join(libraryRoot, 'references', 'source-registry.public.json')
  ];
  const registryPath = registryCandidates.find((candidate) => fs.existsSync(candidate));
  const registry = registryPath ? readJson(registryPath) : { sources: [] };
  const previous = fs.existsSync(sourcePath) ? readJson(sourcePath) : { prompt_entries: [], live_ui_entries: [] };
  const previousPrompt = new Map(asArray(previous.prompt_entries).map((item) => [item.entry_id, item]));
  const previousLive = new Map(asArray(previous.live_ui_entries).map((item) => [item.entry_id, item]));
  const promptEntries = promptCatalog.entries.map((entry) => makePromptRecord(entry, previousPrompt.get(entry.id))).sort((a, b) => a.entry_id.localeCompare(b.entry_id));
  const liveEntries = liveCatalog.entries.map((entry) => makeLiveRecord(entry, previousLive.get(entry.id))).sort((a, b) => a.entry_id.localeCompare(b.entry_id));
  const sourceReferences = ['unlumen-ui-public-registry', 'animos-external-reference']
    .map((id) => registry.sources.find((source) => source.id === id))
    .filter(Boolean)
    .map(sourceReferenceRecord);
  const outputLabels = {
    ...labels,
    risk: {
      ...labels.risk,
      ...Object.fromEntries(asArray(technicalRegistry.records).map((record) => [record.id, record.name_zh_tw]))
    }
  };
  const body = {
    locale: 'zh-TW',
    localization_revision: LOCALIZATION_REVISION,
    prompt_catalog_content_hash: promptCatalog.content_hash,
    live_ui_catalog_content_hash: liveCatalog.content_hash,
    labels: outputLabels,
    prompt_entries: promptEntries,
    live_ui_entries: liveEntries,
    source_references: sourceReferences
  };
  const contentHash = sha256(JSON.stringify(body));
  const generatedAt = previous.content_hash === contentHash && previous.generated_at
    ? previous.generated_at
    : new Date().toISOString();
  const output = { schema_version: '1.0', generated_at: generatedAt, content_hash: contentHash, ...body };
  const allRecords = [...promptEntries, ...liveEntries, ...sourceReferences];
  const englishOnlyFields = allRecords.reduce((sum, record) => sum + descriptiveValues(record).filter((value) => englishWordCount(value) >= 3 && !hasCjk(value)).length, 0);
  const simplifiedChineseFields = allRecords.reduce((sum, record) => sum + [record.display_title_zh_tw, ...descriptiveValues(record)].filter((value) => SIMPLIFIED_CHINESE_PATTERN.test(String(value || ''))).length, 0);
  const simplifiedChineseSamples = allRecords.flatMap((record) => [record.display_title_zh_tw, ...descriptiveValues(record)]
    .filter((value) => SIMPLIFIED_CHINESE_PATTERN.test(String(value || '')))
    .map((value) => ({ entry_id: record.entry_id, value: String(value).slice(0, 240) }))).slice(0, 20);
  const reviewRequired = allRecords.filter((record) => record.localization_status === 'review_required').length;
  const staleRegenerated = allRecords.filter((record) => record.previous_localized_from_hash).length;
  const report = {
    schema_version: '1.0', generated_at: output.generated_at, locale: 'zh-TW', status: englishOnlyFields === 0 && simplifiedChineseFields === 0 && reviewRequired === 0 ? 'PASS' : 'FAIL',
    TOTAL_PROMPT_ENTRIES: promptEntries.length,
    TOTAL_LIVE_UI_ENTRIES: liveEntries.length,
    TOTAL_SOURCE_REFERENCE_ENTRIES: sourceReferences.length,
    ENTRIES_REQUIRING_ZH_TW: allRecords.length,
    ENTRIES_WITH_COMPLETE_ZH_TW: allRecords.length - reviewRequired,
    ENTRIES_REVIEW_REQUIRED: reviewRequired,
    ENGLISH_ONLY_USER_DESCRIPTION_FIELDS: englishOnlyFields,
    SIMPLIFIED_CHINESE_USER_DESCRIPTION_FIELDS: simplifiedChineseFields,
    SIMPLIFIED_CHINESE_FIELD_SAMPLES: simplifiedChineseSamples,
    STALE_LOCALIZATIONS_REGENERATED: staleRegenerated,
    PROMPT_CATALOG_CONTENT_HASH: promptCatalog.content_hash,
    LIVE_UI_CATALOG_CONTENT_HASH: liveCatalog.content_hash,
    LOCALIZATION_CONTENT_HASH: contentHash,
    risk_key_count: Object.keys(outputLabels.risk).length,
    interaction_key_count: Object.keys(labels.interaction).length,
    live_type_key_count: Object.keys(labels.live_type).length,
    sampled_sources: ['animejs-live-ui', 'kokonut-ui-oss', 'retro-ui-oss', 'magic-ui-oss', 'smooth-ui-oss', 'unlumen-ui-public-registry', 'animos-external-reference', 'prompt-database'],
    runtime_policy: { file_protocol: true, fetch_localization_json: false, remote_translation_service: false, generated_js: 'visual-catalog/localization-zh-TW.js' }
  };
  writeText(sourcePath, `${JSON.stringify(output, null, 2)}\n`);
  const runtimeOutput = {
    ...output,
    prompt_entries: promptEntries.map((record) => runtimePromptRecord(record, promptCatalog.entries.find((entry) => entry.id === record.entry_id))),
    live_ui_entries: liveEntries.map(runtimeRecord),
    source_references: sourceReferences.map(runtimeRecord),
    original_text_policy: 'Original descriptive fields remain in catalog-data.js and live-ui-data.js; zh-TW.json retains the explicit audit copy.'
  };
  writeText(outputPath, `/* SPDX-License-Identifier: MIT */\nwindow.VISUAL_CATALOG_ZH_TW = ${JSON.stringify(runtimeOutput)};\n`);
  writeText(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  assert.strictEqual(report.status, 'PASS', `Localization coverage gate failed: ${JSON.stringify(report)}`);
  console.log(`LOCALIZATION_BUILD=PASS prompts=${promptEntries.length} live=${liveEntries.length} references=${sourceReferences.length} review_required=${reviewRequired} english_only=${englishOnlyFields} simplified_chinese=${simplifiedChineseFields} hash=${contentHash}`);
  return report;
}

if (require.main === module) build(process.argv[2] || DEFAULT_LIBRARY_ROOT);

module.exports = { buildVisualCatalogLocalization: build, labels, SIMPLIFIED_CHINESE_PATTERN, descriptiveValues, toTraditional };
