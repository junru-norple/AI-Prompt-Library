(() => {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || '';
  const shard = params.get('shard') || '';
  const title = document.querySelector('#graph-title');
  const note = document.querySelector('#graph-note');
  const NS = 'http://www.w3.org/2000/svg';
  const HTML_NS = 'http://www.w3.org/1999/xhtml';

  function fail(message) {
    title.textContent = '工作流圖譜無法載入';
    note.textContent = message;
  }

  function element(name, attributes = {}) {
    const node = document.createElementNS(NS, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function textUnits(value) {
    return [...String(value || '')].reduce((total, character) => total + (/[^\u0000-\u00ff]/u.test(character) ? 1.7 : 1), 0);
  }

  function nodeGeometry(node) {
    const type = String(node.type || 'Node');
    const titleValue = String(node.title || type);
    const longest = Math.max(textUnits(titleValue), textUnits(type));
    const width = Math.max(168, Math.min(280, Math.ceil(longest / 3) * 7.1 + 28));
    const charactersPerLine = Math.max(16, Math.floor((width - 24) / 7.1));
    const titleLines = Math.max(1, Math.ceil(textUnits(titleValue) / charactersPerLine));
    const typeLines = Math.max(1, Math.ceil(textUnits(type) / charactersPerLine));
    const height = Math.max(80, 32 + titleLines * 18 + typeLines * 15);
    return { type, titleValue, width, height };
  }

  function render(record) {
    title.textContent = record.title;
    document.querySelector('#node-count').textContent = record.nodes.length.toLocaleString('en-US');
    document.querySelector('#link-count').textContent = record.links.length.toLocaleString('en-US');
    const svg = document.querySelector('#graph');
    const limitedNodes = record.nodes.slice(0, 120).sort((left, right) => Number(left.x || 0) - Number(right.x || 0) || Number(left.y || 0) - Number(right.y || 0) || String(left.id).localeCompare(String(right.id)));
    const included = new Set(limitedNodes.map((node) => String(node.id)));
    const columns = 6;
    const rows = Math.max(1, Math.ceil(limitedNodes.length / columns));
    const geometries = limitedNodes.map(nodeGeometry);
    const columnWidths = Array.from({ length: columns }, (_, column) => Math.max(168, ...geometries.filter((_, index) => index % columns === column).map((geometry) => geometry.width)));
    const rowHeights = Array.from({ length: rows }, (_, row) => Math.max(72, ...geometries.slice(row * columns, row * columns + columns).map((geometry) => geometry.height)));
    const columnOffsets = [];
    const rowOffsets = [];
    let cursorX = 40;
    let cursorY = 45;
    columnWidths.forEach((width, index) => { columnOffsets[index] = cursorX; cursorX += width + 30; });
    rowHeights.forEach((height, index) => { rowOffsets[index] = cursorY; cursorY += height + 28; });
    const viewWidth = Math.max(1200, cursorX + 10);
    const viewHeight = Math.max(720, cursorY + 20);
    svg.setAttribute('viewBox', `0 0 ${viewWidth} ${viewHeight}`);
    svg.style.width = `${viewWidth}px`;
    svg.style.height = `${viewHeight}px`;
    const positions = new Map();
    limitedNodes.forEach((node, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const geometry = geometries[index];
      const x = columnOffsets[column];
      const y = rowOffsets[row];
      positions.set(String(node.id), { x, y, width: geometry.width, height: geometry.height, geometry });
    });
    const linkLayer = element('g');
    for (const link of record.links) {
      if (!included.has(String(link.from)) || !included.has(String(link.to))) continue;
      const from = positions.get(String(link.from));
      const to = positions.get(String(link.to));
      const path = element('path', {
        class: 'link',
        d: `M ${from.x + from.width} ${from.y + from.height / 2} C ${from.x + from.width + 36} ${from.y + from.height / 2}, ${to.x - 36} ${to.y + to.height / 2}, ${to.x} ${to.y + to.height / 2}`
      });
      linkLayer.append(path);
    }
    svg.append(linkLayer);
    for (const node of limitedNodes) {
      const position = positions.get(String(node.id));
      const { type, titleValue, width, height } = position.geometry;
      const accessibleLabel = titleValue === type ? type : `${titleValue}；${type}`;
      const group = element('g', {
        class: `node ${/api|openai|claude|gemini/i.test(type) ? 'is-api' : ''} ${/save|preview|output/i.test(type) ? 'is-output' : ''}`,
        transform: `translate(${position.x} ${position.y})`, tabindex: 0, role: 'group', 'aria-label': accessibleLabel,
        'data-node-id': String(node.id), 'data-node-title': titleValue, 'data-node-type': type
      });
      const tooltip = element('title');
      tooltip.textContent = accessibleLabel;
      group.append(tooltip, element('rect', { width, height }));
      const foreignObject = element('foreignObject', { x: 12, y: 8, width: width - 24, height: height - 16 });
      const copy = document.createElementNS(HTML_NS, 'div');
      copy.className = 'node-copy';
      const titleText = document.createElementNS(HTML_NS, 'div');
      titleText.className = 'node-title';
      titleText.textContent = titleValue;
      const typeText = document.createElementNS(HTML_NS, 'div');
      typeText.className = 'node-type';
      typeText.textContent = type;
      copy.append(titleText, typeText);
      foreignObject.append(copy);
      group.append(foreignObject);
      svg.append(group);
    }
    if (record.nodes.length > limitedNodes.length) note.textContent += ` 為控制預覽效能，本圖顯示前 ${limitedNodes.length} 個節點；原始 JSON 保留全部 ${record.nodes.length} 個節點。`;
  }

  if (!/^[0-9a-f]$/.test(shard) || !id) {
    fail('缺少安全的條目 ID 或分片。');
    return;
  }
  const preloaded = window.UNIFIED_WORKFLOW_GRAPH_SHARD;
  if (preloaded?.shard === shard) {
    const record = preloaded.entries?.[id];
    if (!record) fail('此分片中找不到指定工作流。');
    else render(record);
    return;
  }
  const script = document.createElement('script');
  script.src = `../../workflow-graph-shards/${shard}.js`;
  script.addEventListener('load', () => {
    const record = window.UNIFIED_WORKFLOW_GRAPH_SHARD?.entries?.[id];
    if (!record) fail('此分片中找不到指定工作流。');
    else render(record);
  });
  script.addEventListener('error', () => fail('本機圖譜分片載入失敗。'));
  document.head.append(script);
})();
