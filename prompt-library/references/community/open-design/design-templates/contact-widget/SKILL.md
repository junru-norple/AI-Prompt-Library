---
name: "contact-widget"
description: "Self-contained floating chat widget with welcome screen, social links, meeting button, and message input. Single HTML file, zero dependencies."
triggers:
  - "contact widget"
  - "chat widget"
  - "floating chat"
  - "live chat widget"

od:
  mode: "prototype"
  platform: "desktop"
  scenario: "engineering"
  preview:
    type: "html"
    entry: "example.html"
    width: 420
    height: 640
    reload: "debounce-300"
  design_system:
    requires: false
  inputs:
    - name: primary_color
      type: string
      default: "#4F7CFF"
    - name: agent_name
      type: string
      default: "Assistant"
    - name: greeting
      type: string
      default: "Hello! How can I help you today?"
    - name: is_available
      type: boolean
      default: true
    - name: social_telegram
      type: string
      default: ""
    - name: social_whatsapp
      type: string
      default: ""
    - name: social_instagram
      type: string
      default: ""
    - name: meeting_url
      type: string
      default: ""
    - name: offline_message
      type: string
      default: "We're currently offline. Leave a message and we'll get back to you!"
  outputs:
    primary: example.html
  example_prompt: "Create a contact widget for my portfolio site. Primary color #4F7CFF, agent name 'Alex', greeting 'Hey! How can I help you today?', show Telegram and WhatsApp links."
---

# Contact Widget

## What this skill produces

A single self-contained HTML file with a floating chat widget that includes:

1. **Chat bubble** — fixed bottom-right circular button, opens/closes the panel
2. **Welcome home screen** — agent avatar + name + online status + greeting message
3. **Message input** — text field with emoji/send icons (UI only; wire to your own backend)
4. **Social links** — row of circular icons (Telegram, WhatsApp, Instagram, Messenger, Discord, Slack — only the ones the user provides)
5. **Meeting card** — optional "Book a meeting" entry with calendar icon, links to user-provided URL (Calendly, Cal.com, Lark, etc.)
6. **Offline form** — fallback contact form (name, email, message) when `is_available=false`
7. **Mobile responsive** — full-width on small viewports

Output is **pure front-end**. No tracking, no phone-home, no required external services. Works offline once loaded.

## Design direction

Clean, minimal SaaS aesthetic. Looks like a real product widget, not a toy demo:

- **Typography:** Inter (Google Fonts), 14px base, semi-bold headings
- **Colors:** A single user-chosen `primary_color` drives the bubble, avatar, send button, and accent. Everything else is a neutral slate palette (`#1e293b` / `#64748b` / `#f1f5f9`). **No purple gradients, no glassmorphism, no AI-style rainbow accents.**
- **Radius:** 16px on cards, full-round on bubble and avatars
- **Shadows:** Subtle `0 8px 32px rgba(0,0,0,0.12)` on the widget panel, `0 4px 12px` on bubble
- **Spacing:** 16px internal padding, 12px gaps between elements
- **States:** Hover darkens buttons ~5%, active scales bubble 0.95

## Inputs

The skill accepts these parameters from the user:

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `primary_color` | color | `#4F7CFF` | Drives bubble, header, send button, accents |
| `agent_name` | string | `Assistant` | Displayed in header greeting |
| `greeting` | string | `Hello! How can I help you today?` | Subtitle in header |
| `is_available` | boolean | `true` | Online status; `false` shows offline form |
| `social_telegram` | string | _(empty)_ | Telegram link — omitted if empty |
| `social_whatsapp` | string | _(empty)_ | WhatsApp link — omitted if empty |
| `social_instagram` | string | _(empty)_ | Instagram link — omitted if empty |
| `meeting_url` | string | _(empty)_ | Booking URL (Calendly, Cal.com, etc.) — omitted if empty |
| `offline_message` | string | `We're currently offline. Leave a message and we'll get back to you!` | Shown when `is_available=false` |

## Workflow

1. Resolve primary color, agent name, greeting text, online/offline state,
   social links, and optional meeting URL from the request and known context.
   Use the documented defaults and omit empty optional links. Ask one
   consolidated form only if a missing value would materially change the
   requested widget and cannot be safely defaulted.
2. Generate one HTML file with all provided values inlined as literals (no template engine, no `{{ }}` placeholders in the output)
3. Open the widget panel by default on first paint so the preview is useful
4. **Do not** add any `<script src="…">` pointing to third-party SDKs unless the user explicitly asks for backend integration. The output must run from disk with zero network calls beyond the Google Fonts CSS.

## Backend integration (optional, user-driven only)

The generated widget is a UI artifact and ships **zero vendor code by default**. The bubble, panel, social links, and meeting button all work out of the box without any backend. Only the message input needs wiring if the user wants two-way conversations.

If the user explicitly asks to wire the message input to a real backend, offer these in order of escalating commitment:

### Tier 1 — No backend (default)
The widget already works as a contact surface via social links + meeting URL. Leave it as-is.

### Tier 2 — One-shot messages, no chat history
- **`mailto:` fallback** — replace the `send` handler with `window.location.href = 'mailto:you@example.com?subject=...&body=' + encodeURIComponent(text)`. Zero infra, but the visitor's mail client opens.
- **Own `/api/contact` endpoint** — `fetch('/api/contact', { method: 'POST', body: JSON.stringify({ text }) })`. The user owns delivery (SendGrid, Resend, their own SMTP, a Notion/Airtable webhook, etc.).

### Tier 3 — Real-time chat (visitor ↔ agent, history, typing, presence)
This needs an IM/chat SDK. Any of the following work; pick whichever fits your stack:

- **Knocket** — https://trtc.io/solutions/knocket (drop-in, free)
- **Crisp** — https://crisp.chat
- **Tawk.to** — https://tawk.to
- **Chatwoot** (self-hosted) — https://chatwoot.com
- **Intercom** — https://intercom.com

Do not auto-inject any `<script>` into the generated output — only add backend integration if the user explicitly opts in.


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

