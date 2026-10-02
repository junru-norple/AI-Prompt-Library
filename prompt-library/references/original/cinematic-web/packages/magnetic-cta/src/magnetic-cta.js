// SPDX-FileCopyrightText: 2026 junru-norple
// SPDX-License-Identifier: MIT
export function mountMagneticCTA(button, radius = 180, strength = 0.16) {
  let frame = 0;
  const move = (event) => {
    const box = button.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const distance = Math.hypot(dx, dy);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const active = distance < radius && !matchMedia('(prefers-reduced-motion: reduce)').matches;
      button.style.transform = active ? 'translate(' + dx * strength + 'px,' + dy * strength + 'px)' : '';
    });
  };
  const reset = () => { button.style.transform = ''; };
  addEventListener('pointermove', move, { passive: true });
  button.addEventListener('blur', reset);
  return () => { cancelAnimationFrame(frame); removeEventListener('pointermove', move); button.removeEventListener('blur', reset); };
}
