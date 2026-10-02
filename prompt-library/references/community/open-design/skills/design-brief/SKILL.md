---
name: design-brief
description: |
  Parse a structured design brief written in I-Lang protocol format into a
  concrete design spec. Eliminates ambiguity from vague requests like
  "make it professional" by requiring explicit dimensions: palette, typography,
  layout, mood, density, and constraints.
  Trigger keywords: "design brief", "create a design brief", "ilang brief", "structured brief".
triggers:
  - "design brief"
  - "create a design brief"
  - "ilang brief"
  - "structured brief"
od:
  mode: design-system
  platform: desktop
  scenario: planning
  preview:
    type: html
    entry: brief-preview.html
    reload: debounce-100
  design_system:
    requires: false
    generates: true
    sections: [visual-theme, color-palette, typography, component-stylings, layout, depth-elevation, dos-and-donts, responsive, agent-prompt-guide]
  inputs:
    - name: brief
      type: string
      required: true
      description: "I-Lang formatted design brief or natural language description"
  outputs:
    primary: DESIGN.md
    secondary: brief-preview.html
  capabilities_required:
    - file_write
---

# Design Brief Skill

Parse a structured design brief into a concrete DESIGN.md and optional visual preview. Agent, follow this workflow exactly.

## Background

The 8 dimensions in this skill were derived from Open Design's original 71-system catalog; 71 is the research sample, not the current bundled-system count. Every `DESIGN.md` in `design-systems/` still resolves at minimum: color palette, accent, typography, display font, layout model, and component style. We distilled these into 8 orthogonal dimensions that cover the decisions a designer makes before any pixel is placed. Mood and density were added because they are the two most common sources of ambiguity in natural language briefs ("make it clean" means different things to different people).

Dimensions intentionally excluded from the brief level: animation timing, responsive strategy, and accessibility contrast. These are enforced at the template level by individual skills (e.g., `saas-landing` handles its own responsive logic), though the generated DESIGN.md includes sensible breakpoint defaults for downstream consumption.

## 1. Accept input

The user provides a design brief in one of two formats:

### Option A: I-Lang structured brief

```
[PLAN:@DESIGN|type=saas_landing]
  |palette=navy_and_white|accent=coral
  |typography=inter|display=space_grotesk
  |layout=single_column|max_width=1200px
  |mood=professional_minimal
  |density=spacious|section_gap=96px
  |hero=headline+subhead+cta
  |sections=features,pricing,testimonials,footer
  |exclude=animations,parallax,gradients
  |responsive=mobile_first
```

### Option B: Natural language

> "I need a landing page for a developer tool. Clean, minimal, dark mode. Inter font. No flashy animations."

If the user provides Option B, convert it to the structured format using the mapping table below, then proceed. Identify every dimension explicitly stated and flag dimensions that were left unspecified.

### Natural language → I-Lang mapping

For each sentence in the natural language input, identify dimension keywords and map to the closest structured value:

| Natural language phrase | Dimension | I-Lang value |
|------------------------|-----------|-------------|
| "dark mode", "dark theme" | palette | `monochrome_dark` |
| "light", "white background" | palette | `light_clean` |
| "earthy", "warm tones" | palette | `earth_tones` |
| "pop of color", "vibrant" | accent | `electric_blue` (default) or `coral` |
| "subtle accent" | accent | `muted_sage` (default) or `slate` |
| "clean", "minimal", "simple" | mood | `professional_minimal` |
| "playful", "fun", "friendly" | mood | `playful` |
| "bold", "brutalist", "raw" | mood | `brutalist` |
| "editorial", "magazine-like" | mood | `editorial` |
| "spacious", "lots of whitespace" | density | `spacious` |
| "compact", "dense", "information-rich" | density | `compact` |
| "Inter", "system font" | typography | `inter` (default) or `system_ui` |
| "serif", "traditional" | typography | `georgia` (default) or `playfair` |
| "monospace", "code-like" | typography | `jetbrains_mono` |
| "no animations", "static" | exclude | `animations` |
| "no gradients" | exclude | `gradients` |
| "no stock photos" | exclude | `stock_photos` |
| "single page" | layout | `single_column` |
| "two columns", "sidebar" | layout | `two_column` |
| "mobile first" | responsive | `mobile_first` |

When a phrase maps to multiple dimensions (e.g. "clean dark landing page" → mood=professional_minimal + palette=monochrome_dark + layout=single_column), resolve each dimension independently. When multiple values are listed for a single mapping, the first is the default; the agent may select the alternative only if surrounding context strongly favors it.

## 2. Validate dimensions

Every design brief must resolve these 8 dimensions. If any are missing from the input, select sensible defaults using the rules in Section 2.2.

The values listed below form a closed vocabulary. Only values in this table have concrete token mappings in Section 2.1. If the user provides a value not listed here, the agent must prompt for clarification rather than guessing.

| # | Dimension | Key | Example values |
|---|-----------|-----|---------------|
| 1 | Color palette | `palette` | navy_and_white, earth_tones, monochrome_dark, light_clean |
| 2 | Accent color | `accent` | coral, electric_blue, emerald, muted_sage |
| 3 | Body typography | `typography` | inter, system_ui, dm_sans, georgia |
| 4 | Display typography | `display` | space_grotesk, clash_display, same_as_body, playfair |
| 5 | Layout model | `layout` | single_column, two_column, asymmetric |
| 6 | Mood | `mood` | professional_minimal, playful, brutalist, editorial |
| 7 | Density | `density` | compact, balanced, spacious |
| 8 | Constraints | `exclude` | animations, gradients, stock_photos, carousel |

### 2.1 Symbolic → concrete token resolution

Each symbolic value maps to concrete design tokens. The agent must resolve these before writing DESIGN.md:

| Symbolic value | Concrete tokens |
|---------------|----------------|
| `palette=navy_and_white` | Background: #0F172A, Surface: #1E293B, Text: #F8FAFC, Secondary: #94A3B8 |
| `palette=monochrome_dark` | Background: #09090B, Surface: #18181B, Text: #FAFAFA, Secondary: #A1A1AA |
| `palette=light_clean` | Background: #FFFFFF, Surface: #F8FAFC, Text: #0F172A, Secondary: #64748B |
| `palette=earth_tones` | Background: #FFFBEB, Surface: #FEF3C7, Text: #451A03, Secondary: #92400E |
| `accent=coral` | Accent: #F97316, Hover: #EA580C |
| `accent=electric_blue` | Accent: #3B82F6, Hover: #2563EB |
| `accent=emerald` | Accent: #10B981, Hover: #059669 |
| `accent=muted_sage` | Accent: #84A98C, Hover: #6B8F73 |
| `accent=slate` | Accent: #64748B, Hover: #475569 |
| `typography=inter` | Body: Inter, 400, 1rem/1.6 |
| `typography=system_ui` | Body: system-ui, 400, 1rem/1.6 |
| `typography=dm_sans` | Body: DM Sans, 400, 1rem/1.6 |
| `typography=georgia` | Body: Georgia, 400, 1.125rem/1.7 |
| `display=space_grotesk` | Display: Space Grotesk, 700, clamp(2rem, 5vw, 3.5rem) |
| `display=clash_display` | Display: Clash Display, 700, clamp(2rem, 5vw, 3.5rem) |
| `display=playfair` | Display: Playfair Display, 700, clamp(2rem, 5vw, 3.5rem) |
| `display=same_as_body` | Display inherits body font family, weight 600 |
| `density=compact` | Section spacing: 48px, Content padding: 16px/24px |
| `density=balanced` | Section spacing: 72px, Content padding: 24px/40px |
| `density=spacious` | Section spacing: 96px, Content padding: 24px/48px |

Symbolic values not in this table are not valid. If the user provides an unrecognized value (e.g., `palette=ocean_blue`), the agent must prompt for clarification: "I don't recognize `palette=ocean_blue`. Did you mean `navy_and_white`, `monochrome_dark`, `light_clean`, or `earth_tones`?"

### 2.2 Default resolution rules

When a dimension is unspecified, defaults are selected based on mood compatibility:

| Unspecified dimension | Default rule |
|----------------------|-------------|
| `palette` | If mood=editorial → `light_clean`. If mood=brutalist → `monochrome_dark`. Otherwise → `light_clean`. |
| `accent` | If palette is dark → `coral`. If palette is light → `electric_blue`. |
| `typography` | Always → `inter` (highest cross-platform legibility). |
| `display` | If mood=editorial → `playfair`. If mood=brutalist → `space_grotesk`. Otherwise → `same_as_body`. |
| `layout` | Always → `single_column` (safest responsive default). |
| `mood` | Always → `professional_minimal` (least opinionated). |
| `density` | Always → `balanced`. |
| `exclude` | Always → none (no constraints unless specified). |

If mood is also unspecified, all defaults fall back to the safe neutral set: `palette=light_clean`, `accent=electric_blue`, `typography=inter`, `display=same_as_body`, `layout=single_column`, `mood=professional_minimal`, `density=balanced`, `exclude=none`.

## 3. Generate DESIGN.md

This skill generates a new DESIGN.md from scratch based on the resolved brief dimensions. If a DESIGN.md already exists in the working directory, the agent should ask the user whether to overwrite or skip.

Produce a DESIGN.md using the nine-section outline below. This outline is the
skill's portable standalone output, inherited from Open Design's original
upstream baseline; it is not the current repository package schema. Current
bundled packages also carry `manifest.json`, `tokens.css`, and optional rich
resources, while legacy and user-installed `DESIGN.md`-only content remains
readable. All color hex values, font stacks, and spacing values must come from
the resolved tokens in Section 2.1 — do not invent values outside the
resolution table.

```markdown
# [Project Name] Design System

## Visual Theme & Atmosphere
- Mood: [resolved from mood]
- Feel: [derived from mood — e.g., professional_minimal → "Clean, confident, restrained"]
- References: [if mood=editorial → "Magazine layouts, Monocle, Cereal"; if mood=brutalist → "Exposed structure, raw typography"]

## Color Palette & Roles
- Background: [resolved from palette]
- Surface: [resolved from palette]
- Text primary: [resolved from palette]
- Text secondary: [resolved from palette]
- Accent: [resolved from accent]
- Accent hover: [resolved from accent]

## Typography Rules
- Display: [resolved from display], 700, clamp(2rem, 5vw, 3.5rem)
- Body: [resolved from typography], 400, 1rem/1.6
- Mono: JetBrains Mono, 400, 0.875rem

## Component Stylings
- Buttons: [if mood=playful → "rounded-full", otherwise → "rounded-md"], accent bg, contrast text
- Cards: surface bg, subtle border, 12px radius
- Inputs: [if mood=brutalist → "thick border", otherwise → "transparent bg, bottom border"]

## Layout Principles
- Max width: 1200px
- Grid: [resolved from layout]
- Section spacing: [resolved from density]
- Content padding: [resolved from density]

## Depth & Elevation
- Shadows: [if mood=brutalist → "hard 4px offset", if mood=professional_minimal → "none", otherwise → "subtle sm"]
- Borders: 1px solid [derived from palette, 8% opacity of text color]

## Do's and Don'ts
- DO use the declared color tokens exclusively.
- DO maintain consistent section spacing.
- DO ensure all text meets WCAG AA contrast ratio.
- DON'T invent colors outside the palette.
- DON'T add decorative shadows unless Depth & Elevation allows them.
- DON'T use more than 2 display/body typefaces (monospace is a utility face for code and data — it does not count toward this limit).

## Responsive Behavior
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Mobile: single column, stack all sections vertically
- Tablet: allow 2-column feature grids
- Desktop: full layout with max-width constraint
- Images: fluid, max-width 100%, maintain aspect ratio

## Agent Prompt Guide
- Do NOT invent colors outside this palette.
- Do NOT add box-shadows unless specified above.
- Accent color appears maximum 3 times per viewport.
- All interactive elements need :focus-visible outline.
- [if exclude contains items → list each as "Do NOT use {item}."]
```

## 4. Generate brief-preview.html

Create a single HTML file that visually renders the resolved design tokens. The preview must contain these 4 sections in order:

1. **Color palette swatches** — A horizontal row of rectangles, each showing one color from the Color section. Label each with its role (Background, Surface, Text, Accent) and hex code.
2. **Typography specimens** — Three text blocks showing Display, Body, and Mono fonts at their declared sizes. Use a sample sentence ("The quick brown fox...") for each.
3. **Spacing ruler** — A visual ruler or stacked bars showing section spacing and content padding values, labeled with their px values.
4. **Component preview** — Render 2–3 live components (a primary button, a card with title/body, a text input) using the resolved tokens. These should be functional HTML/CSS, not screenshots.

Style the preview itself with the resolved design system tokens (background color, font, spacing). The preview should look like a design system documentation page.

## 5. Report unspecified dimensions

At the end of output, list any dimensions the user did not specify and the defaults that were applied, including the rule that selected each default:

```
Dimensions resolved from defaults:
- display: set to "same_as_body" (rule: mood=professional_minimal → same_as_body)
- density: set to "balanced" (rule: static fallback, no spacing preference given)
- exclude: set to "none" (rule: no constraints unless specified)
```

This transparency prevents silent assumptions from propagating into the final design.


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

