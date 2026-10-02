---
name: tweaks
description: |
  Wrap any HTML artifact with a side panel of live, parameterized
  controls — accent color, type scale, density, motion, theme — that
  rewrite CSS custom properties in real time and persist to
  localStorage. Lets the user explore variants of a design without
  re-prompting the agent. Use when the brief asks for "variants",
  "side-by-side options", "tweak this", "let me adjust", "live
  knobs", or "实时调参".
triggers:
  - "tweaks"
  - "variants"
  - "tweak panel"
  - "live controls"
  - "adjust on the fly"
  - "实时调参"
  - "可调参数面板"
  - "side panel"
  - "knobs"
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
  example_prompt: "Wrap this landing page with a tweak panel — accent color, type scale, density, light/dark — persist to localStorage so the user can refresh without losing their choice."
---

# Tweaks Skill · 参数化变体面板

Wrap any HTML artifact with a side panel of live controls that rewrite
CSS custom properties in real time and persist to `localStorage`.
Inspired by the *huashu-design* tweak pattern.

## What you produce

A single self-contained HTML file with two layers:

1. **Stage** — the original artifact (landing page / deck / dashboard)
   re-keyed so all visual decisions read from CSS custom properties:
   `--accent`, `--scale`, `--density`, `--mode`, `--motion`.
2. **Panel** — a fixed sidebar (or drawer on small viewports) with
   form controls bound to those custom properties via a tiny
   vanilla-JS bridge. Persists every change to `localStorage` keyed
   by the artifact identifier.

The user can:

- Open the artifact and see the stage rendered with their saved
  preferences (or sensible defaults).
- Adjust accent / scale / density / mode / motion in the panel and
  watch the stage update instantly — no rerender.
- Press <kbd>T</kbd> to hide / reveal the panel; <kbd>R</kbd> to
  reset to defaults.
- Refresh the page — every choice is persisted.

## When to use

- The user generated something they like 80% of, and wants to dial
  in the last 20% themselves.
- You're presenting a design system / brand and want the audience to
  feel the variants live (instead of you re-running the agent).
- You're shipping a stand-alone demo (e.g. a portfolio piece) and
  want viewers to play.

## When *not* to use

- One-shot artifacts that won't be iterated on (e.g. a runbook —
  parameters don't help).
- When the artifact's value is in fixed ratios (e.g. an infographic
  with carefully balanced data viz — knobs would degrade it).

## The 5 standard knobs

> Pick a subset that suits the artifact. Don't ship all 5 if only 2
> matter — clutter is a regression.

### 1. `--accent` — Accent color

A select with 5–8 curated swatches (don't ship a free color picker —
the user will pick a bad color and blame you).

```js
const ACCENT_PRESETS = [
  { id: 'rust',    val: '#c96442', label: 'Rust' },
  { id: 'cobalt',  val: '#2c4d8e', label: 'Cobalt' },
  { id: 'sage',    val: '#4a7a3f', label: 'Sage' },
  { id: 'plum',    val: '#7a3f6a', label: 'Plum' },
  { id: 'graphite',val: '#3a3a3a', label: 'Graphite' },
];
```

The artifact uses `var(--accent)` everywhere it had a hard-coded
accent before. Border / link / pull-quote rule / CTA all flip
together.

### 2. `--scale` — Type scale (0.85 / 1.0 / 1.15)

Three settings: *Compact* (0.85), *Normal* (1.0), *Generous* (1.15).
All `font-size` declarations multiply by `var(--scale)` via
`calc(... * var(--scale))`.

Don't go beyond ±15% — beyond that the layout breaks (column flow,
breakpoints, line counts).

### 3. `--density` — Layout density (Tight / Normal / Roomy)

Three settings that swap the spacing scale: *Tight* (0.75) /
*Normal* (1.0) / *Roomy* (1.4). All `padding` / `gap` / `margin`
declarations multiply by `var(--density)`.

This is the highest-impact knob — it's also the most fragile, so
**every layout-critical container must declare its base spacing in
custom properties** before you wrap.

### 4. `--mode` — Light / Dark

A 2-state toggle. Sets `data-mode="light"` vs `"dark"` on the
`<html>` element and the artifact's `:root` selector responds with
two color sets.

If the artifact already has a media-query-based dark mode, *replace*
it with the data-attr version — the user's choice should win over
their OS.

### 5. `--motion` — Off / Subtle / Lively

Three settings. Maps to a CSS variable `--motion-mult` that scales
all `transition-duration` / `animation-duration` declarations:

- *Off* — `0s` (also disables WebGL canvases / decorative animation).
- *Subtle* — `1.0` (the artifact's authored timing).
- *Lively* — `1.6` (slower transitions, more visible motion).

Respect `prefers-reduced-motion`: default to *Off* if the user has
that set, regardless of stored preference.

## Host integration contract (REQUIRED)

The Open Design viewer toolbar has a **Tweaks** toggle that drives panel
visibility from outside the iframe. For the toggle to bind to your panel,
your artifact **must** speak one of these two protocols (pick one; don't
mix). The toolbar enables itself the moment it sees either signal.

### Protocol A — postMessage (recommended for agent-generated artifacts)

Use this when the panel mounts via JS (React, vanilla, anything dynamic).

**Artifact → host:**
- On mount, post `{ type: '__edit_mode_available', visible?: boolean }` to
  `window.parent`. Tells the toolbar a panel exists; the optional `visible`
  reports the panel's initial state so the toolbar toggle starts in sync.
  Omit `visible` for the common "panel is already on screen" case (the host
  treats a missing field as `true` so the legacy zero-arg message keeps
  working). Pass `visible: false` to declare a default-closed panel.
- When the user closes the panel locally (× button, Esc, etc.), post
  `{ type: '__edit_mode_dismissed' }`. Toolbar flips to "off".

**Host → artifact:**
- `{ type: '__activate_edit_mode' }` — open the panel (`setOpen(true)`).
- `{ type: '__deactivate_edit_mode' }` — close the panel (`setOpen(false)`).

Minimal listener:

```js
window.addEventListener('message', (e) => {
  const t = e?.data?.type;
  if (t === '__activate_edit_mode') setOpen(true);
  else if (t === '__deactivate_edit_mode') setOpen(false);
});
// Or, for a default-closed panel:
//   window.parent.postMessage({ type: '__edit_mode_available', visible: open }, '*');
window.parent.postMessage({ type: '__edit_mode_available' }, '*');
// in your close handler:
const dismiss = () => {
  setOpen(false);
  window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
};
```

Panel may default to open or closed — the host syncs its toggle to
whichever state the artifact reports.

### Protocol B — class-based (used by `assets/wrap.html`)

Use this only when you wrap the template verbatim. The artifact ships a
`.tw-panel` element and toggles a `.tw-hidden` class for visibility. The
viewer's iframe bridge (in `apps/web/src/runtime/srcdoc.ts`) hides the
panel on initial paint, watches the class via `MutationObserver`, and
relays state both directions. No JS required in the artifact beyond what
the template already includes.

Selectors are fixed: `.tw-panel` (the panel root) and `.tw-hidden` (the
hidden state). If you rename either, the bridge can't find it.

### Anti-pattern

Don't invent a third protocol or rename either set of identifiers. The
toolbar toggle only binds to A or B. Custom panels with custom classes
and no postMessage will leave the toolbar greyed out.

## Implementation primitives

Read `assets/wrap.html` — it ships the panel + bridge as an
inert template. Your job is to:

1. Take the user's existing artifact HTML.
2. Lift its accent / mode / spacing / scale into custom properties
   (search for hard-coded `#hex` / `Npx` / `Nrem` and convert).
3. Paste the contents into the marked region of `wrap.html`.
4. Edit `assets/wrap.html`'s `KNOBS` array to keep only the knobs
   you decided are relevant to *this* artifact. Don't ship 5 if 2
   matter.
5. Patch the `STORAGE_KEY` to a unique slug (`tweaks-<artifact-slug>`).

The bridge in `wrap.html`:
- Loads `localStorage[STORAGE_KEY]` JSON on first paint.
- Applies values as `document.documentElement.style.setProperty('--accent', ...)`.
- Listens to every form control's `change` event and writes back.
- Exposes <kbd>T</kbd> (toggle panel) and <kbd>R</kbd> (reset).

## Workflow

### Step 1 — Acquire the artifact

Same options as the critique skill:

1. Project file (`index.html` in the project folder).
2. Pasted HTML in the chat.
3. Generated by you in this turn.

### Step 2 — Decide which knobs apply

Read the artifact's CSS first. For each knob, decide *yes / no*:

- `--accent` — yes if the artifact has 1 accent color used ≥ 3 times.
- `--scale` — yes if the artifact is type-driven (article, deck,
  pricing page).
- `--density` — yes if the artifact has consistent gap / padding
  rhythm (deck, dashboard, landing). No for runbooks (already dense).
- `--mode` — yes if the artifact has authored dark mode tokens, or
  you're willing to derive them.
- `--motion` — yes if the artifact has any transition / animation
  worth scaling. No for static reports / critique reports.

Default: **3 knobs is the sweet spot.** Five is too busy, one is
not worth a panel.

### Step 3 — Lift hard-coded values into custom properties

Open `assets/wrap.html`'s `<style>` block — copy its custom-property
naming scheme (`--accent`, `--scale`, etc.). In the user's artifact,
find every place those concerns live and rewrite:

- `color: #c96442` → `color: var(--accent)`
- `font-size: 18px` → `font-size: calc(18px * var(--scale))`
- `padding: 24px 32px` → `padding: calc(24px * var(--density)) calc(32px * var(--density))`
- `transition: opacity 200ms` → `transition: opacity calc(200ms * var(--motion-mult))`

If the artifact uses `clamp()` or `vw` already, multiply the
*outer* value by the custom property — don't tear apart `clamp(...)`.

### Step 4 — Paste into the wrap

Copy the artifact's `<style>` and `<body>` into the marked regions
of `wrap.html`. Keep the panel + bridge intact.

### Step 5 — Test the loop

Open the result, click each knob at least once, refresh the page,
confirm the choice persists. If a knob breaks the layout —
*remove it*, don't ship it.

## Output contract

```
<artifact identifier="tweaks-<artifact-slug>" type="text/html" title="<Artifact Title> · Tweaks">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact ("Wrapped X with a 3-knob tweak
panel — accent / scale / mode."). Stop after `</artifact>`.

## Hard rules

- **Don't ship a free color picker** — only curated swatches. Users
  pick bad colors when given freedom; saving them from that is the
  whole point.
- **Persist by artifact identifier** — `tweaks-<slug>`, not a global
  key. Two artifacts open in two tabs must not share state.
- **Respect `prefers-reduced-motion`** — default to *Off* for motion
  if the user has that set, override only on explicit click.
- **Single-file** — no external CSS / JS / fonts beyond the artifact's
  existing imports. Inline the panel + bridge.
- **Panel hidden by default on viewports < 720px** — slide-in drawer
  via a "T" button at top-right.
- **Don't ship more than 5 knobs.** Three is the sweet spot.


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

