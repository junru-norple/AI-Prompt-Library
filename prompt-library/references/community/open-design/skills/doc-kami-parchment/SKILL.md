---
name: doc-kami-parchment
zh_name: "Kami 羊皮纸文档"
en_name: "Kami Parchment Document"
emoji: "📜"
description: "Warm parchment canvas (#f5f4ed), monochrome ink-blue accent (#1B365D), one serif family, and editorial-grade typography."
zh_description: "暖羊皮纸底 (#f5f4ed) + 墨蓝单色 accent (#1B365D) + 单一衬线字体, 编辑级排印"
en_description: "Warm parchment canvas (#f5f4ed), monochrome ink-blue accent (#1B365D), one serif family, and editorial-grade typography."
category: doc
scenario: personal
aspect_hint: "A4 / Letter 长页"
featured: 48
recommended: 3
tags: ["kami", "parchment", "serif", "editorial", "report", "letter", "one-pager"]
example_id: sample-kami-parchment
example_name: "Kami 羊皮纸 · One-Pager"
example_format: markdown
example_tagline: "暖羊皮纸 + 墨蓝单色 + 单一衬线"
example_desc: "一页 Open Design Studio Issue №26 编辑级 one-pager"
example_source_url: "https://github.com/tw93/kami"
example_source_label: "tw93/kami"
od:
  mode: prototype
  surface: web
  platform: desktop
  scenario: personal
  featured: 0.04
  upstream: "https://github.com/nexu-io/html-anything"
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: false
  example_prompt: "Use the Kami Parchment Document template to turn my content into a warm parchment document with monochrome ink-blue accents, one serif family, and editorial-grade typography. Preserve the template's visual signature, use real content and data, and avoid lorem ipsum or placeholder images."
  example_prompt_i18n:
    zh-CN: "用「Kami 羊皮纸文档」模板把我的内容做成一份「暖羊皮纸底 (#f5f4ed) + 墨蓝单色 accent (#1B365D) + 单一衬线字体, 编辑级排印」。保持模板的视觉签名，使用真实内容和数据，避免 lorem ipsum 和占位图片。"
---

【模板: Kami 羊皮纸文档】
【意图】严肃排版文档: one-pager / 长报告 / 信函 / 简历 / 财报 / changelog / portfolio。Inspired by tw93/kami。强调"写得像被排过版的纸", 不是 dashboard, 不是网页。

【硬性视觉签名 — 不许改】
- **画布**: 暖羊皮纸 `#f5f4ed` (永远不用纯白 `#fff`)。次级背景 `#efeee5`。
- **墨色**: 主文字 `#1f1d18` (近黑暖灰, 不用纯黑 `#000`)。次文字 `#6b665b`。
- **唯一色彩**: 墨蓝 `#1B365D` ——所有 accent (链接、tag 描边、重点数字、引用左 rule) 只能用这一个色, 严禁多色。
- **字体**: 一种语言一种衬线, 全文不混用:
  - 英文: `Charter` (fallback: `Source Serif Pro`, `Iowan Old Style`)
  - 中文: `TsangerJinKai02 W04` (fallback: `Noto Serif SC`)
  - 日文: `YuMincho` (fallback: `Noto Serif JP`)
  - Body 400, Heading 500 (不要 700/800/900)。
- **行高**: 标题 1.1–1.3, 紧凑正文 1.4–1.45, 阅读型正文 1.5–1.55。
- **绝不**: drop-shadow / blur / 圆角 ≥ 8px / 渐变 / 霓虹色 / rgba (用 solid hex)。
- **细节**: tag 用 solid hex 背景方块 (因为 WeasyPrint 不渲染 rgba 好); 单线几何 icon; 边缘 1px hairline `#d4d1c5` rule, 长度受控不到边。

【可选文档类型 — 按用户内容判断】
- **One-Pager** — 顶 logotype (Charter italic) + 标题 + lede + 3 列要点 + 底脚 metadata。
- **Long Doc** — 封面页 (大标题 + 副标 + 作者 + 日期) → 目录 (kicker + page no.) → 章节 (folio 顶角 + section rule + body) → 注释脚注 + 文末 colophon。
- **Letter** — 抬头地址 + 日期 + 收件人 + 正文 (左对齐, 段间空 1.5em) + 署名 + 签名占位线。
- **Portfolio** — 项目 hero (大标题 + sub) + 1 张全幅图 (用 CSS 块绘制占位) + 项目描述 + 角色 / 时间 / stack 元数据 row。
- **Resume** — 顶部姓名 (大字) + tagline 一行 + contact row + 主要 section: experience (公司 / 时间 / 职位 / bullets) + skills + education。
- **Slides** — keynote 风, 页数由【用户内容】决定 (短内容 6 页起步, 长内容应更多), 每页满铺羊皮纸, 大标题 + lede + 角标 page no., 简洁到只有"被印出来"的感觉。
- **Equity Report** — 公司名 + ticker + Q × 年份 + key metrics row (revenue / margin / yoy) + body 分析 + 图表 (SVG 单色折线)。
- **Changelog** — 版本号 (Charter italic 大字) + 日期 + 改动列表 (Added / Changed / Fixed), 单 rule 分隔。

【设计准则】
- "Composed pages, not dashboards." 不要堆 KPI 卡, 不要堆 emoji 图标, 不要 hero gradient。
- "Ring or whisper only, no hard drop shadows." 阴影只能是 `0 0 0 1px #d4d1c5` 这种 hairline 描边。
- 文字层级靠**衬线对比 + 字号 + 留白**, 不靠颜色。
- 单文件 HTML, 用 Tailwind CDN; 全文中英混排时加盘古之白; 不要外链图片, 占位用 paper-tint 色块 + 1px ink 描边。


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

