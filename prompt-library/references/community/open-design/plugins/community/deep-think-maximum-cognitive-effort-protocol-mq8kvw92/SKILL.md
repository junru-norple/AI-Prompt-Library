---
name: deep-think-maximum-cognitive-effort-protocol-mq8kvw92
description: Use this plugin when the user wants a maximum-effort reasoning workflow for a complex, high-stakes, or ambiguous task.
---

# /deep-think — Maximum Cognitive Effort Protocol

**Goal:** Activate the highest level of cognitive architecture for complex, multi-step, or ambiguous tasks where quality matters more than speed.
**Time:** 5-15 minutes depending on complexity tier.
**When to use:** Architecture decisions, multi-system changes, irreversible actions, anything where being wrong is expensive.

> **This is NOT /reason.** /reason = "follow the reasoning engine checklist" (fast, lightweight).
> /deep-think = "maximum effort with structured thinking, research, gap analysis, multi-perspective debate, and adversarial review" (slow, thorough).

---

## Complexity Gate (decide first)

Before starting, classify the task:

| Tier | When | Phases Used |
|------|------|-------------|
| **SIMPLE** | Quick but thorough — single-domain analysis, clear question | Phases 1 + 5 only |
| **MEDIUM** | Research + analysis — multi-source synthesis, comparison | Phases 1-5 |
| **COMPLEX** | Full adversarial — architecture decisions, multi-system changes, irreversible actions | All 8 phases |

---

## Phase 1: ORIENT (Memory + Context)

Load ALL available context before forming any opinion.

1. Read project memory if available (e.g., `MEMORY.md`, `SESSION.md`, or status logs)
2. Read known pitfalls and gotchas for the target domain (e.g., `knowledge/gotchas.md` if present)
3. Read the most relevant local knowledge, READMEs, or chunk files
4. Query any active workspace memory system (e.g., Honcho or agentmemory) when recent session continuity is needed
5. Check conversation logs or history for prior attempts or context on this topic
6. Identify which projects, modules, or systems are involved

**If any tool fails:** Note "degraded mode" and continue with available sources. Do NOT stall.

---

## Phase 2: QUESTION (Challenge the Request)

Before solving, challenge the problem statement itself.

1. Use a sequential thinking or reasoning tool (such as sequential-thinking MCP, if available) to decompose the problem into component parts
2. Ask explicitly:
   - "Is this the right question? Is there a better framing?"
   - "What assumptions are embedded in this request?"
   - "What would go wrong if I do the obvious thing?"
   - "Has this been attempted before? What happened?"
3. If the framing reveals a deeper issue, address THAT instead

---

## Phase 3: RESEARCH (Evidence Collection)

Gather evidence from multiple sources. Do NOT rely on training data alone.

1. Run web searches for current best practices, official documentation, and known issues
2. Use available documentation search tools (such as Context7 MCP, if available) for any referenced libraries, frameworks, or APIs
3. Check repository skills and custom workspace procedures (e.g., under `.agent/skills/` or similar locations)
4. Load domain-specific context or chunk files using workspace routing maps (e.g., `WORKSPACE-AUTOMAP.md` or equivalent)
5. Review workspace-specific conventions and code style files (e.g., `knowledge/conventions.md` or local READMEs) for established patterns

**Rule:** Every factual claim must trace to a retrieved source, not memory.

---

## Phase 4: AUDIT (Gap Analysis)

For architecture and system tasks. Skip for pure analysis questions.

1. **What exists?** List all relevant files, tools, configs currently in place
2. **What SHOULD exist?** Based on research and requirements, what's the ideal state?
3. **What's the delta?** Enumerate every gap between current and ideal
4. **What's stale?** Cross-reference sources for contradictions and outdated information
5. **What's broken?** Check tool health, file integrity, reference validity

---

## Phase 5: SYNTHESIZE (Multi-Perspective Analysis)

Evaluate the problem from multiple expert perspectives.

1. **Council of Experts** — consider the problem as:
   - A **Lead Developer**: Is this technically sound? What are the edge cases?
   - A **Business/Product Strategist**: Does this serve the core project objectives and business outcomes?
   - A **UX/Ops Pro**: Is this maintainable? Will it create friction?
2. **Reconcile conflicts** between perspectives and sources
3. **Produce a structured recommendation** with:
   - The recommended approach
   - The key tradeoff
   - The risk if wrong
   - The success criteria

---

## Phase 6: PLAN (Surgical Execution Design)

Break the recommendation into executable steps.

1. Decompose into the **smallest possible steps** — each independently verifiable
2. Run the **5-step Pre-Action Verification Protocol** on EACH step:
   - Are assumptions stated?
   - Am I targeting the correct file/resource?
   - Is scope minimal?
   - Is action reversible?
   - What are the success criteria?
3. Define **measurable success criteria** for the overall task
4. Sequence steps so failures are caught early (dependencies first)

---

## Phase 7: EXECUTE + VERIFY (Work → Check → Correct)

Execute the plan one step at a time.

1. **One step at a time.** Verify output after each step before proceeding.
2. **Work → Verify → Self-Correct loop.** Do not assume success.
3. **Anti-Bulk Enforcement:** Use the most surgical edit mechanism available. Never rewrite files unless creating from scratch.
4. **80% Confidence Threshold:** If confidence drops below 80% on a high-stakes decision, STOP and ask the user/product owner for input.
5. Follow **Karpathy Doctrine**: surgical, minimal, explicit.

---

## Phase 8: CHALLENGE (Adversarial Self-Review)

After producing the result, attack it.

1. **Re-read the original request word by word.** Did you actually answer THE question?
2. **What did you miss?** What would a senior expert critique about this output?
3. **Would you stake your reputation on this?** If not, what needs to change?
4. **Edge cases:** What happens under unusual conditions? Empty inputs? Scale? Concurrent use?
5. **Save key learnings** to the appropriate memory layer:
   - Debugging insights → update known gotchas (e.g., `knowledge/gotchas.md`)
   - New patterns → update conventions/standards (e.g., `knowledge/conventions.md`)
   - Decisions made → update decisions log (e.g., `knowledge/decisions.md`)
   - Recent continuity worth reusing soon → write a milestone/handoff breadcrumb to the workspace memory system (e.g., Honcho or agentmemory)

---

## What This Workflow Does NOT Do

- It does NOT replace `/reason` for quick analysis — use /reason for fast reasoning engine activation.
- It does NOT save session state — that's `/wrap`.
- It does NOT consolidate memory — that's `/dream`.


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

