// SPDX-FileCopyrightText: 2026 junru-norple
// SPDX-License-Identifier: MIT
import * as THREE from 'three';

export function mountViewer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.4, 6);
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x9da8a8, metalness: 0.88, roughness: 0.24 });
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.42, 64), material));
  group.add(new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.06, 16, 64), material));
  scene.add(group, new THREE.HemisphereLight(0xe8f5ff, 0x251a12, 2.4));
  let frame = 0;
  const render = () => { renderer.render(scene, camera); frame = requestAnimationFrame(render); };
  render();
  return () => { cancelAnimationFrame(frame); scene.traverse((object) => { object.geometry?.dispose(); if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((item) => item.dispose()); }); renderer.dispose(); renderer.forceContextLoss(); };
}
