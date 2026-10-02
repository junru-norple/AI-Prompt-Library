---
name: orbit-general
description: |
  Open Orbit briefing skill — selected by the Orbit pipeline when the
  user has two or more connectors connected. Pulls the past 24 hours of
  activity from every authenticated connector (GitHub, Linear, Notion,
  Slack, 飞书, Calendar, Gmail, Drive, Sentry, Vercel, …) and renders a
  single adaptive bento-grid dashboard at the top of "我的设计". Each
  connector module picks its own UI form (list, avatar stack, status
  ring, heatmap, file grid, alert card, …) based on the data shape it
  returns, so the layout scales as Orbit's connector ecosystem grows.
  This skill should not be triggered manually — it is invoked by
  Orbit's daily-digest scheduler against the user's live connector
  data.
triggers:
  - "orbit"
  - "daily digest"
  - "morning briefing"
  - "每日简报"
  - "早安简报"
  - "跨工具汇总"
od:
  mode: prototype
  platform: desktop
  scenario: orbit
  preview:
    type: html
    entry: index.html
  design_system:
    requires: false
  example_prompt: "Generate today's Open Orbit morning briefing. I have ~10 connectors connected (GitHub, Linear, Notion, Calendar, 飞书, Sentry, Vercel, Slack, Gmail, Drive). Pull yesterday's activity from each and render the editorial bento dashboard."
---

# Orbit General Briefing

Cross-connector morning briefing that lives at the top of "我的设计".
Pulls the past 24 hours of activity from every authenticated connector
and lays them out as one editorial bento dashboard.

## ⚠️ Source-of-truth protocol (read this first)

**Step 1.** Open and read the shipped `example.html` in this folder
before writing any output. That file is the canonical design — your
job is to **reproduce it**, not reinterpret it.

**Step 2.** Mirror the example's structure 1:1:
- Same DOM hierarchy and class names
- Same number and order of sections
- Same number of bento modules in the same order
- Same connector list (do **not** add or drop connectors)
- Same KPI labels, same Top 3 entries, same "people waiting" set
- Same footer string
- Same `<script>` block at the end (link injection)

**Step 3.** You may freshen mock data values (counts, names, times) so
they read as "today" — but you must not invent new UI elements,
sections, modules, badges, callouts, ribbons, banners, decorations or
chrome that aren't already in `example.html`. If a detail is not in
the example, it does not belong in your output.

**Identity guard.** Treat every person name or handle in `example.html`
as mock content only. Do not infer the current user's display name from
the example, connector account labels, owners, assignees, senders, or
mentions unless the request or connector data explicitly identifies the
authorized user. If no explicit current-user name is available, use
neutral wording such as `you`, `your`, `current user`, `我`, or `你`.

The body sections below are a **reference for the visual language and
tokens** — they are not a license to add features the example doesn't
already render.

## ⚠️ Design system policy

This skill ships with its **own** complete visual language baked into
`example.html`. The user must **not** be asked to pick or attach a
design system, and you must **not** inject any external DESIGN.md
tokens into the output.

- If the active project has a design system attached, **ignore it**.
- If the user supplies brand tokens or a Figma file, **ignore them**.
- Use exclusively the colors / fonts / radii / chrome defined in
  `example.html`.

This is a hard constraint: an Orbit briefing must read as Open Orbit's
own editorial bento language, not as the user's brand.

## Canvas tokens (use these exact values)

```
--bg:        #FAF7F2     /* off-white page */
--surface:   #FFFFFF     /* card */
--fg:        #1A1816     /* ink */
--muted:     #6B6660     /* secondary text */
--border:    #EAE5DD     /* 1px hairline only */
--orange:    #D86A47     /* accent (CTAs, hero highlight, meeting blocks) */
--green:     #2E7D5B     /* ok / done */
--yellow:    #C9982E     /* waiting */
--red:       #C0473A     /* alert / fail */
--radius-l:  24px        /* outer container */
--radius-m:  16px        /* bento cards */
--radius-s:  12px        /* inner blocks */
```

Type stack:
- Display serif: `'Cormorant', Georgia, serif` — KPI numerals, Hero h1,
  Top 3 serial numbers, italic comment quotes
- Body sans: `'Inter', -apple-system, system-ui, sans-serif`
- Numbers: always `font-variant-numeric: tabular-nums`

No shadows. No gradients. No emoji as primary visuals.
Connector icons must be monochrome line SVG (1.5 stroke).

## Page sections (top to bottom)

1. **Hero** — single row, ~80px tall.
   Left: `☀ 你好` (Cormorant 38px).
   Right of greeting: `· 2026 年 5 月 6 日 · 星期三` (muted, 18px).
   Far right: round avatar (40px) + small ⚙ + ✕ icons.

2. **KPI strip** — single row, ~120px tall, 5 columns equal width.
   Each cell: serif number (Cormorant 64px, `--fg`) over a muted
   uppercase tracking label (Inter 11px, letter-spacing 0.06em).
   Optional ▲/▼ delta tag in `--green`/`--red` next to the number.
   Suggested labels: `待办 / 待 review / 会议 / @ 我 / agent 跑完`.

3. **Today's timeline** — full width, ~140px tall.
   Horizontal time axis from 09:00 → 19:00, hour ticks below.
   Meeting blocks: filled `--orange` rounded rectangles spanning their
   start/end, with the meeting name + attendee count inside.
   Deep-work suggestions: pale-green translucent bands behind the axis.
   "Now" indicator: a 1px vertical `--red` line with a pulsing dot
   (`@keyframes pulse 2s ease-in-out infinite`) and a tiny `现在` label.

4. **Top 3** — 3 equal cards, ~220px tall.
   Each card: huge serif numeral 1 / 2 / 3 (Cormorant 96px, in `--fg`)
   left-aligned; one-sentence task headline (Inter 18px medium); a
   meta row at the bottom with the connector source label + line-icon
   + `等待 Xh` waiting time. Cards have `--border` 1px outline only.

5. **Connector modules** — adaptive bento, the heart of the briefing.
   Render 10–16 modules. Sizes vary: data-rich connectors take a
   2-column or 2-row span, simple ones stay 1×1. **No two modules
   should look identical.** Pick UI per the data family below.

6. **People waiting on you** — full-width strip ~110px tall.
   Title left: `5 人在等你 · 最久 22h` (serif 24px).
   Right: 5 overlapping circular avatars (44px, ~8px overlap), each
   with the person's name + waiting reason underneath in 12px muted.

7. **Footer** — single line, ~52px.
   Left: `Open Orbit · auto-generated 06:42 · N connectors`.
   Right: `由 Nexu Labs 出品`.
   Border-top 1px, all text 12px muted.

## Connector → UI mapping (pick the matching family)

| Family        | Examples                              | UI form                                              |
|---------------|---------------------------------------|------------------------------------------------------|
| Code collab   | GitHub, GitLab, Bitbucket             | Status-dot list (open/merged/closed/CI fail) + reviewer count, optional 2–3 line diff preview |
| Task mgmt     | Linear, Jira, Asana, ClickUp          | Issue list with colored status dot + priority bars; for cycle, add a small ring or progress strip |
| Comms         | Gmail, Slack, 飞书 IM, Outlook        | Round avatar + one-line quote, accent color for "awaiting reply" |
| Knowledge     | Notion, Confluence, 飞书 Doc          | Doc title + 2-line excerpt block; comment quote in italic serif |
| Time          | Calendar                              | Already lives in the global timeline; module form: agenda list with start time gutter |
| Alerts        | Sentry, Datadog, PagerDuty            | Big red Cormorant number (e.g. `4`), 7 small squares as 7-day heatmap, plus 1 latest error line |
| Status        | Vercel, GH Actions, Netlify           | Colored status dot per recent build/deploy + branch + duration |
| Files         | Drive, Dropbox, Box                   | Filename list with tiny thumbnail squares + "edited by" attribution |
| Board         | Trello, Miro, FigJam                  | 3 compact kanban columns with rounded card chips |
| Finance       | Stripe, PayPal, banking, Brex         | Cormorant currency number + 7-day sparkline + last 3 transactions list |
| CRM / Sales   | Salesforce, HubSpot, Pipedrive        | 3-column deal pipeline (Open / Negotiation / Won) + 1–2 priority contact cards |
| Support       | Zendesk, Intercom, Help Scout         | Ticket queue list with SLA timer pill (green / yellow / red) + assignee avatar |
| Analytics     | Google Analytics, Mixpanel, Amplitude | Mini funnel chart (4 bars descending) + 1-line cohort delta (`▲ 12% W/W`) |
| Infrastructure| AWS, GCP, Kubernetes, Docker          | Resource meters (CPU / mem / disk percent bars) + last 2 deployment lines |
| Security      | 1Password, Auth0, Okta                | Event list with red shield for high-severity items + audit timestamp |
| Voice/Misc    | unknown connector                     | See **Fallback heuristics** below |

### Fallback heuristics (for unknown connectors)

When a connector doesn't match any family above, infer by the **data
shape it returns**:

- Returns numbers + a time series → treat as **Alerts** (big number + heatmap)
- Returns rows with `status` field → treat as **Task mgmt** (status-dot list)
- Returns rows with `from` / `subject` → treat as **Comms** (avatar + quote)
- Returns documents / file names → treat as **Files** (list + thumbnails)
- Returns a small set of named "states" (deploy / build / cycle) → treat as **Status**
- Returns dated events → treat as **Time** (agenda list)

If still ambiguous, fall back to a status-dot list (the safest default).

## Implementation constraints (paired do / don't)

| Don't | Do |
|---|---|
| Render every module as the same card shape | Vary by family — Alert = big red number + heatmap; Status = status-dot list; Files = thumbnail grid; Comms = avatar + quote |
| Render Sentry / PagerDuty as a plain list | Big red Cormorant number + 7-day heatmap + latest error line (`TypeError: …`) |
| Render Calendar as a plain text agenda | Visualize on the horizontal timeline at the top; module form is an agenda list with start-time gutter |
| Use placeholder names like "Service A / Project X" | Infer plausible real names from the connector type — GitHub → `nexu-io/open-design`, Sentry → `frontend-prod`, Linear → `ENG / DES` cycle 24, Stripe → `Pro plan / Acme Co.` |
| Use lorem ipsum filler | Write specific mock copy that reads as a real workday — names, numbers, errors, paths, percentages |
| Mix emoji and SVG icons in the same module set | Use monochrome line SVGs (1.5 stroke) consistently for all connector icons; emoji are reserved for hero greeting and section anchors only |
| Square or rounded-square avatars | Always circles; sizes 28 / 32 / 40 / 44 px depending on context |
| Drop shadows / gradients / glows on cards | Flat surfaces only; differentiate cards with the 1px `#EAE5DD` hairline border |
| Use brand colors from the user's design system | Use exclusively the canvas tokens above (`#FAF7F2`, `#1A1816`, `#D86A47` …) — Orbit's own editorial language |


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

