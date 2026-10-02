// SPDX-FileCopyrightText: 2026 junru-norple
// SPDX-License-Identifier: MIT
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function mountStory(scroller) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const lenis = new Lenis({ wrapper: scroller, content: scroller.firstElementChild, duration: 1.05, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  const triggers = gsap.utils.toArray('[data-chapter]', scroller).map((chapter, index) => ScrollTrigger.create({ trigger: chapter, scroller, start: 'top 55%', onEnter: () => scroller.style.setProperty('--chapter', index + 1) }));
  return () => { gsap.ticker.remove(tick); triggers.forEach((trigger) => trigger.kill()); lenis.destroy(); };
}
