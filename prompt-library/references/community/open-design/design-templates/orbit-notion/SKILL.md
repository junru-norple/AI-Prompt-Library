---
name: orbit-notion
description: |
  Open Orbit briefing skill — selected by the Orbit pipeline when
  Notion is the user's only connected connector, or when the user
  explicitly scopes their daily digest to Notion. Pulls the past 24
  hours of document edits, comments, mentions, and database row changes
  from the user's authenticated Notion connection and renders the
  digest as a native Notion page (callout / toggle / database table
  primitives). This skill should not be triggered manually — it is
  invoked by Orbit's daily-digest scheduler against live Notion data.
triggers:
  - "notion briefing"
  - "notion digest"
  - "doc digest"
  - "notion 简报"
  - "文档摘要"
od:
  mode: prototype
  platform: desktop
  scenario: orbit
  preview:
    type: html
    entry: index.html
  design_system:
    requires: false
  example_prompt: "Generate today's Open Orbit Notion briefing. Notion is my only connected connector — pull yesterday's document edits, comments, @ mentions, and database row changes and render the digest as a native Notion page."
---

# Orbit · Notion Briefing

Single-connector Orbit template scoped to Notion. The briefing renders
*as a real Notion page* — same chrome, same block primitives, same
typography.

## ⚠️ Source-of-truth protocol (read this first)

**Step 1.** Open and read the shipped `example.html` in this folder
before writing any output. That file is the canonical design — your
job is to **reproduce it**, not reinterpret it.

**Step 2.** Mirror the example's structure 1:1:
- Same DOM hierarchy and class names
- Same H2 sections in the same order (文档变更 → 评论 / @ 提及 → 数据库变更)
- Same bullet rows / comment cards / database table columns and rows
- Same callout(s) and toggle block with the same copy
- Same property chips at the top (Type / Owner / Created)
- Same `<script>` block at the end (page-link → notion.so injection)

**Step 3.** You may refresh mock values (doc titles, mentioned people,
edit timestamps) so they read as "today", but you must **not**
invent extra blocks: no extra H2 sections, no extra callouts, no
extra database columns, no extra emoji decorations. If a detail is
not in `example.html`, it does not belong in your output.

**Identity guard.** Treat every person name or handle in `example.html`
as mock content only. Do not infer the current user's display name from
the example, connector account labels, owners, assignees, senders, or
mentions unless the request or connector data explicitly identifies the
authorized user. If no explicit current-user name is available, use
neutral wording such as `you`, `your`, `current user`, `我`, or `你`.

The sections below are a **reference for tokens and visual language** —
not a license to extend the page.

## ⚠️ Design system policy

This skill ships with its **own** complete visual language baked into
`example.html` (Notion's native page chrome and block system). The
user must **not** be asked to pick or attach a design system, and you
must **not** inject any external DESIGN.md tokens into the output.

- If the active project has a design system attached, **ignore it**.
- If the user supplies brand tokens or a Figma file, **ignore them**.
- Use exclusively the colors / fonts / radii defined in `example.html`.

This is a hard constraint: the briefing must read as a real Notion
page, not as the user's brand.

## Canvas tokens (use these exact values)

```
ink (Notion black):  #37352F
text-secondary:      #787774
gray bg (block):     #F1F1EF
gray border:         #E3E2E0
gray light:          #F7F6F3
gray cover:          #E9E5E0
white surface:       #FFFFFF

blue:                #2383E2
blue bg:             #D3E5EF
blue text:           #24548A
green:               #4DAB60
green bg:            #DBEDDB
green text:          #1D6B2D
orange bg:           #FADEC9
orange text:         #93531D
yellow bg:           #FDE68A
callout bg:          #F1F1EF
```

Type stack:
- `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol'`
- Page title: 40px bold
- H2: 24px semibold with 1.6em top margin
- Body: 16px / line-height 1.5
- Captions / breadcrumbs: 14px

Notion always uses generous left/right margins; center the content
column at ~720px max width with the rest as `--gray-light` rails.

## Page sections (top to bottom)

1. **Top app bar** — full-width, white, 45px tall.
   Left: Notion-style sidebar toggle (`«`), then breadcrumb path
   `Open Orbit › Daily Briefing › May 6`. Breadcrumb separators in
   `text-secondary`. Far right: 🔍 search, ⏱ updates, ⚙ share, ⋯.

2. **Faint left sidebar (optional, may render as a 1px hairline rail)**
   to imply Notion's workspace sidebar without rendering it in full.

3. **Cover image** — full-width strip ~200px tall, gray cover color
   `#E9E5E0`, optional small "Add cover" hint hidden in the corner.

4. **Page header inside content column** — emoji icon (60px) at top,
   then page title `每日简报 · 2026 年 5 月 6 日 (Wed)` in 40px bold,
   then a row of property chips (gray):
   `🗂 Type: Daily Briefing  ·  👤 Owner: Current user  ·  📅 Created: 06:42`.

5. **Synopsis paragraph** — one sentence, italic muted:
   *"Auto-generated by Open Orbit from yesterday's Notion activity.
   12 events across 8 docs and 2 databases."*

6. **H2 section: 📝 文档变更** — list of bullet rows. Each bullet:
   `📄 [doc title]` (bold, hover-link blue), then a soft-block child
   showing `[author avatar] [author] edited "[snippet of changed text]"`
   with `· 8h ago` muted on the right.

7. **H2 section: 💬 评论 & @ 提及** — list of comment cards.
   Each card: `gray bg #F1F1EF` rounded 6px, 12px padding;
   `[avatar] [author] · in [doc title]`, then comment body in 15px
   regular, then a tiny "Reply" link.
   Highlight @-mentions with `blue text #24548A` underlined.

8. **Callout block** — required. `gray bg`, 16px padding, rounded 6px,
   left side has a 24px emoji (e.g. 🌟 or 💡). Body:
   *"你昨天还有 3 条评论没回 — 周三例会前看一下?"*

9. **H2 section: 🗄 数据库变更** — render as a Notion database
   table view inline.
   Columns: `Name | Status | Updated by | Updated`.
   Each cell has `gray border` 1px, slight left/right padding,
   row height ~38px. Header row uses 12px caps `text-secondary`.
   Status column uses **colored tag pills** with the green/blue/orange
   bg + text colors above (`Done` green, `In Progress` blue,
   `Triage` orange, `Backlog` gray).

10. **Toggle block** — required. Show a `▶ See 4 more changes` collapsed
    toggle that, when expanded, would reveal additional rows. Render
    it collapsed (just the chevron + label).

11. **Closing callout** — second callout at the bottom acting as a CTA:
    `🚀 在 Open Design 里继续处理 →` linked back to the OD project.

## Block formatting rules

- Heading-block hover icon (`+ ⋮⋮`) can be hinted but kept subtle.
- Use the exact Notion bullet glyph (`•`) and indentation (24px).
- Database tags must be Notion's native pill shape: 2-em radius,
  6×4 padding, 12px medium weight.
- Avatars: 18px circles with letter + Notion-style soft pastel bg.

## Implementation constraints (paired do / don't)

| Don't | Do |
|---|---|
| Borrow chrome from another connector (Material / Linear rows / GitHub pills) | Stay 100% in Notion's block primitives — H1 / H2 / bullet / callout / toggle / database table |
| Use lorem ipsum | Write real-shaped Notion copy: doc titles like `Q3 OKR`, `Onboarding 文档`, `团队周报`; people like Marie / Bob / Lily; comments like "这一段需要你确认" |
| Mix serif typography in body | Notion is sans only — use the system stack with emoji fallbacks |
| Render avatars as squares | Always circles, 18px with letter + Notion-style soft pastel bg |
| Add shadows or gradients | Flat surfaces only; differentiate blocks with `#E3E2E0` 1px borders or `#F1F1EF` block backgrounds |
| Use loud accent colors outside the Notion palette | Use only the documented Notion blue / green / orange / yellow tag hues |
| Replace Notion's gray callout bg with a solid color | Callouts must use `#F1F1EF` gray bg + 24px emoji on the left |
| Use placeholder doc names like "Document 1" | Use real-shaped Notion titles in CJK or English that read like a real workspace |


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

