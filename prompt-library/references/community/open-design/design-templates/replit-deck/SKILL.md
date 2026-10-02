---
name: replit-deck
en_name: "Write a Feature Business Case like a Principal PM"
zh_name: "像 Principal PM 一样写功能商业论证"
description: |
  For product and technical management work: turn PRDs, roadmaps, RFCs, architecture reviews, and retros into decision documents. Built around the core query "pm-feature-business-case-deck", with product strategy lead judgment, buyer-ready proof, and this outcome: approve the feature, architecture, roadmap, or incident follow-up.
en_description: |
  For product and technical management work: turn PRDs, roadmaps, RFCs, architecture reviews, and retros into decision documents. Built around the core query "pm-feature-business-case-deck", with product strategy lead judgment, buyer-ready proof, and this outcome: approve the feature, architecture, roadmap, or incident follow-up.
zh_description: |
  产品/技术管理场景：围绕 core query「pm-feature-business-case-deck」把粗糙材料整理成“像 Principal PM 一样写功能商业论证”这类可购买、可复用的专业 Deck；突出受众、决策目标、证据链、风险取舍和评审标准。
tags:
  - "product-management"
  - "pm-feature-business-case-deck"
  - "product"
  - "roadmap"
  - "architecture"
  - "decision-deck"
  - "commercial-slide-agent"
  - "replit-deck"
triggers:
  - "pm-feature-business-case-deck"
  - "product-management"
  - "Write a Feature Business Case like a Principal PM"
  - "像 Principal PM 一样写功能商业论证"
  - "product"
  - "roadmap"
  - "architecture"
  - "html deck"
  - "html slides"
od:
  mode: deck
  preview:
    type: html
    entry: index.html
  design_system:
    requires: false
  inputs:
    - name: theme
      type: enum
      required: true
      default: helix
      values:
        - helix         # Modern minimal · light grey · ink + electric blue · SaaS metrics / board
        - holm          # Editorial serif · cream · ink + deep chestnut · legal / finance memo
        - vance         # Gallery · cream · cream serif on black bars · art catalog / showcase
        - bevel         # Y2K editorial · black · display type + product photo grid · campaign
        - world-dark    # Finance green dark · deep green · mint + neon yellow · policy report
        - world-mint    # Finance green light · mint · deep green + neon yellow · policy report
        - atlas         # Museum · black · serif + vermilion · long-form narrative / chapter deck
        - bluehouse     # Consumer card · deep navy · gradient cards + peach → coral · product showcase
    - name: slide_count
      type: integer
      default: 6
      min: 3
      max: 20
      # 6 is a board-update baseline. Memos and campaign decks usually land
      # at 3–4 (see example-holm / example-bluehouse). Long-form chapters
      # (atlas) can run 8–12. Don't pad to hit the default.
  scenario: "product"
  example_prompt: "Create \"Write a Feature Business Case like a Principal PM\" as a Product and technical management deck in the Replit Deck visual system. Scene: pm-feature-business-case-deck. First ask only for missing essentials: audience, decision target, source-of-truth materials, deadline, and must-keep numbers. Then produce a commercial-grade slide plan, written slides, visual direction, speaker-ready structure, and critic pass against this rubric: can cross-functional reviewers agree on the next irreversible step."
---

# Replit Deck Skill

Produce a single-file horizontal-swipe HTML deck in one of eight Replit-Slides themes. Every theme is a complete visual system — do not mix tokens across themes.

## Resource map

```
replit-deck/
├── SKILL.md                ← you're reading this
├── assets/
│   └── template.html       ← seed: 8 themes via [data-theme=*], proven iframe-nav script (READ FIRST)
├── references/
│   ├── themes.md           ← 8 themes: when-to-pick / do / don't / primary layouts
│   ├── layouts.md          ← 10 paste-ready slide layouts, cross-theme
│   ├── components.md       ← shared primitives (eyebrow, kpi-row, image-grid, meta-bar)
│   └── checklist.md        ← P0/P1/P2 self-review + theme lock-in gate
└── examples/               ← four reference decks across the most contrasting themes
    ├── example-helix.html       (SaaS board update · light minimal)
    ├── example-holm.html        (legal fintech memo · cream editorial serif)
    ├── example-atlas.html       (quarterly history chapter · black + vermilion)
    └── example-bluehouse.html   (real estate ROI · navy + gradient cards)
```

## Workflow

### Step 0 — Pre-flight (mandatory reads)

1. Read `assets/template.html` end-to-end. The `[data-theme]` blocks carry the tokens; the `<script>` at the bottom solves five iframe nav bugs — **do not rewrite it**.
2. Read `references/themes.md` → pick **one** theme that matches the user's brief. If the user already picked a theme via `od.inputs.theme`, use that.
3. Read `references/layouts.md` → you'll copy `<section>` blocks from here.
4. Read `references/checklist.md` → P0 must pass before emit.

### Step 1 — Commit to one theme

Write out loud (in the TodoWrite or plan section) which theme and why. Once picked, **every slide uses that theme's tokens only**. No swapping mid-deck. The `<body data-theme="helix">` attribute is the single source of truth.

| Theme | Pick when |
|---|---|
| `helix` | SaaS board update, product metrics, neutral modern |
| `holm` | Legal memo, investor pre-read, serious / institutional |
| `vance` | Art portfolio, design catalog, photographer / sculptor |
| `bevel` | Fashion campaign, lookbook, Y2K / editorial attitude |
| `world-dark` | Policy report, finance analysis, premium dark |
| `world-mint` | Lighter companion of world-dark — ESG, wellness finance, sustainability |
| `atlas` | Long-form narrative, chapter deck, museum / archive aesthetic |
| `bluehouse` | Consumer product, real estate, lifestyle, colorful cards |

### Step 2 — Plan slide rhythm before writing HTML

Default 6 slides. Write the rhythm BEFORE any HTML, for example (helix, 6 slides):

```
01  cover           hero + title + subtitle
02  kpi-row-6       6 metrics with ▲/▼ deltas
03  split-insight   left stat + right paragraph
04  chapter-plate   section divider
05  three-up        three parallel columns
06  closing         one bold number or CTA
```

Show this to the user. Redirecting at this stage is cheap.

### Step 3 — Copy seed, bind theme

1. Copy `assets/template.html` to project root as `index.html`.
2. Set `<body data-theme="<chosen>">`.
3. Replace `<title>`.
4. Delete the placeholder slides in the body (the seed ships with 3 demo slides). Keep the chrome (counter / progress / hint).

### Step 4 — Paste layouts, fill real copy

For each planned slide, copy the matching `<section>` from `references/layouts.md`. Replace every `[REPLACE]` with specific copy — never leave placeholders, never use lorem. If a slide feels empty, pick a different layout.

Tag each slide with `data-screen-label="01 Cover"`, `"02 Metrics"`, etc., in presentation order.

### Step 5 — Self-check

Run `references/checklist.md` silently before emit: the **P0 theme-lock gate** plus the five-dimension 1–5 critique (Philosophy / Hierarchy / Execution / Specificity / Restraint). Any dimension ≤ 3 → re-do before emit.

The P0 theme-lock grep is non-negotiable:

```bash
grep -E 'data-theme|style="--' index.html | head
```

If any `style="--accent:..."` or theme override appears on individual slides, revert. One theme per deck.

### Step 6 — Emit artifact

```
<artifact identifier="deck-<slug>" type="text/html" title="<Deck title>">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact. Stop after `</artifact>`.

## Hard rules

- **One theme per deck.** `data-theme` set on `<body>` — never override per-slide.
- **Numbers are real or absent.** No invented metrics. Use `—` or a grey block as an honest placeholder.
- **Display face follows theme.** helix/world-dark/world-mint/bluehouse use the sans Display; holm/vance/atlas use the serif Display; bevel uses the Y2K display. Do not swap. (Authoritative source: the `--font-display` token of each theme in `assets/template.html` — if this list ever disagrees with the template, the template wins.)
- **Accent appears 1–2× per slide max.** Never a gradient-spam.
- **Never rewrite the nav script.** Five iframe bugs it solves are not obvious.
- **Keep it one HTML file.** Inline all CSS. No external fonts — the system stack in each theme is deliberate.
- **`data-screen-label` on every slide.**
- **No Replit logo / brand lockup.** These are template styles, not a Replit-brand deck.

---

## When to pick `replit-deck` vs. peer skills

| Skill | Pick when |
|---|---|
| `simple-deck` | Plain, single-theme deck bound to the project's `DESIGN.md` tokens. When the deck should *match* the host brand, not assert its own. (`designSystemRequired: true`.) |
| `magazine-web-ppt` | Editorial "magazine × e-ink" aesthetic (WebGL fluid background, serif titles, chapter plates). When the brief asks for a keynote / launch / sharing-style deck and calls out Monocle / WIRED / Kinfolk / Domus. |
| `replit-deck` | The brief explicitly asks for Replit-Slides gallery aesthetic, or needs one of the 8 token-frozen visual identities (SaaS board, editorial memo, gallery catalog, Y2K campaign, policy report, museum chapter, consumer cards). No dependency on `DESIGN.md`. |

If the user just says "make me a deck" without further guidance, default to `simple-deck` — it respects their design system. Pick `replit-deck` only when the brief is explicit about the aesthetic or names a theme.

---

## Scope & provenance

- **Eight themes = the full replit.com/slides landing-page gallery at the time of snapshot.** Not a curated subset — every theme card currently published on replit.com/slides is represented here (helix, holm, vance, bevel, world-dark, world-mint, atlas, bluehouse). If Replit ships a ninth template, it is **not** automatically reflected in this skill.
- **Snapshot date: 2026-04-29.** All hex values were sampled from the actual replit.com/slides PNGs on that date with ImageMagick — no guessed colors, no memory substitutions. See `references/themes.md` → *Contributing a new theme* for the exact sampling procedure.
- **Maintenance: one-time snapshot, not tracked.** Replit Slides is a live product and may drift. This skill does not auto-sync. If you notice Replit has updated colors or added a theme and want it reflected here, open an issue on `nexu-io/open-design` titled `replit-deck: re-sync to replit.com/slides (YYYY-MM-DD)` and attach the updated screenshots. There is no designated owner monitoring the upstream.
- **No Replit branding.** These are gallery-style templates, not a Replit-brand deck. The checklist (P0) forbids inserting a Replit logo or wordmark.

---

## Browser / runtime support

- **Target**: modern evergreen desktop browsers (Chrome 110+ / Safari 16+ / Firefox 115+) and modern mobile Safari / Chrome.
- **Features used**: CSS scroll-snap (horizontal), `color-mix()`, CSS custom properties, `text-wrap: balance`. All ≥ 93% Baseline.
- **Not supported**: IE 11, Safari < 15, any browser without `color-mix()` (would need a fallback `--accent-soft` if you want to support older Safari; out of scope for this skill).
- **Mobile**: horizontal scroll-snap works on iOS Safari 16+ and Android Chrome. Keyboard nav is desktop-only by design.
- **Nav script behavior**: reused verbatim from `design-templates/simple-deck` — survives iframe embedding (the daemon preview surface), dual listener races, focus loss, and position persistence across reloads. **Do not rewrite it.**

---

## Verification

The design template auto-registers with the daemon on filesystem scan (no manual wiring). Confirmed against a running daemon on `localhost:7456` after adding this template:

```bash
$ curl -s localhost:7456/api/design-templates \
    | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); \
               console.log(JSON.stringify(d.designTemplates.find(t=>t.id==='replit-deck'), null, 2));"
{
  "id": "replit-deck",
  "name": "replit-deck",
  "description": "Single-file horizontal-swipe HTML deck in the style of Replit Slides's\nlanding-page template gallery. Eight distinct themes …",
  "triggers": [
    "replit deck",
    "replit slides",
    "replit 风格 ppt",
    "replit style deck",
    "helix deck",
    "holm memo",
    "atlas chapter",
    "bluehouse",
    "bevel campaign"
  ],
  "mode": "deck",
  "platform": null,
  "scenario": "product",
  "previewType": "html",
  "designSystemRequired": false,
  "defaultFor": [],
  "upstream": null,
  "featured": null,
  "fidelity": null,
  "speakerNotes": null,
  "animations": null,
  "examplePrompt": "Single-file horizontal-swipe HTML deck in the style of Replit Slides's landing-page template gallery.",
  "hasBody": true
}
```

All four example decks (`examples/example-{helix,holm,atlas,bluehouse}.html`) open directly in a browser. Keyboard nav (← / → / Space / Home / End) and horizontal scroll-snap work in Chrome 129 and Safari 18.


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

