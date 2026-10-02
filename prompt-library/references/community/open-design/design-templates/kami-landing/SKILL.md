---
name: kami-landing
description: >
  Produce a print-grade single-page kami (紙 / 纸) document — warm
  parchment canvas, ink-blue accent, serif at one weight, no italic,
  no cool grays. The output reads like a professional white paper or
  studio one-pager, not an app UI. Multilingual by design (EN ·
  zh-CN · ja). One self-contained HTML file, zero dependencies.
triggers:
  - kami
  - 紙
  - 纸
  - paper one-pager
  - 白皮书
  - white paper
  - parchment landing
  - editorial document
  - print-grade page
  - kami landing
od:
  category: brand-page
  surface: web
  mode: prototype
  platform: desktop
  scenario: marketing
  audience: founders, design studios, OSS maintainers, researchers
  tone: editorial, restrained, print-first
  scale: viewport-anchored long-form single page
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: false
  craft:
    requires:
      - typographic-rhythm
      - pixel-discipline
inputs:
  - id: brand
    label: Brand identity
    description: Name, tagline, location, edition / version, primary URL.
  - id: hero
    label: Hero / cover block
    description: Eyebrow + headline (one line, ≤ 6 words at display size) + tagline + 3 hero meta tokens.
  - id: manifesto
    label: Manifesto paragraph + signature
  - id: metrics
    label: 3-6 metric tiles (value · label · sub)
  - id: chapters
    label: 3-5 numbered chapters (title + lede + body)
  - id: footer
    label: License · year · contact + 3-column site index
parameters:
  output_format:
    type: enum
    values: [standalone-html]
    default: standalone-html
  language:
    type: enum
    values: [en, zh-CN, ja]
    default: en
    description: >
      Sets the primary serif stack on `:root`. EN uses Charter,
      zh-CN uses TsangerJinKai02 / Source Han Serif, ja uses
      YuMincho. Mixed-script content is allowed inline; the browser
      resolves per-glyph fallback automatically.
outputs:
  - path: <out>/index.html
    description: Self-contained HTML, kami CSS inlined, zero JS, zero external dependencies beyond Google Fonts.
capabilities_required:
  - file-write
example_prompt: |
  Build me a kami-style one-pager for "Lumen Field", an indie studio
  shipping a soundscape app for focus. Hero headline "Soundscapes for
  focused work.", manifesto paragraph + signature "by Lumen Field,
  Berlin", 3 metric tiles (12 soundscapes / 4 presets / 1 daily ritual),
  three numbered chapters covering the studio, the app, and the roadmap.
  English-language stack.
---

# kami-landing

Produce a single-page document in the **kami (紙 / 纸)** design system.
The aesthetic borrows from editorial print, technical white papers,
and old typewritten correspondence — the goal is *good content on
good paper*, not *modern app UI*.

> **Design system source of truth:** [`design-systems/kami/DESIGN.md`](../../design-systems/kami/DESIGN.md).
> Read it before shipping. Tokens, type rules, the "ten invariants",
> and forbidden colors all live there.

## What you get

A single self-contained HTML file with:

- **Warm parchment canvas** (`#f5f4ed`) — never `#ffffff`.
- **Single chromatic accent** — ink-blue (`#1B365D`), used on the
  section number, the headline accent word, the left rule of the
  manifesto, and the metric values. Anywhere else, ink-blue must
  cover ≤ 5% of the document surface area.
- **Serif at one weight (500) for hierarchy** — Charter (EN),
  TsangerJinKai02 / Source Han Serif (CN), or YuMincho (JA),
  selected by the `language` parameter. **No italic anywhere.**
- **Tight print rhythm** — line-heights 1.10–1.55, letter-spacing
  per language (0 for EN, 0.35px for CN, 0.02em for JA).
- **Numeric stacks set in `font-variant-numeric: tabular-nums`** so
  metric columns and pagination digits sit cleanly aligned.
- **Depth via 1px rings + whisper shadows** (`0 4px 24px rgba(0,0,0,0.05)`).
  No hard drop shadows, no neumorphism, no backdrop-filter blurs.
- **Tag fills as solid hex** (e.g. `#E4ECF5`), never `rgba()` —
  print renderers double-paint alpha tags.
- **Responsive** at 1280 / 980 / 768 / 560.

## Page structure

```text
1. Eyebrow row     — locale switcher · edition · version (12px sans uppercase)
2. Hero            — display headline (96–106px serif 500), tagline (21px),
                     three hero-token chips (paper-tinted)
3. Manifesto       — pull paragraph in serif 400, 20px, 1.65 LH, with
                     ink-blue left-rule and signature footer
4. Metrics row     — 3-6 cells: value (24px serif 500 ink-blue, tabular-nums),
                     label (12px serif 500 olive)
5. Chapters        — numbered (`01`, `02`, …) ink-blue serif 500 14px,
                     section title 28-32px, body 14-15px
6. Footer          — kicker word (mega serif 500), license · year · contact,
                     three-column site index in 12px serif 500
```

## Workflow contract

### 1. Gather brand brief

Use `AskQuestion` (or equivalent) to collect the brand brief in
chunks. Don't dump the whole input list on the user; ask in two
rounds:

1. Identity round — name, tagline, location, edition / version,
   primary URL, dominant language.
2. Content round — manifesto paragraph + signature, 3-6 metric
   tiles, 3-5 chapter (title + lede + body) entries.

### 2. Pick the language stack

The `language` parameter controls which `--serif` stack is set on
`:root`. Pick based on the dominant language of the manifesto and
chapter body copy:

| `language` | `--serif`                                                 | Notes                                  |
| :--------- | :-------------------------------------------------------- | :------------------------------------- |
| `en`       | Charter, Georgia, Palatino, Times New Roman, serif         | default                                |
| `zh-CN`    | TsangerJinKai02, Source Han Serif SC, Songti SC, Georgia   | letter-spacing 0.35px on body          |
| `ja`       | YuMincho, Hiragino Mincho ProN, Source Han Serif JP        | also override `--olive` to `#4d4c48` (YuMincho strokes are thinner) |

Inline mixed-script content is fine — the browser per-glyph fallback
chain handles it. Do **not** chain all three families inside one
`font-family` declaration; that dilutes character.

### 3. Write `index.html`

Output a single file with all CSS inline. Mirror the structure of
[`example.html`](./example.html) and use only the tokens from
`design-systems/kami/DESIGN.md`. Do **not** invent new colors,
weights, or font families.

Component primitives the agent can drop in (all defined in the
example's `<style>` block):

- `.eyebrow`, `.label` — sans-serif overlines
- `.metric` — value + label vertical pair
- `.section-num` + `.section-title` + `.section-lede`
- `.tag.standard`, `.tag.brush` — solid-hex tags (one brush max per page)
- `.quote` — left-rule serif 500 quote
- `ul.dash` — en-dash bullets in ink-blue
- `.code` — ivory-bg, 1px-border code block
- `.footer-kicker` — mega serif 500 word

Tag every editable element with `data-od-id="<unique-slug>"` so the
host app's comment mode can target it.

### 4. Self-check before delivering

- [ ] Page background is parchment (`#f5f4ed`), never `#ffffff`.
- [ ] Ink-blue (`#1B365D`) covers ≤ 5% of visible surface — count
      section numbers, the manifesto rule, the metric values, the
      headline accent. Total ≤ 5%.
- [ ] All grays are warm (R ≈ G > B). No `slate-*`, no `#f3f4f6`.
- [ ] Serif weight stays at 500 — no `font-weight: 700` or `900`
      anywhere on serif text.
- [ ] No `font-style: italic` anywhere. Emphasis swaps to ink-blue
      color or a `.tag` instead.
- [ ] All numeric stacks (metric values, pagination, dates, financial
      figures) carry `font-variant-numeric: tabular-nums`.
- [ ] All tag fills are solid hex (e.g. `#E4ECF5`), never `rgba()`.
- [ ] Shadows: at most a `1px` ring or a `0 4px 24px rgba(0,0,0,0.05)`
      whisper. No hard drop shadows.
- [ ] Headline ≤ 6 words at display size; CJK ≤ 8 characters.
- [ ] At 768px and 560px the layout collapses to one column without
      horizontal scroll.

## Files in this skill

```text
design-templates/kami-landing/
├── SKILL.md                 # this contract
├── README.md                # human quick-start
└── example.html             # canonical Open Design rendering
```

## Boundaries

- **Do not** invent new colors or typefaces. The kami palette is
  fixed; if a brief demands a brand color, push back or render the
  brand color as a single `.tag.brush` accent.
- **Do not** introduce a second accent color. Pick ink-blue or pick
  nothing.
- **Do not** mix all three font stacks in one declaration; pick the
  dominant language, override `--serif` on `:root`, and let the
  browser per-glyph fallback resolve mixed-script inline content.
- **Do not** use `rgba()` for tag fills — print renderers
  double-paint alpha tags. Use the pre-blended solid hex from the
  table in `design-systems/kami/DESIGN.md` §2.
- **Do not** add JavaScript for animation. The page is paper, not
  an app — motion belongs to the reader scrolling.

## See also

- [`design-systems/kami/DESIGN.md`](../../design-systems/kami/DESIGN.md) — the full token spec.
- [`design-templates/kami-deck/`](../kami-deck/) — sister skill that produces a
  slide deck in the same kami language.
- Upstream: [`tw93/kami`](https://github.com/tw93/kami) — original
  Claude skill (MIT) that the design system adapts.


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

