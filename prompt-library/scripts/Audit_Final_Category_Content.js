#!/usr/bin/env node
/* SPDX-License-Identifier: MIT */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const LIBRARY_ROOT = path.join(PROJECT_ROOT, 'prompt-library');
const INDEX_ROOT = path.join(LIBRARY_ROOT, 'indexes');
const REPOSITORY_ROOT = path.join(PROJECT_ROOT, 'Repository');
const PUBLIC_LIBRARY_ROOT = path.join(REPOSITORY_ROOT, 'prompt-library');
const PUBLIC_INDEX_ROOT = path.join(PUBLIC_LIBRARY_ROOT, 'indexes');
const PUBLIC_VISUAL_ROOT = path.join(PUBLIC_LIBRARY_ROOT, 'visual-catalog');
const OUTPUT_PATH = path.join(INDEX_ROOT, 'final-category-content-audit.json');
const GENERATED_AT = process.env.SOURCE_DATE_EPOCH
  ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
  : new Date().toISOString();

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const slash = (value) => String(value || '').replace(/\\/gu, '/');
const asArray = (value) => Array.isArray(value) ? value : [];
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/u, ''));

function readAssignment(file, key) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { timeout: 20000, filename: file });
  return context.window[key];
}

function writeJsonAtomic(file, value) {
  const temporary = `${file}.tmp-${process.pid}`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((output, key) => {
    if (!['generated_at', 'content_hash'].includes(key)) output[key] = stable(value[key]);
    return output;
  }, {});
}

function resolveUiPath(value, libraryRoot = PUBLIC_LIBRARY_ROOT) {
  const raw = String(value || '').split(/[?#]/u)[0];
  if (!raw || /^(?:https?:|data:|about:)/iu.test(raw)) return '';
  const absolute = path.resolve(libraryRoot, 'visual-catalog', raw.replace(/\//gu, path.sep));
  const root = `${path.resolve(libraryRoot)}${path.sep}`.toLowerCase();
  return absolute.toLowerCase().startsWith(root) ? absolute : '';
}

function previewUsable(entry, libraryRoot = PUBLIC_LIBRARY_ROOT) {
  const file = resolveUiPath(entry.example_path, libraryRoot);
  return Boolean(entry.example_path)
    && !['metadata-only', 'none'].includes(String(entry.preview_type || ''))
    && entry.example_status === 'VERIFIED'
    && file && fs.existsSync(file) && fs.statSync(file).isFile() && fs.statSync(file).size > 0;
}

function assetCapabilities(entry) {
  const assets = asArray(entry.direct_use_assets).filter((asset) => asset?.path);
  return {
    assets,
    copy: entry.action_capabilities?.can_copy === true,
    download: assets.some((asset) => asset.download === true && asset.download_record_id),
    open: assets.some((asset) => asset.type === 'local-source'),
    workflow: assets.some((asset) => asset.type === 'workflow-json'),
    template: assets.some((asset) => ['source-code', 'artifact-file', 'pptx', 'ppt-template-landscape', 'ppt-template-portrait'].includes(asset.type)),
    artifact: assets.some((asset) => ['source-code', 'artifact-file', 'pptx'].includes(asset.type))
  };
}

function categoryContract(entry, promptBodies, options = {}) {
  const action = assetCapabilities(entry);
  const libraryRoot = options.libraryRoot || PUBLIC_LIBRARY_ROOT;
  const preview = previewUsable(entry, libraryRoot);
  const body = Boolean(entry.content_body_path || entry.relative_path) && action.assets.some((asset) => {
    if (!['source-file', 'prompt-file', 'local-source'].includes(asset.type)) return false;
    const file = resolveUiPath(asset.path, libraryRoot);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
    const bytes = fs.readFileSync(file);
    return bytes.length > 0 && bytes.toString('utf8').trim().length > 0
      && (!asset.sha256 || sha256(bytes) === asset.sha256);
  });
  const promptBody = String(promptBodies[entry.id] || '').trim();
  const checks = {
    prompt: Boolean(promptBody) && action.copy && action.download,
    'live-ui': preview && (action.open || action.artifact),
    theme: preview && action.assets.length > 0,
    'design-system': body && (action.copy || action.download || action.open),
    workflow: action.workflow && Number(entry.node_count || 0) > 0,
    'artifact-example': preview && action.artifact,
    skill: body && !asArray(entry.risk_flags).includes('plugin-metadata-not-installed'),
    template: body && (Boolean(entry.template_artifact_path) || action.template || action.assets.some((asset) => asset.type === 'source-file'))
      && (preview || action.copy || action.download || action.open)
  };
  return { action, preview, body, promptBody, complete: checks[entry.content_type] === true };
}

function normalizedBoilerplate(entry) {
  let value = `${entry.summary_zh_tw || ''} ${entry.original_summary || ''}`.normalize('NFKC').toLowerCase();
  for (const token of [entry.title, entry.display_title_zh_tw]) {
    if (token) value = value.split(String(token).normalize('NFKC').toLowerCase()).join('<title>');
  }
  return value.replace(/[0-9a-f]{12,}/gu, '<hash>').replace(/\s+/gu, ' ').trim();
}

function knownGeneric(entry) {
  const summary = String(entry.summary_zh_tw || '').trim();
  const how = String(entry.how_to_zh_tw || '').trim();
  const output = String(entry.expected_output_zh_tw || '').trim();
  const generic = /(?:供能力參考|依項目 metadata 所述|只提供離線 metadata|提供可追溯的本機參考資料|此 Prompt 要求模型依「.+」的主題與原文規則回應使用者)/iu.test(summary);
  const genericOutput = /^(?:依項目 metadata 所述的可重用成果。?|可整合至專案的介面元件與互動行為。?)$/u.test(output);
  return !summary || !how || !output || generic || genericOutput;
}

function recordFor(entry, promptBodies, options = {}) {
  const contract = categoryContract(entry, promptBodies, options);
  const assets = contract.action.assets;
  return {
    entry_id: entry.id,
    title: entry.display_title_zh_tw || entry.title,
    source_type: entry.source_type,
    final_public_category: entry.content_type,
    secondary_facets: asArray(entry.secondary_facets),
    primary_use: entry.primary_use,
    supported_capabilities: asArray(entry.supported_capabilities),
    full_content_present: contract.complete,
    preview_applicability: entry.preview_applicability,
    preview_path: entry.example_path || '',
    preview_verified: contract.preview,
    preview_justification: entry.preview_justification_zh_tw || '',
    artifact_path: entry.artifact_path || assets.find((asset) => asset.download)?.path || '',
    dependency_status: entry.dependency_status,
    dependency_disclosure_zh_tw: entry.dependency_disclosure_zh_tw,
    dependency_disclosure_en: entry.dependency_disclosure_en,
    license_status: entry.license_status,
    source_name: entry.source_name,
    upstream_url: entry.action_capabilities?.entry_upstream_url || entry.action_capabilities?.project_or_dataset_url || '',
    provenance_record_path: entry.action_capabilities?.provenance_record_path || '',
    pinned_version_or_commit: entry.pinned_version_or_commit,
    rights_holder: entry.rights_holder,
    license_ids: asArray(entry.license_ids),
    redistribution_basis: entry.redistribution_basis,
    publication_decision: entry.publication_decision,
    exclusion_reason: entry.exclusion_reason || '',
    localization_status: entry.localization_status,
    content_body_path: entry.content_body_path || entry.relative_path,
    content_body_hash: entry.content_body_hash || entry.content_hash,
    template_artifact_path: entry.template_artifact_path || '',
    download_record_ids: assets.filter((asset) => asset.download).map((asset) => asset.download_record_id),
    technical_marker_ids: asArray(entry.risk_flags)
  };
}

module.exports = { resolveUiPath, previewUsable, assetCapabilities, categoryContract, knownGeneric, recordFor };
