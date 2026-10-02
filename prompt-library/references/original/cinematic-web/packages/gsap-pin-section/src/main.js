// SPDX-FileCopyrightText: 2026 junru-norple
// SPDX-License-Identifier: MIT
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function mountPinStory(root) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return () => {};
  const context = gsap.context(() => {
    const chapters = gsap.utils.toArray('[data-chapter]');
    const timeline = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: '+=350%', pin: true, scrub: 0.65, invalidateOnRefresh: true } });
    chapters.forEach((chapter, index) => timeline.to('[data-assembly]', { '--stage': index + 1, duration: 1 }, index).fromTo(chapter, { autoAlpha: 0.25 }, { autoAlpha: 1, duration: 0.4 }, index));
  }, root);
  return () => context.revert();
}
