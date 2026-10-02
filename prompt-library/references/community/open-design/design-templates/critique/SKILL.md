---
name: critique
description: |
  Run a 5-dimension expert design review on any HTML artifact in the
  project — Philosophy / Visual hierarchy / Detail / Functionality /
  Innovation, each scored 0–10. Outputs a single self-contained HTML
  report with a radar chart, evidence-backed scores, and three lists:
  Keep / Fix / Quick-wins. Use when the brief asks for a "design
  review", "design critique", "5 维度评审", "design audit", or "what's
  wrong with my design".
triggers:
  - "critique"
  - "design review"
  - "design audit"
  - "5 维度评审"
  - "5-dim review"
  - "audit my design"
  - "review my deck"
  - "review my landing page"
  - "评审"
  - "复盘"
od:
  mode: prototype
  platform: desktop
  scenario: design
  upstream: "https://github.com/alchaincyf/huashu-design"
  preview:
    type: html
    entry: index.html
  design_system:
    requires: false
  example_prompt: "Run a 5-dimension critique on the magazine-web-ppt deck I just generated — score philosophy / hierarchy / detail / function / innovation, give me Keep / Fix / Quick-wins."
---

# Critique Skill · 5 维度专家评审

Produce a single-file HTML "design review report" that scores any
artifact across 5 dimensions and proposes actionable fixes. Inspired by
the *huashu-design* expert-critique flow.

## When to use

- After the agent (or user) generates an artifact (deck / prototype /
  landing page) and the user asks "what's wrong with this?" or
  "review this"
- As a self-check loop the agent can run on its own output **before**
  emitting it
- For comparing two variants of the same design

## What you produce

A single self-contained `<artifact type="text/html">` review report
including:

1. **Header** — what artifact was reviewed, date, reviewer ("OD ·
   Critique skill"), 1-line verdict
2. **Radar chart** (inline SVG, no library) showing the 5 scores
3. **Five dimension cards**, each with:
   - Score 0–10 (with band: 0–4 *Broken* · 5–6 *Functional* · 7–8 *Strong*
     · 9–10 *Exceptional*)
   - 1-paragraph evidence (cite specific elements / files / lines)
   - One Keep / Fix / Quick-win bullet
4. **Combined action lists** at the bottom:
   - **Keep** — what's working, don't touch
   - **Fix** — P0 / P1 issues that are visually expensive
   - **Quick wins** — 5–15 minute tweaks with disproportionate impact

## The 5 dimensions

> Each dimension is independent — a deck can be 9/10 on Innovation but
> 4/10 on Hierarchy and the report should say so plainly. Don't average
> away interesting failures.

### 1. Philosophy consistency · 哲学一致性

> Does the artifact pick a clear *direction* and stick to it through
> every micro-decision (chrome / kicker / spacing / accent)?

**Evidence to look for:**
- Is there one declared design direction (e.g. Monocle / WIRED /
  Kinfolk) or is it three styles in a trench coat?
- Does the chrome / kicker vocabulary stay in one register, or does
  page 3 say "Vol.04 · Spring" and page 7 say "BUT WAIT 🔥"?
- Are accent / serif / mono used by the same rule throughout?

**0–4** Three styles fighting each other. **5–6** One direction but
half the elements drift. **7–8** Coherent, occasional drift on edge
pages. **9–10** Every element argues for the same thesis.

### 2. Visual hierarchy · 视觉层级

> Can a stranger figure out what to read first, second, third — without
> being told?

**Evidence to look for:**
- Is the largest type clearly the most important thing on each page?
- Do mono / serif / sans roles match the information's *role* (meta /
  body / display)?
- Lots of "loud" elements competing? Or a clear primary + secondary +
  tertiary tier?

**0–4** Everything shouts. **5–6** Hierarchy works on hero pages but
breaks on body. **7–8** Clear tiers, occasional collision. **9–10** Eye
moves with zero friction.

### 3. Detail execution · 细节执行

> The 90/10 stuff — alignment, leading, kerning at large sizes, image
> framing, foot/chrome polish, edge-case spacing.

**Evidence to look for:**
- Big-stat pages: does the number sit on a baseline, or float?
- Left/right column tops aligned in `grid-2-7-5`?
- `frame-img` + caption proportions consistent across pages?
- Mono labels: same letter-spacing? same uppercase rule?
- Any orphaned `<br>` causing 1-character lines?

**0–4** Visible tape and string. **5–6** Most pages clean, 1–2
ragged. **7–8** Polished, expert eye finds 2–3 misses. **9–10**
Magazine-grade — the kind of detail that makes printed-by-hand
typographers nod.

### 4. Functionality · 功能性

> Does the artifact *work* for its intended use? Click targets, nav,
> readability at presentation distance, copy-paste-ability for code
> blocks, mobile fallback if relevant.

**Evidence to look for:**
- Deck: keyboard / wheel / touch nav all working? Iframe scroll
  fallback?
- Landing: CTA above the fold? Phone number tappable on mobile?
- Runbook: code blocks copyable, mono font, no smart quotes?
- Critical info readable from 4m away (large screen presentation)?

**0–4** Visually fine but doesn't accomplish its job. **5–6** Core
flow works, edge cases broken. **7–8** Robust through normal use.
**9–10** Defensively engineered — handles iframe / fullscreen / paste
/ print without flinching.

### 5. Innovation · 创新性

> Does this push past the median? Is there one element that makes
> people lean in?

**Evidence to look for:**
- One *unexpected* layout / motion / typographic move that wasn't
  required?
- Or 100% safe — could be any deck/landing from any agency?
- Is the innovation *earned* (matches direction) or grafted on
  (random WebGL on a Kinfolk slow-living deck)?

**0–4** Generic AI-slop median. **5–6** Competent and unmemorable.
**7–8** One memorable moment, the rest solid. **9–10** Multiple
moves you'd steal — but each one obviously serves the thesis.

## Scoring discipline (read before you score)

- **Always cite evidence** — "scored 4 because hero page mixes
  Playfair display with Inter sans on the same line" beats "feels
  inconsistent". Numbers without evidence get rejected.
- **Don't average up** — if Hierarchy is 5 because page 3 is broken,
  don't bump to 7 because pages 1 and 2 are fine. The score is the
  *worst sustained band*.
- **Don't grade-inflate** — a 7 means *strong*, not *acceptable*. If
  every score is 7+, you're not reviewing critically.
- **Innovation is allowed to be low** — 5/10 is fine for production
  deliverables. Don't punish *appropriate* conservatism.

## Workflow

### Step 1 — Acquire the artifact

Three modes:

1. **Project file** — user said "review the index.html I just made":
   open it from the project folder.
2. **Pasted HTML** — user pasted code in the chat: read it from the
   message.
3. **Generated by you in this turn** — you just emitted an artifact
   above and want to self-critique: re-read your own `<artifact>`.

If multiple HTML files exist, ask which one (don't review all).

### Step 2 — Read enough to score

Skim the entire `<style>`, then read 6–8 representative content
blocks. **Do not score from frontmatter alone.** The score depends on
*executed* design, not declared intent.

### Step 3 — Score with evidence

For each of the 5 dimensions, write the score and a 30–80 word
evidence paragraph that names specific elements. Use line numbers,
class names, page numbers.

Example:
```
Dimension: Detail execution
Score: 6 / 10
Evidence: Stat-cards on page 3 align cleanly (grid-6, 3×2), but on
page 8 the right column foot sits 2vh higher than the left because
.callout has 3vh top margin while the figure doesn't. Image captions
use mono on page 5 but sans on page 7 — pick one.
```

### Step 4 — Build the action lists

Aggregate the 5 evidence paragraphs into:

- **Keep** (3–5 bullets) — concrete things working that the user must
  not break in the next iteration. Cite by class / page / element.
- **Fix** (3–6 bullets) — must-do, ordered by *visual cost saved per
  minute spent*. Each bullet ≤ 1 sentence.
- **Quick wins** (3–5 bullets) — 5–15 minutes each, high
  signal-to-noise (e.g. "swap `display:flex` for `grid` on page 4 to
  fix the column drift").

### Step 5 — Emit the report HTML

Build a single file:

- Header: artifact name + reviewer credit + date
- Big radar chart (SVG)
- 5 dimension cards in a 1-column or 2-column grid
- Three action lists at the bottom with checkbox affordance

Use the active DESIGN.md tokens if one exists; otherwise default to a
neutral light theme (off-white background, near-black text, one accent
for radar fill).

## Output contract

```
<artifact identifier="critique-<artifact-slug>" type="text/html" title="Critique · <Artifact Title>">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact ("Reviewed X across 5 dimensions, see
report below.") and **stop after `</artifact>`** — do not paraphrase
the report in chat; the user will read the artifact.

## Hard rules

- **5 scores, every time** — partial reports (e.g. only 3 dimensions)
  are not allowed.
- **Evidence per score** — no "feels off" / "needs work". If you
  can't cite an element, the score is not justified.
- **Don't grade-inflate** — overall mean above 8 is suspicious; check
  yourself.
- **Don't review your own artifact in the same turn** — the user
  needs to see it first. Self-critique only on explicit request
  ("now critique what you just made").
- **Single-file HTML only** — no external CSS/JS. Inline everything.
- **Radar chart is mandatory** — gives the report a recognizable
  silhouette and lets the user spot weak axes at a glance.


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

