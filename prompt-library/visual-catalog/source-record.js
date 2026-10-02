/* SPDX-License-Identifier: MIT */
'use strict';

(() => {
  const id = new URLSearchParams(location.search).get('id') || '';
  const title = document.querySelector('#title');
  const status = document.querySelector('#status');
  const facts = document.querySelector('#facts');
  const addFact = (label, value) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = String(value || '不適用／Not applicable');
    row.append(term, description);
    facts.append(row);
  };
  const safeExternal = (value) => {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' && !url.username && !url.password && url.href !== location.href ? url.href : '';
    } catch (_) { return ''; }
  };
  const statusLabel = (value) => ({
    FIXED_SOURCE_FILE_MAPPING_VERIFIED: '固定來源檔案對應已核對／Pinned source file mapping checked',
    EXACT_FIXED_CSV_RECORD_HASH_MATCH: '固定 CSV 單筆正文與本機原文 Hash 相符／Pinned CSV record matches the local original body hash',
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
  }[value] || (/^[A-Z][A-Z0-9_]+$/.test(String(value || '')) ? '請參考下列固定來源欄位／Refer to the pinned source fields below' : value));
  const render = (record, promptBody) => {
  if (!record) {
    title.textContent = '找不到來源證明／Source proof not found';
    status.textContent = id ? `Entry ID: ${id}` : 'URL 缺少 Entry ID。';
    document.documentElement.dataset.sourceProofStatus = 'NOT_FOUND';
    return;
  }

  title.textContent = record.title;
  status.textContent = `${record.entry_id} · ${record.category} · ${statusLabel(record.source_record_mapping_status)}`;
  document.title = `${record.title} · 單筆來源證明`;
  const contributorText = (record.upstream_contributor_names || []).join('、') || '上游未提供逐筆 contributor／Not supplied at entry level';
  [
    ['Entry ID', record.entry_id], ['分類／Category', record.category], ['來源專案／Source project', record.source_project_name],
    ['來源 Repository／Site', record.source_repository_or_site], ['固定 Commit／Version', record.source_commit_or_version],
    ['來源檔案／Source file', record.source_file], ['單筆定位語意／Entry locator semantics', statusLabel(record.source_link_semantics)],
    ['CSV record index', record.source_record_index || '不適用'], ['CSV physical line span（僅本機解析證據）', record.source_record_start_line ? `${record.source_record_start_line}–${record.source_record_end_line}` : '不適用'],
    ['上游 act', record.upstream_act], ['上游 type', record.upstream_type], ['上游 for_devs', record.upstream_for_devs],
    ['原作者／Creator', record.original_creator_display], ['原作者角色／Creator role', statusLabel(record.original_creator_role)],
    ['上游貢獻者／Contributors', contributorText], ['發布者／維護者', record.publisher_or_maintainer],
    ['權利人／Rights holder', record.rights_holder], ['此項目授權／Entry license', record.license || (record.license_ids || []).join(', ')],
    ['此項目授權識別碼／Entry license IDs', (record.license_ids || []).join(', ')],
    ['來源專案涵蓋授權（不表示本項目全部適用）／Source project license collection, not all applicable to this entry', (record.source_project_license_ids || []).join(', ')],
    ['本機改作狀態／Local adaptation', `${statusLabel(record.local_adaptation_status)} · ${record.local_adapter_name_or_project}`],
    ['Record fingerprint', record.source_record_fingerprint], ['上游正文 SHA-256', record.original_body_sha256],
    ['公開正文 SHA-256', record.local_original_body_sha256], ['連結驗證／Link validation', statusLabel(record.link_validation_status)]
  ].forEach(([label, value]) => addFact(label, value));
  const licenseEvidence = record.license_evidence;
  if (licenseEvidence && typeof licenseEvidence === 'object') {
    addFact('此項目授權宣告來源／Entry license declaration', [licenseEvidence.source_file || licenseEvidence.path, licenseEvidence.field && `Field: ${licenseEvidence.field}`, licenseEvidence.line && `Line: ${licenseEvidence.line}`].filter(Boolean).join(' · '));
    if (licenseEvidence.source_commit) addFact('授權宣告固定版本／License declaration commit', licenseEvidence.source_commit);
    if (licenseEvidence.source_file_sha256 || licenseEvidence.sha256) addFact('授權宣告來源 SHA-256／License declaration source hash', licenseEvidence.source_file_sha256 || licenseEvidence.sha256);
  }
  const licenseCompanions = (record.entry_license_companions || []).filter((item) => typeof item.text === 'string' && item.text.length);
  if (licenseCompanions.length) {
    const licenseSection = document.createElement('section');
    licenseSection.id = 'entry-license-companions';
    for (const companion of licenseCompanions) {
      const section = document.createElement('section');
      section.dataset.entryLicenseCompanion = companion.license;
      section.dataset.licenseSha256 = companion.sha256;
      section.dataset.licenseBytes = String(companion.bytes);
      const heading = document.createElement('h2');
      heading.textContent = `此來源的完整授權／Full license for this source · ${companion.license}`;
      const note = document.createElement('p');
      note.className = 'note';
      note.textContent = companion.original_download_contains_full_notice === false
        ? '以下保留固定來源的完整授權與版權聲明，可離線閱讀。Markdown 下載與複製使用公開來源正文，沒有額外附加這份授權全文；若曾清理本機路徑，會另行標示。／The full license and copyright notice from the pinned source are available here offline. Markdown download and copy use the public source body and do not contain this additional full notice; local-path adaptations are separately labeled.'
        : '以下保留固定來源的完整授權與版權聲明，可離線閱讀。／The full license and copyright notice from the pinned source are available here offline.';
      const pre = document.createElement('pre');
      pre.className = 'body';
      pre.tabIndex = 0;
      pre.setAttribute('aria-label', `${companion.license} 完整授權／Full license`);
      pre.textContent = companion.text;
      section.append(heading, note, pre);
      licenseSection.append(section);
      addFact('授權全文固定來源／Pinned full-license source', `${companion.source_id} · ${companion.source_repo} · ${companion.source_file}`);
      if (companion.scope === 'UPSTREAM_SKILL_INSTRUCTIONS_ONLY') addFact('授權全文適用範圍／Full-license scope', '此 Skill 指引原文；相關程式庫與服務的授權另行適用。／These Skill instructions; related libraries and services have separate licenses.');
      addFact('授權全文版本與 SHA-256／Full-license commit and hash', `${companion.source_commit} · ${companion.sha256} · ${companion.bytes} bytes`);
      addFact('固定上游來源與授權宣告對應／Pinned upstream source license mapping', `${companion.entry_source_file}:${companion.entry_declaration_line} · ${companion.entry_declaration_field} · ${companion.entry_source_commit} · SHA-256: ${companion.entry_source_sha256}`);
    }
    facts.after(licenseSection);
  }
  const localSourceNote = [record.local_source_usage_note_zh_tw, record.local_source_usage_note_en, record.local_adaptation_status === 'SANITIZED_LOCAL_ADAPTATION' ? record.public_sanitization_note_zh_tw || '公開版本已替換本機絕對路徑；不宣稱與上游原始位元組相同。' : ''].filter(Boolean).join(' ');
  if (localSourceNote) addFact('公開來源使用條件／Public source requirements', localSourceNote);
  for (const evidence of record.original_creator_evidence || []) {
    addFact('原作者署名證據／Creator credit evidence', `${evidence.name} · ${evidence.source_file}:${evidence.line} · 欄位／Field: ${evidence.field} · Commit: ${evidence.source_commit} · SHA-256: ${evidence.source_file_sha256}`);
  }
  const rawContributor = String(record.upstream_contributor_raw_value || '');
  if (rawContributor && !/[^\s@]+@[^\s@]+\.[^\s@]+/u.test(rawContributor)) addFact('上游 Contributor 原始欄位／Raw contributor value', rawContributor);

  const entryLink = document.querySelector('#entry-link');
  const externalEntry = safeExternal(record.entry_level_source_url);
  if (externalEntry) { entryLink.href = externalEntry; entryLink.hidden = false; }
  const datasetLink = document.querySelector('#dataset-link');
  const dataset = safeExternal(record.dataset_or_project_level_url);
  datasetLink.textContent = record.entry_id.startsWith('prompts-chat:') ? '開啟完整上游資料集' : '開啟上游專案';
  if (dataset) { datasetLink.href = dataset; datasetLink.hidden = false; }
  if (typeof promptBody === 'string' && promptBody.length) {
    document.querySelector('#body-section').hidden = false;
    document.querySelector('#body').textContent = promptBody;
  }
  document.documentElement.dataset.sourceProofStatus = 'PASS';
  document.documentElement.dataset.sourceProofEntryId = record.entry_id;
  };
  const fail = () => {
    title.textContent = '無法載入來源證明／Source proof could not be loaded';
    status.textContent = '請從同一份完整 Library 重新開啟此項目。／Reopen this entry from the same complete Library copy.';
    document.documentElement.dataset.sourceProofStatus = 'LOAD_ERROR';
    delete document.documentElement.dataset.sourceProofEntryId;
  };
  if (!id) { render(null, null); return; }
  document.documentElement.dataset.sourceProofStatus = 'LOADING';
  try {
    const core = window.SourceProofCore;
    const manifest = core.checkManifest(window.SOURCE_PROOF_MANIFEST);
    const key = core.bucketKey(id);
    const script = document.createElement('script');
    // Insert during the parser's final classic script. The bucket and its
    // synchronous onload rendering complete before the initial window load.
    script.src = core.bucketPath(key);
    script.onload = () => {
      try {
        const item = core.selectRecord(manifest, window.SOURCE_PROOF_BUCKET_DATA, id);
        render(item?.record || null, item?.prompt_body || null);
      } catch (_) { fail(); }
    };
    script.onerror = fail;
    document.head.append(script);
  } catch (_) { fail(); }
})();
