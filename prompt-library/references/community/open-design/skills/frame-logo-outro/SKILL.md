---
name: frame-logo-outro
zh_name: "品牌 Logo 收尾帧"
en_name: "Logo Outro Frame"
emoji: "🎬"
description: "Segmented logo assembly, glow bloom, and tagline reveal for video outros or brand closing frames."
zh_description: "Logo 分块组装入场 + glow bloom + tagline 揭示, 适合视频片尾 / 品牌闭幕"
en_description: "Segmented logo assembly, glow bloom, and tagline reveal for video outros or brand closing frames."
category: video
scenario: video
aspect_hint: "1920×1080 (16:9)"
featured: 40
recommended: 8
tags: ["logo", "outro", "branding", "end-card", "frame"]
example_id: sample-frame-logo-outro
example_name: "品牌 Logo 收尾 · HTML Anything"
example_format: markdown
example_tagline: "Midnight Indigo + glow bloom"
example_desc: "Logo 装配 + 品牌名 + tagline + CTA, 视频片尾用"
example_source_url: "https://hyperframes.heygen.com/catalog"
example_source_label: "hyperframes · logo-outro"
od:
  mode: video
  surface: video
  scenario: video
  featured: 0.16
  upstream: "https://github.com/nexu-io/html-anything"
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: false
  example_prompt: "Use the Logo Outro Frame template to turn my content into a video outro or brand closing frame with segmented logo assembly, glow bloom, and tagline reveal. Preserve the template's visual signature, use real content and data, and avoid lorem ipsum or placeholder images."
  example_prompt_i18n:
    zh-CN: "用「品牌 Logo 收尾帧」模板把我的内容做成一段「Logo 分块组装入场 + glow bloom + tagline 揭示, 适合视频片尾 / 品牌闭幕」。保持模板的视觉签名，使用真实内容和数据，避免 lorem ipsum 和占位图片。"
---

【模板: Logo 收尾帧 (Logo Outro)】
【意图】视频结尾的品牌 reveal 帧 —— logo 分块拼装 + glow bloom + tagline 上浮 + CTA。Inspired by hyperframes logo-outro。

【画布】1920×1080, 黑色 `#08090c` 或品牌深色背景; 加微妙 vignette `radial-gradient(...)` 让中心更亮。

【布局】
- **中心 Logo**: 用 CSS / 内联 SVG 绘制; 由 4-8 个几何块 (圆 / 方 / 三角 / hairline) 组成。
  - 入场动画: 每个块从屏幕外滑入 (±100px 不同方向) + scale 1.4→1.0 + opacity 0→1, 错峰 80ms; 总时长 1.2s。
  - 入场完成后, 整个 logo 加 glow bloom: `filter: drop-shadow(0 0 24px <accent>40)`; 同时一道 shimmer `mask-image` 横扫 logo (500ms)。
- **品牌名**: logo 下方 6-8% 位置, 大字 (Inter Tight / SF Pro Display, 48-72px, weight 700, letter-spacing -0.02em), 入场: typewriter or fade-up after logo bloom (1.4s 开始)。
- **Tagline**: 品牌名下方一行 (24-28px, weight 400, opacity 0.7), fade in (1.8s)。
- **底部 CTA + 元数据**: 双行底部 row, 例如 `htmlanything.dev · @htmlanything · 2026`, 11px uppercase letter-spacing 0.16em, 颜色 opacity 0.4, hairline 分隔。

【调色 — 4 选 1, 不混用】
- 🌌 **Midnight Indigo** — bg `#08090c`, accent `#7c5cff` (霓虹紫蓝 glow)。
- 🌅 **Solar Amber** — bg `#0e0a08`, accent `#ffb547` (暖琥珀)。
- 🌿 **Forest Mint** — bg `#0a1410`, accent `#5fb38a` (薄荷绿)。
- ⚪ **Bone & Ink** — bg `#f1efea`, accent `#0a0a0b` (无 neon, 走 editorial 风, glow 改成阴影)。

【设计细节】
- **绝不**: 用外链 logo 图片; logo 必须用纯 CSS / 内联 SVG 几何绘制。
- 入场动画用 `@keyframes` + `animation-delay`; 可被 `prefers-reduced-motion` 关闭。
- 字体: 西文 `Inter Tight` / `SF Pro Display` / `Manrope`; 中文 `Noto Sans SC` weight 700。
- 必须用用户提供的品牌名 + tagline; 若没有, 跑 fallback "HTML Anything" / "Anything → beautiful HTML"。
- 单文件 HTML; 整个动画完成后 freeze (不要 loop, 这是视频结尾帧)。
- 顶部可选 5px ribbon (accent 色) 增加品牌识别。


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

