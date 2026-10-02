# Atelier Zero — Image Generation Prompt Pack

This pack is consumed by the `open-design-landing` skill. Every page-level
image is rendered with `gpt-image-fal` (preferred) or `gpt-image-azure`.

The pack has three layers:

1. **Style anchor** — the long block that tells the model what
   universe we are in. Always prepend to every prompt.
2. **Variable slots** — the per-render content (subject, motifs,
   accent, page type).
3. **Per-slot variants** — explicit composition templates for hero,
   about, capabilities, method tiles, lab cards, work cards,
   testimonial, and CTA.

Render at 1024×1024 minimum for square slots (hero / about / capabilities
/ testimonial / cta), 816×816 for the four method tiles, and 768×1024 for
portrait slots (lab cards, featured work). Authoritative per-slot
dimensions and aspect ratios live in `image-manifest.json` — treat that
file as the source of truth. Save as PNG to `assets/<slot>.png`.

---

## 1. Style anchor (always prepend)

```text
Use case: ads-marketing

Asset type: editorial website hero / creative studio landing page visual

Primary request: Generate a refined editorial web page composition in the
same visual language as a high-end creative AI research studio.

Style/medium: sophisticated digital collage, modern Swiss editorial layout,
Bauhaus geometric composition, classical plaster sculpture fragments,
brutalist/minimal architecture, art-direction website mockup, premium
agency aesthetic.

Scene/backdrop: warm off-white handmade paper background with subtle
grain, faint vertical folds, scanned paper fibers, lightly aged print
texture, thin drafting lines and registration marks.

Subject: a surreal collage combining a cropped classical plaster head or
face fragment, abstract architectural blocks, archways or stairs, sky
cutouts, one small human figure, a delicate tree or botanical element,
and geometric color planes.

Composition/framing: wide 16:9 web page layout, strong asymmetrical
grid, generous negative space, large typography area on the left or
top-left, collage focal object on the right or center-right, precise
alignment, thin divider lines, small UI navigation details.

Lighting/mood: soft diffused daylight, museum-like calm, intelligent,
restrained, tactile, poetic, premium, research-driven.

Color palette: warm ivory, stone beige, soft concrete gray, deep black
text, muted charcoal, washed coral-red accent, occasional mustard-yellow
accent, pale sky blue only inside small sky/image cutouts.

Materials/textures: matte plaster, limestone, travertine, concrete, rough
torn paper edges, halftone print grain, translucent vellum-like overlays,
fine grid paper, dotted matrix patterns.

Typography: large clean grotesk sans-serif for main headline, elegant
high-contrast italic serif for emphasized words, tiny uppercase coral
labels, compact UI microcopy. Text must be crisp, readable, and spelled
exactly as provided.

Graphic details: thin hairline circles, partial arcs, crosshair marks,
small black dots, dotted grids, fine coordinate lines, numbered
annotations, small arrow buttons, simple pill buttons, minimal logo mark.

Constraints: preserve a high-end editorial web design feel; keep spacing
elegant and uncluttered; no cartoon style; no neon colors; no glossy 3D;
no busy gradients; no generic stock-photo look.

Avoid: distorted typography, misspelled text, extra random words, heavy
shadows, childish illustration, cyberpunk, saturated purple/blue palette,
plastic materials, overly decorative UI cards, cluttered composition,
low-resolution textures, watermarks.
```

## 2. Variable slots (substitute per render)

```text
Brand/logo text:        "<BRAND_NAME>"
Navigation text:        "<NAV_1>", "<NAV_2>", "<NAV_3>", "<NAV_4>", "<NAV_5>"
Eyebrow label:          "<EYEBROW>"
Main headline:          "<MAIN_HEADLINE>"
Italic emphasis words:  "<ITALIC_WORDS>"
Body copy:              "<BODY_COPY>"
Primary button:         "<PRIMARY_CTA>"
Secondary button:       "<SECONDARY_CTA>"
Footer/micro labels:    "<FOOTER_LABELS>"
Main collage subject:   <plaster head | eye | hand | arch | stair | tree | landscape | object>
Inserted texture motifs:<sky, mountain, ocean, eye close-up, dancer, stone, fabric, map, grid, handwritten note>
Accent color:           <washed coral red | mustard yellow | pale blue | muted sage>
Page type:              <hero | about | capabilities | method tile | lab card | work card | testimonial | cta>
```

## 3. Per-slot composition templates

### `hero.png` — 1:1 (1024×1024)

```text
Composition/framing: left half is intentionally empty/quiet to allow real
HTML headline overlay; right half holds a tall surreal collage of a
cropped classical plaster head with the top sliced open, sky/architecture
cutouts visible inside the head, a delicate young tree growing through
the composition, a coral sun disk behind, a mustard accent ring at the
base, hairline coordinate marks and dotted matrices around it, a small
human figure standing for scale in the lower-left of the image. Page
type: hero landing.
```

### `about.png` — 1:1 (1024×1024)

```text
Composition: a surreal museum-vitrine arrangement of a partial plaster
profile head facing right, with an open archway carved through the
torso, sky cutout inside the arch, a tree seedling growing out of the
shoulder, and a coral half-circle behind the head. Tiny dotted hairlines
trace contours. Strong negative space top-left for a side-note overlay.
Page type: about / manifesto plate.
```

### `capabilities.png` — 1:1 (1024×1024)

```text
Composition: a Bauhaus-grid stack of architectural fragments — a coral
arch on the left, a beige concrete column center, a mustard small disc
upper-right, a delicate tree mid-frame, a small classical hand fragment
holding a pencil bottom-center. Crosshair and circular hairlines
overlay. Page type: capabilities matrix.
```

### `method-1.png` … `method-4.png` — 1:1 (816×816)

```text
Composition: a single visual metaphor per step.
  method-1 — a magnifying glass over a small architectural map (Detect)
  method-2 — a clipboard with a tiny questionnaire and a coral pen (Discover)
  method-3 — a compass + ruler + color swatch fan (Direct)
  method-4 — a printer's tray with stacked paper sheets exiting (Deliver)
Each on the warm paper ground with hairline grid, a single coral or
mustard accent piece, and one numbered annotation tag. Page type:
method tile.
```

### `lab-1.png` … `lab-5.png` — 3:4 (768×1024)

```text
Composition: portrait-oriented experiment cards. Each is a square-ish
plaster-and-architecture vignette, vertical, with a single dominant
subject:
  lab-1 — a stack of folded magazine spreads
  lab-2 — a film strip + a synthetic eye + a soundwave hairline
  lab-3 — a typewriter with prompt cards in the carriage
  lab-4 — five small dotted gauges arranged in a circle (5-dim critique)
  lab-5 — a glass dome / cloche over a tiny sandbox cityscape (Sandbox)
Use the same paper ground; allow soft drop shadow but stay restrained.
Page type: lab card.
```

### `work-1.png` & `work-2.png` — 3:4 (768×1024)

```text
Composition: featured work plates.
  work-1 — guizang-ppt: an oversized open magazine spread on a desk,
           coral spine, mustard tab. Slight perspective.
  work-2 — dating-web: a concrete dashboard slab, a coral graph bar
           rising, a small classical bust beside it for scale.
Both on the warm paper ground with crop marks.
Page type: work card.
```

### `testimonial.png` — 1:1 (1024×1024)

```text
Composition: a classical plaster bust facing 3/4 left, slightly cropped,
with a small sky cutout where the eye would be, a thin coral arc around
the back of the head, mustard dot at the chin. Quiet background, lots of
negative space upper right. Page type: testimonial portrait.
```

### `cta.png` — 1:1 (1024×1024)

```text
Composition: a closing-plate collage — a mustard sun behind a single
coral arch on the right, a delicate tree growing through the arch, a
small human figure in the lower-left foreground reading a folded
broadsheet, hairline coordinate ladder up the left edge, and a small
"FIN." dotted seal in the upper-right. Page type: closing CTA plate.
```

## 4. Chinese project input template

Use only when the model copy must be Chinese; otherwise prefer English
for legibility. Keep verbatim text short.

```text
请生成一张 16:9 横版网页视觉稿，风格为高级创意 AI 工作室官网：现代瑞士编辑排版、
包豪斯几何、古典石膏雕塑拼贴、极简建筑、手工纸张肌理、细线工程制图标记。

品牌文字："<品牌名>"
导航："<导航1>", "<导航2>", "<导航3>", "<导航4>"
小标签："<小标签>"
主标题必须逐字渲染："<主标题>"
强调词（斜体衬线）："<强调词>"
正文必须逐字渲染："<正文>"
按钮文字："<按钮1>", "<按钮2>"

画面主体：<主体描述>
贴图与元素：<天空 / 石材 / 植物 / 人物 / 眼睛 / 山脉 / 水面 / UI 截图等>
构图：<左文右图 / 右文左图 / 顶部大标题下方横向卡片 / 中央拼贴 / 时间线分栏>
色彩：暖象牙白纸张、黑色文字、石灰/混凝土灰、炭黑、低饱和珊瑚红点缀、
     少量芥末黄或浅天蓝。

限制：文字清晰可读、不添加多余文字、不要水印、不要卡通、不要霓虹、
     不要厚重阴影、不要俗套科技蓝紫渐变。
```

## 5. Calling convention

Pseudocode for an agent driver:

```ts
for (const slot of imageManifest.slots) {
  const prompt = [
    STYLE_ANCHOR,
    fillVars(VARIABLE_SLOTS, brand),
    PER_SLOT[slot.id],
  ].join('\n\n');

  await gptImageFal({
    prompt,
    width:  slot.width,
    height: slot.height,
    quality: 'high',
    output: `assets/${slot.id}.png`,
  });
}
```

If `gpt-image-fal` is unavailable, the same prompts work with
`gpt-image-azure` — but mask-based inpainting is azure-only.

## Provenance

Formalized by Open Design from candidate fac45c04-0d8e-4cc8-ba38-7ccb32fde405.


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

