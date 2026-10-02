---
name: pptx-html-fidelity-audit
description: Audit a python-pptx export against its source HTML deck, identify layout/content drift (footer overflow, cropped content, missing italic/em, lost styling, off-rhythm spacing), and re-export with strict footer-rail + cursor-flow layout discipline. Use this skill whenever the user has a .pptx that was generated from an HTML slide deck and asks to compare/audit/verify/fix the export — including phrases like "compare ppt with html", "fidelity audit", "fix the pptx", "ppt is cut off", "footer overlap", "italic missing in pptx", "re-export the deck", "pptx-html-fidelity-audit", or any case where a python-pptx → HTML round-trip needs verification or repair. Also trigger when the user shows you a deck.html and a deck.pptx side by side and is debugging visual differences.
triggers:
  - "pptx fidelity"
  - "pptx audit"
  - "ppt 跑掉"
  - "字型不對"
  - "footer overlap"
  - "verify pptx"
  - "html to pptx"
od:
  mode: utility
  scenario: engineering
---

# PPTX ↔ HTML Fidelity Audit

A repeatable workflow for catching the ways a `python-pptx` export silently drifts from its HTML source — and fixing them with a layout discipline that prevents the same regressions on the next pass.

## When this skill applies

The user has:

- A source HTML slide deck (typically a single-file deck with `<section class="slide">` blocks):

  ```html
  <section class="slide light">
    <div class="chrome">2026 · Q2 review</div>
    <span class="kicker">Pillar 03</span>
    <h2 class="h-xl">Shipping <em>velocity</em> doubled</h2>
    <p class="lead">…</p>
    <div class="foot">page 5 / 14</div>
  </section>
  ```

- A PPTX file generated from that deck via python-pptx (or similar).
- A suspicion (or visible evidence) that the PPTX doesn't match the HTML — text bleeding into the footer, italic words gone flat, hero slides not centered, sections cropped, tag styling lost.

If the user only has *one* of those two artifacts, this skill doesn't apply yet — first generate the missing one, or ask the user to provide it.

## Why this is hard (and why a skill helps)

PPTX is a fixed-canvas, absolute-positioned medium. HTML is a fluid, flow-based medium. A naive python-pptx export pins each block at hand-picked `(top, left)` coordinates, which works for the *first slide it was tested on* and silently fails for every other slide whose content has different intrinsic height. The result is the most common drift modes:

1. **Footer overflow** — content's `top + height` crosses into the footer row.
2. **Off-canvas content** — bottom of last block exceeds `7.5"` (16:9 canvas).
3. **Italic loss** — `<em>` in HTML never gets `run.font.italic = True`.
4. **Hero slides not centered** — vertical-stack slides use `MARGIN_TOP` instead of computing center.
5. **Box bounds intruding** — the text fits, but the *shape's bounding box* is oversized and visually crosses the rail.
6. **Tag/styling loss** — colored chrome rows, kicker uppercase tracking, mono-vs-serif assignments quietly fall back to defaults.

Every one of these is a *layout discipline* problem, not a content problem. Once you adopt the discipline, they stop happening.

---

## Workflow

The audit is five steps. Don't skip any of them — the discipline only works if the audit produces a real list of issues to drive the re-export. A fix-without-audit pass tends to leave half the issues alive.

### Step 1 — Extract ground truth from the PPTX

Run `scripts/extract_pptx.py <path-to.pptx> > pptx_dump.json`. The script walks every shape on every slide and dumps text, position (`top` / `left`), size (`width` / `height`), and per-run typography (font name, size pt, bold, italic, color). This is the *actual* state of the export — don't trust the export script's intent, trust the dump.

For 14-slide decks, the dump is ~30–60 KB and human-readable.

### Step 2 — Walk the HTML structure

Read the source HTML and enumerate `<section class="slide">` blocks. For each, note:

- The slide's theme (`light` / `dark` / `hero light` / `hero dark`).
- The `chrome` row text (top metadata).
- The `kicker` (small uppercase eyebrow above the headline).
- The headline (h-hero / h-xl / etc.) and any sub-head.
- The body copy and any structured blocks (pipeline steps, cards, pillars, observation cards).
- The `foot` row (bottom metadata).
- Any `<em>` or italic-styled spans — italic is the silent regression.

Map each HTML slide to a PPTX slide index. For decks following the convention "slide 1 = cover, slide N = closing", the mapping is positional.

### Step 3 — Build the audit table

For each slide, walk shapes from the dump and check against expected layout rules. Use this exact table format — the severity column is what drives the fix priority:

```
| Slide | Issue | Severity |
|---|---|---|
| 1 cover | meta-row 底端 6.95" 蓋過 footer (6.7") | 🔴 |
| 5 checklist | row B 步驟描述底端 7.2" 切到 footer | 🔴 |
| 8 3E | 收束段落直接坐在 footer 起點 | 🔴 |
| 9 on-day | step 描述底端剛好碰 footer，無安全距 | 🟠 |
| 多處 | em (Playfair italic) 未保留 | 🟡 |
```

Severity rubric:

- 🔴 **critical** — content cropped, text invisible, footer overlap, off-canvas. Must fix.
- 🟠 **high** — content visible but visual hierarchy broken, no breathing room, hero not centered. Should fix.
- 🟡 **medium** — italic/em missing, font fallback wrong, color drift. Fix in this pass.
- 🟢 **low** — minor spacing/alignment, sub-pixel offsets. Note but don't block.

After the table, write a short root-cause section: 90 % of the issues usually come from 2–3 systemic causes (e.g. "no footer rail enforced", "hero stacks pinned to MARGIN_TOP instead of centered", "italic never propagated"). Naming the systemic causes makes the re-export script much smaller and more correct.

### Step 4 — Re-export with footer-rail + cursor-flow layout discipline

This is the load-bearing technique. See `references/layout-discipline.md` for the full rules; the summary:

**Define the rails up front, once, for the whole deck:**

```python
from pptx.util import Inches

CANVAS_W       = Inches(13.333)   # 16:9
CANVAS_H       = Inches(7.5)
MARGIN_X       = Inches(0.6)
MARGIN_TOP     = Inches(0.5)
CONTENT_MAX_Y  = Inches(6.70)     # NOTHING in content area may cross this
FOOTER_TOP     = Inches(6.85)     # footer row pinned here, edge-to-edge
```

> **Customizing the rails.** The defaults above suit a 16:9 canvas with a slim footer. If your design system uses a wider footer or a 4:3 canvas, override these constants in your export script and pass the same values to `verify_layout.py` via `--content-max-y` / `--canvas-h` / `--canvas-w`. See `references/layout-discipline.md` §1 for the full constant table.


**Use a cursor for content blocks instead of pinning each block at an absolute y:**

```python
class Cursor:
    """Advances down the slide; refuses to cross the footer rail."""
    def __init__(self, y_start, cap=CONTENT_MAX_Y):
        self.y = y_start
        self.cap = cap
    def take(self, h, gap=Inches(0.12)):  # ~1 line of whitespace at 14pt; tighten/loosen per design system
        top = self.y
        self.y = top + h + gap
        if self.y > self.cap:
            raise OverflowError(
                f"cursor at {self.y} exceeds footer rail {self.cap}; "
                f"reduce block height or split slide"
            )
        return top
```

For each slide, instantiate `Cursor(MARGIN_TOP)` and `take(height)` each block in reading order. The slide refuses to render if any block would cross the rail, so overflows become loud build errors instead of silent visual bugs.

**Hero (vertically-centered) slides use a budget instead of a cursor:**

```python
def hero_layout(blocks):
    """blocks = list of (height, gap_after) tuples in reading order."""
    total = sum(h + g for h, g in blocks)
    y_start = (CANVAS_H - total) / 2
    return Cursor(y_start)
```

That single change kills "hero slide content sticks to top" — the most common hero defect.

**Tighten box height to fit text + minimal padding.** PowerPoint reveals shape bounds when they overlap (selection halos, Z-order conflicts), and an oversized box can visually cross the footer rail even when the text inside doesn't. Compute box height from text metrics + ~0.05" pad, not from generous wrappers.

**Preserve italic / em explicitly:**

```python
def add_run(p, text, font, size_pt, italic=False, bold=False, color=None):
    r = p.add_run()
    r.text = text
    r.font.name = font
    r.font.size = Pt(size_pt)
    r.font.italic = italic
    r.font.bold = bold
    if color:
        r.font.color.rgb = color
    return r
```

When walking HTML, detect `<em>` / `<i>` / inline style `font-style: italic` and pass `italic=True`. Use the EN serif face (Playfair Display, Source Serif, or fallback Georgia) for italic display copy — the CJK serif typically has no italic and looks broken if you try to italicize it.

For deeper font issues that the layout rails can't catch — variable-font traps where PowerPoint silently swaps to Calibri / Microsoft JhengHei, missing `<a:ea>` slot causing CJK runs to fall back, fake-italic on Han characters — read `references/font-discipline.md`. The five layers there cover everything `verify_layout.py` can't see.

### Step 5 — Verify post-export

After writing the new `.pptx`, run `scripts/verify_layout.py <path-to.pptx>`. The script:

- Walks every shape on every slide.
- Asserts `top + height ≤ CONTENT_MAX_Y` for content shapes (footer/page-number shapes are allowed below the rail).
- Asserts `top + height ≤ CANVAS_H` for all shapes (no off-canvas).
- Asserts `left + width ≤ CANVAS_W` and `left ≥ 0`.
- Reports violations as a single block: slide index, shape name, observed bottom, rail.

Zero violations is the gate for "this re-export is shippable". Don't claim the audit is fixed without running the verifier — the human eye misses 1–2 mm overflow at zoom-out, the script doesn't.

---

## Output to the user

After Step 5 passes, report:

1. **Audit table** — the table from Step 3.
2. **Root causes** — 1-paragraph systemic explanation.
3. **Fix list** — terse list of what was changed and why (e.g. "hero slides switched to budget centering", "all content blocks routed through Cursor", "em runs explicitly italic").
4. **Verification** — "0 rail violations across N slides, file size X KB".
5. **Path** — absolute path to the re-exported `.pptx`.

The user is reading for two reasons: confirming the visible bugs are fixed, and trusting the systemic fix is right. Cover both.

---

## Bundled resources

- `scripts/extract_pptx.py` — dump every shape on every slide as JSON. Run before the audit. **Important:** also run on the *original* export to compare, and on the *re-exported* one to confirm.
- `scripts/verify_layout.py` — post-export rail checker. Returns nonzero exit code on violations so it slots into a CI pipeline if needed.
- `references/layout-discipline.md` — the full footer-rail + cursor-flow rule set with code snippets for each common slide type (hero, content, pipeline, two-column, observation grid).
- `references/font-discipline.md` — five-layer font audit: mapping, presence, variable-vs-static traps, the three XML language slots (`latin` / `ea` / `cs`), CJK + Latin italic interaction.
- `references/audit-table-template.md` — copy-pasteable table template with severity legend.

Read the references when:

- The deck has slide types beyond what the SKILL.md covers (multi-column dashboards, embedded images, charts) → `layout-discipline.md`.
- The audit shows 🟡 typography issues — italic missing, CJK falling back, unexpected `Calibri` / `Microsoft JhengHei` in the XML → `font-discipline.md`.
- You want to drop the audit table directly into a report or markdown deliverable → `audit-table-template.md`.

---

## Anti-patterns to avoid

- **Patching individual slides without naming the systemic cause.** If you fix slide 5 by lowering its block by 0.2", you'll be back fixing slide 9, 11, and 14 next. Find the rule that produced all four problems.
- **Trusting the original export script's intent.** Always run the extractor against the actual file. Drift between intent and reality is the bug.
- **Skipping verification because "it looked fine in PowerPoint preview".** Preview anti-aliasing hides 1–2 mm overflows. The script doesn't.
- **Italicizing scripts that have no italic tradition.** CJK, Arabic, Hebrew, Devanagari, Thai, and Khmer all produce a synthesized slant when forced into `italic=True`, and the result looks mechanically deformed. Italicize *only* runs whose primary script supports italic — Latin, Cyrillic, Greek. See `references/font-discipline.md` Layer 5 for the implementation pattern.
- **Using `MARGIN_TOP` for hero slides.** Hero slides need *budget centering*, not top-anchored. This is the most common hero defect and the cheapest to fix.

---

## Why geometry-based verification, not visual diff

An earlier iteration of this skill leaned on visual diffing — render the
.pptx through Keynote → PDF → PNG, screenshot the HTML through Chrome
headless, stitch them side-by-side with `magick`. It worked, but with
three sharp drawbacks:

- **Platform lock-in.** Keynote AppleScript is macOS-only; `magick` and
  font-discovery commands vary across OSes; CI pipelines on Linux can't
  reproduce the chain.
- **Imprecision.** A 1-2 mm overflow gets anti-aliased away in a PNG
  preview. The human eye misses it; the script catches it as a hard
  numeric violation.
- **Setup cost.** Every contributor needs the full graphics toolchain
  installed before they can audit. Geometry checks need only
  `python-pptx`.

Geometry-based verification gives up one thing the visual diff is good
at: catching cases where shape positions are correct but the rendered
glyph looks wrong (font fallback, kerning bugs, missing weight). When
that case appears, fall back to a manual screenshot review — the
five-layer audit in `references/font-discipline.md` covers most of the
underlying causes.


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

