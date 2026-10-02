/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';

  const scriptPromises = new Map();
  const objectUrls = new Set();
  let promptPayloadPromise = null;

  function safeLocalPath(value) {
    const path = String(value || '').trim();
    return Boolean(path)
      && !/^(?:[a-z][a-z0-9+.-]*:|[\/#?])/i.test(path)
      && !path.includes('\\')
      && !path.includes('\0');
  }

  function clearLink(link) {
    if (!link) return;
    link.removeAttribute('href');
    link.removeAttribute('download');
    link.removeAttribute('data-download-record-id');
    link.removeAttribute('data-download-delivery');
    link.removeAttribute('data-download-filename');
    link.removeAttribute('data-download-mime');
    link.removeAttribute('data-download-bytes');
    link.removeAttribute('data-download-sha256');
    link.removeAttribute('data-download-payload-path');
    link.removeAttribute('data-download-payload-shard');
    link.removeAttribute('data-download-payload-key');
    link.removeAttribute('data-atlas-action');
    link.hidden = true;
    link.removeAttribute('aria-disabled');
    link.tabIndex = -1;
  }

  function configureLink(link, asset) {
    if (!link || !asset || asset.download !== true || !safeLocalPath(asset.path)
      || !asset.download_record_id || !asset.download_filename || !asset.delivery_mode
      || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0
      || !/^[a-f0-9]{64}$/i.test(String(asset.sha256 || '')) || !asset.mime) {
      clearLink(link);
      return false;
    }
    link.href = asset.path;
    link.download = asset.download_filename;
    link.dataset.downloadRecordId = asset.download_record_id;
    link.dataset.downloadDelivery = asset.delivery_mode;
    link.dataset.downloadFilename = asset.download_filename;
    link.dataset.downloadMime = asset.mime || 'application/octet-stream';
    link.dataset.downloadBytes = String(asset.bytes || 0);
    link.dataset.downloadSha256 = asset.sha256 || '';
    link.dataset.downloadPayloadPath = asset.payload_path || '';
    link.dataset.downloadPayloadShard = asset.payload_shard || '';
    link.dataset.downloadPayloadKey = asset.payload_key || '';
    link.dataset.atlasAction = 'DOWNLOAD_ARTIFACT';
    link.hidden = false;
    link.removeAttribute('aria-disabled');
    link.tabIndex = 0;
    return true;
  }

  function loadScriptOnce(source) {
    if (!safeLocalPath(source)) return Promise.reject(new Error('unsafe payload route'));
    if (scriptPromises.has(source)) return scriptPromises.get(source);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.dataset.atlasDownloadPayload = source;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`download payload unavailable: ${source}`));
      document.head.append(script);
    });
    scriptPromises.set(source, promise);
    return promise;
  }

  function loadPromptPayload() {
    if (window.DIRECT_USE_PROMPT_DATA) return Promise.resolve(window.DIRECT_USE_PROMPT_DATA);
    if (!promptPayloadPromise) {
      promptPayloadPromise = loadScriptOnce('direct-use-prompt-data.js').then(() => {
        if (!window.DIRECT_USE_PROMPT_DATA?.entries) throw new Error('prompt payload missing');
        return window.DIRECT_USE_PROMPT_DATA;
      });
    }
    return promptPayloadPromise;
  }

  function bytesFromBase64(value) {
    const binary = atob(String(value || ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  async function sha256Hex(bytes) {
    if (!window.crypto?.subtle) return '';
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  }

  function dispatch(link, type, detail = {}) {
    link.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      detail: { recordId: link.dataset.downloadRecordId, filename: link.dataset.downloadFilename, ...detail }
    }));
  }

  function triggerBlobDownload(link, bytes) {
    const expectedBytes = Number(link.dataset.downloadBytes || 0);
    if (!bytes?.byteLength || (expectedBytes > 0 && bytes.byteLength !== expectedBytes)) {
      throw new Error(`download byte mismatch (${bytes?.byteLength || 0}/${expectedBytes})`);
    }
    const blob = new Blob([bytes], { type: link.dataset.downloadMime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    objectUrls.add(url);
    const trigger = document.createElement('a');
    trigger.hidden = true;
    trigger.href = url;
    trigger.download = link.dataset.downloadFilename;
    trigger.rel = 'noopener';
    trigger.dataset.atlasDownloadTrigger = 'true';
    document.body.append(trigger);
    trigger.click();
    trigger.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      objectUrls.delete(url);
    }, 30000);
  }

  async function blobBytes(link) {
    const delivery = link.dataset.downloadDelivery;
    const key = link.dataset.downloadPayloadKey;
    if (delivery === 'blob-prompt') {
      const payload = await loadPromptPayload();
      const value = String(payload.entries?.[key] || '');
      if (!value) throw new Error('prompt download payload is empty');
      return new TextEncoder().encode(value);
    }
    if (delivery === 'blob-shard') {
      const shard = link.dataset.downloadPayloadShard;
      const source = link.dataset.downloadPayloadPath;
      if (!shard || !source || !key) throw new Error('download shard binding is incomplete');
      await loadScriptOnce(source);
      const encoded = window.ATLAS_DOWNLOAD_PAYLOAD_SHARDS?.[shard]?.[key];
      if (!encoded) throw new Error('download shard payload is missing');
      return bytesFromBase64(encoded);
    }
    throw new Error(`unsupported blob delivery: ${delivery}`);
  }

  async function readAssetText(asset) {
    const delivery = String(asset?.delivery_mode || '');
    const key = String(asset?.payload_key || asset?.copy_data_key || '');
    let bytes;
    if (delivery === 'blob-prompt') {
      const payload = await loadPromptPayload();
      const value = String(payload.entries?.[key] || '');
      if (!value) throw new Error('copy payload is empty');
      bytes = new TextEncoder().encode(value);
    } else if (delivery === 'blob-shard') {
      const shard = String(asset?.payload_shard || '');
      const source = String(asset?.payload_path || '');
      if (!shard || !source || !key) throw new Error('copy shard binding is incomplete');
      await loadScriptOnce(source);
      const encoded = window.ATLAS_DOWNLOAD_PAYLOAD_SHARDS?.[shard]?.[key];
      if (!encoded) throw new Error('copy shard payload is missing');
      bytes = bytesFromBase64(encoded);
    } else {
      throw new Error(`unsupported copy delivery: ${delivery || '(none)'}`);
    }
    const expectedBytes = Number(asset?.bytes || 0);
    if (!bytes.byteLength || (expectedBytes > 0 && bytes.byteLength !== expectedBytes)) throw new Error('copy payload byte mismatch');
    const expectedHash = String(asset?.sha256 || '');
    const actualHash = await sha256Hex(bytes);
    if (expectedHash && actualHash && expectedHash !== actualHash) throw new Error('copy payload hash mismatch');
    const text = new TextDecoder('utf-8').decode(bytes);
    if (!text.trim()) throw new Error('copy payload has no text');
    return text;
  }

  async function handleBlobDownload(link) {
    link.setAttribute('aria-busy', 'true');
    dispatch(link, 'atlas-download-starting');
    try {
      const bytes = await blobBytes(link);
      const expectedHash = link.dataset.downloadSha256;
      const actualHash = await sha256Hex(bytes);
      if (expectedHash && actualHash && expectedHash !== actualHash) throw new Error('download payload hash mismatch');
      triggerBlobDownload(link, bytes);
      dispatch(link, 'atlas-download-started', { bytes: bytes.byteLength, sha256: actualHash || expectedHash });
    } catch (error) {
      dispatch(link, 'atlas-download-failed', { message: String(error?.message || error) });
    } finally {
      link.removeAttribute('aria-busy');
    }
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[data-download-record-id]');
    if (!link) return;
    if (link.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    const delivery = link.dataset.downloadDelivery;
    if (delivery === 'blob-prompt' || delivery === 'blob-shard') {
      event.preventDefault();
      event.stopPropagation();
      handleBlobDownload(link);
      return;
    }
    if (delivery === 'direct-file') {
      const extension = String(link.dataset.downloadFilename || '').match(/\.[A-Za-z0-9]+$/)?.[0]?.toLowerCase() || '';
      if (!['.docx', '.pptx', '.xlsx', '.zip'].includes(extension)) {
        event.preventDefault();
        dispatch(link, 'atlas-download-failed', { message: `unsafe direct-file extension: ${extension || '(none)'}` });
      }
      return;
    }
    event.preventDefault();
    dispatch(link, 'atlas-download-failed', { message: `unknown download delivery: ${delivery || '(none)'}` });
  }, true);

  window.addEventListener('pagehide', () => {
    for (const url of objectUrls) URL.revokeObjectURL(url);
    objectUrls.clear();
  });

  window.ATLAS_DOWNLOAD_RUNTIME = Object.freeze({
    configureLink,
    clearLink,
    readAssetText,
    actionContract: Object.freeze({
      OPEN_PREVIEW: 'preview-only',
      OPEN_DETAILS: 'details-only',
      DOWNLOAD_ARTIFACT: 'download-only-no-preview-fallback'
    })
  });
})();
