---
name: waitlist-page
description: |
  Minimal pre-launch landing with email capture, brand logo, and optional decorative layer.
  Reads DESIGN.md for colors, typography, and layout rules.
  Best for: product launches, beta signups, early access programs, indie projects.
triggers:
  - "waitlist page"
  - "coming soon page"
  - "pre-launch landing page"
  - "email capture page"
  - "launch page"
od:
  mode: prototype
  platform: desktop
  scenario: marketing
  preview:
    type: html
    entry: example.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  inputs:
    - name: product_name
      type: string
      required: true
    - name: tagline
      type: string
      required: true
    - name: bg_expression
      type: string
      description: "CSS color expression for background (e.g., '#FDE8DF' or 'rgba(...)')."
      required: true
    - name: fg_expression
      type: string
      description: "CSS color expression for text and primary shapes (e.g., '#1A1410' or 'rgba(...)')."
      required: true
    - name: accent_expression
      type: string
      description: "CSS color expression for brand badge and highlights."
      required: true
    - name: deco_expression
      type: string
      description: "CSS color expression for decoration primary."
      required: true
    - name: stripe_expression
      type: string
      description: "CSS color expression for accent stripe."
      required: true
    - name: border_expression
      type: string
      description: "CSS color expression for input borders (e.g., 'rgba(100,50,30,0.38)' or 'color-mix(in srgb, var(--fg) 38%, transparent)'). Must be valid CSS."
      required: true
    - name: success_expression
      type: string
      description: "CSS color expression for success message. Defaults to #2D6A4F if not in DESIGN.md."
      required: true
    - name: btn_label_expression
      type: string
      description: "CSS color expression for button label text (e.g., 'rgba(255,255,255,1)' or '#fff'). Ensure WCAG AA contrast."
      required: true
    - name: ticker_bg_expression
      type: string
      description: "CSS color expression for ticker background (e.g., 'rgba(0,0,0,0.9)'). Must be valid CSS."
      required: true
    - name: ticker_fg_expression
      type: string
      description: "CSS color expression for ticker text (e.g., 'rgba(255,255,255,0.9)'). Ensure contrast."
      required: true
    - name: deco_stroke_expression
      type: string
      description: "CSS color expression for SVG strokes (e.g., 'rgba(0,0,0,0.12)'). Typically a muted foreground or neutral."
      required: true
    - name: logo_shadow_expression
      type: string
      description: "CSS color expression for logo container shadow (e.g., 'rgba(0,0,0,0.08)'). Typically a subtle foreground shade."
      required: true
    - name: logo_fg_expression
      type: string
      description: "CSS color expression for logo text/initials (e.g., 'rgba(255,255,255,1)' or '#fff'). Ensure contrast against accent."
      required: true
    - name: logo_mark
      type: string
      description: "Text initials are HTML-escaped by default. Inline SVG is allowed only after strict allowlist-based sanitization (removing scripts, event handlers, foreignObject, and external references); unsafe input falls back to escaped text."
      required: false
    - name: display_font_url
      type: string
      description: "Display font name with spaces encoded as '+' (e.g., 'Syne', 'DM+Sans'). Used in Google Fonts URL."
      required: true
    - name: display_font_css
      type: string
      description: "Display font name as it appears in CSS (e.g., 'Syne', 'DM Sans'). Already quoted if needed; no extra quotes in template."
      required: true
    - name: body_font_url
      type: string
      description: "Body font name with spaces encoded as '+' (e.g., 'DM+Sans', 'IBM+Plex+Serif'). Used in Google Fonts URL."
      required: true
    - name: body_font_css
      type: string
      description: "Body font name as it appears in CSS (e.g., 'DM Sans', 'IBM Plex Serif'). Already quoted if needed; no extra quotes in template."
      required: true
  outputs:
    primary: index.html
  capabilities_required:
    - file_write
  example_prompt: "Make a waitlist page for a design tool — clean, minimal, with a custom logo and one call-to-action."
---

# Waitlist Page Skill

Pre-launch pages are your first handshake with future users. This skill builds a focused, honest entrance: your brand identity, what you're making, one clear path to join the early list. No artificial scarcity, no fake countdown, no inflation tactics—just a clean, mobile-first vessel for genuine interest.

## Workflow

### Preflight: Load hardened template and brand foundation

0. **Load the brand identity** — Read `DESIGN.md` for the color system, font pairing, and spatial rules. This is your foundation. A waitlist page lives or dies by consistency with the brand it represents. If `DESIGN.md` is missing, ask the user to provide one before you proceed.
1. **Read and copy the reusable template** — Read `assets/template.html`. This template is the hardened seed for all outputs. Copy it to `index.html` as your base. Do not write HTML from scratch or deviate from this structure. The template has all required layout, form structure, decorations, focus styles, and accessibility scaffolding baked in.

### Steps: Token replacement with validation and escaping

2. **Map tokens from inputs** — For each placeholder in the template (e.g., `{{PRODUCT_NAME}}`, `{{BG_EXPRESSION}}`, `{{BORDER_EXPRESSION}}`, `{{LOGO_MARK}}`), follow the replacement rules below:
   - **Text tokens** (`{{PRODUCT_NAME}}`, `{{TAGLINE}}`): HTML-escape `<`, `>`, `&`, `"`, `'` before insertion into HTML text nodes or attribute values.
   - **HTML tokens** (`{{LOGO_MARK}}`): If using text initials, HTML-escape them by default. If using inline SVG, you must strictly sanitize it using an allowlist: strip `<script>` tags, event handlers (`on*`), `<foreignObject>`, external refs (`href`, `xlink:href`, `url()`), and any disallowed attributes/elements before insertion. If the SVG cannot be safely sanitized, fallback to escaped text initials. Never emit raw, unsanitized arbitrary HTML. Ensure any SVG scales cleanly within its container.
   - **Color expression tokens** (`{{BG_EXPRESSION}}`, `{{FG_EXPRESSION}}`, `{{ACCENT_EXPRESSION}}`, `{{DECO_EXPRESSION}}`, `{{STRIPE_EXPRESSION}}`, `{{SUCCESS_EXPRESSION}}`, `{{BORDER_EXPRESSION}}`, `{{BTN_LABEL_EXPRESSION}}`, `{{TICKER_BG_EXPRESSION}}`, `{{TICKER_FG_EXPRESSION}}`, `{{DECO_STROKE_EXPRESSION}}`, `{{LOGO_SHADOW_EXPRESSION}}`, `{{LOGO_FG_EXPRESSION}}`): Must strictly adhere to an explicit color grammar (`#hex`, `rgb`/`rgba`, `hsl`/`hsla`, `oklch`, or `color-mix()` using only local variables). Hard reject any input containing `;`, `{}`, `<`, `>`, comments (`/*`), `@`, `url(`, or external refs to prevent CSS injection. Do not wrap in `#` or add extra quotes. Examples: `rgba(196, 169, 154, 0.38)`, `color-mix(in srgb, var(--fg) 38%, transparent)`, `#FDE8DF`. Insert as-is into `:root` CSS variables. Derive `--success` from DESIGN.md if present; otherwise use the allowed fallback `#2D6A4F` only.
   - **Font name tokens** (`{{DISPLAY_FONT_CSS}}`, `{{BODY_FONT_CSS}}`): These are CSS font-family values, already quoted if they contain spaces (e.g., `'DM Sans'`, `Syne`). Insert as-is into `--font-display` and `--font-body` declarations; do NOT add extra quotes.
   - **Font URL tokens** (`{{DISPLAY_FONT_URL}}`, `{{BODY_FONT_URL}}`): Spaces must be encoded as `+` for the Google Fonts URL (e.g., `DM+Sans`, `IBM+Plex+Serif`). Validate the URL is well-formed before insertion.
3. **Verify token mapping rules** — All color tokens are now in CSS variables:
   - `--bg` = `{{BG_EXPRESSION}}` (e.g., `#FDE8DF`)
   - `--fg` = `{{FG_EXPRESSION}}` (e.g., `#1A1410`)
   - `--accent` = `{{ACCENT_EXPRESSION}}` (brand badge)
   - `--deco` = `{{DECO_EXPRESSION}}` (decoration primary)
   - `--deco-stripe` = `{{STRIPE_EXPRESSION}}` (accent stripe)
   - `--input-border` = `{{BORDER_EXPRESSION}}` (full CSS expression with opacity)
   - `--success` = `{{SUCCESS_EXPRESSION}}` or `#2D6A4F` fallback
   - `--btn-label` = `{{BTN_LABEL_EXPRESSION}}` (button text color for contrast)
   - `--ticker-bg` = `{{TICKER_BG_EXPRESSION}}` (animated ticker background)
   - `--ticker-fg` = `{{TICKER_FG_EXPRESSION}}` (animated ticker text)
   - `--deco-stroke` = `{{DECO_STROKE_EXPRESSION}}` (SVG strokes, typically muted with 12–15% opacity)
   - `--logo-shadow` = `{{LOGO_SHADOW_EXPRESSION}}` (logo container shadow, subtle foreground shade)
   - `--logo-fg` = `{{LOGO_FG_EXPRESSION}}` (contrasting text color for logo initials)
4. **Responsive layout** — The template includes mobile-first scaling:
   - 375px: form stacks to single column, logo shrinks to 40px, decoration compresses, no horizontal scroll.
   - 768px: comfortable two-column breathing room.
   - 1440px+: centered layout with generous whitespace.
   - Verify all text remains readable and the email input + button are fully visible (no clipping) at 375×667 and 390×844.

### Validation: Run hardened quality gates before emitting

5. **Run the quality checklist** — Read `references/checklist.md`. Validate every **P0 gate** before emitting:
   - Exactly one CTA (email form)
   - No countdown timer, no fake social proof, no emoji
   - No horizontal scroll at 375px
   - Email input has `type="email"` and `required`; first name has no `required`
   - Form does NOT use `novalidate`; JS uses `checkValidity()` guard
   - Success message has `role="status"` or `aria-live="polite"`
   - All colors from DESIGN.md or allowed fallback; **no invented hex values**
   - All user text is HTML-escaped; color tokens adhere to strict grammar; fonts are URL-encoded
   - **Pass P0 or do not emit.** If any P0 gate fails, ask the user or fix the token mappings and try again.
6. **Verify P1 gates** for quality submission (recommended):
   - Hover and active states on submit button
   - Form validation with clear feedback
   - Ticker animation respects `prefers-reduced-motion: reduce`
   - All interactive elements have visible focus styles (input:focus includes `outline`)
   - Tab/Enter keyboard support
   - WCAG AA contrast for body text (≥4.5:1) and button label (≥4.5:1)
   - Logo alt/aria-label present; ticker has `aria-hidden="true"`
   - `<html lang="">` is set

### Output

7. **Emit clean HTML** — Single file, CSS inlined, SVG for graphics. Mark interactive elements with `data-od-id` (headline, form, logo, ticker, grid, etc.) so agents can customize without parsing.

## Quality gates

This skill enforces a hardened, template-based workflow to ensure compliance. **You must follow this execution path; deviating from the template disqualifies the output.**

**Mandatory template-based execution:**
- Read `assets/template.html` as your base; do not write HTML from scratch.
- Copy it to `index.html` and replace only the `{{PLACEHOLDER}}` tokens with validated/escaped values.
- Run every P0 gate in `references/checklist.md` before emitting; if any fail, fix and re-validate.

**P0 gates (must pass):**
- Single CTA: Email form is the only interactive element. No nav, no secondary buttons, no social links.
- Logo placement: Fixed top-left, matches DESIGN.md accent color, scales down on mobile (50px → 40px).
- Color consistency: Every color from DESIGN.md palette. Only allowed hardcoded exception: `#2D6A4F` for `--success`.
- No anti-patterns: No countdown timer, no fake social proof, no emoji icons, no lorem ipsum.
- Content integrity: Headline and copy tie directly to `product_name` and `tagline` inputs—no filler copy.
- Mobile fit: No horizontal scroll at 375px. Email input and submit button are fully visible (no clipping) at 375×667 and 390×844. Vertical overflow is scrollable, not hidden.
- Typographic discipline: Display + body fonts only (2-font rule). Consistent sizing across sections.
- Form structure: Two fields (first name optional, email required), `checkValidity()` guard, success message with `role="status"`.
- Token escaping: All user-supplied text HTML-escaped; color tokens adhere to strict grammar and contain no unsafe characters (`;`, `{}`, `<`, `>`, `/*`, `@`, `url(`); font names are URL-encoded; `{{LOGO_MARK}}` is escaped text initials or strictly sanitized inline SVG (no scripts, no event handlers, no foreignObject, no external hrefs).

**P1 gates (should pass for quality submission):**
- Hero section visually distinct and above-the-fold.
- Email submit button has hover and active states.
- Form validation provides clear feedback.
- Page scrollable (not clipped) at all mobile viewports; CTA visible without scroll.
- Ticker animation paused/removed under `prefers-reduced-motion: reduce`.
- All interactive elements have visible focus styles (outline, not just outline:none).
- Keyboard: Tab reaches each form field; Enter submits.
- WCAG AA contrast: Body text ≥4.5:1, button label ≥4.5:1.
- Logo alt/aria-label present; ticker has `aria-hidden="true"`.
- `<html lang="">` set to correct language code.

**Decoration restraint:**
- Lower zone enhances without distraction. Opacity, subtle strokes, muted animation.
- No gradient that spans more than 20% of viewport height.
- Coil, stripe, grid, or ticker all use colors from DESIGN.md only.

## Output

**Only emit after all P0 gates in `references/checklist.md` pass.**

Emit the artifact between tags:

```
<artifact identifier="waitlist-id" type="text/html" title="Coming Soon — {{PRODUCT_NAME}}">
<!doctype html>
<html lang="en">
...
</html>
</artifact>
```

One line of description above the artifact; nothing below.

**Post-emission:** If the user asks for changes, update the index.html in-place and re-run the P0 checklist gates before emitting the next version. Do not skip validation on iterations.


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

