#!/usr/bin/env node
/* SPDX-License-Identifier: MIT */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const categoryAudit = require('./Audit_Final_Category_Content.js');
const { SIMPLIFIED_CHINESE_PATTERN, descriptiveValues } = require('./Build_Visual_Catalog_Localization.js');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const slash = (value) => String(value || '').replace(/\\/g, '/');

// Offsets refer to the supplied text, including JSON/CSV escapes. Callers may
// replace these spans without exposing local path values in public evidence.
function scanAbsoluteLocalPaths(value) {
  const text = String(value ?? '');
  const prefixes = /(?:[A-Za-z]:(?:\\+|\/+)|(?:\\*\/)(?:(?:[a-z]|mnt(?:\\*\/)[a-z])(?:\\*\/))?(?:Users|home|root|workspace|workspaces|AI_Prompt_Library)(?=\\*\/|[\s"'`]|$))/giu;
  const matches = [];
  for (const match of text.matchAll(prefixes)) {
    const index = match.index;
    // Do not reinterpret URL path segments or identifiers as drive roots.
    if (index && /[A-Za-z0-9_]/u.test(text[index - 1])) continue;
    const tokenPrefix = text.slice(0, index).split(/[\s"'`<>\[\]{}(),;]/u).pop();
    if (/^(?:https?|ftp|data):/iu.test(tokenPrefix)) continue;
    let end = index + match[0].length;
    while (end < text.length && !/[\s"'`<>\[\]{}(),;]/u.test(text[end])) end++;
    while (end > index && /[\\.!?:]/u.test(text[end - 1])) end--;
    if (end <= index) continue;
    const normalized = text.slice(index, end).replace(/\\+\//gu, '/').replace(/\\+/gu, '/');
    const kind = /^(?:[A-Za-z]:\/Users(?:\/|$)|\/(?:(?:[a-z]|mnt\/[a-z])\/)?(?:Users|home|root)(?:\/|$))/iu.test(normalized) ? 'USER_HOME' : 'PROJECT_PATH';
    if (matches.length && index < matches[matches.length - 1].index + matches[matches.length - 1].length) continue;
    matches.push({ index, length: end - index, kind });
  }
  return matches;
}

function scanPublicTextPaths(value, extension = '') {
  const text = String(value ?? '').replace(/^\uFEFF/u, '');
  let decoded, format = 'TEXT';
  if (extension.toLowerCase() === '.json') {
    try { decoded = JSON.parse(text); format = 'JSON'; } catch (_) { /* Invalid JSON remains raw-scanned. */ }
  } else if (extension.toLowerCase() === '.js') {
    // Only the existing fixed JSON-data assignments are decoded. Runtime JS
    // remains raw-scanned; no evaluation or broad vendor exception is used.
    // Inspect only the assignment prefix; a whole-payload RegExp can exhaust
    // V8's regexp stack on the multi-megabyte generated JSON-data files.
    let body = text.trimStart();
    while (body.startsWith('/*')) {
      const commentEnd = body.indexOf('*/', 2);
      if (commentEnd < 0) break;
      body = body.slice(commentEnd + 2).trimStart();
    }
    body = body.trimEnd();
    let valueStart = -1;
    if (body.startsWith('window.') && body.endsWith(';')) {
      let cursor = 7;
      if (/[A-Za-z_$]/u.test(body[cursor] || '')) {
        cursor++;
        while (/[\w$]/u.test(body[cursor] || '')) cursor++;
        while (/\s/u.test(body[cursor] || '')) cursor++;
        if (body[cursor] === '=') {
          cursor++;
          while (/\s/u.test(body[cursor] || '')) cursor++;
          if (cursor < body.length - 1) valueStart = cursor;
        }
      }
    }
    if (valueStart >= 0) {
      try {
        const assigned = body.slice(valueStart, -1);
        if (assigned.startsWith('JSON.parse(') && assigned.endsWith(')')) {
          const literal = assigned.slice(11, -1);
          if (!literal.startsWith('"') || !literal.endsWith('"')) throw new Error('JSON string literal required.');
          const jsonText = JSON.parse(literal);
          if (typeof jsonText !== 'string') throw new Error('JSON string literal required.');
          decoded = JSON.parse(jsonText);
          format = 'FIXED_JSON_PARSE_ASSIGNMENT';
        } else {
          decoded = JSON.parse(assigned);
          format = 'FIXED_JSON_ASSIGNMENT';
        }
      } catch (_) { /* Non-JSON assignments cannot bypass the raw scan. */ }
    }
  }
  if (format === 'TEXT') return { format, matches: scanAbsoluteLocalPaths(text) };
  const matches = [];
  const visit = (item) => {
    if (typeof item === 'string') matches.push(...scanAbsoluteLocalPaths(item));
    else if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === 'object') for (const [key, child] of Object.entries(item)) { visit(key); visit(child); }
  };
  visit(decoded);
  return { format, matches };
}

function validateByteSafeAttributes(text) {
  const rows = String(text).replace(/^\uFEFF/u, '').split(/\r?\n/u)
    .map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
  // A single global rule is intentional: later path rules, filters, encodings,
  // ident expansion and line-ending overrides can all change committed bytes.
  return { valid: rows.length === 1 && /^\*\s+-text$/u.test(rows[0]), rule_count: rows.length };
}

const PUBLIC_TEXT_EXTENSIONS = new Set(['', '.css', '.html', '.htm', '.js', '.cjs', '.json', '.jsonc', '.lock', '.md', '.mjs', '.ps1', '.tsx', '.jsx', '.ts', '.txt', '.yaml', '.yml', '.xml', '.rels', '.svg', '.csv', '.ini', '.toml', '.scss', '.less', '.map', '.bat', '.cmd']);
const HEX_SHA256 = /^[0-9a-f]{64}$/u;
function decodePublicText(bytes) {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return bytes.subarray(2).toString('utf16le');
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    if (bytes.length % 2) throw new Error('Invalid UTF-16 byte length.');
    return Buffer.from(bytes.subarray(2)).swap16().toString('utf16le');
  }
  return bytes.toString('utf8');
}
function publicRelativePath(value) {
  return typeof value === 'string' && value.length > 0 && !value.includes('\\') && !value.startsWith('/')
    && !/^[A-Za-z]:/u.test(value) && !value.split('/').some((part) => !part || part === '.' || part === '..');
}

function validateRedistributionPolicy(policy, entries, files) {
  const errors = [];
  const requireThat = (condition, reason) => { if (!condition) errors.push(reason); };
  const uniqueStrings = (items) => Array.isArray(items) && items.every((x) => typeof x === 'string' && x.length > 0) && new Set(items).size === items.length;
  requireThat(policy?.schema_version === 1 && policy.policy_id === 'PUBLIC_REDISTRIBUTION_EVIDENCE_20261002', 'policy-schema');
  requireThat(['excluded_entries', 'excluded_assets', 'sources', 'allowed_pptx', 'excluded_embedded_media_sha256', 'excluded_path_prefixes']
    .every((key) => Array.isArray(policy?.[key])), 'policy-required-arrays');
  requireThat(HEX_SHA256.test(policy?.reference_public_index?.sha256 || '') && Number.isSafeInteger(policy?.reference_public_index?.bytes) && policy.reference_public_index.bytes > 0, 'reference-pin');
  requireThat(uniqueStrings(policy?.reference_public_entry_ids), 'reference-ids');
  requireThat(uniqueStrings(policy?.allowed_entry_ids), 'allowed-ids');
  const reference = new Set(policy?.reference_public_entry_ids || []);
  const allowed = new Set(policy?.allowed_entry_ids || []);
  const excludedRows = Array.isArray(policy?.excluded_entries) ? policy.excluded_entries : [];
  const excluded = new Set(excludedRows.map((row) => row.entry_id));
  requireThat(excluded.size === excludedRows.length && excludedRows.every((row) => reference.has(row.entry_id)
    && typeof row.source_id === 'string' && typeof row.source_commit === 'string' && row.source_commit.length > 0
    && typeof row.reason === 'string' && row.reason.length > 0 && Array.isArray(row.evidence) && row.evidence.length > 0), 'excluded-entry-evidence');
  requireThat(policy?.reference_public_index?.entry_count === reference.size && reference.size > 0, 'reference-count');
  requireThat(allowed.size + excluded.size === reference.size && [...reference].every((id) => allowed.has(id) !== excluded.has(id)), 'exact-policy-partition');
  const actual = new Set(entries.map((entry) => entry.id));
  requireThat(actual.size === entries.length && actual.size === allowed.size && [...actual].every((id) => allowed.has(id)), 'exact-public-entries');
  const sources = Array.isArray(policy?.sources) ? policy.sources : [];
  requireThat(new Set(sources.map((row) => row.id)).size === sources.length, 'duplicate-source-policy');
  requireThat(sources.every((row) => row.id && ['ALLOW', 'EXCLUDE'].includes(row.decision) && row.fixed_commit && row.reason), 'source-policy-evidence');
  const deniedSources = new Set(sources.filter((row) => row.decision === 'EXCLUDE').map((row) => row.id));
  const excludedAssets = Array.isArray(policy?.excluded_assets) ? policy.excluded_assets : [];
  requireThat(new Set(excludedAssets.map((row) => row.path)).size === excludedAssets.length, 'duplicate-asset-policy');
  requireThat(excludedAssets.every((row) => publicRelativePath(row.path) && HEX_SHA256.test(row.sha256 || '')
    && Number.isSafeInteger(row.bytes) && row.bytes >= 0 && Array.isArray(row.entry_ids) && row.reason), 'excluded-asset-evidence');
  const forbiddenPaths = new Set(excludedAssets.map((row) => row.path));
  const forbiddenHashes = new Set(excludedAssets.map((row) => row.sha256));
  const forbiddenPrefixes = policy?.excluded_path_prefixes || [];
  requireThat(Array.isArray(forbiddenPrefixes) && forbiddenPrefixes.every((value) => publicRelativePath(value.replace(/\/$/u, ''))), 'excluded-path-prefixes');
  requireThat(Array.isArray(policy?.allowed_pptx) && policy.allowed_pptx.every((row) => publicRelativePath(row.path)
    && HEX_SHA256.test(row.sha256 || '') && Number.isSafeInteger(row.bytes) && row.bytes > 0
    && row.embedded_media_count === 0 && Array.isArray(row.evidence) && row.evidence.length > 0), 'pptx-rights-evidence');
  requireThat(uniqueStrings(policy?.excluded_embedded_media_sha256) && policy.excluded_embedded_media_sha256.every((value) => HEX_SHA256.test(value)), 'media-evidence');
  const pptxFiles = files.filter((file) => /\.pptx$/iu.test(file.relative));
  requireThat(pptxFiles.length === (policy?.allowed_pptx || []).length && pptxFiles.every((file) =>
    (policy?.allowed_pptx || []).some((row) => row.path === file.relative && row.sha256 === file.sha256 && row.bytes === file.bytes)), 'exact-allowed-pptx-set');
  const deniedMedia = new Set(policy?.excluded_embedded_media_sha256 || []);
  requireThat(policy?.counts?.reference_public_entries === reference.size && policy?.counts?.allowed_entries === allowed.size
    && policy?.counts?.excluded_entries === excluded.size && policy?.counts?.excluded_asset_paths === excludedAssets.length
    && policy?.counts?.pptx_allowed_files === (policy?.allowed_pptx || []).length, 'policy-derived-counts');
  return { valid: errors.length === 0, errors,
    excluded_entry_count: entries.filter((entry) => excluded.has(entry.id)).length,
    excluded_source_count: entries.filter((entry) => deniedSources.has(entry.source_id)).length,
    excluded_asset_count: files.filter((file) => forbiddenPaths.has(file.relative) || forbiddenHashes.has(file.sha256)
      || forbiddenPrefixes.some((prefix) => file.relative === prefix.replace(/\/$/u, '') || file.relative.startsWith(prefix.replace(/\/$/u, '') + '/'))).length,
    excluded_media_count: files.filter((file) => deniedMedia.has(file.sha256)).length,
    expected_entry_count: allowed.size };
}

function scanPublicArchive(buffer, label, policy, depth = 0) {
  if (depth > 8) throw new Error('Archive nesting exceeds the verifiable bound.');
  const zip = parseZipBuffer(buffer, label);
  if (new Set(zip.entries.map((entry) => entry.name)).size !== zip.entries.length
    || zip.entries.some((entry) => entry.flags & 1 || !publicRelativePath(entry.name.replace(/\/$/u, '')))) throw new Error('Archive identity is unsafe.');
  const result = { absolute_paths: 0, user_home_paths: 0, project_paths: 0, xml_paths: 0, excluded_media: 0, excluded_assets: 0, unlicensed_pptx: 0, text_members: 0 };
  const isPptx = /\.pptx$/iu.test(label);
  if (isPptx) {
    const allowed = (policy?.allowed_pptx || []).filter((row) => row.sha256 === sha256(buffer) && row.bytes === buffer.length && row.embedded_media_count === 0);
    if (allowed.length !== 1 || zip.entries.some((row) => /^ppt\/media\//iu.test(row.name))) result.unlicensed_pptx++;
  }
  const forbiddenMedia = new Set(policy?.excluded_embedded_media_sha256 || []);
  const forbiddenAssets = new Set((policy?.excluded_assets || []).map((row) => row.sha256));
  for (const entry of zip.entries) {
    if (entry.name.endsWith('/')) continue;
    const bytes = zip.data(entry);
    if (forbiddenMedia.has(sha256(bytes))) result.excluded_media++;
    if (forbiddenAssets.has(sha256(bytes))) result.excluded_assets++;
    const extension = path.extname(entry.name).toLowerCase();
    if (['.zip', '.pptx', '.docx', '.xlsx'].includes(extension)) {
      const child = scanPublicArchive(bytes, entry.name, policy, depth + 1);
      for (const key of Object.keys(result)) result[key] += child[key];
    } else if (PUBLIC_TEXT_EXTENSIONS.has(extension)) {
      const found = scanPublicTextPaths(decodePublicText(bytes), extension).matches;
      result.text_members++;
      result.absolute_paths += found.length;
      result.user_home_paths += found.filter((item) => item.kind === 'USER_HOME').length;
      result.project_paths += found.filter((item) => item.kind === 'PROJECT_PATH').length;
      if (['.xml', '.rels'].includes(extension)) result.xml_paths += found.length;
    }
  }
  return result;
}

function validatePublicLicenseNotices({ manifest, entries, downloads, sanitization, readBytes }) {
  const errors = [], rows = Array.isArray(manifest?.records) ? manifest.records : [];
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const paths = new Set(), noticeCache = new Map();
  if (manifest?.schema_version !== 1 || manifest?.role !== 'PUBLIC_LICENSE_NOTICE_COMPLETION'
    || !Array.isArray(manifest?.records)) errors.push('license-notice-schema');
  const pinnedBytes = (route, hash, size) => {
    if (!publicRelativePath(route) || !HEX_SHA256.test(hash || '') || !Number.isSafeInteger(size) || size <= 0) throw new Error('notice-pin');
    const bytes = readBytes(route);
    if (!Buffer.isBuffer(bytes) || bytes.length !== size || sha256(bytes) !== hash) throw new Error('notice-file-bytes');
    return bytes;
  };
  const noticeBytes = notice => {
    if (!notice || !publicRelativePath(notice.source_path) || !notice.source_id || !notice.source_commit
      || !Array.isArray(notice.license_ids) || !notice.license_ids.length) throw new Error('notice-source-evidence');
    const fixedLicense = { 'LICENSES/CC-BY-4.0.txt': 'CC-BY-4.0', 'LICENSES/PYTHON-PPTX-MIT.txt': 'MIT' }[notice.public_path];
    if (fixedLicense && JSON.stringify(notice.license_ids) !== JSON.stringify([fixedLicense])) throw new Error('notice-license-id-scope');
    const key = JSON.stringify(notice);
    if (!noticeCache.has(key)) noticeCache.set(key, pinnedBytes(notice.public_path, notice.sha256, notice.bytes));
    return noticeCache.get(key);
  };
  const fileEvidence = value => {
    if (!value || typeof value !== 'object') return [];
    const own = typeof value.path === 'string' && !value.path.includes('#')
      && /(?:^|\/)(?:LICENSE|NOTICE|COPYING|COPYRIGHT)[^/]*$/iu.test(value.path) ? [value] : [];
    return own.concat(Object.values(value).filter(item => item && typeof item === 'object').flatMap(fileEvidence));
  };
  for (const entry of entries) {
    try {
      const notices = entry.public_license_notices || [];
      if (!Array.isArray(notices)) throw new Error('entry-notices');
      for (const evidence of fileEvidence(entry.license_evidence)) {
        if (!notices.some(notice => evidence.sha256 ? notice.sha256 === evidence.sha256
          : notice.source_path === evidence.path || notice.source_path.endsWith('/' + evidence.path))) throw new Error('entry-license-notice-missing');
      }
      for (const notice of notices) {
        const bytes = noticeBytes(notice);
        if (notice.source_id !== entry.source_id) throw new Error('entry-notice-source');
        for (const download of downloads.filter(item => item.entry_id === entry.id && /\.(?:md|markdown|mdx)$/iu.test(item.artifact_path))) {
          const payload = readBytes(`prompt-library/${download.artifact_path}`);
          if (!payload.includes(bytes)) throw new Error('standalone-download-notice-missing');
        }
      }
    } catch (error) { errors.push(`entry-notice:${entry.id}:${error.message}`); }
  }
  for (const row of rows) {
    try {
      if (!publicRelativePath(row.path) || paths.has(row.path)) throw new Error('notice-duplicate-path');
      paths.add(row.path);
      if (!['APPEND_REQUIRED_LICENSE_NOTICE', 'ADD_PPTX_LICENSE_NOTICES'].includes(row.operation)) throw new Error('notice-operation');
      if (!Array.isArray(row.entry_ids) || !row.entry_ids.length || new Set(row.entry_ids).size !== row.entry_ids.length
        || row.entry_ids.some(id => !byId.has(id))) throw new Error('notice-entry-scope');
      if (!HEX_SHA256.test(row.before_upstream_sha256 || '') || !Number.isSafeInteger(row.before_bytes) || row.before_bytes <= 0
        || row.before_upstream_sha256 === row.after_public_sha256) throw new Error('notice-before-pin');
      const bytes = pinnedBytes(row.path, row.after_public_sha256, row.after_bytes);
      if (!Array.isArray(row.notices) || !row.notices.length) throw new Error('required-notices-missing');
      const noticeData = row.notices.map(noticeBytes);
      const bound = (sanitization?.records || []).filter(item => item.path === row.path);
      if (bound.length !== 1 || ['before_upstream_sha256', 'before_bytes', 'after_public_sha256', 'after_bytes', 'operation'].some(key => bound[0][key] !== row[key])) throw new Error('notice-derivative-binding');
      for (const id of row.entry_ids) {
        const entry = byId.get(id);
        if (!(entry.public_derivative_operations || []).includes(row.operation)) throw new Error('notice-entry-operation');
        const records = downloads.filter(item => item.entry_id === id && `prompt-library/${item.artifact_path}` === row.path);
        if (!records.length || records.some(item => item.sha256 !== row.after_public_sha256 || item.bytes !== row.after_bytes)) throw new Error('notice-download-binding');
      }
      if (row.operation === 'APPEND_REQUIRED_LICENSE_NOTICE') {
        if (!/\.(?:md|markdown|mdx)$/iu.test(row.path) || !Number.isSafeInteger(row.body_bytes) || row.body_bytes <= 0
          || row.body_bytes >= bytes.length || !HEX_SHA256.test(row.body_sha256 || '')
          || sha256(bytes.subarray(0, row.body_bytes)) !== row.body_sha256
          || bytes.length - row.body_bytes !== row.appended_bytes || sha256(bytes.subarray(row.body_bytes)) !== row.appended_sha256) throw new Error('notice-original-body');
        if (noticeData.some(notice => !bytes.subarray(row.body_bytes).includes(notice))) throw new Error('notice-append-incomplete');
        if (!bound[0].occurrences?.length && (row.body_bytes !== row.before_bytes || row.body_sha256 !== row.before_upstream_sha256)) throw new Error('notice-upstream-prefix');
      } else {
        if (!/\.pptx$/iu.test(row.path)) throw new Error('notice-pptx-path');
        const pythonNotice = row.notices.filter(notice => notice.source_id === 'python-pptx');
        const primaryNotice = row.notices.filter(notice => notice.source_id !== 'python-pptx');
        if (row.notices.length !== 2 || pythonNotice.length !== 1 || primaryNotice.length !== 1
          || pythonNotice[0].public_path !== 'LICENSES/PYTHON-PPTX-MIT.txt'
          || JSON.stringify(pythonNotice[0].license_ids) !== '["MIT"]'
          || row.entry_ids.some(id => primaryNotice[0].source_id !== byId.get(id).source_id
            || !(byId.get(id).public_license_notices || []).some(notice => notice.public_path === primaryNotice[0].public_path
              && notice.sha256 === primaryNotice[0].sha256))) throw new Error('notice-pptx-license-roles');
        const zip = parseZipBuffer(bytes, row.path);
        const members = new Map(zip.entries.filter(member => !member.name.endsWith('/')).map(member => [member.name, zip.data(member)]));
        if (members.size !== zip.entries.filter(member => !member.name.endsWith('/')).length) throw new Error('notice-pptx-duplicates');
        if (![row.preserved_members, row.changed_members, row.added_members].every(Array.isArray)) throw new Error('notice-pptx-member-evidence');
        const claimed = new Set();
        const checkMember = (item, hash, size) => {
          if (!publicRelativePath(item.path) || claimed.has(item.path) || !members.has(item.path)) throw new Error('notice-pptx-member-set');
          claimed.add(item.path);
          const payload = members.get(item.path);
          if (payload.length !== size || sha256(payload) !== hash) throw new Error('notice-pptx-member-pin');
          return payload;
        };
        for (const item of row.preserved_members) checkMember(item, item.sha256, item.bytes);
        if (row.changed_members.length > 1) throw new Error('notice-pptx-extra-change');
        for (const item of row.changed_members) {
          if (item.path !== '[Content_Types].xml') throw new Error('notice-pptx-changed-member');
          const payload = checkMember(item, item.after_sha256, item.after_bytes);
          const original = payload.toString('utf8').replace(/<Default\b(?=[^>]*\bExtension="txt")(?=[^>]*\bContentType="text\/plain")[^>]*\/\s*>/u, '');
          if (Buffer.byteLength(original) !== item.before_bytes || sha256(original) !== item.before_sha256) throw new Error('notice-pptx-content-types-change');
        }
        const expectedNames = ['publication-notices/ATTRIBUTION.txt', 'publication-notices/LICENSE.txt', 'publication-notices/PYTHON-PPTX-MIT.txt'];
        if (JSON.stringify(row.added_members.map(item => item.path).sort()) !== JSON.stringify(expectedNames)) throw new Error('notice-pptx-added-set');
        for (const item of row.added_members) {
          const payload = checkMember(item, item.sha256, item.bytes);
          if (!payload.equals(pinnedBytes(item.source_public_path, item.sha256, item.bytes))) throw new Error('notice-pptx-source-copy');
          const requiredNotice = item.path === 'publication-notices/LICENSE.txt' ? primaryNotice[0]
            : item.path === 'publication-notices/PYTHON-PPTX-MIT.txt' ? pythonNotice[0] : null;
          if (requiredNotice && (item.source_public_path !== requiredNotice.public_path || !payload.equals(noticeBytes(requiredNotice)))) throw new Error('notice-pptx-required-license-content');
        }
        if (claimed.size !== members.size) throw new Error('notice-pptx-unaccounted-members');
        if (!/<Default\b(?=[^>]*\bExtension="txt")(?=[^>]*\bContentType="text\/plain")[^>]*\/\s*>/u.test(members.get('[Content_Types].xml')?.toString('utf8') || '')) throw new Error('notice-pptx-txt-type');
      }
    } catch (error) { errors.push(`notice-record:${sha256(String(row?.path || ''))}:${error.message}`); }
  }
  for (const row of sanitization?.records || []) if (['REQUIRED_LICENSE_NOTICE_APPENDED', 'PPTX_REQUIRED_LICENSE_NOTICES_ADDED'].includes(row.reason)
    && !paths.has(row.path)) errors.push('notice-manifest-record-missing');
  return { valid: errors.length === 0, errors, record_count: rows.length };
}

function validateSanitizationManifest({ manifest, entries, promptBodies, readBytes, licenseNotices }) {
  const errors = [], rows = Array.isArray(manifest?.records) ? manifest.records : [];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const adapted = new Set(), paths = new Set();
  if (manifest?.schema_version !== '1.0' || !Array.isArray(manifest?.records) || !Array.isArray(manifest?.adaptation_entry_ids)) errors.push('sanitization-schema');
  for (const row of rows) {
    try {
      if (!row || typeof row.path !== 'string' || paths.has(row.path)) throw new Error('duplicate-or-missing-route');
      paths.add(row.path);
      const bodyId = row.path.startsWith('prompt-body:') ? row.path.slice('prompt-body:'.length) : null;
      const parts = bodyId === null ? row.path.split('!') : [];
      if (bodyId === null && !parts.every(publicRelativePath)) throw new Error('unsafe-route');
      if (!['SANITIZED_LOCAL_ADAPTATION', 'PROMPT_BODY_DERIVATIVE'].includes(row.role)
        || (bodyId !== null && row.role !== 'PROMPT_BODY_DERIVATIVE')) throw new Error('derivative-role');
      if (!HEX_SHA256.test(row.before_upstream_sha256 || '') || !HEX_SHA256.test(row.after_public_sha256 || '')
        || row.before_upstream_sha256 === row.after_public_sha256 || !Number.isSafeInteger(row.before_bytes)
        || !Number.isSafeInteger(row.after_bytes) || row.before_bytes <= 0 || row.after_bytes <= 0) throw new Error('derivative-pins');
      if (!Array.isArray(row.entry_ids) || new Set(row.entry_ids).size !== row.entry_ids.length
        || row.entry_ids.some((id) => !byId.has(id))) throw new Error('derivative-entry-scope');
      for (const id of row.entry_ids) adapted.add(id);
      if (!Array.isArray(row.occurrences)) throw new Error('occurrence-array');
      for (const item of row.occurrences) {
        if (!['USER_HOME', 'PROJECT_PATH'].includes(item.kind) || !HEX_SHA256.test(item.before_sha256 || '')
          || !Number.isSafeInteger(item.length) || item.length <= 0
          || item.replacement !== (item.kind === 'USER_HOME' ? '__USER_HOME__' : '__PROJECT_PATH__')) throw new Error('occurrence-evidence');
      }
      const noticeBound = ['REQUIRED_LICENSE_NOTICE_APPENDED', 'PPTX_REQUIRED_LICENSE_NOTICES_ADDED'].includes(row.reason)
        && (licenseNotices?.records || []).some(other => other.path === row.path && other.operation === row.operation
          && other.after_public_sha256 === row.after_public_sha256 && other.before_upstream_sha256 === row.before_upstream_sha256);
      if (!row.occurrences.length && !noticeBound && !(row.reason === 'ARCHIVE_MANIFEST_REBOUND' && row.container_path
        && rows.some((other) => other !== row && other.container_path === row.container_path && other.occurrences?.length))) throw new Error('missing-occurrence-evidence');
      if (parts.length > 1 && (row.container_path !== parts.slice(0, -1).join('!') || row.member_path !== parts.at(-1))) throw new Error('archive-member-identity');
      let bytes;
      if (bodyId !== null) {
        if (!row.entry_ids.includes(bodyId) || typeof promptBodies[bodyId] !== 'string') throw new Error('prompt-body-identity');
        bytes = Buffer.from(promptBodies[bodyId], 'utf8');
      } else bytes = readBytes(row.path);
      if (!Buffer.isBuffer(bytes) || bytes.length !== row.after_bytes || sha256(bytes) !== row.after_public_sha256) throw new Error('actual-derivative-bytes');
      if (!/\.(?:zip|pptx|docx|xlsx)$/iu.test(row.path) && scanPublicTextPaths(decodePublicText(bytes), path.posix.extname(row.path)).matches.length) throw new Error('remaining-path');
    } catch (error) { errors.push(`${sha256(String(row?.path || ''))}:${error.message}`); }
  }
  const declared = manifest?.adaptation_entry_ids || [];
  if (new Set(declared).size !== declared.length || declared.length !== adapted.size || declared.some((id) => !adapted.has(id))) errors.push('adaptation-entry-set');
  for (const entry of entries) {
    const marked = entry.source_record_mapping_status === 'SANITIZED_LOCAL_ADAPTATION' || entry.public_derivative_role === 'SANITIZED_LOCAL_ADAPTATION';
    if (adapted.has(entry.id) !== marked) errors.push(`adaptation-marker:${entry.id}`);
    const bodyRows = rows.filter((row) => row.path === `prompt-body:${entry.id}`);
    if (bodyRows.length) {
      const row = bodyRows[0];
      if (entry.original_body_sha256 !== row.before_upstream_sha256
        || entry.local_original_body_sha256 !== row.after_public_sha256
        || entry.source_record_mapping_status !== 'SANITIZED_LOCAL_ADAPTATION') errors.push(`prompt-upstream-binding:${entry.id}`);
    }
  }
  return { valid: errors.length === 0, errors, record_count: rows.length, adaptation_entry_count: adapted.size };
}

// Proof buckets duplicate already audited public bodies. Validate their exact
// bytes, current index, complete records and original body hashes before
// excluding only those bodies from a second metadata-oriented privacy scan.
// All source/author/license metadata and every original zero gate remain scanned.
function validateSourceProofBuckets({ manifest, authorship, unified, promptBodies, files }) {
  const core = require('../visual-catalog/source-proof-core.js');
  core.checkManifest(manifest);
  const ordered = (value) => Array.isArray(value) ? value.map(ordered)
    : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, ordered(value[key])])) : value;
  const stable = (value) => JSON.stringify(ordered(value));
  if (manifest.unified_index_hash !== unified.content_hash || authorship.unified_index_hash !== unified.content_hash
    || stable(authorship.proof_data) !== stable(manifest)) throw new Error('Proof manifest is not bound to the public index.');
  const ids = new Set((unified.entries || []).map((entry) => entry.id));
  const records = new Map((authorship.records || []).map((record) => [record.entry_id, record]));
  if (ids.size !== unified.entries.length || records.size !== ids.size || records.size !== authorship.records.length
    || [...records.keys()].some((id) => !ids.has(id)) || Object.keys(promptBodies).some((id) => !ids.has(id))) {
    throw new Error('Proof records or bodies are outside the exact public scope.');
  }
  if (files.length !== core.BUCKET_COUNT || new Set(files.map((file) => file.path)).size !== core.BUCKET_COUNT) throw new Error('Proof bucket file inventory is incomplete or duplicated.');
  const metadata = new Map(), seen = new Set(); let bodyCount = 0;
  for (const file of files) {
    const match = /^source-proof-data\/([a-f0-9]{2})\.js$/u.exec(file.path);
    if (!match) throw new Error('Unexpected proof bucket path.');
    const key = match[1], descriptor = manifest.buckets[key], bytes = Buffer.isBuffer(file.bytes) ? file.bytes : Buffer.from(file.text, 'utf8');
    if (bytes.length !== descriptor.bytes || sha256(bytes) !== descriptor.sha256) throw new Error('Proof bucket file hash does not match.');
    const encoded = /^\/\* SPDX-License-Identifier: MIT; source-content licenses remain in each record\. \*\/\nwindow\.SOURCE_PROOF_BUCKET_DATA = JSON\.parse\(("(?:[^"\\]|\\.)*")\);\n$/u.exec(bytes.toString('utf8'));
    if (!encoded) throw new Error('Proof bucket is not the fixed JSON-only data format.');
    const payload = JSON.parse(JSON.parse(encoded[1]));
    core.checkBucket(manifest, payload, key);
    if (Object.keys(payload).sort().join(',') !== 'body_count,bucket_id,entries,entry_count,generation_hash,schema_version,unified_index_hash') throw new Error('Unexpected proof bucket fields.');
    for (const [id, item] of Object.entries(payload.entries)) {
      if (seen.has(id) || !records.has(id) || stable(item.record) !== stable(records.get(id))) throw new Error('Proof record differs from its public authorship record.');
      if (Object.keys(item).sort().join(',') !== 'body_required,prompt_body,prompt_body_sha256,record') throw new Error('Unexpected proof record fields.');
      const hasBody = Object.hasOwn(promptBodies, id);
      if (item.body_required !== hasBody || (hasBody && (item.prompt_body !== promptBodies[id]
        || sha256(Buffer.from(item.prompt_body, 'utf8')) !== item.prompt_body_sha256))) throw new Error('Proof body differs from the audited public original.');
      if (hasBody) bodyCount++;
      seen.add(id);
      // Only the exactly matched body is omitted. Metadata remains inspectable.
      item.prompt_body = null;
    }
    metadata.set(file.path, JSON.stringify(payload));
  }
  if (seen.size !== ids.size || bodyCount !== Object.keys(promptBodies).length || bodyCount !== manifest.body_count) throw new Error('Proof public record/body coverage is incomplete.');
  return { metadata, record_count: seen.size, body_count: bodyCount };
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/u, '').replace(/\r\n?/g, '\n');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((output, key) => {
      output[key] = canonicalize(value[key]);
      return output;
    }, {});
  }
  return value;
}

function objectHash(value) {
  return sha256(JSON.stringify(canonicalize(value)));
}

function walk(root) {
  const resolvedRoot = path.resolve(root);
  const files = [];
  const links = [];
  const directories = [];
  const ignored = [];
  const visit = (directory) => {
    for (const item of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, item.name);
      const relative = slash(path.relative(resolvedRoot, absolute));
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) {
        links.push(relative);
        continue;
      }
      if (stat.isDirectory()) {
        if (relative === '.git' || /(?:^|\/)(?:Repository\.__staging__|Repository\.__previous__|test-artifacts|\.next|node_modules)(?:\/|$)/u.test(relative)) {
          ignored.push(relative);
          continue;
        }
        directories.push(relative);
        if (/(?:^|\/)\.git$/u.test(relative)) continue;
        visit(absolute);
      } else if (stat.isFile()) {
        files.push({ absolute, relative, bytes: stat.size, sha256: sha256(fs.readFileSync(absolute)) });
      }
    }
  };
  visit(resolvedRoot);
  return { files, links, directories, ignored };
}

function treeHash(files, excluded = new Set()) {
  const lines = files.filter((file) => !excluded.has(file.relative)).sort((a, b) => a.relative.localeCompare(b.relative))
    .map((file) => `${file.relative}\0${file.sha256}\0${file.bytes}\n`);
  return sha256(lines.join(''));
}

function loadAssignment(filePath, globalName) {
  const context = { window: {} };
  vm.runInNewContext(readText(filePath), context, { filename: filePath, timeout: 20000 });
  if (!context.window[globalName]) throw new Error(`${globalName} assignment is missing.`);
  return context.window[globalName];
}

function routeFile(repositoryRoot, visualRoot, route) {
  const clean = String(route || '').split(/[?#]/u)[0];
  if (!clean || /^(?:https?:|data:|about:)/iu.test(clean)) return '';
  const absolute = path.resolve(visualRoot, clean);
  return absolute === repositoryRoot || absolute.startsWith(`${repositoryRoot}${path.sep}`) ? absolute : '__ESCAPED__';
}

function countMatches(text, patterns) {
  return patterns.reduce((total, pattern) => total + (String(text).match(pattern) || []).length, 0);
}

function parseZipBuffer(buffer, label = 'archive') {
  const minimum = Math.max(0, buffer.length - 0x10000 - 22);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error(`${label}: ZIP end record is missing`);
  const entryTotal = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  const entries = [];
  let offset = centralOffset;
  for (let index = 0; index < entryTotal; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error(`${label}: invalid central directory`);
    const versionMadeBy = buffer.readUInt16LE(offset + 4);
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const modTime = buffer.readUInt16LE(offset + 12);
    const modDate = buffer.readUInt16LE(offset + 14);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    const host = versionMadeBy >>> 8;
    const unixMode = host === 3 ? ((externalAttributes >>> 16) & 0xffff) : 0;
    entries.push({ name, flags, method, modTime, modDate, compressedSize, size, externalAttributes, unixMode, localOffset, host });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  function data(entry) {
    const local = entry.localOffset;
    if (buffer.readUInt32LE(local) !== 0x04034b50) throw new Error(`${label}: invalid local header for ${entry.name}`);
    const nameLength = buffer.readUInt16LE(local + 26);
    const extraLength = buffer.readUInt16LE(local + 28);
    const start = local + 30 + nameLength + extraLength;
    const packed = buffer.subarray(start, start + entry.compressedSize);
    if (entry.method === 0) return Buffer.from(packed);
    if (entry.method === 8) return zlib.inflateRawSync(packed);
    throw new Error(`${label}: unsupported ZIP method ${entry.method}`);
  }
  return { entries, data };
}

function auditPptx(buffer) {
  const zip = parseZipBuffer(buffer, 'PPTX');
  const names = new Set(zip.entries.map((entry) => entry.name));
  const read = (name) => {
    const entry = zip.entries.find((item) => item.name === name);
    return entry ? zip.data(entry).toString('utf8') : '';
  };
  const core = read('docProps/core.xml');
  const app = read('docProps/app.xml');
  const violations = [];
  if (!/<dc:creator>junru-norple<\/dc:creator>/u.test(core)) violations.push('creator');
  if (!/<cp:lastModifiedBy>junru-norple<\/cp:lastModifiedBy>/u.test(core)) violations.push('lastModifiedBy');
  if (/<Company>[^<]+<\/Company>/u.test(app)) violations.push('company');
  if (/<Manager>[^<]+<\/Manager>/u.test(app)) violations.push('manager');
  if ([...names].some((name) => /(?:^|\/)(?:comments?|notesSlides?|customXml|embeddings|media)\//iu.test(name))) violations.push('comments-notes-custom-embedded-media');
  if ([...names].some((name) => /(?:vbaProject|\.bin$|oleObject)/iu.test(name) && !/printerSettings/iu.test(name))) violations.push('macro-or-ole');
  for (const entry of zip.entries.filter((item) => /\.rels$/iu.test(item.name))) {
    if (/TargetMode=["']External["']/iu.test(zip.data(entry).toString('utf8'))) violations.push('external-relationship');
  }
  for (const entry of zip.entries.filter((item) => /^ppt\/slides\/slide\d+\.xml$/iu.test(item.name))) {
    if (/<p:sld\b[^>]*\bshow=["']0["']/iu.test(zip.data(entry).toString('utf8'))) violations.push('hidden-slide');
  }
  return [...new Set(violations)];
}

function auditZip(buffer, record) {
  const result = { permission000: 0, traversal: 0, symlink: 0, zeroByte: 0, missingLicense: 0, hashMismatch: 0, binaryMetadata: 0, failures: [] };
  let zip;
  try { zip = parseZipBuffer(buffer, record.filename); }
  catch (_) {
    result.hashMismatch += 1;
    result.failures.push('invalid-zip');
    return result;
  }
  const names = zip.entries.map((entry) => entry.name);
  const nameSet = new Set(names);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  if (names.some((name, index) => name !== sorted[index])) result.hashMismatch += 1;
  if (new Set(names).size !== names.length) result.hashMismatch += 1;
  const stamps = new Set(zip.entries.map((entry) => `${entry.modDate}:${entry.modTime}`));
  if (stamps.size !== 1) result.hashMismatch += 1;
  for (const entry of zip.entries) {
    const normalized = entry.name.replace(/\\/g, '/');
    const segments = normalized.split('/');
    if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:/u.test(normalized) || segments.includes('..') || entry.name.includes('\\')) result.traversal += 1;
    if ((entry.flags & 0x1) !== 0) result.traversal += 1;
    const type = entry.unixMode & 0o170000;
    if (type === 0o120000) result.symlink += 1;
    const isDirectory = normalized.endsWith('/');
    if (!isDirectory && entry.size === 0) result.zeroByte += 1;
    if (entry.host !== 3 || (entry.unixMode & 0o777) === 0) result.permission000 += 1;
    if (/(?:^|\/)(?:\.DS_Store|Thumbs\.db|desktop\.ini|__MACOSX)(?:\/|$)/iu.test(normalized)) result.hashMismatch += 1;
  }
  if (!nameSet.has('LICENSE_SCOPE.md')) result.missingLicense += 1;
  if (record.package_kind === 'pptx-package') {
    for (const required of ['README.md', 'ATTRIBUTION.md', 'LICENSES/CC-BY-4.0.txt', 'LICENSES/python-pptx-MIT.txt', 'ARTIFACT_MANIFEST.json']) {
      if (!nameSet.has(required)) result.missingLicense += 1;
    }
  } else {
    for (const required of ['DOWNLOAD_README.md', 'DEPENDENCIES.md', 'LICENSE_SCOPE.md', 'THIRD_PARTY_NOTICES.md', 'ARTIFACT_MANIFEST.json']) {
      if (!nameSet.has(required)) result.missingLicense += 1;
    }
    if (!nameSet.has('LICENSE_EVIDENCE.md') && !names.some((name) => name.startsWith('LICENSES/') && !name.endsWith('/'))) result.missingLicense += 1;
  }
  const manifestEntry = zip.entries.find((entry) => entry.name === 'ARTIFACT_MANIFEST.json');
  if (manifestEntry) {
    try {
      const manifest = JSON.parse(zip.data(manifestEntry).toString('utf8'));
      if (record.package_kind === 'pptx-package') {
        const pptxEntry = zip.entries.find((entry) => entry.name === manifest.pptx_path);
        if (!pptxEntry) result.hashMismatch += 1;
        else {
          const pptxBytes = zip.data(pptxEntry);
          if (pptxBytes.length !== manifest.pptx_bytes || sha256(pptxBytes) !== manifest.pptx_sha256) result.hashMismatch += 1;
          result.binaryMetadata += auditPptx(pptxBytes).length;
        }
        if (manifest.python_pptx_attribution_included !== true || manifest.generator_license_id !== 'MIT') result.missingLicense += 1;
      } else {
        for (const file of Array.isArray(manifest.files) ? manifest.files : []) {
          const entry = zip.entries.find((item) => item.name === file.path);
          if (!entry) { result.hashMismatch += 1; continue; }
          const bytes = zip.data(entry);
          if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) result.hashMismatch += 1;
        }
        if (manifest.schema_version === '2.0.0') {
          if (!manifest.source_license || !manifest.source_commit || !manifest.source_id) result.missingLicense += 1;
        } else if (!manifest.code_license_id && !manifest.content_license_id) result.missingLicense += 1;
      }
    } catch (_) { result.hashMismatch += 1; }
  }
  return result;
}

function auditRepository(repositoryRoot) {
  const profileStarted = Date.now();
  let profileLast = profileStarted;
  const profile = (label) => {
    if (process.env.PUBLIC_AUDIT_PROFILE !== '1') return;
    const now = Date.now();
    process.stderr.write(`[public-audit] ${label}: +${now - profileLast}ms total=${now - profileStarted}ms\n`);
    profileLast = now;
  };
  const root = path.resolve(repositoryRoot);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`Public repository root is missing: ${root}`);
  const inventory = walk(root);
  profile('walk');
  const failures = [];
  const visualRoot = path.join(root, 'prompt-library', 'visual-catalog');
  const unifiedPath = path.join(root, 'prompt-library', 'indexes', 'unified-index-v2.json');
  const downloadPath = path.join(root, 'prompt-library', 'indexes', 'download-manifest.json');
  const provenancePath = path.join(root, 'prompt-library', 'indexes', 'PUBLIC_PROVENANCE_MANIFEST.json');
  const localizationReportPath = path.join(root, 'prompt-library', 'indexes', 'localization-coverage-report.json');
  const technicalRegistryPath = path.join(root, 'prompt-library', 'publication', 'technical-marker-registry.json');
  const registryPath = path.join(root, 'prompt-library', 'references', 'source-registry.public.json');
  const allowlistPath = path.join(root, 'prompt-library', 'publication', 'public-source-allowlist.json');
  const publicManifestPath = path.join(root, 'PUBLIC_BUILD_MANIFEST.json');
  const redistributionPolicyPath = path.join(root, 'prompt-library/publication/redistribution-evidence-policy.json');
  const sanitizationManifestPath = path.join(root, 'prompt-library/indexes/public-sanitization-manifest.json');
  const licenseNoticeManifestPath = path.join(root, 'prompt-library/indexes/public-license-notice-manifest.json');
  const required = [
    '00_OPEN_PROMPT_LIBRARY.cmd', 'README.md', 'LICENSE_SCOPE.md', 'THIRD_PARTY_NOTICES.md', 'PRIVACY_AND_PUBLICATION.md', 'SECURITY.md',
    'LICENSES/MIT.txt', 'LICENSES/APACHE-2.0.txt', 'LICENSES/CC-BY-4.0.txt', 'LICENSES/PYTHON-PPTX-MIT.txt',
    'LICENSES/PROMPTS-CHAT-CC0-1.0.txt', 'LICENSES/PROMPTS-CHAT-MIT.txt',
    'PUBLIC_BUILD_MANIFEST.json', 'VALIDATION_SUMMARY.md', 'package.json', '.gitattributes',
    'prompt-library/visual-catalog/index.html', 'prompt-library/visual-catalog/download-runtime.js',
    'prompt-library/visual-catalog/localization-zh-TW.js', 'prompt-library/visual-catalog/technical-marker-registry.js',
    'prompt-library/indexes/unified-index-v2.json', 'prompt-library/indexes/download-manifest.json',
    'prompt-library/indexes/localization-coverage-report.json',
    'prompt-library/indexes/PUBLIC_PROVENANCE_MANIFEST.json', 'prompt-library/references/source-registry.public.json',
    'prompt-library/publication/public-source-allowlist.json', 'prompt-library/publication/technical-marker-registry.json',
    'prompt-library/publication/redistribution-evidence-policy.json', 'prompt-library/indexes/public-sanitization-manifest.json',
    'prompt-library/indexes/public-license-notice-manifest.json',
    'prompt-library/scripts/Audit_Final_Category_Content.js', 'prompt-library/scripts/Build_Visual_Catalog_Localization.js'
  ];
  for (const relative of required) if (!fs.existsSync(path.join(root, ...relative.split('/')))) failures.push(`missing-required-file:${relative}`);

  const safeReadJson = (filePath, fallback) => {
    try { return fs.existsSync(filePath) ? readJson(filePath) : fallback; }
    catch (_) { failures.push(`invalid-json:${slash(path.relative(root, filePath))}`); return fallback; }
  };
  const unified = safeReadJson(unifiedPath, { entries: [], source_commits: {} });
  const downloads = safeReadJson(downloadPath, { records: [] });
  const provenance = safeReadJson(provenancePath, { entry_records: [], package_records: [] });
  const localizationReport = safeReadJson(localizationReportPath, {});
  const technicalRegistry = safeReadJson(technicalRegistryPath, { records: [] });
  const registry = safeReadJson(registryPath, { sources: [] });
  const allowlist = safeReadJson(allowlistPath, { sources: [] });
  const publicManifest = safeReadJson(publicManifestPath, {});
  const redistributionPolicy = safeReadJson(redistributionPolicyPath, {});
  const sanitizationManifest = safeReadJson(sanitizationManifestPath, {});
  const licenseNoticeManifest = safeReadJson(licenseNoticeManifestPath, {});
  const entries = Array.isArray(unified.entries) ? unified.entries : [];
  const downloadRecords = Array.isArray(downloads.records) ? downloads.records : [];
  const allowedSourceIds = new Set((allowlist.sources || []).map((record) => record.id));
  const allowById = new Map((allowlist.sources || []).map((record) => [record.id, record]));
  const registeredSourceIds = new Set((registry.sources || []).map((record) => record.id));
  const entryProvenance = new Map((provenance.entry_records || []).map((record) => [record.id, record]));
  const packageProvenance = new Map((provenance.package_records || []).map((record) => [record.id, record]));
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const technicalMarkerById = new Map((technicalRegistry.records || []).map((record) => [record.id, record]));
  const recordById = new Map(downloadRecords.map((record) => [record.record_id, record]));
  const declaredDownloadPaths = new Set(downloadRecords.map((record) => `prompt-library/${slash(record.artifact_path)}`));
  const expectedPromptCount = entries.filter((entry) => entry.has_prompt_copy === true).length;
  const expectedLiveCount = entries.filter((entry) => entry.content_type === 'live-ui').length;

  const metrics = {
    PUBLIC_LIBRARY_ENTRY_COUNT: entries.length,
    PUBLIC_COMPLETE_ENTRY_COUNT: entries.filter((entry) => entry.publication_completeness === 'COMPLETE_USABLE').length,
    PUBLIC_REFERENCE_ENTRY_COUNT: entries.filter((entry) => entry.publication_completeness !== 'COMPLETE_USABLE').length,
    PUBLIC_SOURCE_COUNT: new Set(entries.map((entry) => entry.source_id)).size,
    PUBLIC_PROMPT_CONTENT_COUNT: entries.filter((entry) => entry.has_prompt_copy === true).length,
    PUBLIC_PROMPT_ENTRY_COUNT: entries.filter((entry) => entry.has_prompt_copy === true).length,
    PUBLIC_PROMPT_BODY_PRESENT_COUNT: 0, PUBLIC_PROMPT_COPY_READY_COUNT: 0,
    PUBLIC_PROMPT_DOWNLOAD_READY_COUNT: 0, PUBLIC_PROMPT_EMPTY_BODY_COUNT: 0,
    PUBLIC_PROMPT_METADATA_MASQUERADING_AS_COMPLETE_COUNT: 0,
    VISIBLE_LICENSE_UNVERIFIED_COMPLETE_ENTRY_COUNT: 0, FULL_TEXT_AVAILABLE_LABEL_MISMATCH_COUNT: 0,
    PROMPT_BODY_FALLBACK_COUNT: 0, SAFE_REWRITE_MASQUERADING_AS_ORIGINAL_COUNT: 0,
    COPY_READY_FALSE_CLAIM_COUNT: 0, DOWNLOAD_READY_FALSE_CLAIM_COUNT: 0,
    PUBLIC_UNLICENSED_COMPLETE_ENTRY_COUNT: 0, PUBLIC_RECONSTRUCTION_GUIDE_COUNT: 0,
    TECHNICAL_MARKER_UNCLASSIFIED_COUNT: 0, TECHNICAL_MARKER_RUNTIME_MISMATCH_COUNT: 0,
    TECHNICAL_MARKER_MISSING_BILINGUAL_DESCRIPTION_COUNT: 0, PUBLIC_EXCLUDED_MARKER_ENTRY_COUNT: 0,
    PUBLIC_USABLE_ENTRY_TOTAL: 0, PUBLIC_STUB_ENTRY_COUNT: 0, PUBLIC_ORPHAN_ENTRY_COUNT: 0,
    PUBLIC_ENTRY_WITH_NO_PRIMARY_USE_COUNT: 0, PUBLIC_ENTRY_WITH_FAKE_PREVIEW_COUNT: 0,
    PUBLIC_ENTRY_WITH_FAKE_DOWNLOAD_COUNT: 0, VISIBLE_EMPTY_CATEGORY_COUNT: 0,
    WRONG_CATEGORY_BINDING_COUNT: 0, VISIBLE_ACTION_WITHOUT_CAPABILITY_COUNT: 0,
    EMPTY_PREVIEW_PANEL_COUNT: 0, REFERENCE_ONLY_IN_COMPLETE_LIBRARY_COUNT: 0,
    RELATED_TO_UNUSABLE_ENTRY_COUNT: 0, PUBLIC_SEARCHABLE_COMPLETE_ENTRY_COUNT: 0,
    PUBLIC_SEARCH_FALSE_NEGATIVE_COUNT: 0, PUBLIC_SEARCH_WRONG_CATEGORY_COUNT: 0,
    PUBLIC_SEARCH_PRIVATE_RESULT_COUNT: 0, PUBLIC_INVISIBLE_COMPLETE_ENTRY_COUNT: 0,
    PUBLIC_DEFAULT_DISCOVERY_MISSING_COUNT: 0,
    PUBLIC_METADATA_STUB_COUNT: 0, PUBLIC_PROMPT_BODY_MISSING_COUNT: 0,
    PUBLIC_TITLE_SEARCH_MISSING_COUNT: 0, PUBLIC_BODY_SEARCH_MISSING_COUNT: 0,
    PUBLIC_COMPLETE_ACTION_MISSING_COUNT: 0, PUBLIC_SOURCE_PARITY_GAP_COUNT: 0,
    CINEMATIC_WEB_ENTRY_COUNT: entries.filter((entry) => entry.source_id === 'local-original-cinematic-web').length,
    PUBLIC_DOWNLOAD_ARTIFACT_COUNT: downloadRecords.length,
    PUBLIC_DOWNLOAD_BUTTON_TOTAL: downloadRecords.length,
    PUBLIC_DOWNLOAD_ARTIFACT_BOUND_COUNT: downloadRecords.length,
    PUBLIC_PRIVATE_ENTRY_COUNT: 0, PUBLIC_PRIVATE_ARCHIVE_COUNT: 0, PUBLIC_PRIVATE_ARTIFACT_COUNT: 0,
    PUBLIC_PRIVATE_ROUTE_COUNT: 0, PUBLIC_PRIVATE_FINGERPRINT_COUNT: 0,
    PUBLIC_INTERNAL_SOURCE_HASH_COUNT: 0, PUBLIC_INTERNAL_PRIVATE_COUNT_DISCLOSURE: 0,
    PUBLIC_ABSOLUTE_LOCAL_PATH_COUNT: 0, PUBLIC_PERSONAL_EMAIL_COUNT: 0, PUBLIC_REAL_NAME_COUNT: 0,
    PUBLIC_PHONE_COUNT: 0, PUBLIC_ADDRESS_COUNT: 0, PUBLIC_SECRET_FINDING_COUNT: 0,
    PUBLIC_BINARY_PERSONAL_METADATA_COUNT: 0, PUBLIC_UNREGISTERED_SOURCE_COUNT: 0,
    PUBLIC_BLOCKED_SOURCE_REFERENCE_COUNT: 0, PUBLIC_LEGACY_LOCALIZATION_RECORD_COUNT: 0, PUBLIC_SPLIT_BRAIN_COUNT: 0,
    PUBLIC_UNRESOLVED_LOCALIZATION_COUNT: 0, PUBLIC_PENDING_REVIEW_LABEL_COUNT: 0,
    PUBLIC_AMBIGUOUS_STATUS_LABEL_COUNT: 0, PUBLIC_AUTHOR_INVENTED_COUNT: 0,
    PUBLIC_AMBIGUOUS_AUTHOR_LABEL_COUNT: 0, PUBLIC_LIVE_UI_RUNTIME_COUNT: 0,
    PUBLIC_UNLICENSED_ENTRY_COUNT: 0, PUBLIC_UNKNOWN_LICENSE_FILE_COUNT: 0, PUBLIC_MISSING_PROVENANCE_COUNT: 0,
    PUBLIC_LICENSE_SCOPE_CONFLICT_COUNT: 0, PUBLIC_REQUIRED_ATTRIBUTION_MISSING_COUNT: 0,
    PUBLIC_MISLABELED_GSAP_LICENSE_COUNT: 0, PUBLIC_UNEXPLAINED_TRADEMARK_ASSET_COUNT: 0,
    PUBLIC_BROKEN_DOWNLOAD_COUNT: 0, PUBLIC_DOWNLOAD_PREVIEW_COLLISION_COUNT: 0,
    PUBLIC_ZERO_BYTE_ARTIFACT_COUNT: 0, PUBLIC_WRONG_ENTRY_BINDING_COUNT: 0,
    PUBLIC_ZIP_PERMISSION_000_COUNT: 0, PUBLIC_ZIP_TRAVERSAL_COUNT: 0,
    PUBLIC_ZIP_SYMLINK_COUNT: 0, PUBLIC_ZIP_MISSING_LICENSE_COUNT: 0, PUBLIC_ZIP_HASH_MISMATCH_COUNT: 0,
    DOWNLOAD_PACKAGE_MISSING_USAGE_DOCUMENTATION_COUNT: 0,
    PUBLIC_NETWORK_REQUEST_COUNT: 0, PUBLIC_RUNTIME_REMOTE_ASSET_COUNT: 0, PUBLIC_PREVIEW_REMOTE_REQUEST_COUNT: 0,
    AUTO_DEPLOY_TRIGGER_COUNT: 0, UNCONFIRMED_EXTERNAL_MUTATION_COUNT: 0, REDUCED_MOTION_FAILURE_COUNT: 0,
    PUBLIC_FILE_OVER_50_MIB_COUNT: 0, PUBLIC_FILE_OVER_100_MIB_COUNT: 0, PUBLIC_NESTED_REPOSITORY_COUNT: 0,
    PUBLIC_STALE_EVIDENCE_COUNT: 0, PUBLIC_UNBOUND_EVIDENCE_COUNT: 0, PUBLIC_TREE_HASH_MISMATCH_COUNT: 0,
    PUBLIC_SOURCE_PROOF_INTEGRITY_FAILURE_COUNT: 0, PUBLIC_SOURCE_PROOF_VERIFIED_RECORD_COUNT: 0,
    PUBLIC_SOURCE_PROOF_VERIFIED_BODY_COUNT: 0,
    PUBLIC_GIT_BYTE_CONTRACT_FAILURE_COUNT: 0, PUBLIC_IGNORED_CONTENT_DIRECTORY_COUNT: 0,
    PUBLIC_USER_HOME_PATH_COUNT: 0, PUBLIC_LOCAL_PROJECT_PATH_COUNT: 0,
    PUBLIC_ARCHIVE_ABSOLUTE_LOCAL_PATH_COUNT: 0, PUBLIC_ARCHIVE_XML_ABSOLUTE_LOCAL_PATH_COUNT: 0,
    PUBLIC_ARCHIVE_PATH_SCAN_FAILURE_COUNT: 0,
    PUBLIC_REDISTRIBUTION_POLICY_FAILURE_COUNT: 0, PUBLIC_SANITIZATION_EVIDENCE_FAILURE_COUNT: 0,
    PUBLIC_LICENSE_NOTICE_OBLIGATION_FAILURE_COUNT: 0,
    PUBLIC_EXCLUDED_RIGHTS_ENTRY_COUNT: 0, PUBLIC_EXCLUDED_RIGHTS_ASSET_COUNT: 0,
    PUBLIC_PPTX_WITH_UNRESOLVED_MEDIA_RIGHTS_COUNT: 0, PUBLIC_UNRESOLVED_EMBEDDED_MEDIA_COUNT: 0,
    PUBLIC_ENTRY_WITH_INSUFFICIENT_FORMAL_LICENSE_EVIDENCE_COUNT: 0,
    PUBLIC_ARTIFACT_WITHOUT_REDISTRIBUTABLE_ARTIFACT_COUNT: 0,
    PUBLIC_CATEGORY_CONTENT_CONTRACT_FAILURE_COUNT: 0, GENERIC_OR_NON_ACTIONABLE_DESCRIPTION_COUNT: 0,
    TITLE_TYPE_CONFLICT_COUNT: 0, BLANK_REQUIRED_FIELD_COUNT: 0,
    VISIBLE_DISABLED_ACTION_COUNT: 0, UPSTREAM_ACTION_TO_LIBRARY_HOME_COUNT: 0,
    PUBLIC_GENERATED_SIMPLIFIED_CHINESE_RESIDUAL_COUNT: 0
  };

  const redistribution = validateRedistributionPolicy(redistributionPolicy, entries, inventory.files);
  metrics.PUBLIC_IGNORED_CONTENT_DIRECTORY_COUNT = inventory.ignored.filter((relative) => relative !== '.git').length;
  metrics.PUBLIC_REDISTRIBUTION_POLICY_FAILURE_COUNT = redistribution.errors.length;
  metrics.PUBLIC_EXCLUDED_RIGHTS_ENTRY_COUNT = redistribution.excluded_entry_count;
  metrics.PUBLIC_EXCLUDED_RIGHTS_ASSET_COUNT = redistribution.excluded_asset_count;
  metrics.PUBLIC_ENTRY_WITH_INSUFFICIENT_FORMAL_LICENSE_EVIDENCE_COUNT = redistribution.excluded_source_count;
  metrics.PUBLIC_UNRESOLVED_EMBEDDED_MEDIA_COUNT = redistribution.excluded_media_count;
  for (const reason of redistribution.errors) failures.push(`redistribution-policy:${reason}`);
  const attributeFiles = inventory.files.filter((file) => path.posix.basename(file.relative) === '.gitattributes');
  if (attributeFiles.length !== 1 || attributeFiles[0]?.relative !== '.gitattributes'
    || !validateByteSafeAttributes(fs.readFileSync(attributeFiles[0].absolute, 'utf8')).valid) metrics.PUBLIC_GIT_BYTE_CONTRACT_FAILURE_COUNT++;

  let proofMetadata = new Map();
  try {
    const authorship = readJson(path.join(root, 'prompt-library/indexes/source-authorship-manifest.json'));
    const proofScript = fs.readFileSync(path.join(visualRoot, 'source-proof-manifest.js'), 'utf8');
    const assignment = /^\/\* SPDX-License-Identifier: MIT \*\/\nwindow\.SOURCE_PROOF_MANIFEST = ([\s\S]*);\n$/u.exec(proofScript);
    if (!assignment) throw new Error('Invalid proof manifest data script.');
    const manifest = JSON.parse(assignment[1]);
    const direct = loadAssignment(path.join(visualRoot, 'direct-use-prompt-data.js'), 'DIRECT_USE_PROMPT_DATA');
    const files = inventory.files.filter((file) => file.relative.startsWith('prompt-library/visual-catalog/source-proof-data/'))
      .map((file) => ({ path: file.relative.slice('prompt-library/visual-catalog/'.length), bytes: fs.readFileSync(file.absolute) }));
    const validated = validateSourceProofBuckets({ manifest, authorship, unified, promptBodies: direct.entries, files });
    proofMetadata = new Map([...validated.metadata].map(([name, text]) => [`prompt-library/visual-catalog/${name}`, text]));
    metrics.PUBLIC_SOURCE_PROOF_VERIFIED_RECORD_COUNT = validated.record_count;
    metrics.PUBLIC_SOURCE_PROOF_VERIFIED_BODY_COUNT = validated.body_count;
  } catch (error) {
    metrics.PUBLIC_SOURCE_PROOF_INTEGRITY_FAILURE_COUNT++;
    failures.push(`PUBLIC_SOURCE_PROOF_VALIDATION_FAILED:${sha256(String(error.message || error))}`);
  }

  const username = String(process.env.USERNAME || '').trim();
  const knownContentTypes = new Set(['prompt', 'live-ui', 'artifact-example', 'workflow', 'skill', 'design-system', 'theme', 'template']);
  const usableEntryIds = new Set();
  const searchFailureIds = new Set();
  const categoryCounts = new Map();
  const textExtensions = PUBLIC_TEXT_EXTENSIONS;
  const archiveExtensions = new Set(['.zip', '.7z', '.rar', '.tar', '.gz', '.tgz']);
  const markerRequiredFields = [
    'id', 'stable_id', 'name_zh_tw', 'name_en', 'classification', 'scope',
    'library_behavior_zh_tw', 'library_behavior_en', 'downloaded_source_limit_zh_tw', 'downloaded_source_limit_en'
  ];
  for (const marker of technicalRegistry.records || []) {
    const missingCore = markerRequiredFields.some((field) => !String(marker?.[field] ?? '').trim());
    const missingRequirements = !marker?.requirements?.library || !marker?.requirements?.downloaded_source;
    const missingEvidence = !Array.isArray(marker?.evidence) || marker.evidence.length === 0;
    if (missingCore || missingRequirements || missingEvidence || marker.verified_usage_note !== true) {
      metrics.TECHNICAL_MARKER_MISSING_BILINGUAL_DESCRIPTION_COUNT += 1;
    }
  }
  for (const file of inventory.files) {
    const fileProfileStarted = process.env.PUBLIC_AUDIT_PROFILE === '1' ? Date.now() : 0;
    if (fileProfileStarted && file.bytes > 1024 * 1024) process.stderr.write(`[public-audit-file-start] ${file.relative} bytes=${file.bytes}\n`);
    if (file.bytes > 50 * 1024 * 1024) metrics.PUBLIC_FILE_OVER_50_MIB_COUNT += 1;
    if (file.bytes >= 100 * 1024 * 1024) metrics.PUBLIC_FILE_OVER_100_MIB_COUNT += 1;
    const extension = path.extname(file.relative).toLowerCase();
    if (archiveExtensions.has(extension) && !declaredDownloadPaths.has(file.relative)) metrics.PUBLIC_PRIVATE_ARCHIVE_COUNT += 1;
    if (['.zip', '.pptx', '.docx', '.xlsx'].includes(extension)) {
      try {
        const archiveScan = scanPublicArchive(fs.readFileSync(file.absolute), file.relative, redistributionPolicy);
        metrics.PUBLIC_ABSOLUTE_LOCAL_PATH_COUNT += archiveScan.absolute_paths;
        metrics.PUBLIC_USER_HOME_PATH_COUNT += archiveScan.user_home_paths;
        metrics.PUBLIC_LOCAL_PROJECT_PATH_COUNT += archiveScan.project_paths;
        metrics.PUBLIC_ARCHIVE_ABSOLUTE_LOCAL_PATH_COUNT += archiveScan.absolute_paths;
        metrics.PUBLIC_ARCHIVE_XML_ABSOLUTE_LOCAL_PATH_COUNT += archiveScan.xml_paths;
        metrics.PUBLIC_UNRESOLVED_EMBEDDED_MEDIA_COUNT += archiveScan.excluded_media;
        metrics.PUBLIC_EXCLUDED_RIGHTS_ASSET_COUNT += archiveScan.excluded_assets;
        metrics.PUBLIC_PPTX_WITH_UNRESOLVED_MEDIA_RIGHTS_COUNT += archiveScan.unlicensed_pptx;
      } catch (_) { metrics.PUBLIC_ARCHIVE_PATH_SCAN_FAILURE_COUNT++; }
    }
    if (textExtensions.has(extension)) {
      // Scan original bytes before proof-body projection, vendor exceptions or
      // the older metadata scan's size threshold; XML and UTF-16 are included.
      const paths = scanPublicTextPaths(decodePublicText(fs.readFileSync(file.absolute)), extension).matches;
      metrics.PUBLIC_ABSOLUTE_LOCAL_PATH_COUNT += paths.length;
      metrics.PUBLIC_USER_HOME_PATH_COUNT += paths.filter((item) => item.kind === 'USER_HOME').length;
      metrics.PUBLIC_LOCAL_PROJECT_PATH_COUNT += paths.filter((item) => item.kind === 'PROJECT_PATH').length;
    }
    if (!textExtensions.has(extension) || file.bytes > 16 * 1024 * 1024) continue;
    const text = proofMetadata.get(file.relative) ?? readText(file.absolute);
    const isVerifier = file.relative === 'prompt-library/scripts/Verify_Public_Repository.js';
    const isLegal = /(?:^|\/)(?:LICENSES|THIRD_PARTY_NOTICES\.md)(?:\/|$)/u.test(file.relative);
    const isVendoredPublicContent = /(?:^|\/)(?:references\/community|direct-use-assets|generated-artifacts|unified-previews|download-payload-shards|catalog-data\.js|catalog-prompts\.js|direct-use-prompt-data\.js|kinetics-effect-data\.js)(?:\/|$)/u.test(file.relative)
      || /^prompt-library\/visual-catalog\/live-ui(?:\/|-data\.js$|-code\.js$)/u.test(file.relative);
    const scanInto = (metric, patterns) => {
      const started = process.env.PUBLIC_AUDIT_PROFILE === '1' ? Date.now() : 0;
      const matches = countMatches(text, patterns);
      metrics[metric] += matches;
      if (started && (matches > 0 || Date.now() - started > 100)) process.stderr.write(`[public-audit-pattern] ${file.relative} ${metric} matches=${matches} ms=${Date.now() - started}\n`);
    };
    if (!isVerifier && !isVendoredPublicContent) {
      scanInto('PUBLIC_PRIVATE_FINGERPRINT_COUNT', [/(?:references[\\/]user-provided|source_id["']?\s*:\s*["']user-provided|zip-[0-9a-f]{8,}|local-personal-use-only)/giu]);
      scanInto('PUBLIC_INTERNAL_SOURCE_HASH_COUNT', [/source_unified_(?:content_)?hash/giu, /local_unified_(?:content_)?hash/giu]);
      scanInto('PUBLIC_INTERNAL_PRIVATE_COUNT_DISCLOSURE', [/excluded_private_count/giu, /local_private_(?:count|excluded_count)/giu, /private_exclusion_count/giu]);
      scanInto('PUBLIC_SECRET_FINDING_COUNT', [
        /\b(?:sk|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{20,}\b/gu,
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu,
        /\bBearer\s+[A-Za-z0-9._~-]{32,}/giu
      ]);
      if (!isLegal) {
        scanInto('PUBLIC_PERSONAL_EMAIL_COUNT', [/[A-Z0-9._%+-]+@(?!users\.noreply\.github\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}/giu]);
        if (username.length >= 4) scanInto('PUBLIC_REAL_NAME_COUNT', [new RegExp(`\\b${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'giu')]);
        scanInto('PUBLIC_PHONE_COUNT', [/(?<![A-Za-z0-9])(?:\+886[-\s]?9\d{2}[-\s]?\d{3}[-\s]?\d{3}|09\d{2}[-\s]\d{3}[-\s]\d{3})(?!\d)/gu]);
        // Physical-address detector: require title-cased address tokens. This
        // keeps ordinary values such as "123 Main Street" covered without
        // treating lower-cased search terms (model version 2 ... street,
        // 16:9 horizontal street, game-ui ... street) as personal addresses.
        scanInto('PUBLIC_ADDRESS_COUNT', [/\b\d{1,5}\s+(?:[A-Z0-9][A-Za-z0-9.'-]*\s+){1,5}(?:Street|St\.|Road|Rd\.|Avenue|Ave\.|Boulevard|Blvd\.)\b/gu]);
      }
    } else if (!isVerifier) {
      // These files are byte-for-byte, allowlisted public upstream/source artifacts.
      // Their source/route/license/hash bindings are validated below. Keep a cheap,
      // deterministic guard for project-private markers without applying expensive
      // free-form regexes to minified/base64 payloads.
      const lower = text.toLowerCase();
      if (lower.includes('references/user-provided') || lower.includes('references\\user-provided')
        || lower.includes('local-personal-use-only') || lower.includes('"source_id":"user-provided"')
        || lower.includes("'source_id':'user-provided'")) metrics.PUBLIC_PRIVATE_FINGERPRINT_COUNT += 1;
      if (lower.includes('source_unified_hash') || lower.includes('source_unified_content_hash')
        || lower.includes('local_unified_hash') || lower.includes('local_unified_content_hash')) metrics.PUBLIC_INTERNAL_SOURCE_HASH_COUNT += 1;
      if (lower.includes('excluded_private_count') || lower.includes('local_private_count')
        || lower.includes('local_private_excluded_count') || lower.includes('private_exclusion_count')) metrics.PUBLIC_INTERNAL_PRIVATE_COUNT_DISCLOSURE += 1;
    }
    const isRuntime = file.relative.startsWith('prompt-library/visual-catalog/');
    const runtimeCoreScript = /(?:^|\/)(?:app|catalog-core|download-runtime|live-ui-core|unified-app-v2|unified-search-core-v2)\.js$/u.test(file.relative);
    if (isRuntime && !isVendoredPublicContent && ['.html', '.css'].includes(extension)) {
      const remoteAssets = countMatches(text, [/<(?:script|img|iframe|source|video|audio|link)\b[^>]*(?:src|href)\s*=\s*["']https?:\/\//giu, /(?:url\(|@import\s+)["']?https?:\/\//giu]);
      metrics.PUBLIC_NETWORK_REQUEST_COUNT += remoteAssets;
      metrics.PUBLIC_RUNTIME_REMOTE_ASSET_COUNT += remoteAssets;
    }
    if (isRuntime && !isVendoredPublicContent && (extension === '.html' || runtimeCoreScript)) {
      const remoteRequests = countMatches(text, [/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/gu]);
      metrics.PUBLIC_NETWORK_REQUEST_COUNT += remoteRequests;
      metrics.PUBLIC_PREVIEW_REMOTE_REQUEST_COUNT += remoteRequests;
    }
    if (fileProfileStarted && Date.now() - fileProfileStarted > 100) {
      process.stderr.write(`[public-audit-file] ${file.relative} bytes=${file.bytes} ms=${Date.now() - fileProfileStarted}\n`);
    }
  }
  profile('text-and-file-scan');

  metrics.PUBLIC_NESTED_REPOSITORY_COUNT = inventory.directories.filter((directory) => /(?:^|\/)\.git$/u.test(directory)).length;
  if (inventory.links.length) failures.push(`PUBLIC_SYMLINK_COUNT=${inventory.links.length}`);
  const rootLicenseNames = inventory.files.filter((file) => /^LICENSES\/[^/]+$/u.test(file.relative)).map((file) => path.basename(file.relative));
  const knownRootLicenses = new Set(['MIT.txt', 'APACHE-2.0.txt', 'CC-BY-4.0.txt', 'PYTHON-PPTX-MIT.txt', 'PROMPTS-CHAT-CC0-1.0.txt', 'PROMPTS-CHAT-MIT.txt']);
  metrics.PUBLIC_UNKNOWN_LICENSE_FILE_COUNT = rootLicenseNames.filter((name) => !knownRootLicenses.has(name)).length;

  for (const entry of entries) {
    if (entry.index_enabled === false || entry.selection_eligible === false) metrics.PUBLIC_INVISIBLE_COMPLETE_ENTRY_COUNT += 1;
    categoryCounts.set(entry.content_type, (categoryCounts.get(entry.content_type) || 0) + 1);
    if (!knownContentTypes.has(entry.content_type)) metrics.WRONG_CATEGORY_BINDING_COUNT += 1;
    if (entry.publication_completeness !== 'COMPLETE_USABLE') metrics.REFERENCE_ONLY_IN_COMPLETE_LIBRARY_COUNT += 1;
    if (entry.content_type === 'prompt' && entry.has_prompt_copy !== true) metrics.PUBLIC_PROMPT_METADATA_MASQUERADING_AS_COMPLETE_COUNT += 1;
    if (/(?:user-provided-zip-b39aa22f|local-personal-use-only|references[\\/]user-provided)/iu.test(String(entry.search_text || ''))) {
      metrics.PUBLIC_SEARCH_PRIVATE_RESULT_COUNT += 1;
    }
    const identity = `${entry.source_id || ''} ${entry.source_name || ''} ${entry.license_status || ''}`;
    if (/(?:private|personal|user-provided)/iu.test(identity)) metrics.PUBLIC_PRIVATE_ENTRY_COUNT += 1;
    const sourceRecord = allowById.get(entry.source_id);
    if (!sourceRecord || !allowedSourceIds.has(entry.source_id) || !registeredSourceIds.has(entry.source_id)) metrics.PUBLIC_UNREGISTERED_SOURCE_COUNT += 1;
    if (!sourceRecord || (sourceRecord.excluded_entry_licenses || []).includes(entry.license)) metrics.PUBLIC_BLOCKED_SOURCE_REFERENCE_COUNT += 1;
    if (!entry.license || !/^verified(?:$|[-_])/iu.test(String(entry.license_status || ''))) {
      metrics.PUBLIC_UNLICENSED_ENTRY_COUNT += 1;
      if (entry.publication_completeness === 'COMPLETE_USABLE') metrics.PUBLIC_UNLICENSED_COMPLETE_ENTRY_COUNT += 1;
    }
    const markers = Array.isArray(entry.technical_markers) ? entry.technical_markers : [];
    if ((entry.risk_flags || []).some((flag) => !technicalMarkerById.has(flag)
      || !markers.some((marker) => marker?.key === flag && ['INFO', 'LIMITATION', 'BLOCKED', 'FIXED', 'EXCLUDED'].includes(marker.classification)))) {
      metrics.TECHNICAL_MARKER_UNCLASSIFIED_COUNT += 1;
    }
    for (const marker of markers) {
      const registered = technicalMarkerById.get(marker?.key);
      if (!registered || marker.classification !== registered.classification || marker.scope !== registered.scope
        || (marker.name_zh_tw && marker.name_zh_tw !== registered.name_zh_tw)
        || (marker.name_en && marker.name_en !== registered.name_en)
        || (marker.remediation_zh_tw && marker.remediation_zh_tw !== registered.library_behavior_zh_tw)
        || (marker.remediation_en && marker.remediation_en !== registered.library_behavior_en)
        || marker.verified_usage_note !== true) {
        metrics.TECHNICAL_MARKER_RUNTIME_MISMATCH_COUNT += 1;
      }
      if (marker.verified_usage_note !== true || !registered?.name_zh_tw || !registered?.name_en) metrics.PUBLIC_AMBIGUOUS_STATUS_LABEL_COUNT += 1;
    }
    if (markers.some((marker) => marker?.classification === 'EXCLUDED')) metrics.PUBLIC_EXCLUDED_MARKER_ENTRY_COUNT += 1;
    if (entry.publication_classification === 'RECONSTRUCTION_GUIDE') metrics.PUBLIC_RECONSTRUCTION_GUIDE_COUNT += 1;
    const provenanceRecord = entryProvenance.get(entry.id);
    if (!provenanceRecord || !String(provenanceRecord.publication_decision || '').startsWith('INCLUDE')) metrics.PUBLIC_MISSING_PROVENANCE_COUNT += 1;
    if (!entry.name_rights_decision || !entry.name_rights_basis) metrics.PUBLIC_UNEXPLAINED_TRADEMARK_ASSET_COUNT += 1;
    if (entry.source_id === 'prompts-chat' && !/CC0-1\.0/iu.test(entry.license)) metrics.PUBLIC_LICENSE_SCOPE_CONFLICT_COUNT += 1;
    if (entry.source_id === 'local-original-cinematic-web' && (!/MIT/u.test(entry.license) || !/CC-BY-4\.0/u.test(entry.license))) metrics.PUBLIC_LICENSE_SCOPE_CONFLICT_COUNT += 1;
    if (sourceRecord && !(sourceRecord.license_ids || []).some((licenseId) => String(entry.license || '').toLowerCase().includes(String(licenseId).toLowerCase()))) {
      metrics.PUBLIC_LICENSE_SCOPE_CONFLICT_COUNT += 1;
    }
    const paths = [entry.relative_path, entry.example_path, entry.local_artifact_path, ...(entry.direct_use_assets || []).map((asset) => asset.path)].join(' ');
    if (/(?:personal|source-archives|user-provided|zip-[0-9a-f]{8,})/iu.test(paths)) metrics.PUBLIC_PRIVATE_ROUTE_COUNT += 1;
    const assets = entry.direct_use_assets || [];
    let usableAction = false;
    let fakeDownload = false;
    for (const asset of assets) {
      const target = routeFile(root, visualRoot, asset.path);
      if (target === '__ESCAPED__' || (target && !fs.existsSync(target))) metrics.PUBLIC_BROKEN_DOWNLOAD_COUNT += 1;
      if (target && target !== '__ESCAPED__' && fs.existsSync(target) && (asset.download || asset.can_copy_text || asset.type === 'local-source')) usableAction = true;
      if (asset.download) {
        const record = recordById.get(asset.download_record_id);
        if (!record || record.entry_id !== entry.id || record.ui_relative_path !== asset.path || record.sha256 !== asset.sha256 || record.filename !== asset.download_filename || record.delivery_mode !== asset.delivery_mode) {
          metrics.PUBLIC_WRONG_ENTRY_BINDING_COUNT += 1;
          fakeDownload = true;
        }
        if (!target || target === '__ESCAPED__' || !fs.existsSync(target) || !fs.statSync(target).isFile() || fs.statSync(target).size === 0) fakeDownload = true;
      }
    }
    const previewTarget = routeFile(root, visualRoot, entry.example_path);
    if (previewTarget === '__ESCAPED__' || (previewTarget && !fs.existsSync(previewTarget))) metrics.PUBLIC_BROKEN_DOWNLOAD_COUNT += 1;
    const usablePreview = previewTarget && previewTarget !== '__ESCAPED__' && fs.existsSync(previewTarget)
      && !['metadata-only', 'none'].includes(String(entry.preview_type || ''));
    const claimsPreview = Boolean(entry.example_path) && !['metadata-only', 'none'].includes(String(entry.preview_type || ''));
    if (claimsPreview && (!usablePreview || !fs.statSync(previewTarget).isFile() || fs.statSync(previewTarget).size === 0)) {
      metrics.PUBLIC_ENTRY_WITH_FAKE_PREVIEW_COUNT += 1;
      metrics.EMPTY_PREVIEW_PANEL_COUNT += 1;
    }
    if (fakeDownload) metrics.PUBLIC_ENTRY_WITH_FAKE_DOWNLOAD_COUNT += 1;
    const capabilityBindings = [
      [entry.has_prompt_copy === true, assets.some((asset) => asset.type === 'prompt-file' && asset.can_copy_text === true && asset.download === true)],
      [entry.has_code_download === true, assets.some((asset) => asset.type === 'source-code' && asset.download === true)],
      [entry.has_workflow_download === true, assets.some((asset) => asset.type === 'workflow-json' && asset.download === true)],
      [entry.has_ppt_download === true, assets.some((asset) => ['pptx', 'ppt-template-landscape', 'ppt-template-portrait'].includes(asset.type) && asset.download === true)],
      [entry.has_local_source_open === true, assets.some((asset) => asset.type === 'local-source')]
    ];
    metrics.VISIBLE_ACTION_WITHOUT_CAPABILITY_COUNT += capabilityBindings.filter(([claimed, bound]) => claimed && !bound).length;
    if (entry.direct_use_eligible === true && assets.length === 0) metrics.VISIBLE_ACTION_WITHOUT_CAPABILITY_COUNT += 1;
    if (!usableAction && !usablePreview) metrics.PUBLIC_COMPLETE_ACTION_MISSING_COUNT += 1;
    if (String(entry.preview_type || '') === 'metadata-only' && !usableAction) metrics.PUBLIC_METADATA_STUB_COUNT += 1;
    if (usableAction || usablePreview) usableEntryIds.add(entry.id);
    else {
      metrics.PUBLIC_STUB_ENTRY_COUNT += 1;
      metrics.PUBLIC_ORPHAN_ENTRY_COUNT += 1;
      metrics.PUBLIC_ENTRY_WITH_NO_PRIMARY_USE_COUNT += 1;
    }
    const normalizedTitle = String(entry.title || '').normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/\s+/g, ' ').trim();
    if (normalizedTitle && !String(entry.search_text || '').includes(normalizedTitle)) {
      metrics.PUBLIC_TITLE_SEARCH_MISSING_COUNT += 1;
      searchFailureIds.add(entry.id);
    }
    if (!String(entry.search_text || '').includes(String(entry.content_type || '').toLowerCase())) {
      metrics.PUBLIC_SEARCH_WRONG_CATEGORY_COUNT += 1;
      searchFailureIds.add(entry.id);
    }
  }
  metrics.PUBLIC_USABLE_ENTRY_TOTAL = usableEntryIds.size;
  metrics.RELATED_TO_UNUSABLE_ENTRY_COUNT = entries.length - usableEntryIds.size;
  metrics.VISIBLE_EMPTY_CATEGORY_COUNT = [...categoryCounts.entries()].filter(([value, count]) => !value || count < 1).length;
  profile('entry-gates');

  const expectedDownloadCount = entries.reduce((total, entry) => total + (entry.direct_use_assets || []).filter((asset) => asset.download).length, 0);
  if (expectedDownloadCount !== downloadRecords.length) metrics.PUBLIC_WRONG_ENTRY_BINDING_COUNT += Math.abs(expectedDownloadCount - downloadRecords.length) || 1;
  for (const record of downloadRecords) {
    if (record.public_available !== true || /(?:personal|source-archives|user-provided|zip-[0-9a-f]{8,})/iu.test(`${record.artifact_path || ''} ${record.entry_id || ''}`)) metrics.PUBLIC_PRIVATE_ARTIFACT_COUNT += 1;
    const absolute = path.resolve(root, 'prompt-library', ...String(record.artifact_path || '').split('/'));
    const libraryRoot = path.resolve(root, 'prompt-library');
    if (!absolute.startsWith(`${libraryRoot}${path.sep}`) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
      metrics.PUBLIC_BROKEN_DOWNLOAD_COUNT += 1;
      continue;
    }
    const bytes = fs.readFileSync(absolute);
    if (bytes.length === 0) metrics.PUBLIC_ZERO_BYTE_ARTIFACT_COUNT += 1;
    if (bytes.length !== record.bytes || sha256(bytes) !== record.sha256 || path.extname(record.filename).toLowerCase() !== record.extension) metrics.PUBLIC_BROKEN_DOWNLOAD_COUNT += 1;
    if (record.preview_independent !== true || record.ui_relative_path === record.preview_path) metrics.PUBLIC_DOWNLOAD_PREVIEW_COLLISION_COUNT += 1;
    if (record.extension === '.zip') {
      if (!packageProvenance.has(record.record_id)) metrics.PUBLIC_MISSING_PROVENANCE_COUNT += 1;
      const zipResult = auditZip(bytes, record);
      metrics.PUBLIC_ZIP_PERMISSION_000_COUNT += zipResult.permission000;
      metrics.PUBLIC_ZIP_TRAVERSAL_COUNT += zipResult.traversal;
      metrics.PUBLIC_ZIP_SYMLINK_COUNT += zipResult.symlink;
      metrics.PUBLIC_ZERO_BYTE_ARTIFACT_COUNT += zipResult.zeroByte;
      metrics.PUBLIC_ZIP_MISSING_LICENSE_COUNT += zipResult.missingLicense;
      metrics.PUBLIC_ZIP_HASH_MISMATCH_COUNT += zipResult.hashMismatch;
      metrics.PUBLIC_BINARY_PERSONAL_METADATA_COUNT += zipResult.binaryMetadata;
      const boundEntry = entryById.get(record.entry_id);
      const packageNeedsInstall = (boundEntry?.risk_flags || []).some((flag) => ['package-install', 'package-source-requires-dependency-install'].includes(flag));
      if (packageNeedsInstall && ['source-package', 'artifact-package'].includes(record.package_kind)) {
        try {
          const zip = parseZipBuffer(bytes, record.filename);
          const names = new Set(zip.entries.map((entry) => entry.name));
          const requiredDocs = ['DOWNLOAD_README.md', 'DEPENDENCIES.md', 'LICENSE_SCOPE.md', 'THIRD_PARTY_NOTICES.md', 'ARTIFACT_MANIFEST.json'];
          const hasDependencyManifest = [...names].some((name) => /(?:^|\/)(?:package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|requirements(?:-[^/]+)?\.txt|pyproject\.toml|Cargo\.lock)$/iu.test(name));
          if (requiredDocs.some((name) => !names.has(name)) || !hasDependencyManifest) {
            metrics.DOWNLOAD_PACKAGE_MISSING_USAGE_DOCUMENTATION_COUNT += 1;
          }
        } catch (_) {
          metrics.DOWNLOAD_PACKAGE_MISSING_USAGE_DOCUMENTATION_COUNT += 1;
        }
      }
    }
  }
  profile('download-and-zip-gates');

  if (entries.length !== entryProvenance.size) metrics.PUBLIC_MISSING_PROVENANCE_COUNT += Math.abs(entries.length - entryProvenance.size);
  const expectedPackageCount = downloadRecords.filter((record) => record.extension === '.zip').length;
  if (expectedPackageCount !== packageProvenance.size) metrics.PUBLIC_MISSING_PROVENANCE_COUNT += Math.abs(expectedPackageCount - packageProvenance.size);
  if (allowlist.default_policy !== 'DENY' || registry.default_policy !== 'DENY') metrics.PUBLIC_UNREGISTERED_SOURCE_COUNT += 1;
  if (allowedSourceIds.size !== registeredSourceIds.size || [...allowedSourceIds].some((id) => !registeredSourceIds.has(id))) metrics.PUBLIC_UNREGISTERED_SOURCE_COUNT += 1;
  if (allowedSourceIds.size !== new Set(entries.map((entry) => entry.source_id)).size) metrics.PUBLIC_SOURCE_PARITY_GAP_COUNT += 1;
  for (const sourceRecord of allowlist.sources || []) {
    const sourceEntries = entries.filter((entry) => entry.source_id === sourceRecord.id);
    if (!sourceEntries.length) metrics.PUBLIC_SOURCE_PARITY_GAP_COUNT += 1;
    if (sourceRecord.fixed_commit && sourceEntries.some((entry) => entry.source_commit !== sourceRecord.fixed_commit)) metrics.PUBLIC_STALE_EVIDENCE_COUNT += 1;
    for (const licenseRelative of sourceRecord.license_files || []) {
      if (licenseRelative.includes('*')) continue;
      const publishedLicense = path.join(root, 'LICENSES', 'THIRD_PARTY', sourceRecord.id, path.basename(licenseRelative));
      if (!fs.existsSync(publishedLicense)) metrics.PUBLIC_REQUIRED_ATTRIBUTION_MISSING_COUNT += 1;
    }
  }

  const indexHtmlPath = path.join(visualRoot, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    const html = readText(indexHtmlPath);
    if (!/localization-zh-TW\.js/iu.test(html) || !fs.existsSync(path.join(visualRoot, 'localization-zh-TW.js'))) metrics.PUBLIC_LEGACY_LOCALIZATION_RECORD_COUNT += 1;
    if (!/technical-marker-registry\.js/iu.test(html) || !fs.existsSync(path.join(visualRoot, 'technical-marker-registry.js'))) metrics.PUBLIC_AMBIGUOUS_STATUS_LABEL_COUNT += 1;
    for (const route of [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/giu)].map((match) => match[1])) {
      const target = routeFile(root, visualRoot, route);
      if (target === '__ESCAPED__' || (target && !fs.existsSync(target))) metrics.PUBLIC_BROKEN_DOWNLOAD_COUNT += 1;
    }
  }
  try {
    const unifiedApp = readText(path.join(visualRoot, 'unified-app-v2.js'));
    if (!/if \(previewIsAvailable\(entry\)\) main\.append\(inlinePreviewHost\(entry\)\)/u.test(unifiedApp)
      || !/shell\.hidden = !previewIsAvailable\(entry\)/u.test(unifiedApp)) metrics.EMPTY_PREVIEW_PANEL_COUNT += 1;
    if (!/if \(previewIsAvailable\(entry\)\) actions\.append\(artifact\)/u.test(unifiedApp)) metrics.VISIBLE_ACTION_WITHOUT_CAPABILITY_COUNT += 1;
    if (!/facetRecords\('content_type'\)/u.test(unifiedApp)) metrics.VISIBLE_EMPTY_CATEGORY_COUNT += 1;
    const runtimeUnified = loadAssignment(path.join(visualRoot, 'unified-index-v2.js'), 'UNIFIED_INDEX_V2');
    const live = loadAssignment(path.join(visualRoot, 'live-ui-data.js'), 'LIVE_UI_CATALOG');
    const code = loadAssignment(path.join(visualRoot, 'live-ui-code.js'), 'LIVE_UI_CODE');
    const direct = loadAssignment(path.join(visualRoot, 'direct-use-prompt-data.js'), 'DIRECT_USE_PROMPT_DATA');
    const catalog = loadAssignment(path.join(visualRoot, 'catalog-data.js'), 'PROMPT_CATALOG');
    const promptStore = loadAssignment(path.join(visualRoot, 'catalog-prompts.js'), 'PROMPT_CATALOG_PROMPTS');
    const localization = loadAssignment(path.join(visualRoot, 'localization-zh-TW.js'), 'VISUAL_CATALOG_ZH_TW');
    const runtimeTechnicalRegistry = loadAssignment(path.join(visualRoot, 'technical-marker-registry.js'), 'TECHNICAL_MARKER_REGISTRY');
    const promptCoreContext = { window: {} };
    vm.runInNewContext(readText(path.join(visualRoot, 'catalog-core.js')), promptCoreContext, { timeout: 20000 });
    const promptCore = promptCoreContext.window.PromptCatalogCore;
    if (!promptCore?.getPromptAccess || !promptCore?.isVerifiedLicenseStatus) throw new Error('Prompt Runtime license truth helpers are missing.');
    const searchModulePath = path.join(visualRoot, 'unified-search-core-v2.js');
    const indexMarkup = readText(path.join(visualRoot, 'index.html'));
    const searchCoreSource = readText(searchModulePath);
    const directPayloadPosition = indexMarkup.indexOf('direct-use-prompt-data.js');
    const searchCorePosition = indexMarkup.indexOf('unified-search-core-v2.js');
    const runtimeBodySearchBound = directPayloadPosition >= 0
      && searchCorePosition > directPayloadPosition
      && /DIRECT_USE_PROMPT_DATA\?\.entries\?\.\[entry\.id\]/u.test(searchCoreSource);
    delete require.cache[require.resolve(searchModulePath)];
    const publicSearchCore = require(searchModulePath);
    const discoverableIds = new Set(publicSearchCore.searchEntries(entries, '', {}, { diversity: false }).map((item) => item.entry.id));
    metrics.PUBLIC_DEFAULT_DISCOVERY_MISSING_COUNT = entries.filter((entry) => !discoverableIds.has(entry.id)).length;
    if (runtimeUnified.content_hash !== unified.content_hash || JSON.stringify(runtimeUnified.entries) !== JSON.stringify(entries)) metrics.PUBLIC_SPLIT_BRAIN_COUNT += 1;
    if (live.unified_index_content_hash !== unified.content_hash || live.entry_count !== expectedLiveCount || code.entry_count !== expectedLiveCount
      || direct.entry_count !== expectedPromptCount || catalog.entry_count !== expectedPromptCount || promptStore.entry_count !== expectedPromptCount) metrics.PUBLIC_SPLIT_BRAIN_COUNT += 1;
    metrics.PUBLIC_LIVE_UI_RUNTIME_COUNT = Number(live.entry_count || 0);
    if (runtimeTechnicalRegistry.content_hash !== technicalRegistry.content_hash
      || JSON.stringify(runtimeTechnicalRegistry.records || []) !== JSON.stringify(technicalRegistry.records || [])) metrics.PUBLIC_SPLIT_BRAIN_COUNT += 1;
    const promptLocalization = new Map((localization.prompt_entries || []).map((record) => [record.entry_id, record]));
    const liveLocalization = new Map((localization.live_ui_entries || []).map((record) => [record.entry_id, record]));
    const unresolvedLocalization = Number(localizationReport.ENTRIES_REVIEW_REQUIRED || 0)
      + Number(localizationReport.ENGLISH_ONLY_USER_DESCRIPTION_FIELDS || 0)
      + Number(localizationReport.SIMPLIFIED_CHINESE_USER_DESCRIPTION_FIELDS || 0)
      + Math.abs(Number(localizationReport.TOTAL_PROMPT_ENTRIES || 0) - expectedPromptCount)
      + Math.abs(Number(localizationReport.TOTAL_LIVE_UI_ENTRIES || 0) - expectedLiveCount)
      + (localizationReport.status === 'PASS' ? 0 : 1)
      + (localization.prompt_catalog_content_hash === catalog.content_hash ? 0 : 1)
      + (localization.live_ui_catalog_content_hash === live.content_hash ? 0 : 1);
    metrics.PUBLIC_UNRESOLVED_LOCALIZATION_COUNT += unresolvedLocalization;
    metrics.PUBLIC_PENDING_REVIEW_LABEL_COUNT += [...promptLocalization.values(), ...liveLocalization.values()]
      .filter((record) => record.localization_status !== 'complete'
        || (record.risk_labels_zh_tw || []).some((item) => item.localization_status !== 'complete')
        || (record.interaction_labels_zh_tw || []).some((item) => item.localization_status !== 'complete')).length;
    const directIds = new Set(Object.keys(direct.entries || {}));
    const catalogIds = new Set((catalog.entries || []).map((entry) => entry.id));
    const promptStoreIds = new Set((promptStore.entries || []).map((entry) => entry.id));
    const expectedLiveIds = new Set(entries.filter((entry) => entry.content_type === 'live-ui').map((entry) => entry.id));
    for (const rows of [live.entries || [], code.entries || []]) {
      const ids = new Set(rows.map((entry) => entry.id));
      if (ids.size !== rows.length || ids.size !== expectedLiveIds.size || [...ids].some((id) => !expectedLiveIds.has(id))) metrics.PUBLIC_SPLIT_BRAIN_COUNT++;
    }
    for (const ids of [catalogIds, promptStoreIds, directIds]) {
      if (ids.size !== expectedPromptCount || [...ids].some((id) => !entryById.get(id)?.has_prompt_copy)) metrics.PUBLIC_SPLIT_BRAIN_COUNT++;
    }
    const archiveCache = new Map();
    const readSanitizedBytes = (route) => {
      const parts = route.split('!');
      if (!parts.every(publicRelativePath)) throw new Error('Unsafe derivative route.');
      const file = path.resolve(root, parts[0]);
      if (!file.startsWith(root + path.sep)) throw new Error('Derivative route escaped public root.');
      let bytes = fs.readFileSync(file), container = parts[0];
      for (const member of parts.slice(1)) {
        let zip = archiveCache.get(container);
        if (!zip) { zip = parseZipBuffer(bytes, container); archiveCache.set(container, zip); }
        const found = zip.entries.filter((row) => row.name === member);
        if (found.length !== 1) throw new Error('Derivative archive member is missing or duplicated.');
        bytes = zip.data(found[0]); container += '!' + member;
      }
      return bytes;
    };
    const notices = validatePublicLicenseNotices({ manifest: licenseNoticeManifest, entries, downloads: downloadRecords,
      sanitization: sanitizationManifest, readBytes: readSanitizedBytes });
    metrics.PUBLIC_LICENSE_NOTICE_OBLIGATION_FAILURE_COUNT = notices.errors.length;
    for (const reason of notices.errors) failures.push(`license-notice:${reason}`);
    const sanitation = validateSanitizationManifest({ manifest: sanitizationManifest, entries, promptBodies: direct.entries || {}, readBytes: readSanitizedBytes,
      licenseNotices: licenseNoticeManifest });
    metrics.PUBLIC_SANITIZATION_EVIDENCE_FAILURE_COUNT += sanitation.errors.length;
    for (const reason of sanitation.errors) failures.push(`sanitization:${reason}`);
    const requiredCategoryFields = ['entry_id', 'title', 'source_type', 'final_public_category', 'primary_use', 'supported_capabilities',
      'preview_applicability', 'dependency_status', 'dependency_disclosure_zh_tw', 'dependency_disclosure_en', 'license_status',
      'source_name', 'provenance_record_path', 'pinned_version_or_commit', 'rights_holder', 'license_ids', 'redistribution_basis',
      'publication_decision', 'localization_status'];
    for (const entry of entries) {
      const contract = categoryAudit.categoryContract(entry, direct.entries || {}, { libraryRoot: path.join(root, 'prompt-library') });
      const record = categoryAudit.recordFor(entry, direct.entries || {}, { libraryRoot: path.join(root, 'prompt-library') });
      if (!contract.complete) metrics.PUBLIC_CATEGORY_CONTENT_CONTRACT_FAILURE_COUNT++;
      if (entry.content_type === 'artifact-example' && !contract.complete) metrics.PUBLIC_ARTIFACT_WITHOUT_REDISTRIBUTABLE_ARTIFACT_COUNT++;
      if (categoryAudit.knownGeneric(entry)) metrics.GENERIC_OR_NON_ACTIONABLE_DESCRIPTION_COUNT++;
      if (/(?:template|範本|模板)/iu.test(`${entry.title} ${entry.display_title_zh_tw}`) && entry.content_type === 'skill' && entry.template_artifact_path) metrics.TITLE_TYPE_CONFLICT_COUNT++;
      if (requiredCategoryFields.some((key) => Array.isArray(record[key]) ? !record[key].length : !String(record[key] || '').trim())) metrics.BLANK_REQUIRED_FIELD_COUNT++;
      const caps = new Set(record.supported_capabilities || []);
      const primaryUse = String(record.primary_use || '');
      if ((primaryUse.includes('Preview') && !caps.has('PREVIEW')) || (primaryUse.includes('Copy') && !caps.has('COPY_FIXED_SOURCE'))
        || (primaryUse.includes('Download') && !caps.has('DOWNLOAD_VERIFIED_ARTIFACT'))) metrics.VISIBLE_DISABLED_ACTION_COUNT++;
      const action = entry.action_capabilities || {};
      for (const [enabled, field] of [['can_open_entry_upstream', 'entry_upstream_url'], ['can_open_upstream_project_or_dataset', 'project_or_dataset_url']]) {
        if (action[enabled] && (!/^https:\/\//iu.test(String(action[field] || '')) || /(?:^|\/)prompt-library\/visual-catalog(?:\/|$)/iu.test(String(action[field])))) metrics.UPSTREAM_ACTION_TO_LIBRARY_HOME_COUNT++;
      }
      const generated = [entry.summary_zh_tw, entry.how_to_zh_tw, entry.expected_output_zh_tw, entry.dependency_disclosure_zh_tw,
        entry.preview_justification_zh_tw, entry.requirements_zh_tw, entry.execution_readiness_zh_tw];
      metrics.PUBLIC_GENERATED_SIMPLIFIED_CHINESE_RESIDUAL_COUNT += generated.filter((value) => SIMPLIFIED_CHINESE_PATTERN.test(String(value || ''))).length;
    }
    for (const record of [...promptLocalization.values(), ...liveLocalization.values(), ...(localization.source_references || [])]) {
      metrics.PUBLIC_GENERATED_SIMPLIFIED_CHINESE_RESIDUAL_COUNT += [record.display_title_zh_tw, ...descriptiveValues(record)]
        .filter((value) => SIMPLIFIED_CHINESE_PATTERN.test(String(value || ''))).length;
      if (record.localization_status !== 'complete') metrics.PUBLIC_PENDING_REVIEW_LABEL_COUNT++;
    }
    const scanGeneratedLabels = (value) => {
      if (typeof value === 'string') return SIMPLIFIED_CHINESE_PATTERN.test(value) ? 1 : 0;
      return value && typeof value === 'object' ? Object.values(value).reduce((sum, item) => sum + scanGeneratedLabels(item), 0) : 0;
    };
    metrics.PUBLIC_GENERATED_SIMPLIFIED_CHINESE_RESIDUAL_COUNT += scanGeneratedLabels(localization.labels);
    if (localization.locale !== 'zh-TW' || !/<html\b[^>]*\blang=["']zh-TW["']/u.test(indexMarkup)) metrics.PUBLIC_UNRESOLVED_LOCALIZATION_COUNT++;
    const ambiguousAuthor = (entry) => !String(entry?.author || '').trim()
      || /^(?:未標示|unknown|n\/?a|none|null|undefined)$/iu.test(String(entry?.author || '').trim());
    const allowedAuthorStatuses = new Set(['UPSTREAM_SUPPLIED', 'FIRST_PARTY_PROVENANCE_VERIFIED', 'NOT_SUPPLIED_BY_UPSTREAM']);
    for (const item of [...(catalog.entries || []), ...(live.entries || [])]) {
      if (ambiguousAuthor(item)) metrics.PUBLIC_AMBIGUOUS_AUTHOR_LABEL_COUNT += 1;
      if (!allowedAuthorStatuses.has(item.author_status) || !String(item.author_evidence || '').trim()) metrics.PUBLIC_AUTHOR_INVENTED_COUNT += 1;
      if (!item.source_id || !String(item.source_commit || item.upstream_commit || '').trim()
        || !String(item.source_license || item.license || '').trim()) metrics.PUBLIC_REQUIRED_ATTRIBUTION_MISSING_COUNT += 1;
      const localized = catalogIds.has(item.id) ? promptLocalization.get(item.id) : liveLocalization.get(item.id);
      if (!localized || localized.localization_status !== 'complete') metrics.PUBLIC_UNRESOLVED_LOCALIZATION_COUNT += 1;
      for (const marker of item.technical_markers || []) {
        const registered = technicalMarkerById.get(marker?.key);
        if (!registered || marker.classification !== registered.classification || marker.scope !== registered.scope
          || (marker.name_zh_tw && marker.name_zh_tw !== registered.name_zh_tw)
          || (marker.name_en && marker.name_en !== registered.name_en)
          || (marker.remediation_zh_tw && marker.remediation_zh_tw !== registered.library_behavior_zh_tw)
          || (marker.remediation_en && marker.remediation_en !== registered.library_behavior_en)
          || marker.verified_usage_note !== true) {
          metrics.TECHNICAL_MARKER_RUNTIME_MISMATCH_COUNT += 1;
        }
      }
    }
    if ((live.entries || []).some((entry) => !entries.some((candidate) => candidate.id === entry.id))) metrics.PUBLIC_SPLIT_BRAIN_COUNT += 1;
    if ((code.entries || []).some((entry) => !entries.some((candidate) => candidate.id === entry.id))) metrics.PUBLIC_SPLIT_BRAIN_COUNT += 1;
    for (const catalogEntry of catalog.entries || []) {
      const claimsFullText = catalogEntry.local_prompt_available === true;
      const verified = Boolean(catalogEntry.source_license) && promptCore.isVerifiedLicenseStatus(catalogEntry.license_status);
      const access = promptCore.getPromptAccess(catalogEntry, promptStore, catalog.content_hash);
      if (claimsFullText && !verified) metrics.VISIBLE_LICENSE_UNVERIFIED_COMPLETE_ENTRY_COUNT += 1;
      if (claimsFullText !== access.allowed) metrics.FULL_TEXT_AVAILABLE_LABEL_MISMATCH_COUNT += 1;
      if (claimsFullText && !access.allowed) metrics.COPY_READY_FALSE_CLAIM_COUNT += 1;
    }
    for (const entry of entries.filter((candidate) => candidate.has_prompt_copy === true)) {
      const body = direct.entries?.[entry.id];
      if (typeof body !== 'string' || !body.length || !directIds.has(entry.id) || !catalogIds.has(entry.id) || !promptStoreIds.has(entry.id)) {
        metrics.PUBLIC_PROMPT_BODY_MISSING_COUNT += 1;
        searchFailureIds.add(entry.id);
        continue;
      }
      metrics.PUBLIC_PROMPT_BODY_PRESENT_COUNT += 1;
      if (/全文未顯示[：:]|授權尚未驗證|original body hidden|safe rewrite only/iu.test(body)) metrics.PROMPT_BODY_FALLBACK_COUNT += 1;
      if (/使用 prompt-library，讀取來源[\s\S]*請依照我接下來提供的目標進行安全改寫/iu.test(body)) {
        metrics.SAFE_REWRITE_MASQUERADING_AS_ORIGINAL_COUNT += 1;
      }
      const promptAsset = (entry.direct_use_assets || []).find((asset) => asset.type === 'prompt-file');
      if (promptAsset?.can_copy_text === true && promptAsset.copy_data_key === entry.id) metrics.PUBLIC_PROMPT_COPY_READY_COUNT += 1;
      const promptRecord = promptAsset?.download_record_id ? recordById.get(promptAsset.download_record_id) : null;
      if (promptAsset?.download === true && promptRecord?.entry_id === entry.id && promptRecord?.artifact_type === 'prompt-file'
        && promptRecord.sha256 === promptAsset.sha256 && promptRecord.filename === promptAsset.download_filename) {
        metrics.PUBLIC_PROMPT_DOWNLOAD_READY_COUNT += 1;
      }
      const bodyBytes = Buffer.from(body, 'utf8');
      if (!promptRecord || promptRecord.delivery_mode !== 'blob-prompt' || promptRecord.bytes !== bodyBytes.length
        || promptRecord.sha256 !== sha256(bodyBytes)) metrics.DOWNLOAD_READY_FALSE_CLAIM_COUNT += 1;
      const catalogEntry = (catalog.entries || []).find((candidate) => candidate.id === entry.id);
      const runtimeAccess = promptCore.getPromptAccess(catalogEntry, promptStore, catalog.content_hash);
      if (!runtimeAccess.allowed || runtimeAccess.record.prompt_text !== body) metrics.COPY_READY_FALSE_CLAIM_COUNT += 1;
      const normalizedBody = body.normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/\s+/g, ' ').trim();
      const runtimeSearchCorpus = [entry.search_text, body]
        .filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/\s+/g, ' ').trim();
      if (normalizedBody && (!runtimeBodySearchBound || !runtimeSearchCorpus.includes(normalizedBody))) {
        metrics.PUBLIC_BODY_SEARCH_MISSING_COUNT += 1;
        searchFailureIds.add(entry.id);
      }
    }
    if (directIds.size !== entries.filter((entry) => entry.has_prompt_copy === true).length) metrics.PUBLIC_PROMPT_BODY_MISSING_COUNT += 1;
  } catch (_) { metrics.PUBLIC_SPLIT_BRAIN_COUNT += 1; }
  metrics.PUBLIC_PROMPT_EMPTY_BODY_COUNT = Math.max(0, metrics.PUBLIC_PROMPT_ENTRY_COUNT - metrics.PUBLIC_PROMPT_BODY_PRESENT_COUNT);
  metrics.PUBLIC_PROMPT_METADATA_MASQUERADING_AS_COMPLETE_COUNT += metrics.PUBLIC_PROMPT_EMPTY_BODY_COUNT;
  metrics.PUBLIC_SEARCH_FALSE_NEGATIVE_COUNT = searchFailureIds.size;
  metrics.PUBLIC_SEARCHABLE_COMPLETE_ENTRY_COUNT = Math.max(0, metrics.PUBLIC_COMPLETE_ENTRY_COUNT - searchFailureIds.size);
  profile('runtime-bindings');

  const noticesPath = path.join(root, 'THIRD_PARTY_NOTICES.md');
  const notices = fs.existsSync(noticesPath) ? readText(noticesPath) : '';
  if (!/GSAP[\s\S]{0,180}Standard[\s\S]{0,180}(?:not MIT|不是 MIT)/iu.test(notices)) metrics.PUBLIC_MISLABELED_GSAP_LICENSE_COUNT += 1;
  if (!/python-pptx/iu.test(notices) || !fs.existsSync(path.join(root, 'LICENSES', 'PYTHON-PPTX-MIT.txt'))) metrics.PUBLIC_REQUIRED_ATTRIBUTION_MISSING_COUNT += 1;
  for (const relative of ['README.md', 'LICENSE_SCOPE.md', 'THIRD_PARTY_NOTICES.md', 'PRIVACY_AND_PUBLICATION.md', 'SECURITY.md', 'VALIDATION_SUMMARY.md']) {
    const filePath = path.join(root, relative);
    if (fs.existsSync(filePath)) {
      const text = readText(filePath);
      if (!/繁體中文/u.test(text) || !/English/u.test(text)) metrics.PUBLIC_REQUIRED_ATTRIBUTION_MISSING_COUNT += 1;
      // These six files are generated project guidance, rather than preserved
      // upstream source bodies or the separate verbatim LICENSES texts.
      metrics.PUBLIC_GENERATED_SIMPLIFIED_CHINESE_RESIDUAL_COUNT += [...text].filter((character) => SIMPLIFIED_CHINESE_PATTERN.test(character)).length;
    }
  }

  const expectedUnifiedHash = objectHash({ entries, source_commits: unified.source_commits || {} });
  profile('content-hashes');
  if (unified.content_hash !== expectedUnifiedHash) metrics.PUBLIC_STALE_EVIDENCE_COUNT += 1;
  if (downloads.unified_index_hash !== unified.content_hash) metrics.PUBLIC_UNBOUND_EVIDENCE_COUNT += 1;
  if (downloads.content_hash) {
    const downloadBase = { ...downloads }; delete downloadBase.content_hash;
    if (downloads.content_hash !== objectHash(downloadBase)) metrics.PUBLIC_STALE_EVIDENCE_COUNT += 1;
  }
  if (provenance.content_hash) {
    const provenanceBase = { ...provenance }; delete provenanceBase.content_hash;
    if (provenance.content_hash !== objectHash(provenanceBase)) metrics.PUBLIC_STALE_EVIDENCE_COUNT += 1;
  }
  const excluded = new Set(['PUBLIC_BUILD_MANIFEST.json', 'VALIDATION_SUMMARY.md']);
  const contentTreeHash = treeHash(inventory.files, excluded);
  if (publicManifest.content_tree_hash !== contentTreeHash) metrics.PUBLIC_TREE_HASH_MISMATCH_COUNT += 1;
  const validationPath = path.join(root, 'VALIDATION_SUMMARY.md');
  if (!fs.existsSync(validationPath) || !readText(validationPath).includes(contentTreeHash)) metrics.PUBLIC_STALE_EVIDENCE_COUNT += 1;
  const bindings = [
    ['public_unified_index_hash', unified.content_hash],
    ['public_download_manifest_hash', fs.existsSync(downloadPath) ? sha256(fs.readFileSync(downloadPath)) : ''],
    ['public_provenance_manifest_hash', fs.existsSync(provenancePath) ? sha256(fs.readFileSync(provenancePath)) : ''],
    ['public_license_scope_hash', fs.existsSync(path.join(root, 'LICENSE_SCOPE.md')) ? sha256(fs.readFileSync(path.join(root, 'LICENSE_SCOPE.md'))) : ''],
    ['public_redistribution_policy_sha256', fs.existsSync(redistributionPolicyPath) ? sha256(fs.readFileSync(redistributionPolicyPath)) : ''],
    ['public_sanitization_manifest_sha256', fs.existsSync(sanitizationManifestPath) ? sha256(fs.readFileSync(sanitizationManifestPath)) : '']
  ];
  for (const [field, actual] of bindings) if (!actual || publicManifest[field] !== actual) metrics.PUBLIC_UNBOUND_EVIDENCE_COUNT += 1;
  if (Number(publicManifest.public_library_entry_count) !== entries.length || Number(publicManifest.public_download_artifact_count) !== downloadRecords.length) metrics.PUBLIC_STALE_EVIDENCE_COUNT += 1;
  if (Number(publicManifest.public_complete_entry_count) !== metrics.PUBLIC_COMPLETE_ENTRY_COUNT
    || Number(publicManifest.public_reference_entry_count) !== metrics.PUBLIC_REFERENCE_ENTRY_COUNT
    || Number(publicManifest.public_prompt_content_count) !== metrics.PUBLIC_PROMPT_CONTENT_COUNT) metrics.PUBLIC_STALE_EVIDENCE_COUNT += 1;

  const zeroGates = [
    'PUBLIC_PRIVATE_ENTRY_COUNT', 'PUBLIC_PRIVATE_ARCHIVE_COUNT', 'PUBLIC_PRIVATE_ARTIFACT_COUNT', 'PUBLIC_PRIVATE_ROUTE_COUNT',
    'PUBLIC_PRIVATE_FINGERPRINT_COUNT', 'PUBLIC_INTERNAL_SOURCE_HASH_COUNT', 'PUBLIC_INTERNAL_PRIVATE_COUNT_DISCLOSURE',
    'PUBLIC_ABSOLUTE_LOCAL_PATH_COUNT', 'PUBLIC_PERSONAL_EMAIL_COUNT', 'PUBLIC_REAL_NAME_COUNT', 'PUBLIC_PHONE_COUNT',
    'PUBLIC_ADDRESS_COUNT', 'PUBLIC_SECRET_FINDING_COUNT', 'PUBLIC_BINARY_PERSONAL_METADATA_COUNT',
    'PUBLIC_UNREGISTERED_SOURCE_COUNT', 'PUBLIC_BLOCKED_SOURCE_REFERENCE_COUNT', 'PUBLIC_LEGACY_LOCALIZATION_RECORD_COUNT',
    'PUBLIC_UNRESOLVED_LOCALIZATION_COUNT', 'PUBLIC_PENDING_REVIEW_LABEL_COUNT', 'PUBLIC_AMBIGUOUS_STATUS_LABEL_COUNT',
    'PUBLIC_AUTHOR_INVENTED_COUNT', 'PUBLIC_AMBIGUOUS_AUTHOR_LABEL_COUNT',
    'PUBLIC_SPLIT_BRAIN_COUNT', 'PUBLIC_UNLICENSED_ENTRY_COUNT', 'PUBLIC_UNKNOWN_LICENSE_FILE_COUNT',
    'PUBLIC_MISSING_PROVENANCE_COUNT', 'PUBLIC_LICENSE_SCOPE_CONFLICT_COUNT', 'PUBLIC_REQUIRED_ATTRIBUTION_MISSING_COUNT',
    'PUBLIC_MISLABELED_GSAP_LICENSE_COUNT', 'PUBLIC_UNEXPLAINED_TRADEMARK_ASSET_COUNT',
    'PUBLIC_PROMPT_EMPTY_BODY_COUNT', 'PUBLIC_PROMPT_METADATA_MASQUERADING_AS_COMPLETE_COUNT',
    'PUBLIC_STUB_ENTRY_COUNT', 'PUBLIC_ORPHAN_ENTRY_COUNT', 'PUBLIC_ENTRY_WITH_NO_PRIMARY_USE_COUNT',
    'PUBLIC_ENTRY_WITH_FAKE_PREVIEW_COUNT', 'PUBLIC_ENTRY_WITH_FAKE_DOWNLOAD_COUNT', 'VISIBLE_EMPTY_CATEGORY_COUNT',
    'WRONG_CATEGORY_BINDING_COUNT', 'VISIBLE_ACTION_WITHOUT_CAPABILITY_COUNT', 'EMPTY_PREVIEW_PANEL_COUNT',
    'REFERENCE_ONLY_IN_COMPLETE_LIBRARY_COUNT', 'RELATED_TO_UNUSABLE_ENTRY_COUNT',
    'PUBLIC_SEARCH_FALSE_NEGATIVE_COUNT', 'PUBLIC_SEARCH_WRONG_CATEGORY_COUNT', 'PUBLIC_SEARCH_PRIVATE_RESULT_COUNT',
    'PUBLIC_INVISIBLE_COMPLETE_ENTRY_COUNT', 'PUBLIC_DEFAULT_DISCOVERY_MISSING_COUNT',
    'PUBLIC_METADATA_STUB_COUNT', 'PUBLIC_PROMPT_BODY_MISSING_COUNT', 'PUBLIC_TITLE_SEARCH_MISSING_COUNT',
    'PUBLIC_BODY_SEARCH_MISSING_COUNT', 'PUBLIC_COMPLETE_ACTION_MISSING_COUNT', 'PUBLIC_SOURCE_PARITY_GAP_COUNT',
    'VISIBLE_LICENSE_UNVERIFIED_COMPLETE_ENTRY_COUNT', 'FULL_TEXT_AVAILABLE_LABEL_MISMATCH_COUNT',
    'PROMPT_BODY_FALLBACK_COUNT', 'SAFE_REWRITE_MASQUERADING_AS_ORIGINAL_COUNT',
    'COPY_READY_FALSE_CLAIM_COUNT', 'DOWNLOAD_READY_FALSE_CLAIM_COUNT',
    'PUBLIC_UNLICENSED_COMPLETE_ENTRY_COUNT', 'TECHNICAL_MARKER_UNCLASSIFIED_COUNT', 'TECHNICAL_MARKER_RUNTIME_MISMATCH_COUNT',
    'TECHNICAL_MARKER_MISSING_BILINGUAL_DESCRIPTION_COUNT', 'PUBLIC_EXCLUDED_MARKER_ENTRY_COUNT',
    'PUBLIC_BROKEN_DOWNLOAD_COUNT', 'PUBLIC_DOWNLOAD_PREVIEW_COLLISION_COUNT', 'PUBLIC_ZERO_BYTE_ARTIFACT_COUNT',
    'PUBLIC_WRONG_ENTRY_BINDING_COUNT', 'PUBLIC_ZIP_PERMISSION_000_COUNT', 'PUBLIC_ZIP_TRAVERSAL_COUNT',
    'PUBLIC_ZIP_SYMLINK_COUNT', 'PUBLIC_ZIP_MISSING_LICENSE_COUNT', 'PUBLIC_ZIP_HASH_MISMATCH_COUNT',
    'DOWNLOAD_PACKAGE_MISSING_USAGE_DOCUMENTATION_COUNT', 'PUBLIC_NETWORK_REQUEST_COUNT',
    'PUBLIC_RUNTIME_REMOTE_ASSET_COUNT', 'PUBLIC_PREVIEW_REMOTE_REQUEST_COUNT', 'AUTO_DEPLOY_TRIGGER_COUNT',
    'UNCONFIRMED_EXTERNAL_MUTATION_COUNT', 'REDUCED_MOTION_FAILURE_COUNT',
    'PUBLIC_FILE_OVER_100_MIB_COUNT', 'PUBLIC_NESTED_REPOSITORY_COUNT',
    'PUBLIC_STALE_EVIDENCE_COUNT', 'PUBLIC_UNBOUND_EVIDENCE_COUNT', 'PUBLIC_TREE_HASH_MISMATCH_COUNT',
    'PUBLIC_SOURCE_PROOF_INTEGRITY_FAILURE_COUNT', 'PUBLIC_GIT_BYTE_CONTRACT_FAILURE_COUNT', 'PUBLIC_IGNORED_CONTENT_DIRECTORY_COUNT',
    'PUBLIC_USER_HOME_PATH_COUNT', 'PUBLIC_LOCAL_PROJECT_PATH_COUNT', 'PUBLIC_ARCHIVE_ABSOLUTE_LOCAL_PATH_COUNT',
    'PUBLIC_ARCHIVE_XML_ABSOLUTE_LOCAL_PATH_COUNT', 'PUBLIC_ARCHIVE_PATH_SCAN_FAILURE_COUNT',
    'PUBLIC_REDISTRIBUTION_POLICY_FAILURE_COUNT', 'PUBLIC_SANITIZATION_EVIDENCE_FAILURE_COUNT',
    'PUBLIC_LICENSE_NOTICE_OBLIGATION_FAILURE_COUNT',
    'PUBLIC_EXCLUDED_RIGHTS_ENTRY_COUNT', 'PUBLIC_EXCLUDED_RIGHTS_ASSET_COUNT',
    'PUBLIC_PPTX_WITH_UNRESOLVED_MEDIA_RIGHTS_COUNT', 'PUBLIC_UNRESOLVED_EMBEDDED_MEDIA_COUNT',
    'PUBLIC_ENTRY_WITH_INSUFFICIENT_FORMAL_LICENSE_EVIDENCE_COUNT', 'PUBLIC_ARTIFACT_WITHOUT_REDISTRIBUTABLE_ARTIFACT_COUNT',
    'PUBLIC_CATEGORY_CONTENT_CONTRACT_FAILURE_COUNT', 'GENERIC_OR_NON_ACTIONABLE_DESCRIPTION_COUNT',
    'TITLE_TYPE_CONFLICT_COUNT', 'BLANK_REQUIRED_FIELD_COUNT', 'VISIBLE_DISABLED_ACTION_COUNT',
    'UPSTREAM_ACTION_TO_LIBRARY_HOME_COUNT', 'PUBLIC_GENERATED_SIMPLIFIED_CHINESE_RESIDUAL_COUNT'
  ];
  for (const gate of zeroGates) if (metrics[gate] !== 0) failures.push(`${gate}=${metrics[gate]}`);
  const expectedCompleteEntryCount = redistribution.expected_entry_count;
  if (metrics.PUBLIC_LIBRARY_ENTRY_COUNT !== expectedCompleteEntryCount) failures.push(`PUBLIC_LIBRARY_ENTRY_COUNT=${metrics.PUBLIC_LIBRARY_ENTRY_COUNT}`);
  if (metrics.PUBLIC_COMPLETE_ENTRY_COUNT !== expectedCompleteEntryCount) failures.push(`PUBLIC_COMPLETE_ENTRY_COUNT=${metrics.PUBLIC_COMPLETE_ENTRY_COUNT}`);
  if (metrics.PUBLIC_USABLE_ENTRY_TOTAL !== expectedCompleteEntryCount) failures.push(`PUBLIC_USABLE_ENTRY_TOTAL=${metrics.PUBLIC_USABLE_ENTRY_TOTAL}`);
  if (metrics.PUBLIC_SEARCHABLE_COMPLETE_ENTRY_COUNT !== expectedCompleteEntryCount) failures.push(`PUBLIC_SEARCHABLE_COMPLETE_ENTRY_COUNT=${metrics.PUBLIC_SEARCHABLE_COMPLETE_ENTRY_COUNT}`);
  if (metrics.PUBLIC_REFERENCE_ENTRY_COUNT !== 0) failures.push(`PUBLIC_REFERENCE_ENTRY_COUNT=${metrics.PUBLIC_REFERENCE_ENTRY_COUNT}`);
  for (const key of ['PUBLIC_PROMPT_CONTENT_COUNT', 'PUBLIC_PROMPT_ENTRY_COUNT', 'PUBLIC_PROMPT_BODY_PRESENT_COUNT', 'PUBLIC_PROMPT_COPY_READY_COUNT', 'PUBLIC_PROMPT_DOWNLOAD_READY_COUNT']) {
    if (metrics[key] !== expectedPromptCount) failures.push(`${key}=${metrics[key]}`);
  }
  if (metrics.PUBLIC_LIVE_UI_RUNTIME_COUNT !== expectedLiveCount) failures.push(`PUBLIC_LIVE_UI_RUNTIME_COUNT=${metrics.PUBLIC_LIVE_UI_RUNTIME_COUNT}`);
  const uniqueFailures = [...new Set(failures)];
  profile('complete');
  return {
    status: uniqueFailures.length ? 'FAIL' : 'PASS', ...metrics,
    PUBLIC_USABLE_ENTRY_COUNT: metrics.PUBLIC_USABLE_ENTRY_TOTAL,
    PUBLIC_METADATA_ONLY_COMPLETE_ENTRY_COUNT: metrics.PUBLIC_METADATA_STUB_COUNT,
    PUBLIC_REQUIRED_ATTRIBUTION_UNCOVERED_COUNT: metrics.PUBLIC_REQUIRED_ATTRIBUTION_MISSING_COUNT,
    FAKE_DOWNLOAD_COUNT: metrics.PUBLIC_ENTRY_WITH_FAKE_DOWNLOAD_COUNT + metrics.PUBLIC_BROKEN_DOWNLOAD_COUNT,
    EMPTY_PREVIEW_COUNT: metrics.PUBLIC_ENTRY_WITH_FAKE_PREVIEW_COUNT + metrics.EMPTY_PREVIEW_PANEL_COUNT,
    COPY_DOWNLOAD_MISMATCH_COUNT: metrics.COPY_READY_FALSE_CLAIM_COUNT + metrics.DOWNLOAD_READY_FALSE_CLAIM_COUNT,
    PENDING_LOCALIZATION_LABEL_FOUND: metrics.PUBLIC_PENDING_REVIEW_LABEL_COUNT,
    ALL_CODEX_USER_FACING_CHINESE: metrics.PUBLIC_GENERATED_SIMPLIFIED_CHINESE_RESIDUAL_COUNT === 0 ? 'ZH_TW_PASS' : 'FAIL',
    PUBLIC_UNRESOLVED_LICENSE_COUNT: metrics.PUBLIC_UNLICENSED_ENTRY_COUNT + metrics.PUBLIC_ENTRY_WITH_INSUFFICIENT_FORMAL_LICENSE_EVIDENCE_COUNT,
    PUBLIC_UNFULFILLED_LICENSE_OBLIGATION_COUNT: metrics.PUBLIC_LICENSE_NOTICE_OBLIGATION_FAILURE_COUNT,
    PUBLIC_UNRESOLVED_MEDIA_RIGHTS_COUNT: metrics.PUBLIC_PPTX_WITH_UNRESOLVED_MEDIA_RIGHTS_COUNT + metrics.PUBLIC_UNRESOLVED_EMBEDDED_MEDIA_COUNT,
    PUBLIC_PPTX_COUNT: inventory.files.filter((file) => /\.pptx$/iu.test(file.relative)).length,
    KINETICS_PUBLIC_ENTRY_COUNT: entries.filter((entry) => entry.source_id === 'kinetics-official').length,
    KINETICS_EXCLUDED_INSUFFICIENT_LICENSE_COUNT: (redistributionPolicy.excluded_entries || []).filter((entry) => entry.source_id === 'kinetics-official').length,
    LOCAL_TO_PUBLIC_ELIGIBLE_SEARCH_PARITY: metrics.PUBLIC_SEARCH_FALSE_NEGATIVE_COUNT === 0
      && metrics.PUBLIC_SEARCH_WRONG_CATEGORY_COUNT === 0 && metrics.PUBLIC_SEARCH_PRIVATE_RESULT_COUNT === 0 ? 'PASS' : 'FAIL',
    PUBLIC_REPOSITORY_FILE_COUNT: inventory.files.length,
    PUBLIC_REPOSITORY_TOTAL_BYTES: inventory.files.reduce((sum, file) => sum + file.bytes, 0),
    PUBLIC_REPOSITORY_TREE_HASH: treeHash(inventory.files), CONTENT_TREE_HASH: contentTreeHash,
    CONTENT_TREE_HASH_MATCH: metrics.PUBLIC_TREE_HASH_MISMATCH_COUNT === 0,
    failure_count: uniqueFailures.length, failures: uniqueFailures
  };
}

function main() {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf('--root');
  const root = rootIndex >= 0 ? args[rootIndex + 1] : path.resolve(__dirname, '..', '..');
  const report = auditRepository(root);
  process.stdout.write(`${JSON.stringify(report, null, args.includes('--json') ? 0 : 2)}\n`);
  if (report.status !== 'PASS') process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { auditRepository, treeHash, walk, parseZipBuffer, auditZip, validateSourceProofBuckets, scanAbsoluteLocalPaths,
  validateByteSafeAttributes, validateRedistributionPolicy, validateSanitizationManifest, validatePublicLicenseNotices, scanPublicArchive, decodePublicText, scanPublicTextPaths };
