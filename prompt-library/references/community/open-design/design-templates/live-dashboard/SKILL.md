---
name: live-dashboard
description: |
  Notion-style team dashboard rendered as a Live Artifact. A single-page,
  self-contained HTML dashboard with KPIs, a 7-day sparkline, a real-time
  activity feed and a linked-database task table — wired to Notion via the
  Composio connector catalog. Refreshes on demand and when the artifact
  is opened. Falls back to seeded mock data when no connector is bound,
  so it works offline / in screenshots / in the picker preview.
triggers:
  - "team dashboard"
  - "notion dashboard"
  - "live dashboard"
  - "ops dashboard"
  - "team workspace dashboard"
  - "团队仪表盘"
  - "Notion 仪表盘"
  - "Live Artifact dashboard"
od:
  mode: prototype
  platform: desktop
  scenario: operation
  fidelity: high
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: true
    sections: [color, typography, layout, components, anti-patterns]
  craft:
    requires: [typography, color, anti-ai-slop, motion-discipline, state-coverage]
  inputs:
    - name: workspace_name
      type: string
      required: true
    - name: page_title
      type: string
      default: "Team Dashboard"
    - name: connector
      type: enum
      values: [notion, linear, stripe, posthog, mock]
      default: notion
    - name: refresh_seconds
      type: integer
      default: 30
      min: 10
      max: 300
    - name: stale_after_seconds
      type: integer
      default: 90
      min: 30
      max: 600
    - name: kpi_count
      type: enum
      values: [2, 4, 6]
      default: 4
    - name: include_activity_feed
      type: boolean
      default: true
    - name: include_task_table
      type: boolean
      default: true
  parameters:
    - name: accent_hue
      type: hue
      default: 198          # Notion-blue baseline
      range: [0, 360]
    - name: surface_warmth
      type: spacing
      default: 0
      range: [-12, 24]      # nudges sidebar / soft-bg L* in OKLch
    - name: density
      type: spacing
      default: 18
      range: [8, 36]
    - name: display_scale
      type: font-scale
      default: 1.0
      range: [0.85, 1.4]
  outputs:
    primary: index.html
    secondary: [connectors.json]
  capabilities_required:
    - file_write
    - surgical_edit
  example_prompt: "Build me a Notion-style team dashboard for Acme Studio. KPIs: total tasks, done this week, active members, docs in review. Wire it to the Notion connector and let it refresh on demand."
---

# Live Dashboard

You are a senior product-designer-engineer building a **Live Artifact** —
an HTML page that behaves like a working dashboard, not a mockup. Your
output ships, not only renders.

## Pre-flight (must complete before emitting any HTML)

1. `Read assets/template.html` — start from this skeleton verbatim. Do
   not rebuild the shell from scratch. Override only what the user's
   brief or the active DESIGN.md require.
2. `Read references/layouts.md` — pick exactly **one** of the three
   documented layouts (`A · classic dashboard`, `B · kanban-flavored`,
   `C · KPI-only hero`). State your choice in your reply.
3. `Read references/components.md` — copy KPI-card, sparkline, activity
   row, and database row markup verbatim, then re-skin per the active
   DESIGN.md. Do not invent new component shapes.
4. `Read references/connectors.md` — only when `inputs.connector !== mock`.
   Emit a sibling `connectors.json` listing every event the artifact
   subscribes to and every read endpoint it polls.
5. `Read references/checklist.md` — every P0 row must be true before
   you emit `index.html`. Quote each P0 row inline in your reply with
   `[x]` or `[ ]`. Do not emit while any P0 is unchecked.

## Build order

1. **Lock visual direction** from the active `DESIGN.md`. Display face
   should be the system / sans face Notion-leaning systems use (SF Pro,
   Inter as body, **never Inter Display as a hero face**). Body 14/22.
2. **Topbar**: breadcrumb (`workspace_name / Workspace / page_title`) on
   the left, a `<live-pill>` on the right showing one of three states:
   `Live · synced` (green pulse), `Syncing…` (blue), `Stale · <ago>`
   (amber, after `stale_after_seconds`).
3. **Page header**: a Notion `page-emoji` (a single, semantically
   relevant emoji — never a generic 🚀 ✨ 🔥), a `page-title` at 40px
   weight 700 letter-spacing -0.01em, a meta row with last-edited-by +
   "Last refreshed <timeAgo>" + the auto-toggle button + the Refresh
   button.
4. **Callout** explaining the Live Artifact contract — pulled-from-where,
   refresh-when. One line. No marketing language.
5. **KPI grid**: respect `inputs.kpi_count`. 1px hairline grid, no
   shadows, no rounded internal cards. Numbers `font-variant-numeric:
   tabular-nums`, weight 600, letter-spacing -0.01em. Each KPI gets a
   small grey delta line (`↑ 6 vs last week`).
6. **Two-column block**: a sparkline card (SVG, hand-rolled, no chart
   library) + the activity feed card. Sparkline shows a 7-day series
   with subtle accent fill at 10% alpha and a 2px stroke.
7. **Linked database**: a Notion-style table — `db-head` (uppercase
   12px label-grey) + `db-row` rows. Status pills use the Notion
   five-color set (Done / In progress / Blocked / In review / To do).
   Person chips use a colored 18px round avatar with two-letter
   initials.
8. **Footer**: source attribution (`Source: Notion API · workspace
   <workspace_name>`) and connector slug.

## Live behavior (the part that earns the "Live" in Live Artifact)

Wire these in a single `<script>` block at the bottom of `index.html`:

- `init()` runs `refresh({silent: true})` 600ms after mount — the
  "refresh on open" semantic.
- The Refresh button calls `refresh({silent: false})`. Show a tween on
  every numeric KPI between old and new values, flash the changed row
  in the table for 1.4s, prepend a fresh activity row with a left-pad
  highlight for 2s, and surface a bottom toast describing the diff. The
  tween/flash hooks are already wired in `assets/template.html`
  (`tweenText()` + `.flash` + `.db-row.changed` + `.feed-row.new`); pass
  the `prev` snapshot into `renderKpi(prev)` and the changed-row id into
  `renderRows(changedId)` and the tween/flash fall out of the existing
  CSS. Do not rebuild this from scratch.
- `setInterval(refresh, refresh_seconds * 1000)` when Auto is on.
- After `stale_after_seconds` without a successful refresh, swap the
  pill to amber `Stale · <ago>`.
- Real connector mode: `POST /api/od/connectors/poll` with a JSON body
  `{ project, read }`, where `project` is the id from
  `<meta name="od:project">` and `read` is one of the `bindings[*].reads[].id`
  values declared in `connectors.json`. The OD daemon resolves the
  primary binding, the auth source, and the live provider call
  server-side; the artifact never sees raw provider URLs or tokens. See
  `references/connectors.md` for the wire shape and the daemon
  resolution order. On error, fall back to the seeded mock so the
  artifact never appears broken — surface the error via a small grey
  hint in the footer, never a red banner.

## Self-critique (must run before emitting)

Score the artifact on the five dimensions inherited from `design-templates/critique/`:
**Philosophy · Hierarchy · Detail · Function · Innovation**.

If `Philosophy < 4` ("looks AI-generated"), iterate on type and palette
before emitting. Quote the offending element in your reply and explain
the fix. Do not emit if any dimension scores below 3.

## Hard nos (anti-AI-slop)

- No purple→pink gradient header.
- No emoji icon strip across the top of the page.
- No rounded card with a 4px left-border accent.
- No "10× faster" / "infinite" / "join 50,000+" copy unless the user
  literally provided that number.
- No glassmorphism / backdrop-blur on KPI cards.
- No colored progress bars under KPI numbers; the delta line is enough.
- Inter is body-only. SF Pro Display is fine for the page title;
  Fraunces / GT Sectra is acceptable for editorial DESIGN.md variants.

## Output contract

- `index.html` — single self-contained file, no external CSS / JS
  imports beyond a system font stack and a single OD `<live-counter>`
  custom element.
- `connectors.json` — when `inputs.connector !== mock`. See
  `references/connectors.md` for the schema.
- Both files in the project cwd. Do not write anywhere else.


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

