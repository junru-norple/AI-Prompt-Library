// SPDX-FileCopyrightText: 2026 junru-norple
// SPDX-License-Identifier: MIT
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const records = [{ id: 'A-17', title: '潮汐標本' }, { id: 'B-04', title: '無聲機械' }, { id: 'C-29', title: '夜間測繪' }];

export function ArchiveRoutes() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [index]);
  const record = records[index];
  return <main>
    <AnimatePresence mode="wait">
      <motion.article key={record.id} initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -18 }} transition={{ duration: reduce ? 0.01 : 0.42 }}>
        <p>COLLECTION {record.id}</p><h1 ref={heading} tabIndex={-1}>{record.title}</h1>
      </motion.article>
    </AnimatePresence>
    <button onClick={() => setIndex((index + records.length - 1) % records.length)}>上一件</button>
    <button onClick={() => setIndex((index + 1) % records.length)}>下一件</button>
  </main>;
}
