---
name: kami-deck
en_name: "Turn a Study into a Lab Meeting Deck like a Senior Postdoc"
zh_name: "像资深博士后一样做组会研究汇报"
description: |
  A lab-meeting deck on gut-microbiome links to sleep quality — the design, the results, the caveats, and the next experiment. Built as a decision-grade academic research deck for lab group, PI.
en_description: |
  A lab-meeting deck on gut-microbiome links to sleep quality — the design, the results, the caveats, and the next experiment. Built as a decision-grade academic research deck for lab group, PI.
zh_description: |
  像资深博士后一样做组会研究汇报——一份可商业交付的学术研究 Deck，围绕真实主题、证据链与决策目标组织。
tags:
  - "academic-research"
  - "academic-review-deck"
  - "research"
  - "grant"
  - "review"
  - "decision-deck"
  - "commercial-slide-agent"
  - "kami-deck"
triggers:
  - "academic-review-deck"
  - "academic-research"
  - "Turn a Study into a Lab Meeting Deck like a Senior Postdoc"
  - "像资深博士后一样做组会研究汇报"
  - "research"
  - "grant"
  - "review"
  - "html deck"
  - "html slides"
od:
  surface: web
  mode: deck
  audience: founders, researchers, design studios, conference talks
  tone: editorial, restrained, print-first
  scale: 6-15 viewport-locked slides
  preview:
    type: html
    entry: index.html
  design_system:
    requires: false
  craft:
    requires:
      - typographic-rhythm
      - pixel-discipline
  category: "academic-research"
  scenario: "research"
  example_prompt: "Create \"Turn a Study into a Lab Meeting Deck like a Senior Postdoc\" as a decision-grade Academic research deck in this template's own visual system. Subject: A lab-meeting deck on gut-microbiome links to sleep quality — the design, the results, the caveats, and the next experiment. Audience: lab group, PI. First ask only for missing essentials: audience, decision target, source-of-truth materials, deadline, and must-keep numbers. Then produce the slide plan, written slides, visual direction, speaker-ready structure, and a critic pass against this rubric: does the deck prove novelty without overclaiming."
inputs:
  - id: brand
    label: Brand identity (shared across slides)
  - id: deck_title
    label: Deck title shown in the per-slide chrome
  - id: slides
    label: Ordered list of typed slides (cover · chapter · content · stats · quote · cta · end)
  - id: language
    label: Primary language stack
parameters:
  language:
    type: enum
    values: [en, zh-CN, ja]
    default: en
    description: Sets `--serif` to Charter / TsangerJinKai02 / YuMincho respectively.
outputs:
  - path: <out>/index.html
    description: Self-contained kami deck with horizontal swipe pagination.
capabilities_required:
  - file-write
example_prompt: |
  Build me a 9-slide kami-style internal deck for "Hokuto Research" —
  a Q1 portfolio review. Cover slide on ink-blue with the firm name.
  Chapter dividers between Macro, Equities, and Outlook. Three content
  slides with ink-blue numbered headings. One stats slide showing
  AUM / IRR / fund count. One closing CTA. End card with the firm
  signature. Japanese language stack.
---

# kami-deck

Sister skill to [`kami-landing`](../kami-landing/). Produces a single
self-contained HTML file: a horizontal magazine-style swipe deck in
the **kami (紙 / 纸)** design system — print rhythm, ink-blue accent,
serif at one weight, no italic, no cool grays.

The navigation model is intentionally borrowed from the
[`guizang-ppt`](../guizang-ppt/) skill — `←/→` arrow keys, wheel /
swipe, ESC for the overview grid. The aesthetic stays kami: parchment
content slides, ink-blue cover and chapter slides, serif everywhere.

> **Design system source of truth:**
> [`design-systems/kami/DESIGN.md`](../../design-systems/kami/DESIGN.md).
> Read it before shipping. Tokens, type rules, and forbidden colors
> all live there. Slide-specific scale ratios (macro × 1.6,
> letter-spacing × 0.6 vs. print) are documented in §3 "Hierarchy"
> and §5 "Layout Principles · Slides".

## What you get

- N viewport-sized slides (6-15 is the sweet spot) laid out
  horizontally on one transformed flex track.
- **Cover and chapter slides** flip background to ink-blue
  (`#1B365D`) with ivory text — the only place dark theme is used.
- **Content / stats / quote / CTA slides** stay on parchment
  (`#f5f4ed`) with serif at weight 500.
- **Per-slide chrome strip**: brand mark · deck title · live slide
  counter (`01 / 09`).
- **Tabular-nums** on every counter, metric, page number.
- **Coral-free** — kami's accent is ink-blue. Progress bar and dot
  nav are ink-blue too.
- **Keyboard / wheel / touch nav**, ESC overview grid, dot indicator.
- **Multilingual stack** — EN / zh-CN / ja, set on `:root` via
  the `language` parameter.

## Slide types

| Kind        | Background | Use it for                                                |
| :---------- | :--------- | :-------------------------------------------------------- |
| `cover`     | ink-blue   | Title plate at the start. Centered serif title + tagline. |
| `chapter`   | ink-blue   | Roman/Arabic numeral chapter divider.                     |
| `content`   | parchment  | Section number + title + body + optional bullets.         |
| `stats`     | parchment  | 3-4 metric cells (value · label · sub).                   |
| `quote`     | parchment  | Pull quote with ink-blue left rule + author signature.    |
| `cta`       | parchment  | Closing pitch + 1-2 buttons.                              |
| `end`       | ink-blue   | Mega serif kicker word + colophon footer.                 |

A typical 11-slide deck:

```
1. cover     — ink-blue title plate
2. chapter   — "01 / Why now"
3. content   — manifesto
4. content   — capabilities + bullets
5. stats     — 4 numbers
6. chapter   — "02 / How it feels"
7. content   — method
8. content   — selected work
9. quote     — testimonial
10. cta      — primary action
11. end      — ink-blue kicker
```

## Workflow

### 1. Gather the brief

Ask in two rounds (don't dump the whole list at once):

1. Identity round — name, mark, tagline, location, edition, language.
2. Content round — for each slide, kind + the typed fields.

### 2. Pick the language stack

Same as [`kami-landing`](../kami-landing/SKILL.md#2-pick-the-language-stack):
EN → Charter, zh-CN → TsangerJinKai02 / Source Han Serif, ja →
YuMincho. JA also overrides `--olive` to `#4d4c48` because YuMincho
strokes are thinner.

### 3. Write `index.html`

Output a single file with all CSS inline. Mirror the structure of
[`example.html`](./example.html). Use only the tokens from
`design-systems/kami/DESIGN.md`.

The runtime script (keyboard / wheel / touch nav, dot indicator,
progress bar, ESC overview) should match the model documented in
[`open-design-landing-deck/scripts/compose.ts`](../open-design-landing-deck/scripts/compose.ts).
Do **not** reuse the open-design-landing-deck CSS; the visual
language is different.

### 4. Self-check

- [ ] All cover / chapter / end slides use ink-blue background
      (`#1B365D`) with ivory text. All other slides are on
      parchment.
- [ ] Ink-blue covers ≤ 5% of any parchment slide's surface.
- [ ] Slide titles use serif weight 500 only. No italic.
- [ ] All numeric stacks (counter, metrics, page numbers) carry
      `font-variant-numeric: tabular-nums`.
- [ ] Press `→` / `Space` / scroll. Smoothly slides one viewport
      to the right; dot nav advances; the ink-blue progress bar
      ticks forward.
- [ ] Press `Esc`. Overview grid appears with scaled thumbnails.
- [ ] Resize to 1080px and 640px. Cover / content collapse to a
      single column; dot nav still works.
- [ ] Lighthouse: contrast AA, font-display swap, no layout shift.

## Boundaries

- **Do not** introduce a second accent color. Pick ink-blue or
  pick nothing.
- **Do not** use italic anywhere — emphasis swaps to ink-blue.
- **Do not** use `rgba()` for tag fills; pre-blend over parchment
  and use solid hex from the table in
  `design-systems/kami/DESIGN.md` §2.
- **Do not** add a router. This is a single-file artifact.
- **Do not** reuse Atelier Zero collage imagery (the open-design-landing
  visual system). Kami is gradient-free, image-light, and hierarchy
  is carried by type.

## See also

- [`kami-landing`](../kami-landing/) — long-form one-pager sister skill.
- [`design-systems/kami/DESIGN.md`](../../design-systems/kami/DESIGN.md) — token spec.
- [`open-design-landing-deck`](../open-design-landing-deck/) — same
  horizontal swipe nav model, different visual language (Atelier Zero).
- Upstream: [`tw93/kami`](https://github.com/tw93/kami) — original
  Claude skill (MIT). Kami's slides.py template documents the macro
  × 1.6 / micro × 0.6 ratios this skill applies.


---

## 授權與來源附錄 / License and provenance appendix

本附錄保留完整上游授權；附錄前的正文原段未因本次通知補齊而改寫。
The complete upstream notices follow; adding this appendix does not rewrite the preceding body.

### prompt-library/references/community/open-design/LICENSE

Source: open-design-official
Pinned version: bf714528070d5cf1cfcdd25bdc7c9efc7e129d0b

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for describing the origin of the Work and
      reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Support. While redistributing the Work or
      Derivative Works thereof, You may choose to offer, and charge a
      fee for, acceptance of support, warranty, indemnity, or other
      liability obligations and/or rights consistent with this License.
      However, in accepting such obligations, You may act only on Your
      own behalf and on Your sole responsibility, not on behalf of any
      other Contributor, and only if You agree to indemnify, defend,
      and hold each Contributor harmless for any liability incurred by,
      or claims asserted against, such Contributor by reason of your
      accepting any such warranty or support.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright 2026 Open Design contributors

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

