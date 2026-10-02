(() => {
  'use strict';

  const root = document.querySelector('#stage');
  const allowedSources = new Set(['retro-ui-oss', 'magic-ui-oss', 'smooth-ui-oss']);
  const sourceLabels = Object.freeze({
    'retro-ui-oss': 'Retro UI / NeoBrutalism',
    'magic-ui-oss': 'Magic UI',
    'smooth-ui-oss': 'SmoothUI'
  });
  const kindLabels = Object.freeze({ data: '資料', input: '輸入', grid: '網格', text: '文字', effect: '動效', device: '裝置', control: '控制項', layout: '版面', component: '元件' });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function humanize(value) {
    return value.split('-').filter(Boolean).map((part) => part.length <= 3 ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`).join(' ');
  }

  function visualKind(slug) {
    if (/(chart|graph|ticker|number|progress|meter|stats)/.test(slug)) return 'data';
    if (/(input|form|select|combobox|search|textarea|otp|scrubber|slider|upload)/.test(slug)) return 'input';
    if (/(calendar|table|pagination|date)/.test(slug)) return 'grid';
    if (/(text|word|letter|type|shimmer|scramble|reveal|blur|axis|kinetic|shine)/.test(slug)) return 'text';
    if (/(background|grid|particle|meteor|ripple|aurora|beam|orbit|glow|shader|transition|loader|orb|warp|noise|light)/.test(slug)) return 'effect';
    if (/(android|iphone|safari|device|browser|video)/.test(slug)) return 'device';
    if (/(button|switch|toggle|checkbox|radio|badge|tooltip|popover|menu|dialog|drawer|tabs|accordion|toast)/.test(slug)) return 'control';
    if (/(card|bento|list|team|feature|hero|footer|header|pricing|testimonial|faq|layout|stack|dock|tree|navigation|breadcrumb|sidebar|template)/.test(slug)) return 'layout';
    return 'component';
  }

  function addStack(surface, rows = 3) {
    const stack = element('div', 'visual-stack');
    for (let index = 0; index < rows; index += 1) {
      const row = element('div', 'visual-row');
      row.append(element('i', 'visual-dot'), element('i', 'visual-copy'), element('i', 'visual-copy short'));
      stack.append(row);
    }
    surface.append(stack);
  }

  function addLayout(surface) {
    const grid = element('div', 'visual-grid');
    ['主要區塊', '訊號', '操作'].forEach((label) => {
      const card = element('div', 'visual-card');
      card.append(element('strong', '', label));
      grid.append(card);
    });
    surface.append(grid);
  }

  function addText(surface, title) {
    const text = element('div', 'visual-text');
    [...title.slice(0, 14)].forEach((character, index) => {
      const glyph = element('span', '', character === ' ' ? '\u00a0' : character);
      glyph.style.setProperty('--i', index);
      text.append(glyph);
    });
    surface.append(text);
  }

  function addEffect(surface) {
    const particles = element('div', 'visual-effects');
    const points = [[8,18,2],[22,72,1],[38,28,3],[51,82,2],[65,16,1],[78,66,3],[91,31,2],[13,48,1],[86,84,1],[56,47,2],[31,91,1],[72,39,1]];
    points.forEach(([x,y,size], index) => {
      const particle = element('i');
      particle.style.cssText = `--x:${x};--y:${y};--s:${size};--i:${index}`;
      particles.append(particle);
    });
    surface.append(particles, element('div', 'effect-core'));
  }

  function addInput(surface, status) {
    const control = element('div', 'control-demo');
    const input = element('input', 'control-field');
    input.type = 'text';
    input.placeholder = '輸入文字以在本機測試';
    input.setAttribute('aria-label', '本機預覽輸入欄');
    input.addEventListener('input', () => { status.textContent = input.value ? `${input.value.length} 個本機字元` : '待命 · 無網路'; });
    control.append(input, element('div', 'control-meter'));
    surface.append(control);
  }

  function addGrid(surface) {
    const grid = element('div', 'calendar-grid');
    for (let index = 1; index <= 21; index += 1) grid.append(element('i', index === 11 ? 'is-today' : '', String(index)));
    surface.append(grid);
  }

  function addData(surface) {
    const bars = element('div', 'chart-bars');
    [42,68,54,86,62,94].forEach((height, index) => {
      const bar = element('i');
      bar.style.cssText = `--h:${height};--i:${index}`;
      bars.append(bar);
    });
    surface.append(bars);
  }

  function addDevice(surface) {
    const device = element('div', 'device-frame');
    const screen = element('div', 'device-screen');
    screen.append(element('i'), element('i'), element('i'));
    device.append(screen);
    surface.append(device);
  }

  function render() {
    const decoded = decodeURIComponent(location.hash.slice(1));
    const [sourceId, slug] = decoded.split('::');
    if (!new Set(["magic-ui-oss::android","magic-ui-oss::animated-beam","magic-ui-oss::animated-circular-progress-bar","magic-ui-oss::animated-gradient-text","magic-ui-oss::animated-grid-pattern","magic-ui-oss::animated-list","magic-ui-oss::animated-shiny-text","magic-ui-oss::animated-theme-toggler","magic-ui-oss::aurora-text","magic-ui-oss::avatar-circles","magic-ui-oss::backlight","magic-ui-oss::bento-grid","magic-ui-oss::blur-fade","magic-ui-oss::border-beam","magic-ui-oss::client-tweet-card","magic-ui-oss::code-comparison","magic-ui-oss::comic-text","magic-ui-oss::confetti","magic-ui-oss::cool-mode","magic-ui-oss::dia-text-reveal","magic-ui-oss::dock","magic-ui-oss::dot-pattern","magic-ui-oss::dotted-map","magic-ui-oss::file-tree","magic-ui-oss::flickering-grid","magic-ui-oss::glare-hover","magic-ui-oss::globe","magic-ui-oss::glyph-matrix","magic-ui-oss::grid-pattern","magic-ui-oss::hero-video-dialog","magic-ui-oss::hexagon-pattern","magic-ui-oss::highlighter","magic-ui-oss::hyper-text","magic-ui-oss::icon-cloud","magic-ui-oss::interactive-grid-pattern","magic-ui-oss::interactive-hover-button","magic-ui-oss::iphone","magic-ui-oss::kinetic-text","magic-ui-oss::lens","magic-ui-oss::light-rays","magic-ui-oss::line-shadow-text","magic-ui-oss::magic-card","magic-ui-oss::marquee","magic-ui-oss::meteors","magic-ui-oss::morphing-text","magic-ui-oss::neon-gradient-card","magic-ui-oss::noise-texture","magic-ui-oss::number-ticker","magic-ui-oss::orbiting-circles","magic-ui-oss::particles","magic-ui-oss::pixel-image","magic-ui-oss::pointer","magic-ui-oss::progressive-blur","magic-ui-oss::pulsating-button","magic-ui-oss::rainbow-button","magic-ui-oss::retro-grid","magic-ui-oss::ripple","magic-ui-oss::ripple-button","magic-ui-oss::safari","magic-ui-oss::scroll-based-velocity","magic-ui-oss::scroll-progress","magic-ui-oss::shimmer-button","magic-ui-oss::shine-border","magic-ui-oss::shiny-button","magic-ui-oss::smooth-cursor","magic-ui-oss::sparkles-text","magic-ui-oss::spinning-text","magic-ui-oss::striped-pattern","magic-ui-oss::terminal","magic-ui-oss::text-3d-flip","magic-ui-oss::text-animate","magic-ui-oss::text-reveal","magic-ui-oss::typing-animation","magic-ui-oss::video-text","magic-ui-oss::warp-background","magic-ui-oss::word-rotate","retro-ui-oss::accordion","retro-ui-oss::accordion-style-default","retro-ui-oss::alert","retro-ui-oss::alert-style-all-status","retro-ui-oss::alert-style-default","retro-ui-oss::alert-style-solid","retro-ui-oss::alert-style-with-icon","retro-ui-oss::area-chart","retro-ui-oss::avatar","retro-ui-oss::avatar-style-circle","retro-ui-oss::avatar-style-circle-sizes","retro-ui-oss::avatar-style-fallbacks","retro-ui-oss::badge","retro-ui-oss::badge-style-default","retro-ui-oss::badge-style-sizes","retro-ui-oss::badge-style-variants","retro-ui-oss::bar-chart","retro-ui-oss::baseui-accordion","retro-ui-oss::baseui-alert","retro-ui-oss::baseui-avatar","retro-ui-oss::baseui-badge","retro-ui-oss::baseui-breadcrumb","retro-ui-oss::baseui-button","retro-ui-oss::baseui-calendar","retro-ui-oss::baseui-card","retro-ui-oss::baseui-carousel","retro-ui-oss::baseui-checkbox","retro-ui-oss::baseui-command","retro-ui-oss::baseui-context-menu","retro-ui-oss::baseui-dialog","retro-ui-oss::baseui-drawer","retro-ui-oss::baseui-empty","retro-ui-oss::baseui-input","retro-ui-oss::baseui-label","retro-ui-oss::baseui-loader","retro-ui-oss::baseui-menu","retro-ui-oss::baseui-popover","retro-ui-oss::baseui-progress","retro-ui-oss::baseui-radio","retro-ui-oss::baseui-select","retro-ui-oss::baseui-slider","retro-ui-oss::baseui-sonner","retro-ui-oss::baseui-switch","retro-ui-oss::baseui-tab","retro-ui-oss::baseui-table","retro-ui-oss::baseui-text","retro-ui-oss::baseui-textarea","retro-ui-oss::baseui-toc","retro-ui-oss::baseui-toggle","retro-ui-oss::baseui-toggle-group","retro-ui-oss::baseui-tooltip","retro-ui-oss::breadcrumb","retro-ui-oss::button","retro-ui-oss::button-style-default","retro-ui-oss::button-style-link","retro-ui-oss::button-style-outline","retro-ui-oss::button-style-secondary","retro-ui-oss::button-style-with-icon","retro-ui-oss::calendar","retro-ui-oss::card","retro-ui-oss::card-style-commerce","retro-ui-oss::card-style-default","retro-ui-oss::card-style-testimonial","retro-ui-oss::carousel","retro-ui-oss::checkbox","retro-ui-oss::checkbox-style-default","retro-ui-oss::checkbox-style-toggle","retro-ui-oss::command","retro-ui-oss::context-menu","retro-ui-oss::dialog","retro-ui-oss::dialog-style-default","retro-ui-oss::dialog-style-width-variant","retro-ui-oss::dialog-style-with-footer","retro-ui-oss::dialog-style-with-form","retro-ui-oss::drawer","retro-ui-oss::empty","retro-ui-oss::input","retro-ui-oss::input-style-default","retro-ui-oss::input-style-error","retro-ui-oss::input-style-with-label","retro-ui-oss::label","retro-ui-oss::line-chart","retro-ui-oss::loader","retro-ui-oss::menu","retro-ui-oss::menu-style-default","retro-ui-oss::pie-chart","retro-ui-oss::popover","retro-ui-oss::popover-style-default","retro-ui-oss::popover-style-default-shadow","retro-ui-oss::popover-style-primary","retro-ui-oss::popover-style-primary-shadow","retro-ui-oss::progress","retro-ui-oss::progress-style-default","retro-ui-oss::radio","retro-ui-oss::radio-style-default","retro-ui-oss::radio-style-sizes","retro-ui-oss::radio-style-variants","retro-ui-oss::select","retro-ui-oss::select-style-default","retro-ui-oss::slider","retro-ui-oss::sonner","retro-ui-oss::sonner-style-default","retro-ui-oss::sonner-style-error","retro-ui-oss::sonner-style-rich-colors","retro-ui-oss::sonner-style-warning","retro-ui-oss::switch","retro-ui-oss::switch-style-default","retro-ui-oss::switch-style-disabled","retro-ui-oss::tab","retro-ui-oss::tab-style-default","retro-ui-oss::table","retro-ui-oss::table-style-default","retro-ui-oss::table-with-checkbox","retro-ui-oss::table-with-sticky-header","retro-ui-oss::text","retro-ui-oss::text-headings","retro-ui-oss::textarea","retro-ui-oss::textarea-style-default","retro-ui-oss::toc","retro-ui-oss::toggle","retro-ui-oss::toggle-group","retro-ui-oss::toggle-group-style-default","retro-ui-oss::toggle-group-style-outline-muted","retro-ui-oss::toggle-group-style-outlined","retro-ui-oss::toggle-group-style-solid","retro-ui-oss::toggle-style-default","retro-ui-oss::toggle-style-outline-muted","retro-ui-oss::toggle-style-outlined","retro-ui-oss::toggle-style-solid","retro-ui-oss::tooltip","retro-ui-oss::tooltip-style-default","retro-ui-oss::tooltip-style-primary","retro-ui-oss::tooltip-style-solid","retro-ui-oss::typography-p","smooth-ui-oss::agent-avatar","smooth-ui-oss::ai-approval","smooth-ui-oss::ai-artifact","smooth-ui-oss::ai-branch","smooth-ui-oss::ai-citation","smooth-ui-oss::ai-context-meter","smooth-ui-oss::ai-conversation","smooth-ui-oss::ai-diff","smooth-ui-oss::ai-loader","smooth-ui-oss::ai-message","smooth-ui-oss::ai-orb-face","smooth-ui-oss::ai-prompt-input","smooth-ui-oss::ai-reasoning","smooth-ui-oss::ai-response","smooth-ui-oss::ai-sources","smooth-ui-oss::ai-suggestions","smooth-ui-oss::ai-task-list","smooth-ui-oss::ai-tool-call","smooth-ui-oss::animated-avatar-group","smooth-ui-oss::animated-file-upload","smooth-ui-oss::animated-input","smooth-ui-oss::animated-o-t-p-input","smooth-ui-oss::animated-progress-bar","smooth-ui-oss::animated-stepper","smooth-ui-oss::animated-tabs","smooth-ui-oss::animated-tags","smooth-ui-oss::animated-toggle","smooth-ui-oss::animated-tooltip","smooth-ui-oss::aperture-blur-transition","smooth-ui-oss::app-download-stack","smooth-ui-oss::apple-invites","smooth-ui-oss::basic-accordion","smooth-ui-oss::basic-dropdown","smooth-ui-oss::basic-modal","smooth-ui-oss::basic-toast","smooth-ui-oss::blur-out-up","smooth-ui-oss::book","smooth-ui-oss::bottom-up-letters","smooth-ui-oss::breadcrumb","smooth-ui-oss::button-copy","smooth-ui-oss::chat-template","smooth-ui-oss::checkbox","smooth-ui-oss::chroma-blur-transition","smooth-ui-oss::clip-corners-button","smooth-ui-oss::combobox","smooth-ui-oss::context-menu","smooth-ui-oss::contribution-graph","smooth-ui-oss::cta-1","smooth-ui-oss::cta-2","smooth-ui-oss::cta-3","smooth-ui-oss::cursor-follow","smooth-ui-oss::depth-parallax-words","smooth-ui-oss::dialog","smooth-ui-oss::dot-morph-button","smooth-ui-oss::drawer","smooth-ui-oss::dropdown-menu","smooth-ui-oss::dynamic-island","smooth-ui-oss::expandable-cards","smooth-ui-oss::exposure-slider","smooth-ui-oss::fade-through","smooth-ui-oss::faq-1","smooth-ui-oss::faq-2","smooth-ui-oss::faq-3","smooth-ui-oss::faq-4","smooth-ui-oss::features-1","smooth-ui-oss::features-2","smooth-ui-oss::features-3","smooth-ui-oss::figma-comment","smooth-ui-oss::focus-blur-resolve","smooth-ui-oss::footer-1","smooth-ui-oss::footer-3","smooth-ui-oss::footer-4","smooth-ui-oss::form","smooth-ui-oss::github-stars-animation","smooth-ui-oss::glow-hover-card","smooth-ui-oss::gooey-popover","smooth-ui-oss::grid-loader","smooth-ui-oss::header-1","smooth-ui-oss::header-2","smooth-ui-oss::header-3","smooth-ui-oss::header-4","smooth-ui-oss::header-5","smooth-ui-oss::header-6","smooth-ui-oss::image-metadata-preview","smooth-ui-oss::infinite-slider","smooth-ui-oss::interactive-image-selector","smooth-ui-oss::kinetic-center-build","smooth-ui-oss::line-by-line-slide","smooth-ui-oss::logo-cloud-1","smooth-ui-oss::logo-cloud-2","smooth-ui-oss::logo-cloud-3","smooth-ui-oss::logo-cloud-4","smooth-ui-oss::magnetic-button","smooth-ui-oss::mask-reveal-up","smooth-ui-oss::micro-scale-fade","smooth-ui-oss::morph-surface","smooth-ui-oss::notification-badge","smooth-ui-oss::number-flow","smooth-ui-oss::organic-merge-transition","smooth-ui-oss::pagination","smooth-ui-oss::per-character-rise","smooth-ui-oss::per-word-crossfade","smooth-ui-oss::photo-stack","smooth-ui-oss::phototab","smooth-ui-oss::power-off-slide","smooth-ui-oss::price-flow","smooth-ui-oss::pricing-1","smooth-ui-oss::pricing-2","smooth-ui-oss::pricing-3","smooth-ui-oss::prism-sweep-transition","smooth-ui-oss::product-card","smooth-ui-oss::radial-circles-transition","smooth-ui-oss::radio-group","smooth-ui-oss::reveal-text","smooth-ui-oss::reviews-carousel","smooth-ui-oss::scale-down-fade","smooth-ui-oss::scramble-hover","smooth-ui-oss::scroll-reveal-paragraph","smooth-ui-oss::scrollable-card-stack","smooth-ui-oss::scrubber","smooth-ui-oss::sdf-blob-transition","smooth-ui-oss::sdf-circle-transition","smooth-ui-oss::searchable-dropdown","smooth-ui-oss::select","smooth-ui-oss::shader-reveal-circle-transition","smooth-ui-oss::shader-reveal-luma-transition","smooth-ui-oss::shader-reveal-noise-transition","smooth-ui-oss::shader-reveal-planetary-transition","smooth-ui-oss::shader-reveal-push-transition","smooth-ui-oss::shader-reveal-stripes-transition","smooth-ui-oss::shader-reveal-transition","smooth-ui-oss::shader-reveal-wipe-transition","smooth-ui-oss::shader-reveal-zoom-transition","smooth-ui-oss::shared-axis-x","smooth-ui-oss::shared-axis-y","smooth-ui-oss::shared-axis-z","smooth-ui-oss::shimmer-sweep","smooth-ui-oss::shine-text","smooth-ui-oss::short-slide-down","smooth-ui-oss::short-slide-right","smooth-ui-oss::siri-orb","smooth-ui-oss::skeleton-loader","smooth-ui-oss::smooth-button","smooth-ui-oss::soft-blur-in","smooth-ui-oss::spring-scale-in","smooth-ui-oss::stagger-from-center","smooth-ui-oss::stagger-from-edges","smooth-ui-oss::stats-1","smooth-ui-oss::stats-2","smooth-ui-oss::switchboard-card","smooth-ui-oss::team-1","smooth-ui-oss::team-2","smooth-ui-oss::testimonials-1","smooth-ui-oss::testimonials-2","smooth-ui-oss::testimonials-3","smooth-ui-oss::top-down-letters","smooth-ui-oss::tweet-card","smooth-ui-oss::typewriter-text","smooth-ui-oss::user-account-avatar","smooth-ui-oss::warped-circle-transition","smooth-ui-oss::wave-text"]).has(decoded) || !allowedSources.has(sourceId) || !/^[a-z0-9][a-z0-9-]*$/.test(slug || '')) { root.textContent = '此預覽未納入公開版本。 / This preview is not included in the public edition.'; return; }
    const title = humanize(slug);
    const kind = visualKind(slug);
    const rendererMarker = `registry-${sourceId.replace(/-oss$/, '')}-${slug}-adapter`;
    root.replaceChildren();
    root.className = 'registry-preview-adapter';
    root.removeAttribute('style');
    root.dataset.previewKey = `${sourceId}::${slug}`;
    root.classList.add(`source-${sourceId}`, rendererMarker);

    const head = element('header', 'preview-head');
    const heading = element('div');
    heading.append(element('p', 'source-label', sourceLabels[sourceId]), element('h1', 'preview-title', title));
    head.append(heading, element('span', 'preview-kind', kindLabels[kind] || kindLabels.component));

    const surface = element('div', 'demo-surface');
    const status = element('p', 'preview-status', '本機隔離預覽 · 可互動');
    if (kind === 'data') addData(surface);
    else if (kind === 'input') addInput(surface, status);
    else if (kind === 'grid') addGrid(surface);
    else if (kind === 'text') addText(surface, title);
    else if (kind === 'effect') addEffect(surface);
    else if (kind === 'device') addDevice(surface);
    else if (kind === 'layout') addLayout(surface);
    else addStack(surface, 3);

    const action = element('button', 'demo-action', '測試狀態');
    action.type = 'button';
    action.addEventListener('click', () => {
      const active = root.classList.toggle('is-active');
      action.classList.toggle('is-active', active);
      action.textContent = active ? '狀態已啟用' : '測試狀態';
      status.textContent = active ? '本機狀態已變更 · 維持隔離' : '本機隔離預覽 · 可互動';
    });
    const foot = element('footer', 'preview-foot');
    foot.append(status, action);
    root.append(head, surface, foot);
    root.onpointermove = (event) => {
      const box = root.getBoundingClientRect();
      root.style.setProperty('--pointer-x', String((event.clientX - box.left) / box.width));
      root.style.setProperty('--pointer-y', String((event.clientY - box.top) / box.height));
    };
  }

  function setPlayback(action) {
    if (document.documentElement.dataset.catalogPlayback === 'blocked') return;
    document.body.classList.toggle('is-paused', action === 'pause');
    document.documentElement.dataset.catalogPlayback = action === 'pause' ? 'paused' : 'running';
  }

  const renderSafely = () => {
    try {
      render();
      document.documentElement.dataset.catalogPlayback = 'running';
    } catch (error) {
      // Preview blocked safely: keep a stable regression marker while the visible message remains zh-TW.
      root.replaceChildren(element('p', 'preview-status', `預覽已安全阻擋：${error.message}`));
      document.documentElement.dataset.catalogPlayback = 'blocked';
    }
  };

  try {
    renderSafely();
    addEventListener('hashchange', renderSafely);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const syncReduced = () => setPlayback(reduced.matches ? 'pause' : 'resume');
    syncReduced();
    reduced.addEventListener?.('change', syncReduced);
    addEventListener('message', (event) => {
      if (event.source === window.parent && event.data?.type === 'prompt-library-preview' && ['pause', 'resume'].includes(event.data.action)) setPlayback(event.data.action);
    });
    if (window.parent !== window) window.parent.postMessage({ type: 'prompt-library-preview-ready' }, '*');
  } catch (error) { renderSafely(); }
})();
