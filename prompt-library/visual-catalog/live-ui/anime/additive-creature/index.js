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

const { animate, createTimeline, createTimer, stagger, utils } = window.__PROMPT_LIBRARY_ANIME_API__;
const creatureEl = document.querySelector('#creature');
const viewport = { w: window.innerWidth * .5, h: window.innerHeight * .5 };
const cursor = { x: 0, y: 0 };
const rows = 13;
const grid = [rows, rows];
const from = 'center';
const scaleStagger = stagger([2, 5], { ease: 'inQuad', grid, from });
const opacityStagger = stagger([1, .1], { grid, from });

for (let i = 0; i < (rows * rows); i++) {
  creatureEl.appendChild(document.createElement('div'));
}

const particuleEls = creatureEl.querySelectorAll('div');

utils.set(creatureEl, {
  width: rows * 10 + 'em',
  height: rows * 10 + 'em'
});

utils.set(particuleEls, {
  x: 0,
  y: 0,
  scale: scaleStagger,
  opacity: opacityStagger,
  background: stagger([80, 20], { grid, from,
    modifier: v => `hsl(4, 70%, ${v}%)`,
  }),
  boxShadow: stagger([8, 1], { grid, from,
    modifier: v => `0px 0px ${utils.round(v, 0)}em 0px var(--red-1)`,
  }),
  zIndex: stagger([rows * rows, 1], { grid, from, modifier: utils.round(0) }),
});

const pulse = () => {
  animate(particuleEls, {
    keyframes: [
      {
        scale: 5,
        opacity: 1,
        delay: stagger(90, { start: 1650, grid, from }),
        duration: 150,
      }, {
        scale: scaleStagger,
        opacity: opacityStagger,
        ease: 'inOutQuad',
        duration: 600
      }
    ],
  });
}

const mainLoop = createTimer({
  frameRate: 15, // Animate to the new cursor position every 250ms
  onUpdate: () => {
    animate(particuleEls, {
      x: cursor.x,
      y: cursor.y,
      delay: stagger(40, { grid, from }),
      duration: stagger(120, { start: 750, ease: 'inQuad', grid, from }),
      ease: 'inOut',
      composition: 'blend', // This allows the animations to overlap nicely
    });
  }
});

const autoMove = createTimeline()
.add(cursor, {
  x: [-viewport.w * .45, viewport.w * .45],
  modifier: x => x + Math.sin(mainLoop.currentTime * .0007) * viewport.w * .5,
  duration: 3000,
  ease: 'inOutExpo',
  alternate: true,
  loop: true,
  onBegin: pulse,
  onLoop: pulse,
}, 0)
.add(cursor, {
  y: [-viewport.h * .45, viewport.h * .45],
  modifier: y => y + Math.cos(mainLoop.currentTime * .00012) * viewport.h * .5,
  duration: 1000,
  ease: 'inOutQuad',
  alternate: true,
  loop: true,
}, 0);

const manualMovementTimeout = createTimer({
  duration: 1500,
  onComplete: () => autoMove.play(),
});

const followPointer = e => {
  const event = e.type === 'touchmove' ? e.touches[0] : e;
  cursor.x = event.pageX - viewport.w;
  cursor.y = event.pageY - viewport.h;
  autoMove.pause();
  manualMovementTimeout.restart();
}

document.addEventListener('mousemove', followPointer);
document.addEventListener('touchmove', followPointer);


window.__PROMPT_LIBRARY_ANIME_READY__?.();
