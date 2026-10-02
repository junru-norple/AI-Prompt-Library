// SPDX-FileCopyrightText: 2026 junru-norple
// SPDX-License-Identifier: MIT
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function mountSequence(canvas, drawFrame, frameCount = 72) {
  const state = { frame: 0 };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { drawFrame(Math.round(frameCount * 0.72)); return () => {}; }
  const tween = gsap.to(state, { frame: frameCount - 1, ease: 'none', snap: 'frame', onUpdate: () => drawFrame(state.frame), scrollTrigger: { trigger: canvas.closest('[data-sequence]'), start: 'top top', end: 'bottom bottom', scrub: 0.35 } });
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}
