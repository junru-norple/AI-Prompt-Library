---
name: orbit-linear
description: |
  Open Orbit briefing skill — selected by the Orbit pipeline when
  Linear is the user's only connected connector, or when the user
  explicitly scopes their daily digest to Linear. Pulls the past 24
  hours of issue movement, status changes, assignments, and cycle
  progress from the user's authenticated Linear connection and renders
  the digest in Linear's native Inbox + cycle-progress visual language.
  This skill should not be triggered manually — it is invoked by
  Orbit's daily-digest scheduler against live Linear data.
triggers:
  - "linear briefing"
  - "linear digest"
  - "issue digest"
  - "linear 简报"
  - "issue 汇总"
od:
  mode: prototype
  platform: desktop
  scenario: orbit
  preview:
    type: html
    entry: index.html
  design_system:
    requires: false
  example_prompt: "Generate today's Open Orbit Linear briefing. Linear is my only connected connector — pull yesterday's issue movement, cycle progress, status changes, and assignments and render them in Linear's native Inbox layout."
---

# Orbit · Linear Briefing

Single-connector Orbit template scoped to Linear.

## ⚠️ Source-of-truth protocol (read this first)

**Step 1.** Open and read the shipped `example.html` in this folder
before writing any output. That file is the canonical design — your
job is to **reproduce it**, not reinterpret it.

**Step 2.** Mirror the example's structure 1:1:
- Same DOM hierarchy and class names
- Same top toolbar (breadcrumb + view switcher + cycle strip + theme
  toggle), exactly those items
- Same left-rail entries in the same order
- Same issue groups ("Needs your attention" → "Updated yesterday")
  with the same row count and same expanded-by-default behavior
- Same priority-bar / status-dot system
- Same `<script>` block at the end (toggle / theme / keyboard /
  Linear link injection)

**Step 3.** You may refresh mock values (issue identifiers, titles,
labels, ages, assignees) so they read as "today", but you must
**not** add extra rail entries, extra groups, extra fields in the
preview pane, or any chrome ornaments not already in `example.html`.

**Identity guard.** Treat every person name or handle in `example.html`
as mock content only. Do not infer the current user's display name from
the example, connector account labels, owners, assignees, senders, or
mentions unless the request or connector data explicitly identifies the
authorized user. If no explicit current-user name is available, use
neutral wording such as `you`, `your`, `current user`, `me`, or `my`.

The sections below are a **reference for tokens and visual language** —
not a license to extend the page.

## ⚠️ Design system policy

This skill ships with its **own** complete visual language baked into
`example.html` (Linear's signature compact UI). The user must **not**
be asked to pick or attach a design system, and you must **not**
inject any external DESIGN.md tokens into the output.

- If the active project has a design system attached, **ignore it**.
- If the user supplies brand tokens or a Figma file, **ignore them**.
- Use exclusively the colors / fonts / radii defined in `example.html`.

This is a hard constraint: the briefing must read as a real Linear
page, not as the user's brand.

## Canvas tokens — light theme (default to ship)

```
page bg:           #f4f5f6
surface:           #ffffff
ink:               #1b1c1f
ink-2:             #37393e
ink-3 (muted):     #6c6f78
ink-4:             #9ea1a9

border:            rgba(0,0,0,0.06)
border-card:       rgba(0,0,0,0.08)
border-strong:     rgba(0,0,0,0.12)
hover row:         rgba(0,0,0,0.025)
active row:        rgba(0,0,0,0.05)

accent:            #5e6ad2
accent-bg:         rgba(94,106,210,0.06)

attention accent:  #c77d1a   /* "needs attention" group */
attention bg:      rgba(212,148,14,0.06)

shadow-card:       0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)
```

Status dot palette (must use exactly these):
```
backlog:    #9ea1a9   /* gray, hollow ring */
todo:       #d4940e   /* yellow, dashed ring */
progress:   #2b80c5   /* blue, partial ring */
review:     #8759c7   /* purple, partial ring */
done:       #1a8d3a   /* green, filled */
canceled:   #6c6f78   /* gray with strike */
```

Priority icon = 4 small vertical bars, height ascending.
Filled bars indicate level: 0 None → 4 Urgent.
Urgent uses `#d4513a`; High uses `#c77d1a`; Medium/Low use `#505259`.

Type stack:
- `'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif`
- Mono: `'Berkeley Mono', ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace`
- Sizes: nav 13px, row title 13.5px, meta 12px, headers 11px caps with letter-spacing 0.04em

## Page sections

1. **Top toolbar** — single row, 44px tall, no shadow, hairline border-bottom.
   Left: breadcrumb `Orbit › Daily Digest › May 6` (13px, `…›…` separators
   in `ink-4`). Then a thin divider, then `▼ My issues` view switcher.
   Right: `🔍 search`, `+ new`, `▦ display options`, avatar.

2. **Cycle progress strip** — slot to the right of the breadcrumb area,
   one line: `Cycle 12 · 60% complete · 3 days left`. Render as 11px caps
   with a tiny inline progress bar (60px wide, 4px tall, accent fill).

3. **Three-column main**:
   - **Left nav** (240px): vertical, no background — items at 13px.
     Sections: `Inbox · My issues · Active · Backlog · All issues`,
     then a divider, then `📋 Triage · 🚫 Canceled · ✅ Completed`.
     Active row: `accent-bg` background, `accent` ink.
     Bottom: a tiny `Open Orbit · auto-generated 06:42` muted line.
   - **Issue list** (flex 1): two grouped sections.
     - **Needs your attention** — header in `attention accent` 11px caps;
       group block has `attention bg` very subtle background.
       Rows include: assigned + stale issues, high/urgent priority.
     - **Updated yesterday** — header 11px caps muted; rows of status
       changes and completions.
     Each row is one tight line:
     `[priority bars] [identifier ENG-148] [status dot] [title……………] [labels] [cycle chip] [assignee avatar]`
     Row height ~36px. Hover = `hover row` color.
   - **Issue preview** (360px right): the pre-selected issue.
     Title large (16px medium); ID + status pill below; description
     paragraphs; an Activity stream (small avatar + verbed action +
     timestamp); Labels chips at bottom; Cycle chip; Assignees row.

## Identifier / chip rules

- Issue IDs (e.g. `ENG-148`) are mono, 12px, `ink-3`.
- Labels: rounded pill with a 4px colored dot, label text, optional ✕.
  Hue per label is arbitrary, choose realistic dev-team colors.
- Cycle chip: small rounded box `Cycle 12` with hairline border.
- Status dots: 14px circles with internal ring/fill per state above.
- Priority bars: 4 short vertical bars right of identifier, fill bars
  per level.

## Implementation constraints (paired do / don't)

| Don't | Do |
|---|---|
| Add shadows beyond the listed `shadow-card` token | Use only `0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)` for cards |
| Use bright colors outside the status palette | Use only the documented status hues (Backlog gray / Todo yellow / Progress blue / Review purple / Done green) and the `#5e6ad2` accent |
| Use sans-serif typography that isn't Inter | Use `'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif` |
| Use airy row heights | Keep rows under 40px (target ~36px) — Linear is signature-dense |
| Use lorem ipsum | Write real-shaped Linear copy: identifiers like `ENG-148`, `DES-22`, `INF-9`; cycle names like `Cycle 12`; titles like "Auth middleware refactor" |
| Render avatars as squares | Always circles, 18–24px |
| Ship the dark theme | Render the light theme — `#f4f5f6` page, `#ffffff` cards |
| Use placeholder team prefixes like `T-1` | Use real-shaped team prefixes: `ENG / DES / INF / OPS` |


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

