---
name: social-spotify-card
zh_name: "Spotify 正在播放卡"
en_name: "Spotify Now-Playing Card"
emoji: "🎵"
description: "Spotify Now Playing-style card with album art, progress bar, and playback controls, suited to video overlays or personal homepages."
zh_description: "Spotify Now Playing 风格卡: 专辑封面 + 进度条 + 播放控制, 适配视频叠加 / 个人主页"
en_description: "Spotify Now Playing-style card with album art, progress bar, and playback controls, suited to video overlays or personal homepages."
category: card
scenario: personal
aspect_hint: "1280×720 或 600×200"
featured: 43
tags: ["spotify", "music", "now-playing", "card", "overlay"]
example_id: sample-social-spotify-card
example_name: "Spotify Now Playing · Lo-Fi"
example_format: markdown
example_tagline: "Spotify 经典 dark 卡"
example_desc: "Lo-Fi Beats · Chillhop 进度条 1:24 / 3:42 + 控制行"
example_source_url: "https://hyperframes.heygen.com/catalog"
example_source_label: "hyperframes · spotify-card"
od:
  mode: prototype
  surface: web
  platform: desktop
  scenario: personal
  upstream: "https://github.com/nexu-io/html-anything"
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: false
  example_prompt: "Use the Spotify Now-Playing Card template to turn my content into a Spotify Now Playing-style card with album art, progress bar, and playback controls for a video overlay or personal homepage. Preserve the template's visual signature, use real content and data, and avoid lorem ipsum or placeholder images."
  example_prompt_i18n:
    zh-CN: "用「Spotify 正在播放卡」模板把我的内容做成一份「Spotify Now Playing 风格卡: 专辑封面 + 进度条 + 播放控制, 适配视频叠加 / 个人主页」。保持模板的视觉签名，使用真实内容和数据，避免 lorem ipsum 和占位图片。"
---

【模板: Spotify Now-Playing 卡】
【意图】把一首歌、一段播客、或一段个人介绍渲染成 Spotify 正在播放卡, 适合 video overlay / 个人 about page / 创作者 hero。Inspired by hyperframes spotify-card。

【画布】两个尺寸:
- 横版视频叠加: 1280×720, 卡片居中或左下角浮动。
- 紧凑横条 widget: 600×200, 可嵌入到任何 hero。

【卡片结构】
- 外框: 圆角 12-16px; bg 用专辑封面色提取的暗渐变 (e.g. `linear-gradient(135deg, #1e3264 0%, #0d1f3d 100%)`) 或 Spotify 经典 `#121212`; 边缘有 1px subtle border。
- 左侧: **专辑封面** (CSS 渐变 + 大字 monogram 或抽象几何描绘, 不能外链图片), 圆角 6px, 60-200px 方形。
- 右侧:
  - 顶部 `NOW PLAYING` (uppercase letterspace 0.14em, 11px, 绿色 `#1DB954`)。
  - **歌名 / 标题** (Inter / Spotify Circular, 22-28px, weight 700, 白色)。
  - **艺人 / 副标** (16px, weight 400, opacity 0.7)。
  - 进度条: 4px 高, 圆角, 灰色背景 + 白色 fill (`width: 38%`); 两端时间戳 `1:24 / 3:42` (mono, 11px, 灰)。
  - 控制行: ⏮ ⏯ ⏭ icon (inline SVG, 24px, 白色 fill), shuffle / repeat icon 较小。
- 右上角: Spotify logo (内联 SVG, 绿色 `#1DB954` 圆 + 三道白色波纹)。
- 可选: 右下角小型音波动效 (3 个 bar `@keyframes`)。

【字体】
- 主: `Spotify Circular` → fallback `Inter` / `Inter Tight`, weight 400 / 700。
- 数字: 同主字体, 不用 mono 太多。

【设计细节】
- Spotify 经典 dark mode: `#121212` bg, `#1DB954` accent, `#b3b3b3` secondary text。
- 若用户输入是文本/标题 → 把 "标题" 当歌名, "副标/作者" 当艺人, 估算"时长" 3:42 默认。
- 若用户输入是音乐相关 → 直接对应。
- 严禁外链图片; 封面用 CSS 渐变 + 文字 logo / 几何描绘。
- 微动效: 音波动效用 `@keyframes`, 可被 `prefers-reduced-motion` 关闭。
- 单文件 HTML。


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

