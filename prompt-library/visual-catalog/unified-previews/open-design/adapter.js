(() => {
  'use strict';
  const entries = window.OPEN_DESIGN_SPECIMENS_V2?.entries || {};
  const requested = new URLSearchParams(window.location.search).get('id') || '';
  const specimen = entries[requested];
  const text = (selector, value) => { document.querySelector(selector).textContent = value || ''; };
  if (!specimen) {
    text('#specimen-title', '找不到 specimen payload');
    text('#specimen-description', '沒有這筆項目的來源樣本。／No source specimen is available for this entry.');
    return;
  }
  text('#specimen-title', specimen.title);
  text('#specimen-description', specimen.description || '由固定 commit 的 token 與設計文件建立本機證據頁。');
  text('#specimen-category', specimen.category);
  const colorGrid = document.querySelector('#color-grid');
  specimen.colors.forEach((color) => {
    const item = document.createElement('div');
    item.className = 'swatch';
    item.style.backgroundColor = color;
    const label = document.createElement('span');
    label.textContent = color;
    item.append(label);
    colorGrid.append(item);
  });
  const fontList = document.querySelector('#font-list');
  specimen.fonts.forEach((font) => {
    const item = document.createElement('li');
    item.textContent = font;
    fontList.append(item);
  });
  const spacingList = document.querySelector('#spacing-list');
  specimen.spacing.forEach((space) => {
    const item = document.createElement('div');
    item.className = 'spacing-item';
    const label = document.createElement('span');
    label.textContent = space;
    const bar = document.createElement('span');
    bar.className = 'spacing-bar';
    if (/^\d+(?:\.\d+)?(?:px|rem|em)$/u.test(space)) bar.style.width = space;
    item.append(label, bar);
    spacingList.append(item);
  });
  const componentList = document.querySelector('#component-list');
  specimen.components.forEach((component) => {
    const item = document.createElement('span');
    item.textContent = component;
    componentList.append(item);
  });
  const containers = { colors: colorGrid, fonts: fontList, spacing: spacingList, components: componentList };
  for (const [field, container] of Object.entries(containers)) {
    const note = specimen.field_notes?.[field] || (!specimen[field].length
      ? '來源未提供可核對的此類 token；不使用預設值補造。／The source supplies no verifiable token of this type; no default is invented.' : '');
    if (note) {
      const item = document.createElement('p');
      item.className = 'source-field-note';
      item.dataset.field = field;
      item.textContent = note;
      container.after(item);
    }
  }
})();
