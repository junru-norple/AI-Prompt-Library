---
name: frontend-design
description: |
  Create distinctive, production-grade frontend interfaces with strong visual direction, polished typography, considered layout, and working HTML/CSS/JS or framework code. Use for websites, landing pages, dashboards, React components, application screens, and UI beautification.
triggers:
  - "frontend design"
  - "ui design"
  - "ux design"
  - "web design"
  - "production ui"
  - "landing page"
  - "dashboard design"
  - "react component design"
license: Complete terms in LICENSE.txt
od:
  mode: prototype
  category: web-artifacts
  craft:
    requires: [typography, color, anti-ai-slop]
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Design and build a production-quality SaaS analytics dashboard for a finance team, with real interaction states, refined typography, and a distinctive visual direction."
  upstream: "https://github.com/anthropics/skills/tree/main/skills/frontend-design"
---

# frontend-design

> Adapted from Anthropic's official `frontend-design` skill for Open Design.

Use this skill when the user asks to build or improve a frontend interface: a website, landing page, dashboard, application screen, HTML/CSS artifact, React/Vue/Svelte component, or a visual redesign of an existing UI.

The goal is not just "make it nicer." The goal is to ship working frontend code with a clear design point of view, strong craft, and enough product detail that the result feels designed for the user's actual context.

## Workflow

1. Understand the brief before choosing the look.
   - Identify the audience, primary job, domain, and emotional tone.
   - Note any technical constraints: framework, existing styles, accessibility, performance, export target, or responsive requirements.
   - If the repo already has design tokens, components, screenshots, or a `DESIGN.md`, use those as the source of truth.

2. Commit to one specific aesthetic direction.
   - Pick a direction that fits the product: brutally minimal, editorial, luxury, playful, industrial, retro-futuristic, dense operational, calm enterprise, artful consumer, or another precise direction.
   - Make the direction concrete through typography, spacing, color, hierarchy, motion, and component shape.
   - Avoid generic AI defaults: purple-blue gradients, vague glass cards, interchangeable SaaS layouts, over-rounded cards, stock icon rows, and decorative blobs that do not serve the interface.

3. Design the real interface, not a placeholder poster.
   - Include the controls, empty/loading/error states, tables, filters, navigation, and responsive behavior a real user would expect.
   - Use honest content. If data is unknown, label it as sample, pending, or unavailable instead of inventing claims.
   - Keep workflows efficient for the target user. Dashboards and tools should be scannable and dense enough for repeated use; marketing pages can be more expressive.

4. Build production-grade frontend code.
   - Prefer the repository's existing framework, component conventions, icons, tokens, and styling approach.
   - For standalone artifacts, create self-contained HTML/CSS/JS unless the user asked for a framework.
   - Use semantic markup, keyboard-accessible controls, visible focus states, sensible contrast, and responsive layout constraints.
   - Use CSS variables for repeated colors, spacing, shadows, and type scale.

5. Refine visual craft.
   - Typography: choose expressive but readable type pairings. Avoid using default system stacks as the main visual idea unless the direction is intentionally utilitarian.
   - Color: create a balanced palette with role clarity. Use accent color sparingly and deliberately.
   - Layout: use alignment, rhythm, density, and negative space intentionally. Do not let cards, panels, or labels drift.
   - Motion: add purposeful transitions for state changes, reveals, and feedback. Prefer transforms and opacity for performance.
   - Details: use texture, borders, shadows, dividers, media, and iconography only when they support the concept.

6. Self-review before final delivery.
   - The interface works at mobile and desktop widths.
   - Text fits its containers and does not overlap adjacent UI.
   - Interactive elements have hover/focus/active/disabled states.
   - The design avoids obvious AI-generated visual tropes.
   - The result has one memorable quality a user could describe after closing the page.

## Open Design Integration

When Open Design provides an active design system, treat it as the product's brand contract. Use the injected color, typography, layout, and component guidance first, then apply this skill's frontend craft rules where the design system is silent.

When Open Design injects craft references such as `typography`, `color`, and `anti-ai-slop`, apply those checks before finishing. If the user's brand guidance conflicts with a generic craft rule, the user's brand guidance wins.

## Source

- Upstream: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Category: `web-artifacts`

## License

This skill is adapted from Anthropic's official skills repository. See `LICENSE.txt` in this folder for the upstream Apache-2.0 license terms.


---

## 授權與來源附錄 / License and provenance appendix

本附錄保留完整上游授權；附錄前的正文原段未因本次通知補齊而改寫。
The complete upstream notices follow; adding this appendix does not rewrite the preceding body.

### prompt-library/references/community/open-design/skills/frontend-design/LICENSE.txt

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
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

