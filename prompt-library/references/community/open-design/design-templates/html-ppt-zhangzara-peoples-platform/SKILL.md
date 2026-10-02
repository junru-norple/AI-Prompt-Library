---
name: html-ppt-zhangzara-peoples-platform
en_name: "Make a Public-Transit Funding Case like a Transportation Policy Lead"
zh_name: "像交通政策负责人一样做公共交通投资论证"
description: |
  A public-transit funding proposal for a city council — ridership need, the plan, the risk controls, and the ask. Built as a decision-grade policy briefing deck for city council, public board.
en_description: |
  A public-transit funding proposal for a city council — ridership need, the plan, the risk controls, and the ask. Built as a decision-grade policy briefing deck for city council, public board.
zh_description: |
  像交通政策负责人一样做公共交通投资论证——一份可商业交付的政策简报 Deck，围绕真实主题、证据链与决策目标组织。
tags:
  - "government-policy"
  - "policy-briefing-deck"
  - "policy"
  - "regulatory"
  - "risk-review"
  - "decision-deck"
  - "commercial-slide-agent"
  - "html-ppt-zhangzara-peoples-platform"
triggers:
  - "policy-briefing-deck"
  - "government-policy"
  - "Make a Public-Transit Funding Case like a Transportation Policy Lead"
  - "像交通政策负责人一样做公共交通投资论证"
  - "policy"
  - "regulatory"
  - "risk-review"
  - "html deck"
  - "html slides"
od:
  mode: deck
  upstream: "https://github.com/zarazhangrui/beautiful-html-templates/tree/main/templates/peoples-platform"
  upstream_license: MIT
  preview:
    type: html
    entry: example.html
  design_system:
    requires: false
  speaker_notes: false
  animations: false
  category: "government-policy"
  scenario: "policy"
  example_prompt: "Create \"Make a Public-Transit Funding Case like a Transportation Policy Lead\" as a decision-grade Government & policy deck in this template's own visual system. Subject: A public-transit funding proposal for a city council — ridership need, the plan, the risk controls, and the ask. Audience: city council, public board. First ask only for missing essentials: audience, decision target, source-of-truth materials, deadline, and must-keep numbers. Then produce the slide plan, written slides, visual direction, speaker-ready structure, and a critic pass against this rubric: does the deck reduce approval risk rather than create rhetorical heat."
---

# People's Platform (Block & Bold)

> Activist poster energy: blue, orange, red on cream, with Alfa Slab + Caveat Brush.

A single self-contained HTML deck — typography, palette, decorative system,
and slide vocabulary are all tuned together. Mixing layouts across templates
breaks the system; stay inside this one.

## At a glance

- **Scheme:** light
- **Formality:** medium-low
- **Density:** medium-high
- **Slides in demo:** 10

## Best for

Anything that should feel honest, loud, and graphic: cultural commentary, manifestos, civic and community decks, design talks, campaign pitches. Excellent for founder-vision moments, mission statements, or any deck — including across industries — that wants protest-poster energy instead of corporate polish.

## Avoid for

Contexts where institutional restraint is the actual goal — the saturated political-poster palette commits hard to expressive energy.

## Workflow

1. **Clone `example.html` AND the `assets/` folder** into the user's workspace.
   This template ships an `assets/deck-stage.js` runtime (keyboard navigation,
   stage rendering); the HTML references it as `assets/deck-stage.js`, so the
   file must sit next to the cloned HTML or that path will 404 in the generated
   artifact and navigation will silently break. Inlining the JS into a single
   `<script>` block in the HTML is an acceptable alternative when a single
   self-contained file is preferred.
2. **Replace placeholder content** with the user's real headlines, body copy,
   numbers, names, dates, and section labels. Match existing dimensions when
   swapping image placeholders.
3. **Preserve the design system.** Never substitute fonts, recolor the palette,
   restructure the layout grid, or strip decorative elements (corner brackets,
   paper grain, geometric shapes, illustrated SVGs). They are part of the
   identity.
4. **Adjust deck length by duplicating layouts.** If the user has more content
   than the demo holds, duplicate an existing slide of the most appropriate
   layout. If less, drop slides from the bottom. Update page-number labels.
5. **Designing missing layouts:** if a slide needs a layout the template
   doesn't have, design it from scratch using the same fonts, palette,
   decorative vocabulary, spacing rhythm, and component grammar — never bail
   to a different template.
6. **Keep the navigation runtime as shipped.** If the deck ships an
   `assets/deck-stage.js` or inline keyboard handler, leave it intact.

## Output contract

Emit between `<artifact>` tags:

```
<artifact identifier="zhangzara-peoples-platform" type="text/html" title="Deck Title">
<!doctype html>
<html>...</html>
</artifact>
```

## Source & license

Vendored from upstream MIT-licensed
[`zarazhangrui/beautiful-html-templates`](https://github.com/zarazhangrui/beautiful-html-templates/tree/main/templates/peoples-platform).

The full upstream MIT license text — including the original copyright notice — ships in this skill at
[`LICENSE`](./LICENSE) and must be redistributed alongside any copy of `example.html`,
`template.json`, or any vendored `assets/` runtime. See `template.json` for the upstream metadata snapshot.


---

## 授權與來源附錄 / License and provenance appendix

本附錄保留完整上游授權；附錄前的正文原段未因本次通知補齊而改寫。
The complete upstream notices follow; adding this appendix does not rewrite the preceding body.

### prompt-library/references/community/open-design/design-templates/html-ppt-zhangzara-peoples-platform/LICENSE

Source: open-design-official
Pinned version: bf714528070d5cf1cfcdd25bdc7c9efc7e129d0b

MIT License

Copyright (c) 2026 Zara Zhang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

