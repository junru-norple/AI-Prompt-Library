---
name: live-artifact
description: |
  Create refreshable, auditable Open Design artifacts backed by connector or local data.
  Trigger when the user asks for live dashboards, refreshable reports, synced views, or reusable data-backed artifacts.
triggers:
  - "live artifact"
  - "live dashboard"
  - "refreshable dashboard"
  - "live report"
  - "refreshable report"
  - "synced view"
  - "可刷新"
  - "实时看板"
od:
  mode: prototype
  scenario: live
  preview:
    type: html
    entry: index.html
    reload: debounce-100
  design_system:
    requires: true
  outputs:
    primary: index.html
    secondary:
      - template.html
      - artifact.json
      - data.json
      - provenance.json
  capabilities_required:
    - shell
    - file_write
---

# Live Artifact Skill

Create an Open Design live artifact: a project-scoped, previewable HTML artifact whose data can later be refreshed without redesigning the presentation.

## Resource map

```
live-artifact/
├── SKILL.md
└── references/
    ├── artifact-schema.md      ← `references/artifact-schema.md`: artifact files, DTO shape, template binding rules
    ├── connector-policy.md     ← `references/connector-policy.md`: connector safety, redaction, credential boundaries
    └── refresh-contract.md     ← `references/refresh-contract.md`: source metadata, refresh execution, snapshots
```

## Current status

Use the references in this directory as the source of truth for the live artifact file contract. Prefer daemon wrapper commands over raw HTTP when registering or updating live artifacts.

## When to use this skill

Use this skill when the user asks for a data-backed view that should remain useful after the first render, for example a live dashboard, refreshable report, synced status page, auditable data view, or artifact that can later be refreshed from local/project data or connectors.

Before creating files, decide whether the user actually wants a live artifact or a normal static artifact:

- Use a live artifact when the user mentions refresh, sync, recurring updates, connector-backed data, source/provenance tracking, dashboards, reports, or reusable data-backed views.
- Use a normal static artifact when the user only wants a one-off HTML/mockup/image/file and does not need refresh, source metadata, or data/provenance panels.
- If the intent is ambiguous, ask one short question: “Should this be refreshable/live, or just a static artifact?”

## Workflow

1. **Resolve scope and data source without blocking on connected connectors**
   - Identify the preview goal, audience, data freshness expectations, and whether refresh should be possible later.
   - If the user explicitly names a connector/source such as Notion, GitHub, Slack, or Google Drive, do not ask “where should the data come from?” before checking daemon connector tools.
   - Prefer local/project sources or daemon connector tools when available.
   - Do not call provider APIs directly when a daemon connector/wrapper exists.
   - If connector data is needed, first list connectors with `"$OD_NODE_BIN" "$OD_BIN" tools connectors list --format compact`. If the named connector is present with `status: "connected"`, choose an appropriate read-only `auto` tool from its catalog and execute it through the connector wrapper.
   - For Notion specifically, a connected `notion` connector plus a user brief that names Notion is enough to start with `notion.notion_search` using a query derived from the requested artifact/topic. Use `notion.notion_fetch_database` only when the user supplied a database id or the search result clearly identifies one.
   - Ask the user a data-source question only when no matching connected connector exists, multiple connected candidates fit equally well, or the requested artifact has no usable topic/query to search for. If you must ask, be specific: ask for the page/database/topic or permission to search broadly, not “where is the Notion data source?”

2. **Author the source files**
   - Write `template.html` as the human-designed HTML template. The daemon hydrates it with `data.json` using the `html_template_v1` binding contract — stay inside it or hydration fails and the raw template ships with visible `{{…}}` tokens:
     - Scalars: `{{data.path.to.value}}`. Paths start with `data`, dot-separated; numeric array indexes are allowed (`{{data.kpis.0.value}}`). Every binding must resolve to a single string/number, not an object or array.
     - Lists: repeat one element with `data-od-repeat="item in data.items"`, then bind loop-scoped fields inside it as `{{item.label}}` (or `{{item}}` for a scalar array). One level only; `data.*` still works inside the repeat for globals.
     - Do NOT hand-loop in a `<script>` (scripts are stripped from previews), and do NOT reference a bare loop variable like `{{metric.value}}` without a matching `data-od-repeat` scope — that binding is unresolvable. Nested repeats, conditionals, filters, helpers, and raw/triple-brace interpolation are unsupported.
   - Write `data.json` as the canonical preview data used by those bindings — real values, not placeholders.
   - Write `artifact.json` with the live artifact metadata, preview declaration, document declaration, and safe source descriptors.
   - Write `provenance.json` with concise source notes, timestamps, non-sensitive connector references, and transformation notes.
   - Do not author `index.html` as source. The daemon derives `index.html` from `template.html` and `data.json`.

3. **Keep data compact and preview-oriented**
   - Store only normalized values needed by the preview.
   - Summarize large lists, provider responses, or logs before writing them into `data.json`.
   - Stay within the bounded JSON rules in `references/artifact-schema.md`.

4. **Apply safety rules before registration**
   - Never store credentials, OAuth tokens, API keys, cookies, auth headers, raw provider responses, HTTP envelopes, full payloads, or secret-like fields in `artifact.json`, `data.json`, `provenance.json`, or source metadata.
   - Avoid forbidden key names such as `raw`, `rawResponse`, `payload`, `body`, `headers`, `cookie`, `authorization`, `token`, `secret`, `credential`, and `password` anywhere in persisted JSON.
   - Use escaped `html_template_v1` interpolation only. Raw/unescaped HTML interpolation is not allowed.

5. **Register or update through daemon wrappers**
   - Use the Open Design daemon wrapper commands via `"$OD_NODE_BIN" "$OD_BIN"` instead of raw `curl`, bare `node`, or bare `od`:

     ```bash
     "$OD_NODE_BIN" "$OD_BIN" tools live-artifacts create --input artifact.json
     "$OD_NODE_BIN" "$OD_BIN" tools live-artifacts list --format compact
     "$OD_NODE_BIN" "$OD_BIN" tools live-artifacts update --artifact-id "$ARTIFACT_ID" --input artifact.json
     ```

   - The wrapper reads injected `OD_NODE_BIN`, `OD_BIN`, `OD_DAEMON_URL`, and `OD_TOOL_TOKEN`; do not print, persist, or override token values.
   - Do not include or invent `projectId`; the daemon derives project/run scope from the token.
   - Use raw HTTP only for daemon development/debugging when explicitly requested.

6. **Use connector wrappers for connector data**
   - Discover available connectors and tools:

     ```bash
     "$OD_NODE_BIN" "$OD_BIN" tools connectors list --format compact
     ```

   - Execute a read-only connector tool with a JSON object input file:

     ```bash
     "$OD_NODE_BIN" "$OD_BIN" tools connectors execute --connector "$CONNECTOR_ID" --tool "$TOOL_NAME" --input input.json
     ```

   - Persist only the compact normalized fields needed by the preview plus non-sensitive connector references (`connectorId`, `toolName`, `accountLabel`). Never persist connector credentials, transport metadata, or raw provider output.
   - Do not ask for connector secrets or duplicate setup. If `status` is `connected`, use the listed tools; if it is not connected, tell the user to connect it in the UI.
   - See `references/connector-policy.md` for listing/execution and credential boundaries, and `references/refresh-contract.md` for read-only refresh source metadata.

7. **Report concise results**
   - On success, return the artifact ID/title and note that `index.html` is daemon-derived.
   - On validation failure, fix the source files and retry through the wrapper. Do not bypass validation.

## Required files

Every live artifact creation flow must produce these source files before registration:

- `template.html` — declared skill output and source template for the preview.
- `data.json` — compact, canonical preview data.
- `artifact.json` — create/update input for daemon validation.
- `provenance.json` — safe source and transformation summary.

`index.html` is the primary preview entry declared in frontmatter, but it is derived daemon output rather than agent-authored source.


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

