---
name: html-ppt-zhangzara-pin-and-paper
en_name: "Turn a Field-Study Capstone into a Defense Deck like a Star Biology Major"
zh_name: "像明星生物学生一样做田野调查答辩"
description: |
  A field-biology capstone on urban pollinator decline — the survey design, the data, the contribution, and the caveats. Built as a decision-grade coursework defense deck for faculty reviewers.
en_description: |
  A field-biology capstone on urban pollinator decline — the survey design, the data, the contribution, and the caveats. Built as a decision-grade coursework defense deck for faculty reviewers.
zh_description: |
  像明星生物学生一样做田野调查答辩——一份可商业交付的课业答辩 Deck，围绕真实主题、证据链与决策目标组织。
tags:
  - "student-coursework"
  - "senior-capstone-defense-deck"
  - "education"
  - "coursework"
  - "defense"
  - "academic"
  - "decision-deck"
  - "commercial-slide-agent"
  - "html-ppt-zhangzara-pin-and-paper"
triggers:
  - "senior-capstone-defense-deck"
  - "student-coursework"
  - "Turn a Field-Study Capstone into a Defense Deck like a Star Biology Major"
  - "像明星生物学生一样做田野调查答辩"
  - "coursework"
  - "defense"
  - "academic"
  - "html deck"
  - "html slides"
od:
  mode: deck
  upstream: "https://github.com/zarazhangrui/beautiful-html-templates/tree/main/templates/pin-and-paper"
  upstream_license: MIT
  preview:
    type: html
    entry: example.html
  design_system:
    requires: false
  speaker_notes: false
  animations: false
  category: "student-coursework"
  scenario: "education"
  example_prompt: "Create \"Turn a Field-Study Capstone into a Defense Deck like a Star Biology Major\" as a decision-grade Student coursework deck in this template's own visual system. Subject: A field-biology capstone on urban pollinator decline — the survey design, the data, the contribution, and the caveats. Audience: faculty reviewers. First ask only for missing essentials: audience, decision target, source-of-truth materials, deadline, and must-keep numbers. Then produce the slide plan, written slides, visual direction, speaker-ready structure, and a critic pass against this rubric: can a reviewer find the contribution, evidence, and limitation in under 90 seconds."
---

# Pin & Paper

> Yellow paper with safety-pin illustrations, ink-blue handwritten Caveat, paper-grain texture.

A single self-contained HTML deck — typography, palette, decorative system,
and slide vocabulary are all tuned together. Mixing layouts across templates
breaks the system; stay inside this one.

## At a glance

- **Scheme:** light
- **Formality:** medium
- **Density:** medium
- **Slides in demo:** 11

## Best for

Anything that should feel hand-crafted, warm, and literary: qualitative research findings, founder reflections, longform brand stories, workshop debriefs. The signature safety-pin illustrations and paper-grain texture make it especially good for any deck — including tech or business — that wants personality and warmth over polish.

## Avoid for

Decks that need to feel digital-native polished or rigorously data-driven — handwritten Caveat is intentionally informal.

## Workflow

1. **Clone `example.html` AND the `assets/` folder** into the user's workspace.
   This template ships an `assets/deck-stage.js` runtime (keyboard navigation,
   stage rendering) and an `assets/styles.css` stylesheet. The HTML references
   them as `assets/deck-stage.js` and `assets/styles.css`, so both must sit next
   to the cloned HTML or those paths will 404 in the generated artifact and
   navigation/styling will silently break. Inlining the JS/CSS into a single
   `<script>`/`<style>` block in the HTML is an acceptable alternative when a
   single self-contained file is preferred.
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
<artifact identifier="zhangzara-pin-and-paper" type="text/html" title="Deck Title">
<!doctype html>
<html>...</html>
</artifact>
```

## Source & license

Vendored from upstream MIT-licensed
[`zarazhangrui/beautiful-html-templates`](https://github.com/zarazhangrui/beautiful-html-templates/tree/main/templates/pin-and-paper).

The full upstream MIT license text — including the original copyright notice — ships in this skill at
[`LICENSE`](./LICENSE) and must be redistributed alongside any copy of `example.html`,
`template.json`, or any vendored `assets/` runtime. See `template.json` for the upstream metadata snapshot.


---

## 授權與來源附錄 / License and provenance appendix

本附錄保留完整上游授權；附錄前的正文原段未因本次通知補齊而改寫。
The complete upstream notices follow; adding this appendix does not rewrite the preceding body.

### prompt-library/references/community/open-design/design-templates/html-ppt-zhangzara-pin-and-paper/LICENSE

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

