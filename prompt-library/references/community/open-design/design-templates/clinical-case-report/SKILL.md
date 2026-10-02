---
name: clinical-case-report
description: |
  Structured medical case presentation for clinical rounds, conferences,
  and documentation. Generates SOAP-format or narrative case reports
  with physiologically accurate vitals, labs, and evidence-based plans.
  Use when the brief mentions "case report", "case presentation", "SOAP note",
  "clinical case", "ward rounds", "case summary", or "patient presentation".
triggers:
  - "case report"
  - "case presentation"
  - "soap note"
  - "clinical case"
  - "ward rounds"
  - "patient presentation"
  - "case summary"
  - "medical case"
od:
  mode: prototype
  platform: desktop
  scenario: healthcare
  preview:
    type: html
    entry: index.html
  fidelity: high-fidelity
  example_prompt: "58-year-old male with 2 hours of substernal chest pain radiating to the left arm, diaphoresis, and ST elevation in leads II, III, aVF. Generate a full emergency cardiology case presentation."
---

# Clinical Case Report Skill

Generate a structured medical case presentation for clinical rounds,
conferences, or documentation. The output follows standard medical
formatting conventions used in hospital settings worldwide.

## What you will produce

A single-page HTML case report (`index.html`). Content varies by format
(see `references/case-formats.md` — selected in Step 0):

**SOAP / Conference format:**
- **Patient identification** — age, sex, chief complaint
- **History of Present Illness (HPI)** — chronological narrative with
  pertinent positives and negatives
- **Past Medical History, Medications, Allergies**
- **Review of Systems**
- **Physical Examination** — systematic findings by system
- **Vital Signs** — formatted table with reference ranges and flags
- **Investigations** — laboratory results and imaging findings
- **Assessment** — primary diagnosis and differential (3–5 items)
  with clinical reasoning for each
- **Management Plan** — evidence-based, organised by problem

**Brief Rounds format** (daily review, ward round, handover, ICU, post-call):
- **ID line** — age, sex, day of admission, primary problem
- **Interval events / current status** — what has changed since last review
- **Active problems** — numbered list
- **Plan-by-problem** — concise actions for each active problem
- Full HPI and systematic physical examination are **not** included

---

## Step-by-step workflow

### Step 0 — Load reference files

Before starting, read both reference files:

1. `references/case-formats.md` — use this to choose the correct output
   format (SOAP, Conference, or Brief Rounds) based on the user's context
2. `references/checklist.md` — keep P0 gates in mind throughout; you
   must pass all P0 items before emitting the final artifact

### Step 1 — Parse the brief

Read the user's prompt and extract:

- Patient age and sex
- Chief complaint or presenting problem
- Any vitals, labs, or imaging the user has provided
- Clinical context: ED, ward rounds, conference case, outpatient, etc.
- Specialty context: cardiology, emergency, internal medicine, etc.

If the chief complaint or presenting problem is missing:
- **SOAP / Conference**: ask one clarifying question before proceeding. Do not proceed without it.
- **Brief Rounds**: if the admission problem or ID line is already available (e.g. "day-3 ICU review for septic shock"), proceed directly — a separate chief complaint is not required.

### Step 2 — Build the clinical narrative

**For SOAP / Conference outputs:** write the HPI as a continuous prose
narrative in standard clinical style:

> "This is a [age]-year-old [sex] with a history of [relevant PMH] who
> presents with [chief complaint]. Symptoms began [timeline] and are
> characterised by [quality, severity, radiation]. Associated symptoms
> include [list]. Pertinent negatives include [list]."

The HPI must be chronological. Include timeline markers
("2 hours prior to presentation", "onset yesterday morning").

**For Brief Rounds outputs** (daily review, ward round, handover, ICU,
post-call): skip the full HPI and examination. Instead produce:

- **ID line**: "[Age][sex], Day [N] of admission, [primary problem]"
- **Interval events / current status**: what has changed since last review
- **Active problems**: numbered list
- **Plan-by-problem**: concise action for each active problem

### Step 3 — Generate physiologically consistent clinical data

If the user has not provided specific values, generate values that are
internally consistent with the diagnosis:

**Consistency checks (typical patterns):**

- A patient in shock **typically** has: HR >100, SBP <90, raised lactate,
  impaired capillary refill — but medications (beta-blockers), age, or
  shock type (neurogenic, spinal) can alter this pattern
- Pneumonia **typically** presents with raised WBC, raised CRP,
  temperature >38°C — but afebrile pneumonia exists, especially in
  the elderly or immunocompromised
- A STEMI **typically** shows ST elevation in contiguous leads and raised
  high-sensitivity troponin — but early presentations may have initially
  normal troponin; CK-MB is not universally required
- Sepsis **typically** shows raised or low WBC, raised lactate >2,
  temperature abnormality — but compensated early sepsis may present
  with normal vitals
- Lab units must match convention: creatinine in µmol/L or mg/dL
  (state which), glucose in mmol/L, haemoglobin in g/dL

**Critical rule — preserve user-provided data:**
- Never overwrite a value the user has explicitly stated
- If a user-provided value is atypical for the diagnosis, keep it and
  note the atypical presentation in the assessment rather than
  forcing canonical numbers
- Never generate a value that contradicts the stated diagnosis

### Step 4 — Write the assessment

The assessment section must contain:

1. **Primary diagnosis** stated clearly on the first line
2. **Clinical reasoning** — one sentence explaining why this is the
   most likely diagnosis
3. **Differential diagnosis** — exactly 3 to 5 items, each with one
   sentence of supporting or refuting evidence
4. **Risk stratification** — include a validated clinical score where
   applicable (TIMI for ACS, GRACE for ACS, Killip class + Shock Index
   for STEMI/cardiogenic shock, CURB-65 for pneumonia, qSOFA for sepsis,
   Wells for PE, etc.). Killip class and Shock Index together are
   accepted as sufficient risk stratification for STEMI/cardiogenic shock cases.

### Step 5 — Write the management plan

The plan must be:

- **Specific**: write drug names, doses, routes, and frequencies.
  Do not write "start antibiotics" — write
  "Piperacillin-Tazobactam 4.5g IV q8h for 5 days"
- **Organised by problem** using numbered headers
- **Evidence-based**: management must reflect current standard of care
  for the diagnosis
- **Complete**: include investigations to order, monitoring parameters,
  consults to request, and disposition

If you are uncertain about a specific dose, write
"[drug name] — dose per local formulary/protocol" rather than
inventing a dose.

### Important — Prescribing Safety

Generated plans must:
- Be marked as educational/simulated, not a substitute for clinician judgment
- Use "per local formulary/protocol" language when required patient variables
  (weight, renal function, allergies) are missing from the brief
- List key contraindications and unknowns before medication recommendations
  when relevant patient data has not been provided
- Never claim a plan is "definitive" or "standard of care" without full
  patient context (allergy status, renal/hepatic function, pregnancy
  status, weight, anticoagulation/bleeding risk)
- Include a disclaimer footer in the HTML output stating the case is for
  educational and documentation purposes only

### Step 6 — Write `index.html`

Requirements for the HTML output:

- Professional medical document typography
  (Georgia or system serif font preferred)
- White background, dark text — suitable for printing
- Vital signs and lab results in HTML `<table>` elements
- Critical findings (ST elevation, raised troponin, low BP, etc.)
  highlighted in a visually distinct callout box with red left border
- @media print CSS rules so the document prints cleanly on A4/Letter
- Tag every major section with `data-od-id` for comment-mode targeting:

```html
<section data-od-id="hpi">...</section>
<section data-od-id="vitals">...</section>
<section data-od-id="pmh">...</section>
<section data-od-id="examination">...</section>
<section data-od-id="investigations">...</section>
<section data-od-id="assessment">...</section>
<section data-od-id="plan">...</section>
```

### Step 7 — Self-check against `references/checklist.md`

Before emitting `<artifact>`, run every P0 item in `references/checklist.md`.
All P0 items must pass. Fix any failures before emitting.

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

