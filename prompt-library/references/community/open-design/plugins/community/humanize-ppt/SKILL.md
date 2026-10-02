---
name: humanize-ppt
description: >-
  A presentation system for agent-made PPTs — born for the talk, not just the
  template. It turns raw material into an AST (audience-state-transfer) outline
  with per-page visual-enhancement decisions (image / SVG diagram / video),
  hands a production brief to a downstream renderer (HTML-PPT skills or native
  PPTX), then runs a capped 3-round presentation checkup (演讲体检) on the
  rendered deck. It never renders slides itself. Use before generating
  PPT/HTML slides from raw material, and after rendering when the user says
  things like "给这份 deck 做演讲体检" or "PPT 渲染质检". If all you want is
  one beautiful template page with no outline and no checkup, a rendering
  skill alone is enough.
version: 1.1.1
author: LearnPrompt
license: MIT
requires-skills:
  guizang-ppt-skill: "Required for Chinese decks — the downstream native HTML renderer the brief targets."
  frontend-slides: "Recommended English HTML renderer. support_level: full."
  beautiful-html-templates: "English HTML alternative. support_level: full."
  ppt-master: "Native editable PPTX renderer. support_level: full."
  remotion-video-production: "Main pipeline for the video media slot — renders the real mp4 to the slot's asset_path."
  remotion-best-practices: "Pair with remotion-video-production while writing Remotion code."
  remotion-video-toolkit: "Only for complex video work — captions, charts, 3D, batch templates."
  baoyu-image-gen: "Image media slot — drives the local Codex CLI, no OPENAI_API_KEY needed."
# Verification evidence and per-renderer hand-off details: references/renderer-verification.md
# Machine-readable support levels: registry/renderer_registry.json
metadata:
  tags: [presentation, ppt, pptx, html-slides, humanizer, ast, workflow, brief-orchestrator, hv-analysis, 9-styles]
---

# Humanize PPT

Use this skill when a user wants to turn raw material, notes, voice transcripts, documents, or links into a presentation-ready outline and per-page media decisions before delegating rendering to a downstream skill. Old PPT/PPTX files are not read directly: extract their text first (see `scripts/pptx_qa.py`'s dump/inspect output), then feed that text in as `--source`. A deck Humanize PPT already rendered goes through `--qa-from <rendered.pptx>` instead — the presentation checkup, not brief mode.

## Positioning

Humanize PPT is a **presentation system, born for the talk**: an **Outline Director** (AST audience-state-transfer — every page turn moves the audience forward), a **Per-Page Visual-Enhancement Director** (real image / SVG diagram / Remotion video), a **Production Brief Orchestrator**, a **Presentation Checkup Runner** (演讲体检; formerly the QA loop, CLI flag still `--qa-from`), and a **Presenter-Mode hand-off**. The motivation: HTML-PPT template skills are great at *concept display* but blow a simple idea into a dozen pretty pages, while a real 90-minute talk is ~30 — the pretty shell outruns the content density. Humanize closes that gap: it keeps the beauty (rendered natively by the downstream template skill) and makes it *presentable* — a line you can stand up and deliver. Downstream template skills own "renders beautifully"; Humanize owns "it's a talk, and someone checked it."

The presentation checkup in one sentence: it does not grade beauty, it grades the outline. It compares every rendered page against its outline page, pulls out the pages that can only be looked at but not spoken from, and keeps going until every page is one the speaker can stand up and present. A failed page, in plain words: a page that holds only a few words and never finishes its point, or a page that fails the audience state transfer it promised (the listener walks out of that page in the same state they walked in). Such a page should not exist; the checkup pulls it out and generates fix instructions.

Humanize is broadly compatible with downstream renderers that can consume plain markdown + JSON. Verified routes are: Chinese HTML → `guizang-ppt-skill`; English HTML → `frontend-slides` / `beautiful-html-templates`; native editable PowerPoint → `ppt-master`. Other downstreams remain hot-pluggable; support levels live in `registry/renderer_registry.json` and move only on real output.

It runs **before** downstream PPT / HTML slide skills and **around** the post-render presentation checkup. It owns the AST contract, the per-page media decision (does this page need a photo, a system diagram, a 10-second process clip, nothing?), the production brief that the next agent consumes, and the checkup pass on rendered HTML/PPTX. It does **not** own the rendered deck itself.

There are two human review gates before rendering: the **outline preview** and the renderer's style gate. HTML routes use Humanize's ≥4 real-cover `--style-gallery`. PPT Master already owns a mandatory three-stage Confirm UI with native visual previews, so `--renderer ppt-master --style-gallery` delegates to that gate and writes `style_gallery_plan.json` + `commands/style-gallery/ppt-master-confirm-ui.md` rather than duplicating the catalog.

The user calls Humanize PPT once for the brief, hands the brief to a downstream skill for native rendering, then calls Humanize again with `--qa-from <rendered.html|native.pptx>` to run the 3-iteration presentation checkup. Each iteration writes `qa_report.md`, `fix_prompt.md`, and `qa_iteration.json`. After 3 rounds with remaining failures, status flips to `needs-human`.

Humanize PPT never copies a downstream skill's template, never injects custom sections into it, and never post-processes rendered HTML or PPTX. Fixes return to the downstream author source. See `references/guizang-production-brief-orchestrator.md` and `adapters/ppt-master-bridge-notes.md`.

For public positioning, describe Humanize PPT as a brief orchestrator that pairs with native downstream renderers. Do **not** frame it as a renderer itself, and do not present it as a "router" that picks the best visual style for the user — that decision lives in the brief, the downstream skill's own templates, and the human's review. When a user only wants a pretty template page, that is a rendering-skill job, not a Humanize job: state the choice, not a prohibition.

## AST theory

AST means **Audience-State-Transfer**.

- **Audience**: who is listening, what they know, what they resist, and why they would keep listening.
- **State**: the audience state before and after the deck, plus the core tension that blocks the transition.
- **Transfer**: the slide-by-slide path that moves the audience from initial state to desired state.

Core sentence:

> PPT is not an information container. PPT is an audience state-transfer artifact.

## Required output contract

For every Humanize PPT run, produce:

1. `deck_brief.md` — audience, goal, tension, success criteria.
2. `ast_outline.md` — AST map and narrative arc.
3. `slide_plan.json` — slide-by-slide plan, with per-page `media: {image, diagram, video}` decision and `layout_hint`.
4. `speaker_intent.md` — what the speaker should do on each slide. Downstream skills consume this as the source for their native speaker notes and presenter shell.
5. `asset_manifest.md` — Humanize's per-page material decisions: which page needs which kind of asset (image / diagram / video) and for what purpose.
6. `video_slots.json` — optional Remotion / HyperFrames / native video insertion plan.
7. `style_brief.md` — visual principle for downstream production.
8. `renderer_registry.json` — renderer capability snapshot for this run.
9. `router_plan.json` — selected primary renderer and staged route plan.
10. `commands/*.md` — bounded instructions for each downstream specialist agent.
11. `run_manifest.json` — final file inventory, route status, and QA status.
12. `<renderer>-production-prompt.md` — the downstream entrypoint. In addition to the HTML routes, `ppt-master` emits `ppt-master-production-prompt.md` + self-contained `ppt-master-source.md` and disposable `outputs/ppt-master-handoff/` copies.
13. `outputs/qa/qa_report.md` — first-pass QA gate (brief mode) or per-iteration QA findings (QA mode).

QA mode (post-render) additionally produces per iteration:

14. `outputs/qa/fix_prompt.md` — downstream-skill-actionable fix instructions.
15. `outputs/qa/qa_iteration.json` — round number, status (`iterate` / `pass` / `needs-human`), unresolved findings, history.

Style-gallery mode (`--style-gallery`, pre-outline gate) instead produces and stops:

16. HTML routes: `style_gallery.html` plus ≥4 cover entries. PPT Master: no fake gallery HTML; style selection stays in its native Confirm UI.
17. `style_gallery_plan.json` — cover candidates for HTML or `mode: downstream-confirm-ui` for PPT Master.
18. `commands/style-gallery/<id>.md` — cover command for HTML, or `ppt-master-confirm-ui.md` for the native gate.

## Recommended OPC workflow (v0.6.4)

```text
O — Outline + Per-Page Media Direction
  Humanize PPT: raw material → AST outline + per-page media decision
  (deck_brief.md, ast_outline.md, slide_plan.json, speaker_intent.md,
   asset_manifest.md, video_slots.json, style_brief.md)

P — Native Renderer Invocation (100% downstream)
  zh  → guizang-ppt-skill        (Style A or B, native; recommended)
  en  → frontend-slides / beautiful-html-templates (native; recommended)
  pptx → ppt-master (native DrawingML; explicit --renderer ppt-master)
  other HTML-PPT skills → hot-pluggable, same brief contract
  Humanize emits the production prompt and stops. The downstream
  skill renders the deck. Humanize does NOT copy templates, does
  NOT inject SLIDES_HERE / [必填] replacements, does NOT add
  postMessage bridges to the rendered HTML.

Q — Presentation Checkup (演讲体检) on the rendered artifact
  Humanize --qa-from <rendered.html|native.pptx> reads the output of P,
  compares pages against the outline, scans for failure modes
  (references/qa-failure-modes.md), writes qa_report.md and
  fix_prompt.md, tracks iteration in qa_iteration.json.
  Cap: 3 rounds. After cap with remaining findings, status
  flips to needs-human.

C — Complete / Control
  Downstream skill native speaker notes + presenter shell + deploy
  (Humanize does not own these in v0.6.4 — the brief tells the
  next agent to produce them in the downstream skill's own format)
```

## Rules

### v0.6.4 invariants (these are the hard rules; if you break any, you're off the v0.6.4 boundary)

1. **Humanize is brief-only.** It writes the renderer production contract and stops. It does **not** open, copy, or post-process downstream templates or final HTML/PPTX.
2. **Downstream renderers are 100% native.** The next agent follows the downstream skill's own `SKILL.md`. The brief tells the next agent which skill to load, which Style (A/B) to use, which layouts to pick from, and which QA gates must pass — but it does not carry template internals.
3. **The presentation checkup caps at 3 iterations.** Round 4 with remaining fail findings is `needs-human`. The loop does not spin forever; it hands the decision back to a human.
4. **Speaker notes and presenter shell — Humanize produces a baseline `presenter-shell.html`; downstream owns the full stage.** Humanize owns the semantic source (`speaker_intent.md`) and now also writes `outputs/presenter/presenter-shell.html` directly from `slide_plan.json` + `speaker_intent.md` (usable standalone, even before the downstream deck exists). The downstream skill produces the native speaker notes and fuller presenter console. Humanize does not inject `postMessage` bridges or `?slide=` URL parameters into the rendered HTML.
5. **The production prompt is the downstream entrypoint.** It names every support artifact the renderer must read. PPT Master additionally reads `ppt-master-source.md`, which freezes the Humanize page story and notes intent without duplicating PPT Master's visual contracts.

### Working rules

6. Do not let slide renderers consume raw material directly when Humanize PPT can first produce the AST contract.
7. Keep the downstream skill as the owner of the full stage view; Humanize's `presenter-shell.html` is a functional baseline, not a replacement for native consoles.
8. Absorb AI-writing cleanup principles from humanizer tools, but do not reduce Humanize PPT to text polishing.
9. Prefer a small verified workflow over a broad unverified promise.
10. For public Skill releases, create/push the repo, install from GitHub locally, run one safe full sample, verify the brief + presentation checkup on the verified known-good checkpoint (https://github.com/LearnPrompt/humanize-ppt/tree/main/examples/03-codex-guizang-native-ink-classic), and only then polish README details.
11. For Agent Teams development, emit `router_plan.json`, `run_manifest.json`, bounded `commands/*.md`, and the per-renderer production prompt before wiring real downstream Skills.
12. For WorkBuddy/CodeBuddy team upload packages, do **not** package demo or rendered HTML outputs as the team zip. The upload zip must mirror a team-plugin structure like `trading-team`: root-level `.codebuddy-plugin/plugin.json`, `agents/`, `skills/`, `rules/`, and `setting.json` (plus optional `avatars/`, `.workbuddy-plugin/`, `README.md`, `settings.json`). The `rules/` directory should include a scenario rule file such as `rules/<plugin-name>_rules.md` with frontmatter (`description`, `alwaysApply`, `enabled`, `updatedAt`, `provider`) and a `<system_reminder>` block describing available agents, skills, SOP, and usage requirements. Verify with `unzip -l` that the root is not `index.html/assets/screenshots/source` and is not folder-wrapped unless the target uploader explicitly requires a wrapper directory.
13. Do not treat HyperFrames/Remotion videos as a single embedded player that replaces PPT content. For Humanize PPT deliverables, video tools are **material producers**: transitions, explainer clips, before/after comparisons, talking-material inserts, social previews, and fallback stills that fill specific slide needs. The `media.video` decision per page (see `slide_plan.json` schema) tells the downstream skill which pages want a Remotion clip, for what purpose, and at what duration.

## Operational references

- `references/guizang-production-brief-orchestrator.md` — canonical brief specification: what `<renderer>-production-prompt.md` must and must not contain.
- `references/qa-failure-modes.md` (+ English mirror `references/qa-failure-modes.en.md`) — failure-mode catalog for the presentation checkup; code-side source of truth is `FAILURE_MODES` in `scripts/humanize_ppt_v2.py`.
- `references/style-gallery-spec.md` — the `--style-gallery` cover-style gate.
- `references/renderer-guidance.md` — per-renderer recommended paths and the known-good checkpoint rules.
- `references/renderer-verification.md` — per-renderer verification evidence behind the frontmatter one-liners.
- `adapters/ppt-master-bridge-notes.md` — native PPTX route boundary and OOXML checkup contract.
- `SPEC.md` — engine technical specification: CLI surface, data flow, output contract, style gallery, checkup, media model, renderer registry.
- Full annotated index of all references, adapters, version notes, and helper scripts: `docs/index.md`.

## Local demo

The recommended stable entrypoint is `scripts/humanize_ppt.py` (versioned scripts remain as compatibility shims). Full CLI examples — brief mode, presentation checkup, native PPTX, outline preview, legacy entrypoints — live in `docs/local-demo.md`.

**`--out` warning:** point `--out` at a dedicated run directory. Brief mode rebuilds it from scratch every run, but only wipes it automatically when it is missing, empty, or already a previous Humanize PPT run (`run_manifest.json` / `style_gallery_plan.json` / `outline-preview.md` / `preview-confirmed.json` at its root) — otherwise it refuses and asks for `--force`.


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

