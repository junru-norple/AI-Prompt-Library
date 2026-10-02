(() => {
  'use strict';

  const allowed = new Set(["action-search-bar","ai-input-search","ai-loading","ai-text-loading","ai-voice","apple-activity-card","attract-button","avatar-picker","background-paths","beams-background","card-flip","card-stack","carousel-cards","command-button","currency-transfer","dynamic-text","file-upload","flow-field","glitch-text","gradient-button","hold-button","liquid-glass-card","loader","matrix-text","morphic-navbar","mouse-effect-card","particle-button","scroll-text","shape-hero","shimmer-text","sliced-text","slide-text-button","smooth-tab","social-button","spotlight-cards","switch-button","swoosh-text","team-selector","toolbar","type-writer"]);
  let slug = decodeURIComponent(location.hash.replace(/^#/, ''));
  const root = document.querySelector('#preview');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [];
  const resumeHooks = [];
  let requestedRunning = true;
  let running = requestedRunning && !reducedMotion.matches;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function section(className = 'stage') {
    const node = element('section', className);
    node.dataset.preview = slug;
    return node;
  }

  function panel(title, copy) {
    const node = section('k-panel');
    node.append(element('p', 'k-eyebrow', 'KOKONUT UI · LOCAL STATIC ADAPTATION'));
    node.append(element('h1', 'k-title', title));
    node.append(element('p', 'k-copy', copy));
    return node;
  }

  function adapterStage(marker, extraClass = '') {
    return section(`adapter-stage ${marker}${extraClass ? ` ${extraClass}` : ''}`);
  }

  function statusLine(text = '等待操作') {
    const node = element('p', 'k-status', text);
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    return node;
  }

  function localButton(label, className = 'k-button') {
    const button = element('button', className, label);
    button.type = 'button';
    return button;
  }

  function repeating(callback, delay) {
    let timer = 0;
    const tick = () => {
      if (running) callback();
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, delay);
    cleanups.push(() => window.clearTimeout(timer));
    return () => window.clearTimeout(timer);
  }

  function setPressed(button, active) {
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }

  function renderActionSearchBar() {
    const stage = adapterStage('action-search-adapter');
    const shell = element('div', 'action-search-shell');
    shell.append(element('p', 'k-eyebrow', 'ACTION SEARCH · LOCAL COMMANDS'));
    const input = element('input', 'k-field action-search-input');
    input.type = 'search';
    input.placeholder = '搜尋命令…';
    input.setAttribute('aria-label', '搜尋本機示範命令');
    const list = element('div', 'action-search-results');
    list.setAttribute('role', 'listbox');
    const status = statusLine('按 Ctrl／⌘ + K 可聚焦搜尋');
    let activeIndex = 0;
    const commands = [
      ['建立文件', '⌘ N'], ['搜尋專案', '⌘ P'], ['切換主題', '⌘ T'], ['開啟設定', '⌘ ,']
    ];
    const draw = () => {
      const query = input.value.trim().toLocaleLowerCase();
      const visible = commands.filter(([name]) => name.toLocaleLowerCase().includes(query));
      list.replaceChildren();
      activeIndex = Math.min(activeIndex, Math.max(0, visible.length - 1));
      visible.forEach(([name, key], index) => {
        const option = localButton('', 'action-search-option');
        option.setAttribute('role', 'option');
        option.append(element('span', '', name), element('kbd', '', key));
        option.addEventListener('click', () => { status.textContent = `已選取：${name}（僅示範，不執行命令）`; });
        if (index === activeIndex) option.classList.add('is-active');
        list.append(option);
      });
      if (!visible.length) list.append(element('p', 'action-search-empty', '找不到相符命令'));
    };
    const keyHandler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault(); input.focus(); status.textContent = '命令搜尋已聚焦';
      }
      if (event.key === 'Escape' && document.activeElement === input) { input.value = ''; draw(); input.blur(); }
    };
    input.addEventListener('input', draw);
    input.addEventListener('keydown', (event) => {
      const options = [...list.querySelectorAll('button')];
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % Math.max(1, options.length); draw();
      } else if (event.key === 'Enter' && options[activeIndex]) { event.preventDefault(); options[activeIndex].click(); }
    });
    window.addEventListener('keydown', keyHandler);
    cleanups.push(() => window.removeEventListener('keydown', keyHandler));
    shell.append(input, list, status); stage.append(shell); root.append(stage); draw();
  }

  function renderAIInputSearch() {
    const stage = adapterStage('ai-input-search-adapter');
    const form = element('form', 'ai-input-shell');
    form.append(element('p', 'k-eyebrow', 'AI INPUT · SEARCH MODE'));
    const textarea = element('textarea', 'k-field ai-input-textarea');
    textarea.placeholder = '輸入要整理或搜尋的內容…';
    textarea.setAttribute('aria-label', 'AI 搜尋示範輸入');
    const controls = element('div', 'ai-input-controls');
    const searchToggle = localButton('⌕ 搜尋模式', 'k-button ai-search-toggle');
    searchToggle.setAttribute('aria-pressed', 'true');
    searchToggle.classList.add('is-active');
    const send = localButton('送出 ↗', 'k-button primary');
    const status = statusLine('本機示範不會傳送資料');
    searchToggle.addEventListener('click', () => setPressed(searchToggle, searchToggle.getAttribute('aria-pressed') !== 'true'));
    textarea.addEventListener('input', () => { status.textContent = textarea.value ? `已輸入 ${textarea.value.length} 個字元；資料仍留在本頁` : '本機示範不會傳送資料'; });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      status.textContent = textarea.value.trim() ? `已建立本機示範請求：${textarea.value.trim().slice(0, 28)}` : '請先輸入內容';
    });
    textarea.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') form.requestSubmit();
    });
    controls.append(searchToggle, send); form.append(textarea, controls, status); stage.append(form); root.append(stage);
  }

  function renderAILoading() {
    const stage = adapterStage('ai-loading-adapter');
    const card = element('div', 'ai-loading-card');
    card.append(element('p', 'k-eyebrow', 'AI STATE LOADING'));
    const lines = element('div', 'ai-code-lines');
    ['讀取需求', '整理上下文', '建立回覆', '檢查結果'].forEach((label, index) => {
      const row = element('div', 'ai-code-line'); row.style.setProperty('--i', index); row.append(element('span', '', label), element('i')); lines.append(row);
    });
    const progress = element('div', 'ai-loading-progress');
    const fill = element('span'); progress.append(fill);
    const status = statusLine('處理中：讀取需求');
    let step = 0;
    repeating(() => {
      step = (step + 1) % 5;
      fill.style.width = `${Math.min(step, 4) * 25}%`;
      const rows = [...lines.children]; rows.forEach((row, index) => row.classList.toggle('is-done', index < step));
      status.textContent = step === 4 ? '本機示範完成' : `處理中：${rows[Math.min(step, 3)].querySelector('span').textContent}`;
    }, 950);
    card.append(lines, progress, status); stage.append(card); root.append(stage);
  }

  function renderAIPrompt() {
    const stage = adapterStage('ai-prompt-adapter');
    const form = element('form', 'ai-prompt-shell');
    const top = element('div', 'ai-prompt-top');
    top.append(element('p', 'k-eyebrow', 'AI INPUT SELECTOR'));
    const model = element('select', 'ai-model-select');
    model.setAttribute('aria-label', '選擇本機示範模型');
    ['OpenAI', 'Gemini', 'Anthropic'].forEach((name) => { const option = element('option', '', name); option.value = name; model.append(option); });
    top.append(model);
    const textarea = element('textarea', 'k-field ai-prompt-textarea');
    textarea.placeholder = 'Ask anything…';
    const footer = element('div', 'ai-prompt-footer');
    const attach = localButton('＋', 'k-button ai-attach'); attach.setAttribute('aria-label', '附件示範按鈕');
    const submit = localButton('送出 ↑', 'k-button primary');
    const status = statusLine('不連接任何 AI 服務');
    attach.addEventListener('click', () => { status.textContent = '附件功能僅作介面示範'; });
    textarea.addEventListener('input', () => { status.textContent = textarea.value ? `草稿 ${textarea.value.length} 字元；未連接 AI 服務` : '不連接任何 AI 服務'; });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      status.textContent = textarea.value.trim() ? `已用 ${model.value} 建立本機介面狀態（未送出）` : '請先輸入訊息';
    });
    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
    });
    footer.append(attach, submit); form.append(top, textarea, footer, status); stage.append(form); root.append(stage);
  }

  function renderAITextLoading() {
    const stage = adapterStage('ai-text-loading-adapter');
    const shell = element('div', 'ai-thinking-shell');
    const glyph = element('span', 'ai-thinking-glyph', '✦');
    const text = element('strong', 'ai-thinking-text', 'Thinking');
    const dots = element('span', 'ai-thinking-dots', '');
    shell.append(glyph, text, dots); stage.append(shell); root.append(stage);
    const phases = ['Thinking', 'Reasoning', 'Reviewing']; let phase = 0; let dot = 0;
    repeating(() => {
      dot = (dot + 1) % 4; dots.textContent = '.'.repeat(dot);
      if (dot === 0) { phase = (phase + 1) % phases.length; text.textContent = phases[phase]; }
    }, 420);
  }

  function renderAIVoice() {
    const stage = adapterStage('ai-voice-adapter');
    const shell = element('div', 'ai-voice-shell');
    shell.append(element('p', 'k-eyebrow', 'VOICE MODE · SIMULATED'));
    const waves = element('div', 'ai-voice-waves');
    for (let index = 0; index < 22; index += 1) { const bar = element('span'); bar.style.setProperty('--i', index); waves.append(bar); }
    const timer = element('strong', 'ai-voice-time', '00:00');
    const toggle = localButton('● 開始模擬', 'k-button primary ai-voice-toggle');
    toggle.setAttribute('aria-pressed', 'false');
    const status = statusLine('不會存取麥克風或錄製音訊');
    let seconds = 0;
    toggle.addEventListener('click', () => {
      const active = toggle.getAttribute('aria-pressed') !== 'true'; setPressed(toggle, active);
      shell.classList.toggle('is-recording', active); toggle.textContent = active ? '■ 停止模擬' : '● 開始模擬';
      status.textContent = active ? '模擬語音波形中；沒有麥克風存取' : '模擬已停止';
    });
    repeating(() => {
      if (toggle.getAttribute('aria-pressed') !== 'true') return;
      seconds += 1; timer.textContent = `00:${String(seconds).padStart(2, '0')}`;
    }, 1000);
    shell.append(waves, timer, toggle, status); stage.append(shell); root.append(stage);
  }

  function renderAppleActivityCard() {
    const stage = adapterStage('apple-activity-adapter');
    const card = element('article', 'activity-card');
    const copy = element('div', 'activity-copy');
    copy.append(element('p', 'k-eyebrow', 'DAILY ACTIVITY'), element('h1', 'k-title', 'Close your rings'));
    const rings = element('div', 'activity-rings');
    [['Move', '78%', '#ff3b63'], ['Exercise', '62%', '#d8ff48'], ['Stand', '86%', '#5bd7ff']].forEach(([label, value, color], index) => {
      const ring = element('div', 'activity-ring'); ring.style.setProperty('--value', value); ring.style.setProperty('--ring', color); ring.style.setProperty('--i', index); ring.setAttribute('aria-label', `${label} ${value}`); rings.append(ring);
    });
    const stats = element('div', 'activity-stats');
    [['Move', '468 kcal'], ['Exercise', '19 min'], ['Stand', '10 hr']].forEach(([label, value]) => { const item = element('span'); item.append(element('small', '', label), element('strong', '', value)); stats.append(item); });
    card.append(copy, rings, stats); stage.append(card); root.append(stage);
  }

  function renderAttractButton() {
    const stage = adapterStage('attract-button-adapter');
    const field = element('div', 'attract-field');
    const button = localButton('', 'attract-core'); button.append(element('span', '', 'Explore'), element('i', '', '↗'));
    for (let index = 0; index < 14; index += 1) { const particle = element('span', 'attract-particle'); particle.style.setProperty('--i', index); field.append(particle); }
    const move = (event) => {
      if (!running) return;
      const box = field.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) / box.width;
      const y = (event.clientY - box.top - box.height / 2) / box.height;
      button.style.transform = `translate(${(x * 24).toFixed(1)}px, ${(y * 18).toFixed(1)}px)`;
      field.style.setProperty('--mx', `${event.clientX - box.left}px`); field.style.setProperty('--my', `${event.clientY - box.top}px`);
    };
    field.addEventListener('pointermove', move);
    field.addEventListener('pointerleave', () => { button.style.removeProperty('transform'); });
    button.addEventListener('click', () => { button.querySelector('span').textContent = 'Attracted ✓'; });
    field.append(button); stage.append(field); root.append(stage);
  }

  function renderAvatarPicker() {
    const stage = adapterStage('avatar-picker-adapter');
    const card = element('div', 'avatar-picker-card');
    card.append(element('p', 'k-eyebrow', 'CHOOSE YOUR AVATAR'));
    const orbit = element('div', 'avatar-orbit');
    const names = ['Nova', 'Mika', 'Sol', 'Iris'];
    const selected = element('strong', 'avatar-selected', 'Nova');
    const status = statusLine('已選擇 Nova');
    names.forEach((name, index) => {
      const button = localButton(name.slice(0, 1), 'avatar-choice'); button.style.setProperty('--i', index); button.style.setProperty('--avatar-hue', `${index * 82 + 25}`); button.setAttribute('aria-label', `選擇 ${name}`);
      button.addEventListener('click', () => {
        orbit.querySelectorAll('button').forEach((item) => item.classList.remove('is-active')); button.classList.add('is-active'); selected.textContent = name; status.textContent = `已選擇 ${name}`;
      });
      if (index === 0) button.classList.add('is-active'); orbit.append(button);
    });
    const input = element('input', 'k-field avatar-name'); input.placeholder = '顯示名稱'; input.setAttribute('aria-label', '顯示名稱');
    input.addEventListener('input', () => { status.textContent = input.value.trim() ? `預覽名稱：${input.value.trim()}` : `已選擇 ${selected.textContent}`; });
    card.append(orbit, selected, input, status); stage.append(card); root.append(stage);
  }

  function renderBeamsBackground() {
    const stage = adapterStage('beams-background-adapter', 'beams-stage');
    const field = element('div', 'beams-field');
    for (let index = 0; index < 20; index += 1) { const beam = element('span', 'beam-line'); beam.style.setProperty('--i', index); field.append(beam); }
    const copy = element('div', 'beams-copy'); copy.append(element('p', 'k-eyebrow', 'BEAMS BACKGROUND'), element('h1', 'k-title', 'Signals in motion'), element('p', 'k-copy', 'CSS 光束保留原元件的流動背景概念，不使用遠端資產。'));
    stage.append(field, copy); root.append(stage);
  }

  function renderBentoGrid() {
    const stage = adapterStage('bento-grid-adapter', 'bento-stage');
    const grid = element('div', 'bento-grid');
    const cards = [
      ['Models', 'OpenAI · Gemini · Claude', 'bento-models'],
      ['Prompt', 'Build a focused interface', 'bento-prompt'],
      ['Activity', '12 local interactions', 'bento-activity'],
      ['Insights', '+28% clearer flow', 'bento-insights']
    ];
    cards.forEach(([title, copy, className], index) => {
      const card = localButton('', `bento-item ${className}`); card.setAttribute('aria-pressed', 'false');
      card.append(element('span', 'bento-index', `0${index + 1}`), element('strong', '', title), element('small', '', copy));
      if (className === 'bento-activity') { const bars = element('span', 'bento-bars'); for (let i = 0; i < 7; i += 1) { const bar = element('i'); bar.style.setProperty('--i', i); bars.append(bar); } card.append(bars); }
      card.addEventListener('click', () => setPressed(card, card.getAttribute('aria-pressed') !== 'true'));
      grid.append(card);
    });
    stage.append(grid); root.append(stage);
  }

  function renderCardStack() {
    const stage = adapterStage('card-stack-adapter');
    const stack = element('div', 'card-stack');
    const items = [['Field Notes', 'Research fragments'], ['System Map', 'Architecture overview'], ['Launch Plan', 'Milestones and owners']];
    items.forEach(([title, copy], index) => {
      const card = localButton('', 'stack-card'); card.style.setProperty('--i', index); card.setAttribute('aria-expanded', 'false');
      card.append(element('span', 'stack-art', `${index + 1}`), element('strong', '', title), element('small', '', copy));
      card.addEventListener('click', () => {
        const active = card.getAttribute('aria-expanded') !== 'true';
        stack.querySelectorAll('.stack-card').forEach((item) => { item.classList.remove('is-active'); item.setAttribute('aria-expanded', 'false'); });
        if (active) { card.classList.add('is-active'); card.setAttribute('aria-expanded', 'true'); }
      });
      stack.append(card);
    });
    stage.append(stack); root.append(stage);
  }

  function renderCarouselCards() {
    const stage = adapterStage('carousel-cards-adapter');
    const shell = element('div', 'carousel-shell');
    const viewport = element('div', 'carousel-viewport');
    const slides = [['Night Drive', 'Motion study'], ['Quiet Grid', 'Editorial system'], ['Signal Bloom', 'Generative color']];
    let current = 0;
    slides.forEach(([title, copy], index) => {
      const card = element('article', 'carousel-card'); card.style.setProperty('--card-hue', `${index * 95 + 215}`);
      const favorite = localButton('♡', 'carousel-favorite'); favorite.setAttribute('aria-label', `收藏 ${title}`); favorite.setAttribute('aria-pressed', 'false');
      favorite.addEventListener('click', () => { const active = favorite.getAttribute('aria-pressed') !== 'true'; setPressed(favorite, active); favorite.textContent = active ? '♥' : '♡'; });
      card.append(favorite, element('span', 'carousel-art'), element('strong', '', title), element('small', '', copy)); viewport.append(card);
    });
    const controls = element('div', 'carousel-controls'); const prev = localButton('←', 'k-button'); const next = localButton('→', 'k-button'); const status = statusLine('1 / 3');
    const draw = () => { viewport.style.transform = `translateX(${-current * 100}%)`; status.textContent = `${current + 1} / ${slides.length}`; };
    prev.addEventListener('click', () => { current = (current - 1 + slides.length) % slides.length; draw(); });
    next.addEventListener('click', () => { current = (current + 1) % slides.length; draw(); });
    controls.append(prev, status, next); shell.append(viewport, controls); stage.append(shell); root.append(stage);
  }

  function renderCurrencyTransfer() {
    const stage = adapterStage('currency-transfer-adapter');
    const card = element('div', 'transfer-card');
    card.append(element('p', 'k-eyebrow', 'TRANSFER · UI SIMULATION'));
    const amounts = element('div', 'transfer-amounts');
    amounts.append(element('span', '', 'USD 1,250.00'), element('b', '', '↓'), element('span', '', 'EUR 1,148.35'));
    const steps = element('ol', 'transfer-steps');
    ['Review', 'Authorise', 'Complete'].forEach((name) => { const row = element('li'); row.append(element('i'), element('span', '', name)); steps.append(row); });
    const button = localButton('開始介面示範', 'k-button primary transfer-action'); const status = statusLine('不會進行付款或金融交易'); let timer = 0;
    button.addEventListener('click', () => {
      window.clearInterval(timer); let index = 0; [...steps.children].forEach((item) => item.classList.remove('is-done'));
      status.textContent = '步驟 1：Review'; button.disabled = true;
      timer = window.setInterval(() => {
        if (!running) return;
        steps.children[index]?.classList.add('is-done'); index += 1;
        status.textContent = index >= 3 ? '介面示範完成；未進行交易' : `步驟 ${index + 1}：${steps.children[index].textContent}`;
        if (index >= 3) { window.clearInterval(timer); button.disabled = false; button.textContent = '重新示範'; }
      }, 650);
    });
    cleanups.push(() => window.clearInterval(timer)); card.append(amounts, steps, button, status); stage.append(card); root.append(stage);
  }

  function renderDynamicText() {
    const stage = adapterStage('dynamic-text-adapter');
    const shell = element('div', 'dynamic-text-shell');
    shell.append(element('span', 'dynamic-prefix', 'Make it'));
    const word = element('strong', 'dynamic-word', 'focused'); shell.append(word); stage.append(shell); root.append(stage);
    const words = ['focused', 'useful', 'delightful', 'local-first']; let index = 0;
    repeating(() => { shell.classList.remove('is-entered'); index = (index + 1) % words.length; word.textContent = words[index]; requestAnimationFrame(() => shell.classList.add('is-entered')); }, 1450);
    shell.classList.add('is-entered');
  }

  function renderFileUpload() {
    const stage = adapterStage('file-upload-adapter');
    const shell = element('div', 'file-upload-shell');
    shell.append(element('p', 'k-eyebrow', 'LOCAL FILE UI · NO UPLOAD'));
    const drop = element('div', 'file-drop-zone'); drop.tabIndex = 0; drop.setAttribute('role', 'button'); drop.setAttribute('aria-label', '模擬本機檔案選擇');
    drop.append(element('span', 'file-upload-icon', '⇧'), element('strong', '', '拖放檔案或點擊選擇'), element('small', '', '檔案只用於本機介面示範'));
    const progress = element('div', 'file-progress'); const fill = element('span'); progress.append(fill);
    const status = statusLine('未選擇檔案'); let timer = 0;
    const simulate = () => {
      const demoName = 'design-system.zip'; window.clearInterval(timer); let value = 0; fill.style.width = '0%';
      status.textContent = `本機假資料：${demoName}`;
      timer = window.setInterval(() => {
        if (!running) return; value += 10; fill.style.width = `${value}%`;
        if (value >= 100) { window.clearInterval(timer); status.textContent = `${demoName}：介面模擬完成，未開啟或上傳檔案`; }
      }, 100);
    };
    drop.addEventListener('click', simulate);
    drop.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); simulate(); } });
    const showDragState = (event) => { event.preventDefault(); drop.classList.add('is-dragging'); };
    const clearDragState = (event) => { event.preventDefault(); drop.classList.remove('is-dragging'); };
    drop.addEventListener('dragenter', showDragState);
    drop.addEventListener('dragover', showDragState);
    drop.addEventListener('dragleave', clearDragState);
    drop.addEventListener('drop', (event) => { clearDragState(event); simulate(); });
    cleanups.push(() => window.clearInterval(timer)); shell.append(drop, progress, status); stage.append(shell); root.append(stage);
  }

  function renderFlowField() {
    const stage = adapterStage('flow-field-adapter', 'flow-field-stage');
    const canvas = element('canvas', 'flow-field-canvas'); canvas.width = 640; canvas.height = 300; canvas.setAttribute('aria-label', '本機粒子流場動畫');
    const context = canvas.getContext('2d');
    const points = Array.from({ length: 72 }, (_, index) => ({ x: (index * 83) % canvas.width, y: (index * 47) % canvas.height, phase: index * .37 }));
    const pointer = { x: canvas.width / 2, y: canvas.height / 2 };
    let frame = 0; let raf = 0;
    const draw = () => {
      raf = 0;
      if (running && context) {
        frame += .018; context.fillStyle = 'rgba(9,10,15,.2)'; context.fillRect(0, 0, canvas.width, canvas.height);
        points.forEach((point, index) => {
          const angle = Math.sin(point.y * .014 + frame + point.phase) + Math.cos(point.x * .012 - frame);
          const dx = pointer.x - point.x; const dy = pointer.y - point.y; const distance = Math.max(42, Math.hypot(dx, dy));
          point.x += Math.cos(angle) * 1.25 + dx / distance * .08; point.y += Math.sin(angle) * 1.25 + dy / distance * .08;
          if (point.x < 0) point.x = canvas.width; if (point.x > canvas.width) point.x = 0; if (point.y < 0) point.y = canvas.height; if (point.y > canvas.height) point.y = 0;
          context.fillStyle = `hsla(${180 + (index % 8) * 9},90%,65%,.7)`; context.beginPath(); context.arc(point.x, point.y, 1.35, 0, Math.PI * 2); context.fill();
        });
        raf = requestAnimationFrame(draw);
      }
    };
    canvas.addEventListener('pointermove', (event) => { const box = canvas.getBoundingClientRect(); pointer.x = (event.clientX - box.left) / box.width * canvas.width; pointer.y = (event.clientY - box.top) / box.height * canvas.height; });
    const copy = element('div', 'flow-field-copy'); copy.append(element('p', 'k-eyebrow', 'FLOW FIELD'), element('strong', '', 'Move through the current'));
    const ensureFlowAnimation = () => { if (running && !raf) raf = requestAnimationFrame(draw); };
    stage.append(canvas, copy); root.append(stage); ensureFlowAnimation(); resumeHooks.push(ensureFlowAnimation); cleanups.push(() => { if (raf) cancelAnimationFrame(raf); raf = 0; });
  }

  function renderGlitchText() {
    const stage = adapterStage('glitch-text-adapter');
    const text = element('strong', 'glitch-word', 'SIGNAL'); text.dataset.text = 'SIGNAL'; text.tabIndex = 0;
    const status = statusLine('將指標移到文字上查看故障效果');
    text.addEventListener('click', () => { text.classList.toggle('is-active'); status.textContent = text.classList.contains('is-active') ? 'Glitch 已鎖定' : 'Glitch 依 hover 顯示'; });
    stage.append(text, status); root.append(stage);
  }

  function renderGradientButton() {
    const stage = adapterStage('gradient-button-adapter');
    const button = localButton('', 'gradient-action'); button.append(element('span', '', 'Create project'), element('i', '', '↗'));
    const status = statusLine('漸層邊框會跟隨 hover 與 focus');
    button.addEventListener('click', () => { button.classList.toggle('is-complete'); button.querySelector('span').textContent = button.classList.contains('is-complete') ? 'Project ready ✓' : 'Create project'; status.textContent = '僅更新本機介面狀態'; });
    stage.append(button, status); root.append(stage);
  }

  function renderLiquidGlassCard() {
    const stage = adapterStage('liquid-glass-adapter', 'liquid-stage');
    const backdrop = element('div', 'liquid-backdrop'); backdrop.append(element('span'), element('span'), element('span'));
    const card = element('article', 'liquid-card');
    const art = element('div', 'liquid-art'); art.append(element('span', '', 'LOCAL'), element('strong', '', 'Aurora No. 7'));
    const meta = element('div', 'liquid-meta'); meta.append(element('p', 'k-eyebrow', 'LIQUID GLASS'), element('h1', 'k-title', 'Ambient collection'), element('p', 'k-copy', '以本機 CSS 幾何取代上游遠端圖片。'));
    const action = localButton('播放預覽 ▶', 'k-button liquid-action'); const status = statusLine('等待操作');
    action.addEventListener('click', () => { const active = card.classList.toggle('is-playing'); action.textContent = active ? '暫停預覽 Ⅱ' : '播放預覽 ▶'; status.textContent = active ? '正在播放本機視覺狀態' : '預覽已暫停'; });
    card.append(art, meta, action, status); stage.append(backdrop, card); root.append(stage);
  }

  function renderLoader() {
    const stage = adapterStage('loader-adapter');
    const shell = element('div', 'loader-showcase');
    shell.append(element('p', 'k-eyebrow', 'LOADER SYSTEM'));
    const variants = element('div', 'loader-variants');
    const orbit = element('span', 'loader-orbit'); orbit.append(element('i'));
    const bars = element('span', 'loader-bars'); for (let index = 0; index < 5; index += 1) { const bar = element('i'); bar.style.setProperty('--i', index); bars.append(bar); }
    const dots = element('span', 'loader-dots'); for (let index = 0; index < 3; index += 1) { const dot = element('i'); dot.style.setProperty('--i', index); dots.append(dot); }
    variants.append(orbit, bars, dots); shell.append(variants, element('p', 'k-copy', '三種純 CSS 載入狀態，會遵循 reduced motion。')); stage.append(shell); root.append(stage);
  }

  function renderMatrixText() {
    const stage = adapterStage('matrix-text-adapter');
    const shell = element('div', 'matrix-text-shell'); const output = element('strong', 'matrix-output', 'LOCAL FIRST'); output.setAttribute('aria-label', 'LOCAL FIRST'); shell.append(output); stage.append(shell); root.append(stage);
    const target = 'LOCAL FIRST'; const alphabet = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ'; let frame = 0;
    repeating(() => {
      frame = (frame + 1) % (target.length * 3);
      output.textContent = [...target].map((char, index) => char === ' ' ? ' ' : index * 3 < frame ? char : alphabet[(frame + index * 7) % alphabet.length]).join('');
    }, 90);
  }

  function renderMorphicNavbar() {
    const stage = adapterStage('morphic-navbar-adapter');
    const nav = element('nav', 'morphic-nav'); nav.setAttribute('aria-label', '本機示範導覽');
    const indicator = element('span', 'morphic-indicator'); nav.append(indicator);
    const status = statusLine('目前：Home');
    ['Home', 'Work', 'Notes', 'About'].forEach((label, index) => {
      const button = localButton(label, 'morphic-item'); button.dataset.index = index; button.classList.toggle('is-active', index === 0);
      button.addEventListener('click', () => {
        nav.querySelectorAll('button').forEach((item) => item.classList.remove('is-active')); button.classList.add('is-active'); indicator.style.setProperty('--index', index); status.textContent = `目前：${label}`;
      });
      nav.append(button);
    });
    nav.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const buttons = [...nav.querySelectorAll('button')]; const current = buttons.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus(); buttons[next].click();
    });
    stage.append(nav, status); root.append(stage);
  }

  function renderMouseEffectCard() {
    const stage = adapterStage('mouse-effect-card-adapter');
    const card = element('article', 'mouse-effect-card'); card.tabIndex = 0;
    const art = element('div', 'mouse-card-art'); art.append(element('span', '', 'A'), element('span', '', 'T'), element('span', '', 'L'), element('span', '', 'A'), element('span', '', 'S'));
    card.append(element('p', 'k-eyebrow', 'POINTER FIELD'), element('h1', 'k-title', 'Move with intent'), element('p', 'k-copy', '指標位置控制卡片光暈與傾斜。'), art);
    const move = (event) => {
      if (!running) return; const box = card.getBoundingClientRect(); const x = (event.clientX - box.left) / box.width; const y = (event.clientY - box.top) / box.height;
      card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`); card.style.setProperty('--rx', `${(6 - y * 12).toFixed(2)}deg`); card.style.setProperty('--ry', `${(x * 12 - 6).toFixed(2)}deg`);
    };
    card.addEventListener('pointermove', move); card.addEventListener('pointerleave', () => { card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); });
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter') card.classList.toggle('is-active'); });
    stage.append(card); root.append(stage);
  }

  function renderParticleButton() {
    const stage = adapterStage('particle-button-adapter');
    const shell = element('div', 'particle-action-shell'); const button = localButton('Generate spark ✦', 'particle-action'); const status = statusLine('點擊產生本機粒子');
    button.addEventListener('click', () => {
      shell.querySelectorAll('.particle-dot').forEach((item) => item.remove());
      for (let index = 0; index < 18; index += 1) { const dot = element('i', 'particle-dot'); dot.style.setProperty('--i', index); shell.append(dot); window.setTimeout(() => dot.remove(), 900); }
      status.textContent = '已產生 18 個本機裝飾粒子';
    });
    shell.append(button); stage.append(shell, status); root.append(stage);
  }

  function renderProfileDropdown() {
    const stage = adapterStage('profile-dropdown-adapter');
    const shell = element('div', 'profile-menu-shell');
    const trigger = localButton('', 'profile-trigger'); trigger.setAttribute('aria-expanded', 'false'); trigger.append(element('span', 'profile-avatar', 'JL'), element('span', '', 'Jamie Lin'), element('i', '', '⌄'));
    const menu = element('div', 'profile-menu'); menu.hidden = true; menu.setAttribute('role', 'menu');
    [['Profile', '⌁'], ['Preferences', '⚙'], ['Usage', '◫'], ['Sign out demo', '↪']].forEach(([label, icon]) => { const item = localButton('', 'profile-menu-item'); item.setAttribute('role', 'menuitem'); item.append(element('span', '', icon), element('span', '', label)); menu.append(item); });
    const status = statusLine('選單已關閉');
    trigger.addEventListener('click', () => { const open = trigger.getAttribute('aria-expanded') !== 'true'; trigger.setAttribute('aria-expanded', String(open)); menu.hidden = !open; status.textContent = open ? '選單已開啟' : '選單已關閉'; });
    menu.addEventListener('click', (event) => { const item = event.target.closest('button'); if (!item) return; status.textContent = `已選取：${item.textContent.trim()}（僅示範）`; menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); });
    const close = () => { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    const keyHandler = (event) => { if (event.key === 'Escape' && !menu.hidden) { close(); trigger.focus(); status.textContent = '選單已關閉'; } };
    const outsideHandler = (event) => { if (!shell.contains(event.target)) close(); };
    window.addEventListener('keydown', keyHandler); document.addEventListener('pointerdown', outsideHandler);
    cleanups.push(() => { window.removeEventListener('keydown', keyHandler); document.removeEventListener('pointerdown', outsideHandler); });
    shell.append(trigger, menu, status); stage.append(shell); root.append(stage);
  }

  function renderScrollText() {
    const stage = adapterStage('scroll-text-adapter');
    const viewport = element('div', 'scroll-text-viewport'); viewport.tabIndex = 0;
    const track = element('div', 'scroll-text-track');
    ['Observe', 'the rhythm', 'of local', 'interfaces', 'as you scroll'].forEach((line, index) => { const item = element('strong', 'scroll-text-line', line); item.style.setProperty('--i', index); track.append(item); });
    const status = statusLine('在框內滾動查看文字轉場');
    viewport.addEventListener('scroll', () => {
      const progress = viewport.scrollTop / Math.max(1, viewport.scrollHeight - viewport.clientHeight); viewport.style.setProperty('--scroll', progress.toFixed(3)); status.textContent = `滾動進度 ${Math.round(progress * 100)}%`;
    });
    viewport.append(track, element('div', 'scroll-text-spacer')); stage.append(viewport, status); root.append(stage);
  }

  function renderShapeHero() {
    const stage = adapterStage('shape-hero-adapter', 'shape-hero-stage');
    const shapes = element('div', 'shape-field');
    for (let index = 0; index < 12; index += 1) { const shape = element('span', `hero-shape shape-${index % 4}`); shape.style.setProperty('--i', index); shapes.append(shape); }
    const copy = element('div', 'shape-hero-copy'); copy.append(element('p', 'k-eyebrow', 'SHAPES HERO'), element('h1', 'k-title', 'Ideas find their form'), element('p', 'k-copy', '使用系統字型與本機 CSS 幾何重現落下圖形。'));
    const action = localButton('Explore forms', 'k-button primary'); action.addEventListener('click', () => stage.classList.toggle('is-shuffled')); copy.append(action);
    stage.append(shapes, copy); root.append(stage);
  }

  function renderShimmerText() {
    const stage = adapterStage('shimmer-text-adapter');
    const text = element('strong', 'shimmer-word', 'Build something clear'); text.tabIndex = 0;
    const status = statusLine('純 CSS shimmer；reduced motion 時會暫停');
    text.addEventListener('click', () => { text.classList.toggle('is-wide'); status.textContent = text.classList.contains('is-wide') ? '字距已展開' : '字距已還原'; });
    stage.append(text, status); root.append(stage);
  }

  function renderSlicedText() {
    const stage = adapterStage('sliced-text-adapter');
    const button = localButton('', 'sliced-word'); button.setAttribute('aria-label', '切片文字互動'); button.setAttribute('aria-pressed', 'false');
    button.append(element('span', 'slice-top', 'MOTION'), element('span', 'slice-bottom', 'MOTION'), element('i', '', 'MOTION'));
    const status = statusLine('Hover 或點擊查看切片位移');
    button.addEventListener('click', () => { const active = button.getAttribute('aria-pressed') !== 'true'; setPressed(button, active); status.textContent = active ? '切片狀態已鎖定' : '切片狀態依 hover 顯示'; });
    stage.append(button, status); root.append(stage);
  }

  function renderSlideTextButton() {
    const stage = adapterStage('slide-text-button-adapter');
    const button = localButton('', 'slide-text-action'); button.append(element('span', 'slide-label', 'Discover'), element('span', 'slide-label clone', 'Open locally ↗'));
    const status = statusLine('不會導向外部網站');
    button.addEventListener('click', () => { button.classList.toggle('is-active'); status.textContent = button.classList.contains('is-active') ? '第二層文字已固定' : '依 hover 顯示第二層文字'; });
    stage.append(button, status); root.append(stage);
  }

  function renderSocialButton() {
    const stage = adapterStage('social-button-adapter');
    const shell = element('div', 'social-action-shell'); const trigger = localButton('Share', 'social-trigger'); trigger.setAttribute('aria-expanded', 'false');
    const items = element('div', 'social-items');
    [['Copy', '⧉'], ['Mail', '✉'], ['Save', '↓']].forEach(([label, icon]) => { const button = localButton(icon, 'social-item'); button.setAttribute('aria-label', label); items.append(button); });
    const status = statusLine('所有按鈕只更新本機狀態');
    const setOpen = (open) => { shell.classList.toggle('is-open', open); trigger.setAttribute('aria-expanded', String(open)); };
    trigger.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'));
    shell.addEventListener('pointerenter', () => setOpen(true)); shell.addEventListener('pointerleave', () => setOpen(false));
    items.addEventListener('click', (event) => { const button = event.target.closest('button'); if (button) status.textContent = `已選取：${button.getAttribute('aria-label')}（示範）`; });
    shell.append(trigger, items); stage.append(shell, status); root.append(stage);
  }

  function renderSwitchButton() {
    const stage = adapterStage('switch-button-adapter');
    const shell = element('div', 'theme-switch-shell'); shell.dataset.theme = 'dark';
    const copy = element('div', 'theme-preview'); copy.append(element('p', 'k-eyebrow', 'LOCAL THEME'), element('h1', 'k-title', 'Quiet contrast'));
    const toggle = localButton('', 'theme-toggle'); toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', 'false'); toggle.append(element('span', 'theme-thumb', '☾'), element('span', 'theme-label', 'Dark'));
    const status = statusLine('只切換此預覽，不讀寫系統主題');
    toggle.addEventListener('click', () => {
      const light = toggle.getAttribute('aria-checked') !== 'true'; toggle.setAttribute('aria-checked', String(light)); shell.dataset.theme = light ? 'light' : 'dark'; toggle.querySelector('.theme-thumb').textContent = light ? '☀' : '☾'; toggle.querySelector('.theme-label').textContent = light ? 'Light' : 'Dark'; status.textContent = `本機預覽：${light ? 'Light' : 'Dark'}`;
    });
    shell.append(copy, toggle, status); stage.append(shell); root.append(stage);
  }

  function renderSwooshText() {
    const stage = adapterStage('swoosh-text-adapter');
    const shell = element('div', 'swoosh-shell'); const word = element('strong', 'swoosh-word', 'MOVE'); const trail = element('span', 'swoosh-trail'); trail.setAttribute('aria-hidden', 'true'); shell.append(word, trail); stage.append(shell); root.append(stage);
  }

  function renderTeamSelector() {
    const stage = adapterStage('team-selector-adapter');
    const shell = element('div', 'team-selector-shell'); shell.append(element('p', 'k-eyebrow', 'SELECT A TEAM'));
    const list = element('div', 'team-list'); list.setAttribute('role', 'listbox'); const status = statusLine('已選擇 Atlas');
    [['Atlas', 'AT', 'Design systems'], ['Orbit', 'OR', 'Product motion'], ['North', 'NO', 'Research']].forEach(([name, initials, copy], index) => {
      const button = localButton('', 'team-option'); button.setAttribute('role', 'option'); button.setAttribute('aria-selected', String(index === 0)); button.classList.toggle('is-active', index === 0);
      button.append(element('span', 'team-avatar', initials), element('span', 'team-copy'), element('i', '', '✓')); button.querySelector('.team-copy').append(element('strong', '', name), element('small', '', copy));
      button.addEventListener('click', () => { list.querySelectorAll('button').forEach((item) => { item.classList.remove('is-active'); item.setAttribute('aria-selected', 'false'); }); button.classList.add('is-active'); button.setAttribute('aria-selected', 'true'); status.textContent = `已選擇 ${name}`; });
      list.append(button);
    });
    shell.append(list, status); stage.append(shell); root.append(stage);
  }

  function renderTweetCard() {
    const stage = adapterStage('tweet-card-adapter');
    const card = element('article', 'tweet-card');
    const head = element('div', 'tweet-head'); head.append(element('span', 'tweet-avatar', 'K'), element('span', 'tweet-user'), element('b', '', '𝕏')); head.querySelector('.tweet-user').append(element('strong', '', 'Kokonut UI'), element('small', '', '@kokonut_ui'));
    const copy = element('p', 'tweet-copy', 'Small interactions make local tools easier to understand.');
    const meta = element('p', 'tweet-meta', '10:32 · Aug 9 · Local preview');
    const actions = element('div', 'tweet-actions'); const like = localButton('♡ 128', 'tweet-like'); like.setAttribute('aria-pressed', 'false');
    like.addEventListener('click', () => { const active = like.getAttribute('aria-pressed') !== 'true'; setPressed(like, active); like.textContent = active ? '♥ 129' : '♡ 128'; });
    actions.append(like, element('span', '', '↻ 24'), element('span', '', '◌ 8')); card.append(head, copy, meta, actions); stage.append(card); root.append(stage);
  }

  function renderCommandButton() {
    const stage = section();
    const button = element('button', 'command-button');
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.append(element('span', 'command-icon', '⌘'), element('span', '', 'CMD + K'), element('span', 'command-sheen'));
    const status = element('p', 'k-status', '點擊按鈕查看狀態回饋');
    status.setAttribute('role', 'status');
    button.addEventListener('click', () => {
      const active = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(active));
      status.textContent = active ? '命令面板狀態已啟用' : '命令面板狀態已關閉';
    });
    stage.append(button, status);
    root.append(stage);
  }

  function renderCardFlip() {
    const stage = section();
    const shell = element('button', 'flip-shell');
    shell.type = 'button';
    shell.setAttribute('aria-label', '翻轉設計系統卡片');
    shell.setAttribute('aria-pressed', 'false');
    const card = element('span', 'flip-card');
    const front = element('span', 'flip-face flip-front');
    front.append(element('span', 'flip-orbit'), element('strong', '', 'Design Systems'), element('small', '', 'Explore the fundamentals'), element('em', '', '↻'));
    const back = element('span', 'flip-face flip-back');
    back.append(element('strong', '', 'Design Systems'), element('small', '', 'Dive into modern UI/UX design.'));
    const list = element('span', 'flip-list');
    ['UI/UX', 'Modern Design', 'Tailwind CSS', 'Kokonut UI'].forEach((item) => list.append(element('span', '', `→ ${item}`)));
    back.append(list, element('span', 'flip-cta', 'Start today →'));
    card.append(front, back);
    shell.append(card);
    const setFlip = (active) => { shell.classList.toggle('is-flipped', active); shell.setAttribute('aria-pressed', String(active)); };
    shell.addEventListener('mouseenter', () => setFlip(true));
    shell.addEventListener('mouseleave', () => setFlip(false));
    shell.addEventListener('click', () => setFlip(!shell.classList.contains('is-flipped')));
    stage.append(shell);
    root.append(stage);
  }

  function renderHoldButton() {
    const node = panel('Hold Button', '按住以確認；放開會重設進度。');
    const button = element('button', 'hold-button');
    button.type = 'button';
    button.append(element('span', 'hold-progress'), element('span', 'hold-label', '⌫  Hold me'));
    const status = element('p', 'k-status', '等待操作');
    status.setAttribute('role', 'status');
    let completionTimer = 0;
    const stop = () => {
      window.clearTimeout(completionTimer);
      button.classList.remove('is-holding');
      button.querySelector('.hold-label').textContent = '⌫  Hold me';
      if (status.textContent !== '操作已確認') status.textContent = '已放開；進度重設';
    };
    const start = (event) => {
      event.preventDefault();
      if (!running) return;
      window.clearTimeout(completionTimer);
      button.classList.add('is-holding');
      button.querySelector('.hold-label').textContent = 'Release';
      status.textContent = '持續按住…';
      completionTimer = window.setTimeout(() => {
        if (!running) return;
        status.textContent = '操作已確認';
        button.classList.remove('is-holding');
        button.querySelector('.hold-label').textContent = '✓  Complete';
      }, 1600);
    };
    button.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((name) => button.addEventListener(name, stop));
    button.addEventListener('keydown', (event) => { if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) start(event); });
    button.addEventListener('keyup', (event) => { if (event.key === ' ' || event.key === 'Enter') stop(); });
    cleanups.push(() => window.clearTimeout(completionTimer));
    node.append(button, status);
    root.append(node);
  }

  function renderBackgroundPaths() {
    const stage = section('stage');
    stage.classList.add('paths-stage');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 900 360');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '流動漸層路徑背景');
    for (let index = 0; index < 18; index += 1) {
      const pathNode = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const y = 40 + index * 16;
      pathNode.setAttribute('d', `M -50 ${y} C 180 ${y - 100}, 300 ${y + 105}, 490 ${y - 20} S 760 ${y + 85}, 950 ${y - 55}`);
      pathNode.style.setProperty('--i', index);
      svg.append(pathNode);
    }
    const heading = element('div', 'paths-copy');
    heading.append(element('p', 'k-eyebrow', 'BACKGROUND PATHS'), element('h1', 'k-title', 'Flow with intention'));
    stage.append(svg, heading);
    root.append(stage);
  }

  function buildToolbarButton(label, symbol) {
    const button = element('button', '', label);
    button.type = 'button';
    button.prepend(element('span', 'toolbar-icon', symbol));
    return button;
  }

  function renderToolbar() {
    const stage = section();
    const toolbar = element('div', 'component-toolbar');
    toolbar.setAttribute('role', 'toolbar');
    const status = element('p', 'toolbar-status', '選取：Pointer');
    status.setAttribute('role', 'status');
    [['Pointer', '↖'], ['Frame', '□'], ['Comment', '◌'], ['Share', '↗']].forEach(([label, symbol], index) => {
      const button = buildToolbarButton(label, symbol);
      button.classList.toggle('is-active', index === 0);
      button.addEventListener('click', () => {
        toolbar.querySelectorAll('button').forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
        status.textContent = `選取：${label}`;
      });
      toolbar.append(button);
    });
    stage.append(toolbar, status);
    root.append(stage);
  }

  function renderSmoothTab() {
    const stage = section('tab-demo');
    const card = element('div', 'tab-card');
    const tabs = element('div', 'smooth-tabs');
    tabs.setAttribute('role', 'tablist');
    const items = [
      ['overview', 'Overview', 'Realtime product overview', 'Track the signal that matters.'],
      ['activity', 'Activity', 'Recent team activity', 'See changes without leaving context.'],
      ['insights', 'Insights', 'Focused performance insights', 'Compare trends and decide faster.'],
      ['settings', 'Settings', 'Workspace controls', 'Tune permissions and preferences.']
    ];
    const activate = (id) => {
      const item = items.find(([value]) => value === id);
      card.replaceChildren(element('p', 'k-eyebrow', item[1]), element('h1', 'k-title', item[2]), element('p', 'k-copy', item[3]));
      tabs.querySelectorAll('button').forEach((button) => {
        const selected = button.dataset.tab === id;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
    };
    items.forEach(([id, label]) => {
      const button = element('button', '', label);
      button.type = 'button';
      button.dataset.tab = id;
      button.setAttribute('role', 'tab');
      button.addEventListener('click', () => activate(id));
      tabs.append(button);
    });
    stage.append(card, tabs);
    root.append(stage);
    activate('overview');
  }

  function renderTypeWriter() {
    const stage = section('typewriter-stage');
    const line = element('p', 'typewriter-line');
    const text = element('span');
    const cursor = element('span', 'typewriter-cursor');
    cursor.setAttribute('aria-hidden', 'true');
    line.append(text, cursor);
    stage.append(line);
    root.append(stage);
    const sequences = ['Typewriter', 'Multiple Words', 'Auto Loop'];
    let sequenceIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const target = sequences[sequenceIndex];
      if (!running) { timer = window.setTimeout(tick, 180); return; }
      charIndex += deleting ? -1 : 1;
      text.textContent = target.slice(0, Math.max(0, charIndex));
      let delay = deleting ? 45 : 75;
      if (!deleting && charIndex >= target.length) { deleting = true; delay = 850; }
      if (deleting && charIndex <= 0) { deleting = false; sequenceIndex = (sequenceIndex + 1) % sequences.length; delay = 180; }
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 220);
    cleanups.push(() => window.clearTimeout(timer));
  }

  function renderSpotlightCards() {
    const stage = section('spotlight-stage');
    const heading = element('div', 'spotlight-heading');
    heading.append(element('p', 'k-eyebrow', 'FEATURES'), element('h1', 'k-title', 'Everything you need'));
    const grid = element('div', 'spotlight-grid');
    [['Instant', 'Sub-100ms feedback', '#f59e0b'], ['Secure', 'Zero-trust by default', '#60a5fa'], ['Global', 'Designed for every region', '#34d399'], ['Developer first', 'Clear tools and honest docs', '#a78bfa'], ['Scalable', 'Grows with your project', '#38bdf8'], ['Local ready', 'No remote preview assets', '#f472b6']].forEach(([title, copy, color]) => {
      const card = element('article', 'spotlight-card');
      card.style.setProperty('--spot', color);
      card.append(element('span', 'spotlight-icon', '✦'), element('strong', '', title), element('small', '', copy));
      card.addEventListener('pointermove', (event) => {
        if (!running) return;
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - .5;
        const y = (event.clientY - box.top) / box.height - .5;
        card.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
        card.style.setProperty('--gx', `${((x + .5) * 100).toFixed(1)}%`);
        card.style.setProperty('--gy', `${((y + .5) * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerenter', () => grid.classList.add('has-focus'));
      card.addEventListener('pointerleave', () => {
        grid.classList.remove('has-focus');
        card.style.removeProperty('--rx'); card.style.removeProperty('--ry');
      });
      grid.append(card);
    });
    stage.append(heading, grid);
    root.append(stage);
  }

  const renderers = {
    'action-search-bar': renderActionSearchBar,
    'ai-input-search': renderAIInputSearch,
    'ai-loading': renderAILoading,
    'ai-prompt': renderAIPrompt,
    'ai-text-loading': renderAITextLoading,
    'ai-voice': renderAIVoice,
    'apple-activity-card': renderAppleActivityCard,
    'attract-button': renderAttractButton,
    'avatar-picker': renderAvatarPicker,
    'background-paths': renderBackgroundPaths,
    'beams-background': renderBeamsBackground,
    'bento-grid': renderBentoGrid,
    'card-flip': renderCardFlip,
    'card-stack': renderCardStack,
    'carousel-cards': renderCarouselCards,
    'command-button': renderCommandButton,
    'currency-transfer': renderCurrencyTransfer,
    'dynamic-text': renderDynamicText,
    'file-upload': renderFileUpload,
    'flow-field': renderFlowField,
    'glitch-text': renderGlitchText,
    'gradient-button': renderGradientButton,
    'hold-button': renderHoldButton,
    'liquid-glass-card': renderLiquidGlassCard,
    'loader': renderLoader,
    'matrix-text': renderMatrixText,
    'morphic-navbar': renderMorphicNavbar,
    'mouse-effect-card': renderMouseEffectCard,
    'particle-button': renderParticleButton,
    'profile-dropdown': renderProfileDropdown,
    'scroll-text': renderScrollText,
    'shape-hero': renderShapeHero,
    'shimmer-text': renderShimmerText,
    'sliced-text': renderSlicedText,
    'slide-text-button': renderSlideTextButton,
    'smooth-tab': renderSmoothTab,
    'social-button': renderSocialButton,
    'spotlight-cards': renderSpotlightCards,
    'switch-button': renderSwitchButton,
    'swoosh-text': renderSwooshText,
    'team-selector': renderTeamSelector,
    'toolbar': renderToolbar,
    'tweet-card': renderTweetCard,
    'type-writer': renderTypeWriter
  };

  function setPlayback(action) {
    requestedRunning = action === 'resume';
    running = requestedRunning && !reducedMotion.matches;
    document.body.classList.toggle('is-paused', !running);
    if (running) resumeHooks.forEach((resume) => resume());
  }

  function applyPlaybackPreference() {
    running = requestedRunning && !reducedMotion.matches;
    document.body.classList.toggle('is-paused', !running);
    if (running) resumeHooks.forEach((resume) => resume());
  }

  function renderCurrentPreview() {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    resumeHooks.length = 0;
    slug = decodeURIComponent(location.hash.replace(/^#/, ''));
    root.replaceChildren();
    if (!allowed.has(slug) || !renderers[slug]) {
      root.append(panel('預覽未納入', '此元件尚未通過逐項本機靜態適配驗證。'));
    } else {
      renderers[slug]();
    }
    applyPlaybackPreference();
  }

  renderCurrentPreview();
  window.addEventListener('hashchange', renderCurrentPreview);

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.type !== 'prompt-library-preview') return;
    if (message.action === 'pause' || message.action === 'resume') setPlayback(message.action);
  });
  window.addEventListener('pagehide', () => {
    running = false;
    cleanups.forEach((cleanup) => cleanup());
  });
  const handleReducedMotionChange = () => applyPlaybackPreference();
  if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', handleReducedMotionChange);
  else if (typeof reducedMotion.addListener === 'function') reducedMotion.addListener(handleReducedMotionChange);
  if (window.parent !== window) window.parent.postMessage({ type: 'prompt-library-preview-ready' }, '*');
})();
