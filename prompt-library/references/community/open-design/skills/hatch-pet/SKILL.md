---
name: hatch-pet
description: Create, repair, validate, preview, and package Codex-compatible animated pet spritesheets from character art, screenshots, generated images, or visual references. Use when a user wants to hatch a Codex pet, create a custom animated pet, or build a built-in pet asset with an 8x9 atlas, transparent unused cells, row-by-row animation prompts, QA contact sheets, preview videos, and pet.json packaging. This skill composes the installed $imagegen system skill for visual generation and uses bundled scripts for deterministic spritesheet assembly.
triggers:
  - "hatch a pet"
  - "hatch pet"
  - "codex pet"
  - "spritesheet pet"
  - "animated pet"
  - "孵化宠物"
  - "电子宠物"
od:
  mode: image
  surface: image
  scenario: personal
  preview:
    type: image
    entry: final/spritesheet.png
  design_system:
    requires: false
  outputs:
    primary: final/spritesheet.png
    secondary:
      - final/spritesheet.webp
      - pet.json
      - qa/contact-sheet.png
  example_prompt: "Hatch me a tiny pixel-art shiba pet — friendly, sitting upright, with a small pomegranate prop. Use the hatch-pet skill end-to-end."
  upstream: "https://github.com/openai/skills/tree/main/skills/.curated/hatch-pet"
---

# Hatch Pet

> **Open Design integration.** This is the unmodified Codex `hatch-pet` skill,
> vendored under `skills/hatch-pet/` so any Open Design agent can run it. After
> the skill finishes packaging, the resulting `spritesheet.webp` (under
> `${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/`) can be imported into the
> floating pet companion via **Settings → Pets → Import Codex sprite**. The
> import flow auto-detects the 8×9 / `192×208` atlas and lets the user pick
> which animation row to play (idle, running-right, waving, …).


## Overview

Create a Codex-compatible animated pet from a concept, one or more reference images, or both. This skill owns pet-specific prompt planning, animation rows, frame extraction, atlas geometry, QA, previews, and packaging. It delegates visual generation to `$imagegen`.

User-facing inputs are optional. If the user omits a pet name, infer one from the concept or reference filenames; if that is not possible, choose a short appropriate name. If the user omits a description, infer one from the concept or references. If the user omits reference images, generate the base pet from text first, then use that base as the canonical reference for every animation row.

## Generation Delegation

Use `$imagegen` for all normal visual generation.

Before generating base art, row strips, or repair rows, load and follow the installed image generation skill:

```text
${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/SKILL.md
```

Do not call the Image API directly for the normal path. Let `$imagegen` choose its own built-in-first path and its own CLI fallback rules. If `$imagegen` says a fallback requires confirmation, ask the user before continuing.

When invoking `$imagegen` from this skill, pass the generated pet prompt as the authoritative visual spec. Do not wrap it in the generic `$imagegen` shared prompt schema and do not add extra polish, hero-art, photo, product, or illustration-style augmentation. Pet prompts should stay terse, sprite-specific, and digital-pet oriented; only add role labels for input images and any essential user constraint.

Use this skill's scripts for deterministic work only: preparing prompts and manifests, ingesting selected `$imagegen` outputs, extracting frames, validating rows, composing the final atlas, creating QA media, and packaging.

Hard boundary: do not create, draw, tile, warp, mirror, or synthesize pet visuals with local Python/Pillow scripts, SVG, canvas, HTML/CSS, or other code-native art as a substitute for `$imagegen`. For a normal pet run, expect up to 10 visual generation jobs: 1 base pet plus 9 row-strip jobs. The only exception is `running-left`, which may be derived by mirroring `running-right` only after `running-right` has been generated, visually inspected, and explicitly approved as safe to mirror. If mirroring is not appropriate, generate `running-left` as a normal grounded `$imagegen` row. If those calls are too expensive, blocked, or unavailable, stop and explain the blocker instead of fabricating row strips locally.

Do not mark visual jobs complete by editing `imagegen-jobs.json`, copying files into `decoded/`, or writing helper scripts that populate row outputs. Use `record_imagegen_result.py` for selected built-in `$imagegen` outputs, or `generate_pet_images.py` only for the documented secondary fallback. The deterministic scripts may only process already-generated visual outputs.

Only the base job may be prompt-only. Every row-strip job generated through `$imagegen` must use the input images listed in `imagegen-jobs.json`, including the canonical base reference created after the base job is recorded. Treat any row generation without attached grounding images as invalid.

## Codex Digital Pet Style

Default pet art should match the Codex app's built-in digital pets: small pixel-art-adjacent mascots with compact chibi proportions, chunky readable silhouettes, thick dark 1-2 px outlines, visible stepped/pixel edges, limited palettes, flat cel shading, simple expressive faces, and tiny limbs. Even if the reference art is more detailed, complex or realistic, the generated pet should be simplified into this style.

Do NOT generate polished illustration, painterly rendering, anime key art, 3D rendering, glossy app-icon treatment, realistic fur or material texture, soft gradients, high-detail antialiasing, and complex tiny accessories. References that are more detailed than this should be simplified into the house style before row generation.

## Transparency And Effects

Pet rows are processed into transparent 192x208 cells, so every generated pixel must either belong to the pet sprite or be cleanly removable chroma-key background. Prefer pose, expression, and silhouette changes over decorative effects.

Allowed effects must satisfy all of these conditions:

- The effect is state-relevant and helps explain the animation.
- The effect is physically attached to, touching, or overlapping the pet silhouette, not floating nearby.
- The effect is inside the same frame slot as the pet and does not create a separate sprite component.
- The effect is opaque, hard-edged, pixel-style, and uses non-chroma-key colors.
- The effect is small enough to remain readable at 192x208 without clutter.

Examples of allowed effects: a tear touching the face, a small smoke puff touching the box or head, or tiny stars overlapping the pet during a failed/dizzy reaction.

Avoid these by default because they usually break transparent-background cleanup or component extraction:

- wave marks, motion arcs, speed lines, action streaks, afterimages, blur, or smears
- detached stars, loose sparkles, floating punctuation, floating icons, falling tear drops, separated smoke clouds, or loose dust
- cast shadows, contact shadows, drop shadows, oval floor shadows, floor patches, landing marks, impact bursts, glow, halo, aura, or soft transparent effects
- text, labels, frame numbers, visible grids, guide marks, speech bubbles, thought bubbles, UI panels, code snippets, checkerboard transparency, white backgrounds, black backgrounds, or scenery
- chroma-key-adjacent colors in the pet, prop, effects, highlights, or shadows
- stray pixels, disconnected outline bits, speckle/noise, cropped body parts, overlapping poses, or any pose that crosses into a neighboring frame slot

State-specific guidance:

- `waving`: show the wave through paw pose only. Do not draw wave marks, motion arcs, lines, sparkles, or symbols around the paw.
- `jumping`: show vertical motion through body position only. Do not draw shadows, dust, landing marks, impact bursts, bounce pads, or floor cues.
- `failed`: tears, attached smoke puffs, or attached stars are allowed if they obey the allowed-effects rules; do not use red X marks, floating symbols, detached smoke, detached stars, or separate tear droplets.
- `review`: show focus through lean, blink, eyes, head tilt, or paw position. Do not add magnifying glasses, papers, code, UI, punctuation, or symbols unless that prop already exists in the base pet identity.
- `running-right`, `running-left`, and `running`: show locomotion through body, limb, and prop movement only. Do not draw speed lines, dust clouds, floor shadows, or motion trails.

## Pet Naming

Ask the user for a pet name when they have not provided one and only if the conversation naturally allows it. If asking would slow down a direct execution request, choose a short appropriate name from the pet concept, reference image, or personality, then use that name consistently as the display name and as the source for the package folder slug.

Good built-in style examples:

- Codex - The original Codex companion.
- Dewey - A tidy duck for calm workspace days.
- Fireball - Hot path energy for fast iteration.
- Rocky - A steady rock when the diff gets large.
- Seedy - Small green shoots for new ideas.
- Stacky - A balanced stack for deep work.
- BSOD - A tiny blue-screen gremlin.
- Null Signal - Quiet signal from the void.

## Visible Progress Plan

For every pet run, keep a visible checklist so the user can see where the work is up to. Create the checklist before starting, keep one step active at a time, and update it as each step finishes.

Before creating the checklist, establish the pet name when possible. Use the user-provided name when available; otherwise infer a short appropriate name from the concept or references. If the name is too long, not settled, or not appropriate for a friendly checklist, use `your pet` instead.

Use this checklist for a normal pet run, replacing `<Pet>` with the pet's name or `your pet`:

1. Getting `<Pet>` ready.
2. Imagining `<Pet>`'s main look.
3. Picturing `<Pet>`'s poses.
4. Hatching `<Pet>`.

What each step means:

- `Getting <Pet> ready.` Choose or confirm the pet name, description, source images, and working folder.
- `Imagining <Pet>'s main look.` Generate the pet's main reference image. This is required for new pets, even when the user does not provide an image, because it becomes the visual source of truth.
- `Picturing <Pet>'s poses.` Create the pose rows, starting with `idle` and `running-right` to confirm the pet still looks consistent. Only mirror `running-left` if `running-right` clearly works when flipped.
- `Hatching <Pet>.` Turn the approved poses into the final pet files, review the contact sheet, previews, and validation results, fix any broken parts, save `pet.json` and `spritesheet.webp` into the pet folder, then tell the user where the pet and QA files were saved.

Only mark a step complete when the real file, image, or decision exists. If this is just a repair run, start from the first relevant step instead of restarting the whole checklist.

## Default Workflow

1. Prepare a pet run folder and imagegen job manifest:

```bash
SKILL_DIR="${CODEX_HOME:-$HOME/.codex}/skills/hatch-pet"
python "$SKILL_DIR/scripts/prepare_pet_run.py" \
  --pet-name "<Name>" \
  --description "<one sentence>" \
  --reference /absolute/path/to/reference.png \
  --output-dir /absolute/path/to/run \
  --pet-notes "<stable pet description>" \
  --style-notes "<style notes>" \
  --force
```

All arguments above are optional except any flags needed to express user constraints. For text-only requests, pass the concept through `--pet-notes` and omit `--reference`; `prepare_pet_run.py` will infer a name, description, chroma key, and output directory as needed.

2. Inspect the next ready `$imagegen` jobs:

```bash
python "$SKILL_DIR/scripts/pet_job_status.py" --run-dir /absolute/path/to/run
```

3. For each ready job, invoke `$imagegen` with:

- the prompt file listed in `imagegen-jobs.json`
- every input image listed for the job, with its role label
- the default built-in `image_gen` path unless `$imagegen` itself routes otherwise

The base job must complete first. If user references exist, the base job uses them. If no references exist, the base job may be prompt-only. After recording the base, `record_imagegen_result.py` writes `decoded/base.png` and `references/canonical-base.png`; all row jobs use the original references if present plus those canonical base images.

`prepare_pet_run.py` also creates 9 row-specific layout guide images under `references/layout-guides/`, one per animation state. Row jobs attach the matching guide as a layout-only input so the model can follow the correct frame count, spacing, centering, and safe padding. Treat these guides as invisible construction references: the generated row strip must not include visible boxes, borders, center marks, labels, guide colors, or the guide background.

When generating row strips, keep the identity lock in the row prompt authoritative: do not redesign the pet, and preserve the same head shape, face, markings, palette, prop, outline weight, body proportions, and silhouette. A row that looks like a related but different pet is failed even if the deterministic geometry QA passes.

Generate and record `running-right` before deciding how to complete `running-left`. Inspect `running-right` against the base and references. If the pet is visually symmetric enough that a horizontal mirror preserves identity, prop placement, handedness, markings, lighting, text-free details, and direction semantics, derive `running-left` with:

```bash
python "$SKILL_DIR/scripts/derive_running_left_from_running_right.py" \
  --run-dir /absolute/path/to/run \
  --confirm-appropriate-mirror \
  --decision-note "<why mirroring preserves this pet's identity>"
```

If there is any asymmetric side-specific marking, readable text, non-mirrored logo, handed prop, one-sided accessory, lighting cue, or direction-specific pose that would become wrong when flipped, do not mirror. Generate `running-left` with `$imagegen` using its row prompt and all listed grounding images, including `decoded/running-right.png` as a gait reference.

For the built-in path, record the selected source image from `$CODEX_HOME/generated_images/.../ig_*.png`. Do not record files from the run directory, `tmp/`, hand-made fixtures, deterministic row folders, or post-processed copies as visual job sources.

4. After selecting a generated output for a job, ingest it:

```bash
python "$SKILL_DIR/scripts/record_imagegen_result.py" \
  --run-dir /absolute/path/to/run \
  --job-id <job-id> \
  --source /absolute/path/to/generated-output.png
```

This copies the image to the exact decoded path expected by the deterministic pipeline and records source metadata in `imagegen-jobs.json`.

5. When all jobs are complete, finalize:

```bash
python "$SKILL_DIR/scripts/finalize_pet_run.py" \
  --run-dir /absolute/path/to/run
```

Expected output:

```text
run/
  pet_request.json
  imagegen-jobs.json
  prompts/
  decoded/
  frames/frames-manifest.json
  final/spritesheet.png
  final/spritesheet.webp
  final/validation.json
  qa/contact-sheet.png
  qa/review.json
  qa/run-summary.json
  qa/videos/*.mp4
```

Package output is written outside the run directory by default. If `CODEX_HOME` is set, use it; otherwise use `$HOME/.codex`.

```text
${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/
  pet.json
  spritesheet.webp
```

Review `qa/contact-sheet.png`, `qa/review.json`, `final/validation.json`, and `qa/videos/` before accepting the pet.

Deterministic validation is necessary but not sufficient. Before calling the pet done, visually inspect the contact sheet for identity consistency. Block acceptance if any row changes species/body type, face, markings, palette, prop design, prop side unexpectedly, or overall silhouette.

## Subagent Row Generation

After the base job has been recorded and `references/canonical-base.png` exists, row-strip visual generation must use subagents unless the user explicitly says not to use subagents for this session. Before row generation, state that subagents are being used and which row jobs are being delegated. If subagents cannot be spawned because the current environment or tool policy blocks them, stop before row-strip generation, explain the blocker, and ask for explicit user direction before continuing sequentially.

The parent agent must own the manifest and package writes.

Default flow:

1. Parent runs `prepare_pet_run.py`.
2. Parent generates and records `base`.
3. Parent runs `pet_job_status.py`.
4. Parent spawns subagents for `idle` and `running-right` first as identity and gait checks.
5. Parent records the selected `idle` and `running-right` results returned by subagents.
6. Parent decides whether `running-left` is safe to derive by mirror; if not, parent treats it as a normal grounded row job delegated to a subagent.
7. Parent spawns subagents for every remaining non-derived row image-generation job.
8. Each subagent receives the row prompt and every listed input image path, invokes `$imagegen`, and returns only the selected `$CODEX_HOME/generated_images/.../ig_*.png` source path.
9. Parent alone runs `record_imagegen_result.py`, `derive_running_left_from_running_right.py`, repair queueing, finalization, QA, and packaging.

Subagent write boundary: do not let subagents edit `imagegen-jobs.json`, copy files into `decoded/`, run `record_imagegen_result.py`, run `derive_running_left_from_running_right.py`, run `finalize_pet_run.py`, or package the pet. This avoids manifest races and keeps provenance checks centralized.

Subagent handoff contract:

- Give each subagent exactly one row job unless you are intentionally batching adjacent simple rows.
- Include the row id, the absolute prompt file path, the full prompt text or an instruction to read that exact prompt file, and every input image path with its role label from `imagegen-jobs.json`.
- Explicitly remind the subagent that the prompt's transparency and effects rules are mandatory: no detached effects, no wave marks for `waving`, no speed lines or dust for running rows, and only attached opaque sprite-like tears/smoke/stars when allowed by the state prompt.
- Tell the subagent to inspect the generated candidate for frame count, identity consistency, clean flat chroma-key background, safe spacing, and forbidden detached effects before returning it.
- Tell the subagent to return only the selected original `$CODEX_HOME/generated_images/.../ig_*.png` source path plus a one-sentence QA note. The parent decides whether to record or repair it.

Use this template for each subagent:

```text
Generate the `<row-id>` row for this hatch-pet run.

Run dir: <absolute run dir>
Prompt file: <absolute prompt file>
Input images:
- <absolute path> — <role>
- <absolute path> — <role>

Read and follow the row prompt exactly, including the Transparency and artifact rules. Use `$imagegen` only; do not use local scripts to draw, tile, edit, or synthesize sprites.

Before returning, visually check:
- exact requested frame count
- same pet identity as the canonical base
- clean flat chroma-key background
- complete, separated, unclipped poses
- no forbidden detached effects or slot-crossing artifacts

Do not edit manifests, copy into decoded, record results, mirror rows, finalize, repair, or package. Return only:
selected_source=/absolute/path/to/$CODEX_HOME/generated_images/.../ig_*.png
qa_note=<one sentence>
```

No silent sequential fallback: if subagents cannot be used for row-strip visual generation, stop and ask for explicit user direction before continuing without them. Only an explicit user instruction such as "do not use subagents" or "run this sequentially" authorizes a normal sequential row-generation path. The final answer must report which row jobs were delegated to subagents and which, if any, were mirrored or repaired by the parent.

## Repair Workflow

If finalization stops because row QA failed, queue targeted repair jobs:

```bash
python "$SKILL_DIR/scripts/queue_pet_repairs.py" \
  --run-dir /absolute/path/to/run
```

Then repeat the `$imagegen` generation and `record_imagegen_result.py` ingest loop for each reopened row job. Regenerate the smallest failing scope: the failed row, not the whole sheet.

For identity repairs, use the canonical base image, original references, contact sheet, and exact row failure note as grounding context. Repair only the failed row while preserving the canonical pet identity.

## Secondary Image Generation Fallback

`scripts/generate_pet_images.py` is a secondary fallback for this skill.

Use it only when the installed `$imagegen` system skill is unavailable or cannot be invoked in the current environment. Normal pet creation should delegate visual generation to `$imagegen`, because `$imagegen` owns the built-in-first image generation policy and its own CLI fallback behavior.

Run the secondary fallback only after explaining why `$imagegen` cannot be used:

```bash
python "$SKILL_DIR/scripts/generate_pet_images.py" \
  --run-dir /absolute/path/to/run \
  --model gpt-image-2 \
  --states all
```

The secondary fallback requires `OPENAI_API_KEY`.

## Rules

- Keep `$imagegen` as the primary generation layer.
- Keep reference images attached/visible for `$imagegen` whenever the chosen path supports references.
- Attach the row's `references/layout-guides/<state>.png` image to every row-strip job as a layout-only guide, and do not accept outputs that copy guide pixels.
- Use subagents for row-strip visual generation after the parent records the base image. The parent may generate the base, but row-strip jobs belong to subagents unless the user explicitly says not to use subagents for this session.
- Generate every normal visual job with `$imagegen`: base plus all row strips that are not explicitly approved `running-left` mirror derivations.
- Treat only the base job as eligible for prompt-only generation; every row job must attach its listed grounding images.
- Delegate `running-right` first, then mirror `running-left` only when visual inspection confirms a mirror preserves identity and semantics; otherwise delegate `running-left` as a normal grounded `$imagegen` row.
- Never substitute locally drawn, tiled, transformed, or code-generated row strips for missing `$imagegen` outputs.
- Never manually mutate `imagegen-jobs.json` to claim a visual job completed.
- Do not rely on generated images for exact atlas geometry; use this skill's deterministic scripts.
- Use the chroma key stored in `pet_request.json`; do not force a fixed green screen.
- Keep the pet's silhouette, face, materials, palette, and props consistent across all rows.
- Enforce the transparency and effects rules above in every base, row, and repair prompt.
- Treat visual identity drift as a blocker even when `qa/review.json` and `final/validation.json` have no errors.
- Treat a contact sheet that shows cropped references, repeated tiles, white cell backgrounds, or non-sprite fragments as failed.
- Treat forbidden detached effects, chroma-key-adjacent artifacts, shadows, glows, smears, dust, landing marks, wave marks, speed lines, or motion trails as failed rows.
- Treat `qa/review.json` errors as blockers. Warnings require visual review.

## Acceptance Criteria

- Final atlas is PNG or WebP, `1536x1872`, transparent-capable, and based on `192x208` cells.
- Used cells are non-empty and unused cells are fully transparent.
- Atlas follows the row/frame counts in `references/animation-rows.md`.
- Contact sheet and preview videos have been produced unless explicitly skipped.
- `qa/review.json` has no errors.
- Row-by-row review confirms the animation cycles are complete enough for the Codex app.
- `${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/pet.json` and `${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/spritesheet.webp` are staged together for custom pets.


---

## 授權與來源附錄 / License and provenance appendix

本附錄保留完整上游授權；附錄前的正文原段未因本次通知補齊而改寫。
The complete upstream notices follow; adding this appendix does not rewrite the preceding body.

### prompt-library/references/community/open-design/skills/hatch-pet/LICENSE.txt

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
   except as required for reasonable and customary use in describing the
   origin of the Work and reproducing the content of the NOTICE file.

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

9. Accepting Warranty or Additional Liability. While redistributing
   the Work or Derivative Works thereof, You may choose to offer,
   and charge a fee for, acceptance of support, warranty, indemnity,
   or other liability obligations and/or rights consistent with this
   License. However, in accepting such obligations, You may act only
   on Your own behalf and on Your sole responsibility, not on behalf of
   any other Contributor, and only if You agree to indemnify,
   defend, and hold each Contributor harmless for any liability
   incurred by, or claims asserted against, such Contributor by reason
   of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

   To apply the Apache License to your work, attach the following
   boilerplate notice, with the fields enclosed by brackets "[]"
   replaced with your own identifying information. (Don\'t include
   the brackets!)  The text should be enclosed in the appropriate
   comment syntax for the file format. We also recommend that a
   file or class name and description of purpose be included on the
   same "printed page" as the copyright notice for easier
   identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

