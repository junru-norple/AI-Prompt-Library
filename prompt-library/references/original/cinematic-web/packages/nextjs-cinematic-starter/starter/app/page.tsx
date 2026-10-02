// SPDX-FileCopyrightText: 2026 junru-norple
// SPDX-License-Identifier: MIT
'use client';
import { motion, useReducedMotion } from 'motion/react';

export default function Home() {
  const reduce = useReducedMotion();
  return <main>
    <a className="skip" href="#work">跳至作品</a>
    <header><p>COBALT PRACTICE / 2026</p><nav aria-label="主要導覽"><a href="#work">作品</a><a href="#method">方法</a></nav></header>
    <section className="hero"><motion.h1 initial={reduce ? false : { y: 36, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: reduce ? 0 : 0.48 }}>空間從一條<br/>可驗證的線開始。</motion.h1><div className="model" aria-hidden="true"/></section>
    <section id="work"><article><span>01</span><h2>潮線劇場</h2><p>城市與海面共享的公共剖面。</p></article><article><span>02</span><h2>光井住宅</h2><p>用日照而不是牆面組織一天。</p></article></section>
    <section id="method"><h2>研究、切面、原型、回看。</h2></section>
  </main>;
}
