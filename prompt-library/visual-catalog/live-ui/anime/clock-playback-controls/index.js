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

const { animate, createTimeline, utils, cubicBezier } = window.__PROMPT_LIBRARY_ANIME_API__;
const [ $digitalClock ] = utils.$('#digital');

const s = 1000;
const m = 60*s;
const h = 60*m;
const oneday = h * 24;

const masterTL = createTimeline({ defaults: { ease: 'linear' }, autoplay: false });

[h * 10, h, 0, m * 10, m, 0, s * 10, s, 0, 100, 10].forEach(d => {
  const $el = document.createElement('div');
  $digitalClock.appendChild($el);
  $el.classList.add('slot');
  if (!d) {
    $el.classList.add('colon');
    $el.textContent = ':';
  } else {
    $el.classList.add('numbers');
    for (let i = 0; i < 10; i++) {
      const $num = document.createElement('div');
      $num.textContent = `${i}`;
      const angle = i * 36;
      const a = utils.degToRad(angle);
      utils.set($num, {
        translateY: -3 * Math.sin(a) + 'ch',
        z: 3 * Math.cos(a) + 'ch',
        rotateX: angle,
      });
      $el.appendChild($num);
    }
    const canStop = d > 100;
    const ease = canStop ? cubicBezier(1,0,.6,1.2) : 'linear';
    const duration = canStop ? 650 : d;
    const position = `+=${canStop ? d - 650 : 0}`;
    const numTL = createTimeline({ defaults: { ease }, loop: true });
    const t = d === h*10 ? 4 : d === h ? 25 : d === m*10 || d === s*10 ? 7 : 11;
    for (let i = 1; i < t; i++) {
      const rotateX = -((i * 36) + (i === t - 1 ? (360 - i * 36) : 0));
      numTL.add($el, { rotateX, duration }, d === h*10 && i === t - 1 ? '+=' + ((h * 4) - 650) : position);
    }
    masterTL.sync(numTL, 0);
  }
});

masterTL.duration = oneday;
masterTL.iterationDuration = oneday;

const getNow = () => new Date().getTime() % oneday;

const [ $currentTimeRange ] = /** @type {Array<HTMLInputElement>} */(utils.$('#currentTime .range'));
const [ $currentTimeValue ] = /** @type {Array<HTMLInputElement>} */(utils.$('#currentTime .value'));

const [ $speedRange ] = /** @type {Array<HTMLInputElement>} */(utils.$('#speed .range'));
const [ $speedValue ] = /** @type {Array<HTMLInputElement>} */(utils.$('#speed .value'));

masterTL.currentTime = getNow();
// masterTL.currentTime = oneday - 3000;

masterTL.onUpdate = ({currentTime, speed}) => {
  $currentTimeRange.value = `${currentTime}`;
  $currentTimeValue.value = `${currentTime}`;
  $speedRange.value = `${speed}`;
  $speedValue.value = `${utils.round(speed, 0)}`;
}

utils.$('#controls button').forEach($button => {
  const id = $button.id;
  $button.onclick = () => {
    if (id === 'seek') {
      animate(masterTL, {
        currentTime: getNow(),
        ease: 'inOut(3)',
        duration: 1500
      })
    } else if (id === 'slowmo') {
      animate(masterTL, {
        speed: .1,
        ease: 'out(3)',
        duration: 1500
      })
    } else if (id === 'speedup') {
      animate(masterTL, {
        speed: 5,
        ease: 'out(3)',
        duration: 1500
      })
    } else if (id === 'normalspeed') {
      animate(masterTL, {
        speed: 1,
        ease: 'out(3)',
        duration: 1500
      })
    } else {
      masterTL[id]();
    }
  }
});

utils.$('fieldset').forEach($el => {
  const $range = /** @type {HTMLInputElement} */($el.querySelector('.range'));
  const $value = /** @type {HTMLInputElement} */($el.querySelector('.value'));
  const prop = $el.id;
  const value = masterTL[prop];
  $range.value = value;
  $value.value = masterTL[prop];
  $range.oninput = () => {
    const newValue = prop === 'currentTime' ? +$range.value % oneday : +$range.value;
    utils.sync(() => masterTL[prop] = newValue);
    $value.value = `${utils.round(newValue, 0)}`;
  };
});
window.__PROMPT_LIBRARY_ANIME_READY__?.();
