---
name: github-dashboard
description: |
  GitHub repository analytics dashboard — stars, forks, contributors,
  issues, pull requests, recent activity, and top contributors. Use when
  the brief asks for a GitHub repo dashboard, open-source growth report,
  repository health page, or GitHub analytics view.
triggers:
  - "github dashboard"
  - "repo dashboard"
  - "repository dashboard"
  - "github analytics"
  - "open source dashboard"
  - "github growth"
  - "仓库看板"
  - "GitHub 看板"
od:
  mode: prototype
  platform: desktop
  scenario: operation
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  outputs:
    primary: index.html
    secondary:
      - template.html
      - data.json
      - artifact.json
      - provenance.json
  capabilities_required:
    - shell
    - file_write
  example_prompt: "Build a GitHub dashboard for nexu-io/open-design — stars, forks, contributors, issues, PRs, recent activity, and top contributors."
---

# GitHub Dashboard Skill

Create a single-screen GitHub repository analytics dashboard in the FlowAI / Soft Paper Workspace visual style: warm off-white canvas, white rounded panels, a fixed left sidebar, compact KPI cards, pastel pills, dense tables, and low-contrast hairlines.

## Resource map

```
github-dashboard/
├── SKILL.md
├── example.html                         ← rendered reference dashboard
└── references/
    ├── template.html                    ← live-artifact-compatible HTML template
    ├── example-data.json                ← normalized public GitHub data shape
    ├── artifact-example.json            ← minimal live-artifact create input
    └── provenance-example.json          ← safe source/provenance example
```

## When to use this skill

Use this when the user asks for a dashboard or report about a single GitHub repository, for example:

- repository growth dashboard
- open-source project health report
- GitHub stars / forks / contributors analytics
- issue and pull-request activity page
- maintainer / contributor dashboard

If the user asks for refreshability, source auditability, or scheduled updates, produce the live-artifact source set (`template.html`, `data.json`, `artifact.json`, `provenance.json`) and follow the `live-artifact` contract. If they only need a visual artifact, produce a self-contained `index.html`.

## Workflow

1. **Resolve repository scope**
   - Parse `owner/repo` from the brief.
   - This v1 skill is scoped to one repository. If multiple repositories are requested, ask the user to pick the primary repository or create one dashboard per repository.
   - If the repo is missing, ask one concise question for the GitHub URL or `owner/repo`.

2. **Collect public GitHub data**
   - Prefer GitHub CLI/API for public repository data when available.
   - Current stars/forks/watchers/open issue count: `GET /repos/{owner}/{repo}` (`stargazers_count`, `forks_count`, `watchers_count`, `open_issues_count`).
   - Contributors: paginate `GET /repos/{owner}/{repo}/contributors?per_page=100&page=N`, sort by `contributions` descending, and take the top N used by the dashboard. If only page 1 is available, label totals as first-page estimates.
   - Issues: use GitHub Search API (`repo:{owner}/{repo} is:issue`) for total counts, or paginate `GET /repos/{owner}/{repo}/issues?state=all` and filter out items with a `pull_request` field.
   - Pull requests: use GitHub Search API (`repo:{owner}/{repo} is:pr`) for total counts, or paginate `GET /repos/{owner}/{repo}/pulls?state=all` and count pages via the `Link` header.
   - Recent activity: combine the newest issues and pull requests, normalize them into display-ready rows, and cap the preview list at 5–10 items.
   - Growth/delta metrics: GitHub REST does not expose complete historical star/fork deltas. Use GraphQL, stargazer event snapshots, the Events API where available, or explicitly mark deltas as estimated/synthetic in `provenance.json`.
   - Do not store auth tokens, raw HTTP envelopes, cookies, rate-limit headers, or private metadata.

3. **Normalize into dashboard data**
   - Required `repository`: `name`, `fullName`, `url`, `description`, `language`, `license`, `created`, `lastUpdated`.
   - Required `metrics`: stars, forks, contributors, issues, pull requests. Store display-ready totals plus small deltas or growth notes.
   - Required `contributors`: top 5–8 contributors with `login`, `avatar`, and `contributions`.
   - Required `recentActivity`: display-ready rows with `title`, `typeText`, `typeClass`, `label`, `labelClass`, `author`, `authorAvatar`, and `updated`. Do not rely on template conditionals for issue/PR switching.
   - Chart data can be synthetic only when GitHub does not expose the exact history; document the transformation in provenance.

4. **Apply the visual system**
   - Use the active `DESIGN.md` tokens when present.
   - If no design system is provided, use the Soft Paper defaults reflected in `references/template.html`: `#F2F2F0` canvas, white cards, `#ECECEA` borders, `#0A0A0A` ink, Geist/Inter typography, 256px sidebar, 48px topbar, and 16px card radius.
   - Keep color small and semantic: green for healthy metrics, amber for warning, blue for feature/PR labels, red only for defects or risk.

5. **Lay out the page**
   - Shell: 256px sidebar + main panel, both white, rounded 16px, 1px hairline border.
   - Topbar: repo context on the left, refresh/export/action affordances on the right.
   - Header: repository name, description, and date/settings/actions row.
   - KPI strip: 5 compact cards for stars, forks, contributors, issues, PRs.
   - Main grid: 2fr/1fr split with a growth chart or activity table on the left and top contributors/health cards on the right.
   - Footer: provenance/last-updated note in small muted text.

6. **Write the artifact**
   - For a static artifact, write one self-contained `index.html` with inline CSS and no external JS libraries.
   - For a live artifact, write `template.html`, `data.json`, `artifact.json`, and `provenance.json`; `index.html` is derived by the daemon.
   - Tag major regions with stable `data-od-id` values: `sidebar`, `topbar`, `repo-header`, `kpi-strip`, `growth-chart`, `contributors`, `activity`, `provenance`.

## Visual rules

- Light mode only.
- 256px fixed sidebar on desktop; stack on narrow screens.
- 4 or 5 KPI cards in the first row.
- Use tabular lining numerals for all counts.
- Avatars are circular, 28–32px in tables and contributor lists.
- Tables use 13px body text, 11px uppercase column labels, 1px row dividers.
- Cards use hairline borders and a barely visible shadow at most: `0 1px 2px rgba(10,10,10,.04), 0 1px 1px rgba(10,10,10,.02)`.
- Do not use gradients except tiny workflow/repo icon placeholders.
- Do not make the page look like GitHub itself. This is a custom operational dashboard, not a GitHub UI clone.

## Self-check

- Every metric has a source or a provenance note.
- No private data or credentials are persisted.
- Data labels are specific to the repository, not placeholders.
- The screen still reads clearly at 50% zoom.
- The dashboard uses at most one solid black primary action per area.
- Status labels and issue/PR chips are pastel pills, not saturated badges.


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

