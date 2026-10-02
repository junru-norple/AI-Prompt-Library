// SPDX-FileCopyrightText: 2026 junru-norple
// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react';
import './globals.css';
export const metadata = { title: 'Cobalt Practice', description: 'Static-export cinematic architecture starter.' };
export default function Layout({ children }: Readonly<{ children: ReactNode }>) { return <html lang="zh-Hant"><body>{children}</body></html>; }
