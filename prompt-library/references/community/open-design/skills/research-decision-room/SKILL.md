---
name: research-decision-room
description: |
  Turn messy user research notes, interviews, support tickets, surveys, and product
  context into an evidence-backed decision room: a single HTML artifact with an
  evidence ledger, theme map, confidence heatmap, opportunity matrix, decision
  memo, and experiment queue. Use when teams need to move from qualitative
  signals to product or design decisions without fabricating certainty.
triggers:
  - "research decision room"
  - "user research synthesis"
  - "research synthesis dashboard"
  - "evidence-backed product decision"
  - "interview synthesis"
  - "opportunity solution tree"
  - "usability findings dashboard"
  - "qualitative research board"
od:
  mode: prototype
  platform: desktop
  scenario: research
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  craft:
    requires: [typography, color, accessibility-baseline, anti-ai-slop]
  inputs:
    - name: research_material
      type: string
      required: true
      description: "Interview notes, tickets, survey excerpts, analytics notes, or a product decision brief"
    - name: decision_scope
      type: string
      required: false
      description: "The product/design decision the team needs to make"
  outputs:
    primary: index.html
  example_prompt: "Synthesize 8 interview notes, 24 support tickets, and recent activation metrics into a research decision room for whether a project-management app should add an onboarding checklist or contextual inline tips."
  capabilities_required:
    - file_write
---

# Research Decision Room Skill

Create a single-page HTML decision artifact that helps a product or design team
turn messy evidence into a clear next move. The output is not a decorative
research deck. It is a working room for debate: evidence, themes, confidence,
tradeoffs, and recommended experiments stay visible together.

## Resource map

```text
research-decision-room/
├── SKILL.md
├── example.html
└── references/
    ├── checklist.md
    └── evidence-model.md
```

Read `references/evidence-model.md` before synthesis and run
`references/checklist.md` before emitting the artifact.

## When to use this skill

Use this skill when the user has any mix of:

- Interview notes, usability-test observations, support tickets, sales call notes,
  app-store reviews, NPS comments, survey open text, analytics snippets, or
  product-decision context.
- A decision that needs evidence: "Should we build X?", "Which onboarding path
  should we try?", "Why are users dropping off?", "What do customers actually
  mean by slow?"
- A need to share findings with stakeholders who will not read a long research
  report.

Do not use it for pure visual inspiration, campaign ideation, or brand moodboards.

## Workflow

### Step 1 - Establish the decision frame

Identify the decision scope from the user's prompt. If the user did not give a
decision, derive one from the evidence and label it as inferred.

Write a short frame with:

- Decision question.
- Audience or segment.
- Time horizon.
- Known constraints.
- What this artifact will not decide.

If key context is missing and the task is not blocked, proceed with labelled
assumptions instead of asking a broad question.

### Step 2 - Build the evidence ledger

Normalize every useful signal into ledger rows using the model in
`references/evidence-model.md`.

Each ledger row must include:

- `id`: short stable id, such as `I-03`, `T-14`, `M-02`.
- `source_type`: interview, usability, support, survey, analytics, sales, field
  note, or stakeholder.
- `segment`: user type or "unknown".
- `signal`: one-sentence observation.
- `quote_or_metric`: direct quote, metric, or "not provided".
- `strength`: strong, medium, or weak.
- `limitations`: why this evidence may be biased or incomplete.

Never invent quotes, participant counts, dates, revenue impact, or metrics. If
the user did not provide a number, use "not provided" and explain what evidence
would increase confidence.

### Step 3 - Synthesize themes and tensions

Cluster evidence into 4 to 6 themes. For each theme:

- Name the theme in plain human language.
- List the evidence ids that support it.
- Explain the behavior behind it, not just the UI complaint.
- Mark confidence as high, medium, or low.
- Note contradictions or segment differences.

Prefer verbs over nouns: "Teams abandon setup when the first blank state asks
for too much" is better than "Onboarding problem".

### Step 4 - Score opportunities

Create an opportunity matrix with 3 to 5 options. Score each option on a 1 to 5
scale:

- Evidence strength.
- User pain.
- Business leverage.
- Implementation risk, where 5 means low risk and 1 means high risk.

Show the total score, but do not let the score replace judgment. Add one sentence
on why the top recommendation wins.

### Step 5 - Draft the decision memo

Write a decision memo with:

1. Recommended move.
2. Why now.
3. What evidence supports it.
4. What could be wrong.
5. What to measure next.
6. Reversible next step.

Keep the memo short enough to read in under one minute.

### Step 6 - Create the HTML artifact

Produce a self-contained `index.html`. Use the active `DESIGN.md` for typography,
spacing, color roles, and component tone, but keep the information architecture
stable:

1. Header with decision question, confidence, and last-updated label.
2. Executive readout with recommendation, risk, and next experiment.
3. Evidence ledger with filter chips.
4. Theme map with evidence ids and confidence.
5. Opportunity matrix.
6. Decision memo.
7. Experiment queue with owner, metric, and success threshold.
8. Assumptions and limitations.

The artifact should be interactive but durable. Simple vanilla JavaScript is
allowed for filtering evidence, switching views, or highlighting related ids.
No framework dependency is required.

### Step 7 - Self-check and emit

Run the checklist. Then emit one concise orientation sentence and one HTML
artifact:

```xml
<artifact identifier="research-decision-room" type="text/html" title="Research Decision Room">
<!doctype html>
<html>...</html>
</artifact>
```

Nothing after the closing `</artifact>`.


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

