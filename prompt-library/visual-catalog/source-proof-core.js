/* SPDX-License-Identifier: MIT */
'use strict';

((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SourceProofCore = api;
})(typeof window === 'object' ? window : globalThis, () => {
  const BUCKET_COUNT = 256;
  const SCHEMA = '1.0-source-proof-buckets';
  const HASH = /^[a-f0-9]{64}$/u;
  const own = (object, key) => !!object && Object.hasOwn(object, key);
  function bucketKey(id) {
    if (typeof id !== 'string') throw new Error('Entry ID must be a string.');
    let value = 2166136261;
    // FNV-1a over JavaScript UTF-16 code units, identical in Node and browsers.
    for (let i = 0; i < id.length; i += 1) value = Math.imul(value ^ id.charCodeAt(i), 16777619) >>> 0;
    return (value & 255).toString(16).padStart(2, '0');
  }
  function bucketPath(key) {
    if (!/^[a-f0-9]{2}$/u.test(key)) throw new Error('Invalid proof bucket.');
    return `source-proof-data/${key}.js`;
  }
  function checkManifest(manifest) {
    if (!manifest || manifest.schema_version !== SCHEMA || manifest.bucket_count !== BUCKET_COUNT
      || !HASH.test(manifest.generation_hash) || !HASH.test(manifest.unified_index_hash)
      || !manifest.buckets || Object.keys(manifest.buckets).length !== BUCKET_COUNT) {
      throw new Error('Invalid proof manifest.');
    }
    let entries = 0, bodies = 0;
    for (let i = 0; i < BUCKET_COUNT; i += 1) {
      const key = i.toString(16).padStart(2, '0'), item = manifest.buckets[key];
      if (!item || item.path !== bucketPath(key) || !HASH.test(item.sha256)
        || !Number.isSafeInteger(item.bytes) || item.bytes <= 0
        || !Number.isSafeInteger(item.entry_count) || item.entry_count < 0
        || !Number.isSafeInteger(item.body_count) || item.body_count < 0 || item.body_count > item.entry_count) {
        throw new Error('Invalid proof bucket descriptor.');
      }
      entries += item.entry_count; bodies += item.body_count;
    }
    if (entries !== manifest.entry_count || bodies !== manifest.body_count) throw new Error('Proof manifest counts do not reconcile.');
    return manifest;
  }
  function checkBucket(manifest, data, key) {
    checkManifest(manifest);
    bucketPath(key);
    const descriptor = manifest.buckets[key];
    if (!data || data.schema_version !== SCHEMA || data.bucket_id !== key
      || data.generation_hash !== manifest.generation_hash || data.unified_index_hash !== manifest.unified_index_hash
      || !data.entries || typeof data.entries !== 'object' || Array.isArray(data.entries)) {
      throw new Error('Stale or mismatched proof data.');
    }
    const entries = Object.entries(data.entries);
    let bodyCount = 0;
    for (const [entryId, item] of entries) {
      if (bucketKey(entryId) !== key || !item || item.record?.entry_id !== entryId
        || typeof item.body_required !== 'boolean') throw new Error('Proof record identity does not match.');
      const hasBody = typeof item.prompt_body === 'string' && item.prompt_body.length > 0;
      if (item.body_required !== hasBody || (hasBody && !HASH.test(item.prompt_body_sha256))
        || (!hasBody && (item.prompt_body !== null || item.prompt_body_sha256 !== ''))) {
        throw new Error('Expected proof body is missing or malformed.');
      }
      if (hasBody && item.record.local_original_body_sha256
        && item.record.local_original_body_sha256 !== item.prompt_body_sha256) throw new Error('Proof body binding does not match.');
      if (hasBody) bodyCount += 1;
    }
    if (entries.length !== descriptor.entry_count || entries.length !== data.entry_count
      || bodyCount !== descriptor.body_count || bodyCount !== data.body_count) throw new Error('Proof bucket coverage does not reconcile.');
    return data;
  }
  function selectRecord(manifest, data, id) {
    checkBucket(manifest, data, bucketKey(id));
    return own(data.entries, id) ? data.entries[id] : null;
  }
  return Object.freeze({ BUCKET_COUNT, SCHEMA, bucketKey, bucketPath, checkManifest, checkBucket, selectRecord });
});
