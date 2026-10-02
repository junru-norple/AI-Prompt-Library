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

const { animate, createTimer, utils } = window.__PROMPT_LIBRARY_ANIME_API__;
const initializeCatalogCanvasSource = () => {
  if (innerWidth <= 0 || innerHeight <= 0) return;
  window.removeEventListener('resize', initializeCatalogCanvasSource);
const canvasEl = document.querySelector('canvas');
const ctx = canvasEl.getContext('2d', { alpha: false });
const maxParticules = Number(location.href.split('?')[1]) || 240;
const colors = ['#FF4B4B','#FF8F42','#FFC730','#F6FF56'];
const viewport = { width: 0, height: 0 };
const particules = [];
const squarePi = 2 * 2 * Math.PI;

function setCanvasSize() {
  const { innerWidth, innerHeight } = window;
  const ratio = 2;
  canvasEl.width = innerWidth * ratio;
  canvasEl.height = innerHeight * ratio;
  canvasEl.style.width = innerWidth + 'px';
  canvasEl.style.height = innerHeight + 'px';
  canvasEl.getContext('2d').scale(ratio, ratio);
  viewport.width = innerWidth;
  viewport.height = innerHeight;
}

function createParticule(x, y) {
  return {
    x,
    y,
    color: utils.randomPick(colors),
    radius: 1,
  }
}

function drawParticule(p) {
  ctx.beginPath();
  ctx.fillStyle = p.color;
  ctx.arc(p.x, p.y, p.radius, 0, squarePi, true);
  ctx.fill();
}

setCanvasSize();
window.addEventListener('resize', setCanvasSize);

function animateParticule(p, i) {
  const newX = utils.random(0, viewport.width);
  const diffX = newX - p.x;
  const durX = Math.abs(diffX * 20);
  const newY = utils.random(0, viewport.height);
  const diffY = newY - p.y;
  const durY = Math.abs(diffY * 20);
  animate(p, {
    x: { to: newX, duration: durX },
    y: { to: newY, duration: durY },
    radius: utils.random(2, 6),
    ease: 'out(1)',
    onComplete: () => { animateParticule(p, i); }
  });
}

for (let i = 0; i < maxParticules; i++) {
  const p = createParticule(viewport.width * .5, viewport.height * .5);
  particules.push(p);
  animateParticule(p, i);
}

const catalogCanvasDrawTimer = createTimer({
  onUpdate: self => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = .1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < maxParticules; i++) {
      drawParticule(particules[i]);
    }
  },
})


// The source resize listener resets the bitmap. Reduced motion redraws its
// already sampled source particles once, without restarting the timer loop.
window.addEventListener('resize', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    catalogCanvasDrawTimer.onUpdate(catalogCanvasDrawTimer);
  }
});

  window.__PROMPT_LIBRARY_ANIME_READY__?.();
};
if (innerWidth > 0 && innerHeight > 0) initializeCatalogCanvasSource();
else window.addEventListener('resize', initializeCatalogCanvasSource);
