---
name: orbit-gmail
description: |
  Open Orbit briefing skill — selected by the Orbit pipeline when
  Gmail is the user's only connected connector, or when the user
  explicitly scopes their daily digest to Gmail. Pulls the past 24
  hours of inbox activity (replies awaited, mentions, cc, auto-
  categorized bulk) from the user's authenticated Gmail connection
  and renders the digest as the Orbit Daily Digest email opened
  inside Gmail's reading view. This skill should not be triggered
  manually — it is invoked by Orbit's daily-digest scheduler against
  live Gmail data.
triggers:
  - "gmail briefing"
  - "inbox digest"
  - "email summary"
  - "gmail 简报"
  - "邮件摘要"
od:
  mode: prototype
  platform: desktop
  scenario: orbit
  preview:
    type: html
    entry: index.html
  design_system:
    requires: false
  example_prompt: "Generate today's Open Orbit Gmail briefing. Gmail is my only connected connector — pull yesterday's mail and render it as the opened Orbit Daily Digest email inside Gmail's reading view."
---

# Orbit · Gmail Briefing

Single-connector Orbit template scoped to Gmail. The briefing renders
as **the Orbit Daily Digest email already opened** inside Gmail's
reading view — Gmail top header + the email chrome (toolbar / subject
/ sender / digest body / reply bar). There is no left rail, no inbox
list, and no three-pane layout.

## ⚠️ Source-of-truth protocol (read this first)

**Step 1.** Open and read the shipped `example.html` in this folder
before writing any output. That file is the canonical design — your
job is to **reproduce it**, not reinterpret it.

**Step 2.** Mirror the example's structure 1:1:
- Same DOM hierarchy and class names: `<header>` (Gmail top bar) →
  `<main class="digest-wrap">` → `<div class="email-chrome">` →
  toolbar / subject / sender row / digest body / reply bar.
- The Gmail top header has only the elements present in the example
  (hamburger / wordmark / search bar / help / settings / app launcher
  / avatar). **Do not** add a left rail (no Compose button, no system
  labels, no Categories tabs, no colored label list).
- **Do not** render an inbox list of other emails. Only the opened
  digest email is shown.
- Same digest-body sections in the same order: greeting → summary
  strip → 需要处理 → 值得关注 → 仅供知悉 → digest footer.
- Same reply bar at the bottom (回复 / 全部回复 / 转发).
- Same `<script>` block at the end (action-btn / reply-btn link
  injection).

**Step 3.** You may refresh mock copy (sender names, subjects, summary
text, times) so it reads as "today", but you must **not** invent
extra UI: no inbox listing, no left rail, no Categories tab strip,
no extra digest sections, no chrome ornaments. If a detail is not
already in `example.html`, it does not belong in your output.

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
`example.html` (Gmail / Google Sans / Material chrome). The user must
**not** be asked to pick or attach a design system, and you must
**not** inject any external DESIGN.md tokens into the output.

- If the active project has a design system attached, **ignore it**.
- If the user supplies brand tokens or a Figma file, **ignore them**.
- Use exclusively the colors / fonts / radii defined in `example.html`.

This is a hard constraint: the briefing must read as a real Gmail
page, not as the user's brand.

## Canvas tokens (use these exact values)

```
page bg:           #f6f8fc
surface:           #ffffff
border:            #e0e0e0
text:              #202124
text-secondary:    #5f6368
text-muted:        #80868b
surface-hover:     #f1f3f4

red (Gmail):       #D93025  /* Compose, important markers, accent */
blue:              #1a73e8  /* CTA / link */
yellow:            #f4b400  /* important ★ */
green:             #0f9d58
search bar bg:     #eaf1fb  /* light blue-tinted pill */
```

Type stack:
- `'Google Sans', 'Roboto', -apple-system, system-ui, sans-serif`
- Logo wordmark: Google Sans 22px medium
- Body: 14px / line-height 20px
- Email preview: 13px

## Page sections (top to bottom — the page is one column, not a 3-pane app)

1. **Gmail top header** (`<header>`) — full width, white.
   Left: hamburger (☰) + Gmail wordmark (`Gmail`, first `G` red).
   Center: rounded search bar (`#eaf1fb` bg, search icon left, settings
   icon right, placeholder `搜索邮件`).
   Right: ❓ help, ⚙ settings, ▦ Google apps launcher, round avatar.

2. **Email chrome** (`<main class="digest-wrap"> <div class="email-chrome">`)
   — the opened email lives directly under the header. No left rail,
   no inbox list. Sub-blocks in order:

   a. **Email toolbar** — back / archive / delete / mark unread / label
      / spacer / prev / next.

   b. **Email subject area** — `<h1 class="email-subject">` with the
      digest subject (e.g. `☀ 你昨天的 6 封重要邮件 — Open Orbit
      Daily`) followed by an inline `Orbit` tag.

   c. **Sender row** — round avatar `O` + `Open Orbit
      <orbit@opendesign.local>` + 收件人 `我 ▾` + date right-aligned +
      reply icon + more icon.

   d. **Digest body** (`<div class="digest-body">`):
      - greeting paragraph
      - summary strip — 3 numeric cells (urgent / 值得关注 / 仅供知悉)
      - section **🔴 需要处理** — cards with `action-btn primary`
      - section **🟡 值得关注** — cards with `action-btn ghost`
      - section **⚪ 仅供知悉** — cards
      - `digest-footer` micro-tag

   e. **Reply bar** — bottom row with 回复 / 全部回复 / 转发 buttons.

## Pill / icon rules

- Avatars: round, 40px+ for sender, 32px for card, 28px for inline.
- Labels / tags: small rounded pills with no fill (dot + text) **only**
  where they appear in the example.
- The single yellow important star (in the subject area or as a tag)
  belongs to the Orbit digest only.

## Implementation constraints (paired do / don't)

| Don't | Do |
|---|---|
| Render a left rail (Compose / system labels / colored labels) | Skip the rail entirely; the page is single-column under the header |
| Render an inbox list of other emails | Show only the opened Orbit Daily Digest email |
| Render a Categories tab strip (主要 / 社交 / 推广) | Skip it; the digest occupies the reading view directly |
| Use non-Google typography | Use `'Google Sans', 'Roboto', -apple-system, system-ui, sans-serif` |
| Add drop shadows on the Gmail chrome | Flat surfaces; only the subtle Material 1 elevation when an element is focused |
| Render avatars as squares | Always circles — sender 40px, card 32px, inline 28px |
| Use lorem ipsum | Write real-shaped Gmail copy: "Q3 预算确认", "Login redesign 反馈", senders like Allen Liu / Marie / Nina Park |
| Use dark mode | Stay on Gmail's default light theme (`#f6f8fc` page) |
| Brand the Gmail chrome with Orbit | Orbit branding lives only inside the digest body (subject `Orbit` tag + footer micro-tag) |
| Put yellow important stars on multiple inbox rows | Only the Orbit Daily Digest row can carry the important marker |


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

