---
name: html-ppt-zhangzara-retro-zine
en_name: "Make a Neighborhood Zine Story like an Indie Photo Editor"
zh_name: "像独立图片编辑一样做街区 zine 故事"
description: |
  A neighborhood zine on the disappearing corner shops — portraits, voices, and what a block loses when they close. Built as a decision-grade story deck for community, local readers.
en_description: |
  A neighborhood zine on the disappearing corner shops — portraits, voices, and what a block loses when they close. Built as a decision-grade story deck for community, local readers.
zh_description: |
  像独立图片编辑一样做街区 zine 故事——一份可商业交付的生活故事 Deck，围绕真实主题、证据链与决策目标组织。
tags:
  - "life"
  - "travel-photo-essay-deck"
  - "personal"
  - "story"
  - "photo-essay"
  - "decision-deck"
  - "commercial-slide-agent"
  - "html-ppt-zhangzara-retro-zine"
triggers:
  - "travel-photo-essay-deck"
  - "life"
  - "Make a Neighborhood Zine Story like an Indie Photo Editor"
  - "像独立图片编辑一样做街区 zine 故事"
  - "story"
  - "personal"
  - "photo-essay"
  - "html deck"
  - "html slides"
od:
  mode: deck
  upstream: "https://github.com/zarazhangrui/beautiful-html-templates/tree/main/templates/retro-zine"
  upstream_license: MIT
  preview:
    type: html
    entry: example.html
  design_system:
    requires: false
  speaker_notes: false
  animations: false
  category: "life"
  scenario: "personal"
  example_prompt: "Create \"Make a Neighborhood Zine Story like an Indie Photo Editor\" as a decision-grade Life & story deck in this template's own visual system. Subject: A neighborhood zine on the disappearing corner shops — portraits, voices, and what a block loses when they close. Audience: community, local readers. First ask only for missing essentials: audience, decision target, source-of-truth materials, deadline, and must-keep numbers. Then produce the slide plan, written slides, visual direction, speaker-ready structure, and a critic pass against this rubric: would someone retell the story after seeing it once."
---

# Retro Zine

> Beige paper with green accent and Bebas Neue + Caveat: a riso-printed zine in HTML form.

A single self-contained HTML deck — typography, palette, decorative system,
and slide vocabulary are all tuned together. Mixing layouts across templates
breaks the system; stay inside this one.

## At a glance

- **Scheme:** light
- **Formality:** medium-low
- **Density:** medium
- **Slides in demo:** 10

## Best for

Anything that should feel printed, lo-fi, and crafted: indie zines and publications, music / arts brands, creator portfolios, small-batch craft launches, community decks. Also a great underdog choice for tech, research, or business decks that want a riso-print warmth instead of digital polish.

## Avoid for

Contexts that demand digital-native polish or fast modern-tech energy — the layered zine aesthetic intentionally feels handmade.

## Workflow

1. **Clone `example.html`** into the user's workspace as the working file.
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
<artifact identifier="zhangzara-retro-zine" type="text/html" title="Deck Title">
<!doctype html>
<html>...</html>
</artifact>
```

## Source & license

Vendored from upstream MIT-licensed
[`zarazhangrui/beautiful-html-templates`](https://github.com/zarazhangrui/beautiful-html-templates/tree/main/templates/retro-zine).

The full upstream MIT license text — including the original copyright notice — ships in this skill at
[`LICENSE`](./LICENSE) and must be redistributed alongside any copy of `example.html`,
`template.json`, or any vendored `assets/` runtime. See `template.json` for the upstream metadata snapshot.


---

## 授權與來源附錄 / License and provenance appendix

本附錄保留完整上游授權；附錄前的正文原段未因本次通知補齊而改寫。
The complete upstream notices follow; adding this appendix does not rewrite the preceding body.

### prompt-library/references/community/open-design/design-templates/html-ppt-zhangzara-retro-zine/LICENSE

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

