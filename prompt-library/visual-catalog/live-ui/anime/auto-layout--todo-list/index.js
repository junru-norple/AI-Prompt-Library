(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  const tracked = new Map();
  const resumeAfterReduction = new Set();
  const nativeAnimations = new Set();
  const sourceFrameMs = 1500;
  let sourceReady = false;
  let samplingSourceFrame = false;
  let staticFrameQueued = false;

  // Always run source initialization. Reduced motion samples the actual source
  // animations once with the pinned runtime's public API, without a frame loop.
  const runtime = window.anime;
  const wrappers = new Map();
  window.__PROMPT_LIBRARY_ANIME_API__ = new Proxy(runtime, {
    get(target, name) {
      if (!['animate', 'createTimeline', 'createTimer', 'createLayout'].includes(name)) return target[name];
      if (wrappers.has(name)) return wrappers.get(name);
      const wrapper = (...args) => {
        const result = target[name](...args);
        if (name === 'createLayout') {
          const animateLayout = result.animate;
          result.animate = function (parameters = {}) {
            if (!reducedMotion.matches) return animateLayout.call(this, parameters);
            // Commit the source's real target layout and execute its cleanup;
            // stopping a layout transition halfway leaves overlapping elements.
            return animateLayout.call(this, { ...parameters, autoplay: false, loop: 0, alternate: false }).complete();
          };
        } else if (reducedMotion.matches) {
          tracked.set(result, name);
          if (sourceReady && !samplingSourceFrame && !staticFrameQueued) {
            staticFrameQueued = true;
            queueMicrotask(() => {
              staticFrameQueued = false;
              if (reducedMotion.matches) staticSourceFrame();
            });
          }
        }
        return result;
      };
      wrappers.set(name, wrapper);
      return wrapper;
    }
  });

  async function staticSourceFrame() {
    if (samplingSourceFrame) return;
    samplingSourceFrame = true;
    const sampled = new Set();
    const sample = (animation) => {
      if (!animation || sampled.has(animation) || animation.paused) return;
      sampled.add(animation);
      resumeAfterReduction.add(animation);
      const duration = Number(animation.iterationDuration || animation.duration);
      const time = Number.isFinite(duration) ? Math.min(sourceFrameMs, duration * .5) : sourceFrameMs;
      animation.pause().seek(time, true);
    };
    for (const [animation, kind] of tracked) if (kind !== 'createTimer') sample(animation);
    // The original Canvas draw callback consumes the sampled particle values.
    // Other source timers may create animations, which are sampled once below.
    for (const [animation, kind] of [...tracked]) if (kind === 'createTimer' && !animation.paused) {
      sample(animation);
      if (typeof animation.onUpdate === 'function') animation.onUpdate(animation);
    }
    for (const [animation, kind] of tracked) if (kind !== 'createTimer') sample(animation);
    // A seek computes blend values; the pinned runtime commits the additive
    // composition in its public update(). Flush it once without a frame loop.
    // update() respects the runtime clock's frame limit. Waiting one bounded
    // interval ensures this single additive flush is not silently skipped.
    await new Promise((resolve) => window.setTimeout(resolve, 20));
    if (!reducedMotion.matches) { samplingSourceFrame = false; return; }
    runtime.engine?.update();
    window.__PROMPT_LIBRARY_ANIME_REDUCED_FRAME__?.();
    for (const animation of document.getAnimations?.() || []) if (animation.playState === 'running') {
      nativeAnimations.add(animation);
      animation.pause();
    }
    runtime.engine?.pause();
    document.documentElement.dataset.catalogStaticSourceFrame = String(sourceFrameMs);
    samplingSourceFrame = false;
  }

  function applyPlaybackState() {
    document.documentElement.dataset.catalogPlayback = visible && !reducedMotion.matches ? 'running' : 'paused';
    const engine = window.anime && window.anime.engine;
    if (!engine) return;
    engine.useDefaultMainLoop = visible && !reducedMotion.matches;
    if (visible && !reducedMotion.matches) {
      for (const animation of resumeAfterReduction) animation.resume();
      resumeAfterReduction.clear();
      tracked.clear();
      for (const animation of nativeAnimations) animation.play();
      nativeAnimations.clear();
      engine.resume();
      // pause() is a no-op when no request is pending; resume() can therefore
      // also be a no-op. wake() is the public API that schedules normal work.
      engine.wake();
    } else {
      engine.pause();
      if (sourceReady && reducedMotion.matches) return staticSourceFrame();
    }
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.type !== 'prompt-library-preview') return;
    if (message.action === 'resume') visible = true;
    if (message.action === 'pause') visible = false;
    applyPlaybackState();
  });

  window.addEventListener('pagehide', () => {
    visible = false;
    applyPlaybackState();
  });
  const handleReducedMotionChange = () => applyPlaybackState();
  if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', handleReducedMotionChange);
  else if (typeof reducedMotion.addListener === 'function') reducedMotion.addListener(handleReducedMotionChange);

  window.__PROMPT_LIBRARY_ANIME_READY__ = () => {
    const finish = () => window.setTimeout(async () => {
      if (window.__PROMPT_LIBRARY_ANIME_SOURCE_INITIALIZE__) {
        // Responsive source scopes may replace their observer during a retry.
        const initialize = () => window.__PROMPT_LIBRARY_ANIME_SOURCE_INITIALIZE__?.();
        let ready = initialize();
        for (let attempt = 0; ready === false && attempt < 3; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 20));
          // A warm, hidden preview also has its default loop paused. Advance
          // only the pending source setup; update() never schedules a new RAF.
          if (!runtime.engine.useDefaultMainLoop) runtime.engine.update();
          ready = initialize();
        }
        if (ready === false) throw new Error('The source scroll observer did not initialize.');
      }
      sourceReady = true;
      await applyPlaybackState();
      if (window.parent !== window) window.parent.postMessage({ type: 'prompt-library-preview-ready' }, '*');
    }, 0);
    if (document.fonts?.ready) document.fonts.ready.then(finish);
    else finish();
  };
  applyPlaybackState();
})();

const { createLayout, spring, stagger, $ } = window.__PROMPT_LIBRARY_ANIME_API__;
const $container = /** @type {HTMLElement} */(document.getElementById('$container'));
const $todoTemplate = /** @type {HTMLTemplateElement} */(document.getElementById('$todoTemplate'));
const $new = /** @type {HTMLElement} */(document.getElementById('$new'));
const $pending = /** @type {HTMLElement} */(document.getElementById('$pending'));
const $completed = /** @type {HTMLElement} */(document.getElementById('$completed'));
const $addInput = /** @type {HTMLInputElement} */(document.getElementById('$addInput'));
const $createForm = /** @type {HTMLFormElement} */(document.getElementById('$createForm'));

const layout = createLayout($container, {
  properties: ['backgroundColor', 'color', 'accent-color'],
  ease: spring({ bounce: .3, duration: 450 }),
  leaveTo: {
    opacity: 0,
    transform: 'translateY(.5rem) scale(.9)',
  }
});

const createItem = (text) => {
  const $item = /** @type {HTMLLIElement} */($todoTemplate.content.firstElementChild.cloneNode(true));
  const $checkbox = $item.querySelector('input[type="checkbox"]');
  const $labelText = $item.querySelector('.text');
  $labelText.textContent = text;
  $checkbox.addEventListener('change', handleToggle);
  return $item;
}

const handleToggle = event => {
  const $checkbox = /** @type {HTMLInputElement} */(event.currentTarget);
  const $item = $checkbox.closest('.item');
  if (!$item) return;
  const $targetList = $checkbox.checked ? $completed : $pending;
  $('.list').forEach($el => $el.classList.toggle('is-active', $el === $targetList));
  $('.item').forEach($el => $el.classList.toggle('is-floating', $el === $item));
  layout.update(() => $targetList.insertBefore($item, $targetList.firstElementChild), { ease: 'inOutExpo' });
}

const addItem = () => {
  const value = $addInput.value.trim();
  if (!value) return;
  const $item = createItem(value);
  // debugger;
  $new.appendChild($item);
  layout.update(() => $pending.insertBefore($item, $pending.firstElementChild));
  $addInput.value = '';
}

const handleAction = event => {
  const $button = /** @type {HTMLButtonElement} */(event.target);
  const $item = $button.closest('.item');
  if (!$item) return;
  const $parent = $item.parentElement;
  if ($parent.id === '$createForm') {
    addItem();
  } else {
    layout.update(() => {
      $item.classList.add('is-removed');
    }, {
      ease: 'out(3.5)',
      onComplete: () => {
        if ($parent.children.length > 1) { // If there are more than one element left remove the element directly
          $item.remove();
        } else { // Otherwise wrap the removal into a layout.update() to avoid abrupt list resizing
          layout.update(() => $item.remove())
        }
      }
    });
  }
}

$createForm.addEventListener('submit', event => {
  event.preventDefault();
  addItem();
});

document.addEventListener('click', event => {
  if (/** @type {HTMLElement} */(event.target).classList.contains('action')) handleAction(event);
});
window.__PROMPT_LIBRARY_ANIME_READY__?.();
