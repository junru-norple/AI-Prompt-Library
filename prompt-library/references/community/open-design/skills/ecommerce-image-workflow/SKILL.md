---
name: ecommerce-image-workflow
en_name: "Ecommerce Image Workflow"
description: |
  Reference-product ecommerce image workflow for generating a compact set
  of product-faithful main, feature, and lifestyle images from real product
  reference photos. V1 requires uploaded product imagery and intentionally
  defers brief-only concept generation and platform-specific batch exports.
triggers:
  - "ecommerce product images"
  - "product image set"
  - "product photography workflow"
  - "product main image"
  - "product feature shot"
  - "reference product commerce images"
  - "lifestyle product image"
  - "amazon product images"
  - "shopify product images"
  - "taobao product images"
od:
  mode: image
  surface: image
  category: image-generation
  scenario: marketing
  preview:
    type: html
    entry: example.html
  design_system:
    requires: false
  example_prompt: |
    Use the Ecommerce Image Workflow to turn my uploaded product reference
    photo into a compact ecommerce image set: one main packshot, one feature
    highlight image, and one lifestyle scene. Preserve the exact product
    identity, color, material, logo placement, structure, and proportions.
---

# Ecommerce Image Workflow

Create a compact ecommerce image set from real product reference imagery.
This V1 skill is intentionally narrow: it supports **reference-product mode
only**. If the user only describes a product and does not provide a product
photo, ask for one and stop. Do not create a brief-only concept product in
this version.

## Resource map

```text
ecommerce-image-workflow/
|-- SKILL.md
|-- example.html
`-- references/
    `-- checklist.md
```

## What this skill produces

By default, generate three ecommerce-ready image assets for one product:

1. **Main image** - clean product-first packshot on white or soft neutral
   background.
2. **Feature image** - one selling point shown clearly with controlled callout
   space, without relying on tiny unreadable in-image text.
3. **Lifestyle image** - product shown in a plausible use context while keeping
   the product faithful to the reference.

Also create:

- `image-manifest.json` describing reference inputs, slots, prompts, outputs,
  aspect ratios, and fidelity notes.
- `ecommerce-gallery.html` as a small preview gallery linking the generated
  files and summarizing the image roles.

## Input contract

Required:

- At least one uploaded product reference image in the active project.

Ask only for missing essentials:

- Product name or short label if it is not obvious.
- Main selling point if the feature image cannot be inferred safely.
- Target marketplace or aspect only if the user asks for platform-specific
  framing.

Do not ask broad discovery questions. Keep the workflow moving.

## Workflow

### Step 0 - Confirm reference-product mode

Before planning, verify that the current project includes a real product
reference image.

If no product image is available, reply:

> Please upload at least one product reference image first. This V1 workflow
> preserves a real product from reference photos; brief-only concept generation
> is deferred to a later version.

Then stop.

### Step 1 - Extract product identity anchors

Inspect the reference image and write a short internal identity lock:

- Product category and form factor.
- Shape and silhouette.
- Primary colors and materials.
- Logo, label, pattern, fasteners, ports, straps, handles, or other fixed
  details.
- Scale cues and proportions.
- What must not change.

Use these anchors in every generation prompt.

### Step 2 - Build a three-slot shot plan

Create a compact shot plan before dispatch:

| Slot | Default aspect | Goal |
|---|---:|---|
| main | 1:1 | Product-first marketplace image on white or soft neutral background |
| feature | 4:5 | One clear selling point with close-up detail or simple callout space |
| lifestyle | 4:5 | Realistic use context with the product still visually faithful |

If the project metadata provides `imageAspect`, use it when the user expects a
single aspect across the set. Otherwise use the slot defaults above.

### Step 3 - Compose prompts with a fidelity lock

Every prompt must include this product fidelity instruction near the top:

```text
Preserve the exact product identity from the reference image: shape,
silhouette, color, material, logo/label placement, visible construction
details, and proportions. Do not redesign the product. Do not add, remove,
or relocate product features.
```

Then add slot-specific instructions:

#### Main image prompt

- Product centered and fully visible.
- White, off-white, or very light grey background.
- Soft studio lighting with clean shadow.
- No props unless the user asked for them.
- No in-frame marketing text.

#### Feature image prompt

- Focus on one user-provided or safely inferred feature.
- Use close-up composition, cutaway-style crop, or clean negative space for
  later designer-added labels.
- Keep the product visually balanced in the frame. If no explicit callout
  structure is being generated, center the product. If label space is needed,
  offset the product only slightly and make the empty space feel intentional.
- Do not invent certifications, performance numbers, materials, or claims.
- Avoid tiny rendered text; leave label space instead.

#### Lifestyle image prompt

- Use a realistic environment matched to the product category.
- Keep the product the focal point.
- Show human interaction only if it helps explain use and does not obscure the
  product.
- Preserve product scale and structure.

### Step 4 - Dispatch through the media contract

Use the unified Open Design media dispatcher. Do not call provider APIs or
custom model commands directly.

For each slot, run the standard generate/wait loop:

```bash
# POSIX bash. Do not call provider APIs directly.
out=$("$OD_NODE_BIN" "$OD_BIN" media generate \
  --project "$OD_PROJECT_ID" \
  --surface image \
  --model "<imageModel from metadata>" \
  --aspect "<slot aspect or imageAspect from metadata>" \
  --image "<project-relative product reference image>" \
  --output "<product-slug>-<slot>.png" \
  --prompt "<full slot prompt>")
ec=$?
if [ "$ec" -ne 0 ]; then echo "$out" >&2; exit "$ec"; fi

last=$(printf '%s\n' "$out" | tail -1)
task_id=$(printf '%s\n' "$last" |
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('taskId',''))" 2>/dev/null)
since=$(printf '%s\n' "$last" |
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('nextSince',0))" 2>/dev/null)
since="${since:-0}"

while [ -n "$task_id" ]; do
  out=$("$OD_NODE_BIN" "$OD_BIN" media wait "$task_id" --since "$since")
  ec=$?
  last=$(printf '%s\n' "$out" | tail -1)
  since=$(printf '%s\n' "$last" |
    python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('nextSince',0))" 2>/dev/null)
  since="${since:-0}"
  if [ "$ec" -eq 0 ]; then
    task_id=""
  elif [ "$ec" -ne 2 ]; then
    echo "$out" >&2
    exit "$ec"
  fi
done

printf '%s\n' "$last"
```

The final line must be JSON with `{"file": {"name": "...", ...}}`.
Record each final returned filename in `image-manifest.json`.

If the active image model or provider cannot use `--image`, stop and tell the
user that this workflow needs a reference-capable image generation path for
product fidelity.

### Step 5 - Write `image-manifest.json`

After generation, create a project file named `image-manifest.json`:

```json
{
  "workflow": "ecommerce-image-workflow",
  "mode": "reference-product",
  "productName": "Example product",
  "referenceImages": ["reference-product.png"],
  "fidelityNotes": [
    "Preserve product identity, color, material, construction, and proportions.",
    "Do not treat these outputs as platform-compliance proof without human review."
  ],
  "slots": [
    {
      "id": "main",
      "role": "marketplace packshot",
      "aspect": "1:1",
      "output": "example-product-main.png",
      "promptSummary": "Centered product-first packshot on a clean neutral background."
    },
    {
      "id": "feature",
      "role": "single feature highlight",
      "aspect": "4:5",
      "output": "example-product-feature.png",
      "promptSummary": "Close-up or negative-space composition for one verified selling point."
    },
    {
      "id": "lifestyle",
      "role": "usage context",
      "aspect": "4:5",
      "output": "example-product-lifestyle.png",
      "promptSummary": "Realistic scene with the product as the focal point."
    }
  ]
}
```

Keep the manifest honest. If a detail is unknown, write `null` or a short note
instead of inventing claims.

### Step 6 - Write `ecommerce-gallery.html`

Create a simple single-file HTML gallery that:

- Shows the reference image first.
- Shows the three generated slots with their role names.
- Lists product-fidelity notes.
- Links to `image-manifest.json`.
- Uses system fonts and local project files only; no CDN imports.

### Step 7 - Hand off

Reply with:

- The generated filenames.
- A one-sentence summary of the fidelity lock used.
- A reminder that marketplace-specific compliance, final text overlays, and
  claim/legal review remain human review steps.

Do not emit an `<artifact>` tag.

## Hard rules

- V1 requires real product reference imagery. No brief-only concept products.
- One product per run.
- Default to exactly three slots: main, feature, lifestyle.
- Preserve the product; do not redesign it.
- Do not invent claims, certifications, measurements, ingredients, or
  performance data.
- Use `"$OD_NODE_BIN" "$OD_BIN" media generate`; do not call provider APIs
  directly.
- Always create `image-manifest.json` after generation.
- Run `references/checklist.md` before handoff.


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

