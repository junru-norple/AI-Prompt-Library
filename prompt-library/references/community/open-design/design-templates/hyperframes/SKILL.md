---
name: hyperframes
description: Create video compositions, animations, title cards, overlays, captions, voiceovers, audio-reactive visuals, and scene transitions in HyperFrames HTML. Use when asked to build any HTML-based video content, add captions or subtitles synced to audio, generate text-to-speech narration, create audio-reactive animation (beat sync, glow, pulse driven by music), add animated text highlighting (marker sweeps, hand-drawn circles, burst lines, scribble, sketchout), or add transitions between scenes (crossfades, wipes, reveals, shader transitions). Covers composition authoring, timing, media, and the full video production workflow. For CLI commands (init, lint, preview, render, transcribe, tts) see the hyperframes-cli skill.
triggers:
  - "hyperframes"
  - "html video"
  - "video composition"
  - "interactive video"
  - "captions"
  - "tts video"
  - "kinetic typography"
  - "html in canvas"
  - "drawElementImage"
  - "html shader"
  - "vfx-iphone-device"
  - "vfx-liquid-glass"
  - "vfx-portal"
od:
  mode: video
  surface: video
  scenario: video
  preview:
    type: html
  design_system:
    requires: false
  example_prompt: |
    A 5-second product reveal: a minimal high-end product on a clean cream
    surface, soft side light, slow camera push-in, restrained motion, no
    text overlays.
---

# HyperFrames

HTML is the source of truth for video. A composition is an HTML file with `data-*` attributes for timing, a GSAP timeline for animation, and CSS for appearance. The framework handles clip visibility, media playback, and timeline sync.

## Open Design integration (load-bearing for this surface)

When this skill runs inside Open Design (i.e. `$OD_PROJECT_DIR` is set), the
output flow is fixed: only the rendered `.mp4` should land in the project
root. Composition source files (`hyperframes.json`, `meta.json`,
`index.html`, assets) belong inside a hidden cache directory so they don't
clutter the user's FileViewer or the chat's "produced files" chips.

**Render workflow inside OD — fast path**:

For most OD requests ("test video", "5s product reveal", "demo clip"),
do NOT write the composition HTML from scratch. Use HyperFrames'
built-in scaffold and edit only what the prompt actually changes. The
"author from scratch" path costs minutes of model output and silent
chat-tool time; the scaffold path costs seconds.

```bash
# 1. Pick a hidden cache slot. Dotfile prefix → OD's project file
#    listing skips it, so the source files never clutter the chat.
COMP_REL=".hyperframes-cache/$(date +%s)-$(openssl rand -hex 2)"
COMP="$OD_PROJECT_DIR/$COMP_REL"

# 2. Get an immediately-renderable scaffold (hyperframes.json,
#    meta.json, index.html with GSAP CDN + window.__timelines.main
#    already registered). This runs in your shell — pure file copy,
#    no Chrome, no network beyond the npx cache.
npx hyperframes init "$COMP" --example blank --skip-skills --non-interactive

# 3. Edit ONLY $COMP/index.html — change `data-duration` on the root
#    if you need a non-default length, swap the placeholder palette
#    in <style>, add 1–3 clip <div>s for text/imagery, and append the
#    matching GSAP tweens inside the existing
#    `window.__timelines["main"] = gsap.timeline({paused:true})` block.
#    Keep edits minimal; the scaffold is already valid HF.

# 4. Dispatch render through the OD daemon. Do NOT run `npx hyperframes
#    render` from this shell — the daemon runs it for you in an
#    unsandboxed process. (Many agent CLIs, Claude Code in particular,
#    wrap Bash in macOS sandbox-exec under which puppeteer's Chrome
#    subprocess hangs partway through frame capture. The daemon process
#    is unsandboxed, so renders complete reliably.)
#
#    The dispatcher returns within ~1s with a {taskId}; drive the
#    render to completion by looping `"$OD_NODE_BIN" "$OD_BIN" media wait <taskId>` calls.
#    Each call long-polls up to 25s (well under your shell tool's
#    default 30s cap) and exits 0/2/5 to signal done/running/failed.
out=$("$OD_NODE_BIN" "$OD_BIN" media generate \
  --project "$OD_PROJECT_ID" \
  --surface video \
  --model hyperframes-html \
  --output "<descriptive-name>.mp4" \
  --composition-dir "$COMP_REL")
ec=$?
task_id=$(printf '%s\n' "$out" | tail -1 | jq -r '.taskId // empty')
since=$(printf '%s\n' "$out" | tail -1 | jq -r '.nextSince // 0')
while [ "$ec" -eq 2 ] && [ -n "$task_id" ]; do
  out=$("$OD_NODE_BIN" "$OD_BIN" media wait "$task_id" --since "$since")
  ec=$?
  since=$(printf '%s\n' "$out" | tail -1 | jq -r '.nextSince // '"$since")
done
[ "$ec" -ne 0 ] && { echo "$out" >&2; exit "$ec"; }
```

Each `generate` and each `wait` call lasts at most ~25s, so the agent
shell tool's default ~30s cap never fires. Progress lines from HF
(`Capturing frame N/M`) stream to stderr live throughout the loop.
When the render finishes, the last stdout line is
`{"file": { "name": "<output>", "size": …, "kind": "video", … }}` —
quote `file.name` in your reply so the user knows what was produced.

**Skip the Visual Identity Gate inside OD.** The HARD-GATE section
below (under "Approach") tells you to read DESIGN.md / visual-style.md
or stop and ask 3 mood questions before writing any composition. That
gate is for standalone HF projects. **OD projects already have their
own design-system layer** — the user picked their visual direction at
project creation time. For an OD test render, default to: dark canvas
(#0b0b0f), one warm accent (#ffb76b), one cool accent (#7da4ff),
restrained motion. Only ask for stylistic input if the user's prompt
is too vague to even pick a subject (very rare).

When to skip the scaffold and write from scratch: only when the user
explicitly asks for something the blank template clearly can't host
(e.g. multi-composition timelines, audio-reactive overlays, captions
synced to a TTS track they've already generated). For everything else,
init + edit is the default path.

The lighter HF subcommands you CAN still run from your own shell
(they don't need to spawn Chrome):

- `npx hyperframes lint "$COMP"` — validate composition before dispatch
- `npx hyperframes transcribe <audio>` — generate captions
- `npx hyperframes tts <text>` — generate narration

Reserve the daemon dispatch for `render`/`inspect`/`preview` (anything
Chrome-bound). After authoring the composition under `.hyperframes-cache/`,
render it by calling `"$OD_NODE_BIN" "$OD_BIN" media generate --surface video --model hyperframes-html --composition-dir <rel>`.
The daemon runs the Chrome-bound HyperFrames render outside your shell
sandbox and streams progress back to you. Do not run `npx hyperframes render`
yourself.

**Do NOT** drop `hyperframes.json` / `meta.json` / `index.html` in the
project root; OD's file listing scans recursively and the user would see
three unrelated files appear in the chat.

For CLI options beyond `render` (lint, preview, transcribe, tts, inspect,
benchmark) call them directly from your shell tool when the task warrants
it (e.g., generate TTS audio into the cache before referencing it from
the composition).

## Approach

Before writing HTML, think at a high level:

1. **What** — what should the viewer experience? Identify the narrative arc, key moments, and emotional beats.
2. **Structure** — how many compositions, which are sub-compositions vs inline, what tracks carry what (video, audio, overlays, captions).
3. **Timing** — which clips drive the duration, where do transitions land, what's the pacing.
4. **Layout** — build the end-state first. See "Layout Before Animation" below.
5. **Animate** — then add motion using the rules below.

For small edits (fix a color, adjust timing, add one element), skip straight to the rules.

### Visual Identity Gate

<HARD-GATE>
Before writing ANY composition HTML, you MUST have a visual identity defined. Do NOT write compositions with default or generic colors.

Check in this order:

1. **DESIGN.md exists in the project?** → Read it. Use its exact colors, fonts, motion rules, and "What NOT to Do" constraints.
2. **visual-style.md exists?** → Read it. Apply its `style_prompt_full` and structured fields. (Note: `visual-style.md` is a project-specific file. `visual-styles.md` is the style library with 8 named presets — different files.)
3. **User named a style** (e.g., "Swiss Pulse", "dark and techy", "luxury brand")? → Read [visual-styles.md](./visual-styles.md) for the 8 named presets. Generate a minimal DESIGN.md with: `## Style Prompt` (one paragraph), `## Colors` (3-5 hex values with roles), `## Typography` (1-2 font families), `## What NOT to Do` (3-5 anti-patterns).
4. **None of the above?** → Ask 3 questions before writing any HTML:
   - What's the mood? (explosive / cinematic / fluid / technical / chaotic / warm)
   - Light or dark canvas?
   - Any specific brand colors, fonts, or visual references?
     Then generate a minimal DESIGN.md from the answers.

Every composition must trace its palette and typography back to a DESIGN.md, visual-style.md, or explicit user direction. If you're reaching for `#333`, `#3b82f6`, or `Roboto` — you skipped this step.
</HARD-GATE>

For motion defaults, sizing, entrance patterns, and easing — follow [house-style.md](./house-style.md). The house style handles HOW things move. The DESIGN.md handles WHAT things look like.

## Layout Before Animation

Position every element where it should be at its **most visible moment** — the frame where it's fully entered, correctly placed, and not yet exiting. Write this as static HTML+CSS first. No GSAP yet.

**Why this matters:** If you position elements at their animated start state (offscreen, scaled to 0, opacity 0) and tween them to where you think they should land, you're guessing the final layout. Overlaps are invisible until the video renders. By building the end state first, you can see and fix layout problems before adding any motion.

### The process

1. **Identify the hero frame** for each scene — the moment when the most elements are simultaneously visible. This is the layout you build.
2. **Write static CSS** for that frame. The `.scene-content` container MUST fill the full scene using `width: 100%; height: 100%; padding: Npx;` with `display: flex; flex-direction: column; gap: Npx; box-sizing: border-box`. Use padding to push content inward — NEVER `position: absolute; top: Npx` on a content container. Absolute-positioned content containers overflow when content is taller than the remaining space. Reserve `position: absolute` for decoratives only.
3. **Add entrances with `gsap.from()`** — animate FROM offscreen/invisible TO the CSS position. The CSS position is the ground truth; the tween describes the journey to get there.
4. **Add exits with `gsap.to()`** — animate TO offscreen/invisible FROM the CSS position.

### Example

```css
/* scene-content fills the scene, padding positions content */
.scene-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 120px 160px;
  gap: 24px;
  box-sizing: border-box;
}
.title {
  font-size: 120px;
}
.subtitle {
  font-size: 42px;
}
/* Container fills any scene size (1920x1080, 1080x1920, etc).
   Padding positions content. Flex + gap handles spacing. */
```

**WRONG — hardcoded dimensions and absolute positioning:**

```css
.scene-content {
  position: absolute;
  top: 200px;
  left: 160px;
  width: 1920px;
  height: 1080px;
  display: flex; /* ... */
}
```

```js
// Step 3: Animate INTO those positions
tl.from(".title", { y: 60, opacity: 0, duration: 0.6, ease: "power3.out" }, 0);
tl.from(".subtitle", { y: 40, opacity: 0, duration: 0.5, ease: "power3.out" }, 0.2);
tl.from(".logo", { scale: 0.8, opacity: 0, duration: 0.4, ease: "power2.out" }, 0.3);

// Step 4: Animate OUT from those positions
tl.to(".title", { y: -40, opacity: 0, duration: 0.4, ease: "power2.in" }, 3);
tl.to(".subtitle", { y: -30, opacity: 0, duration: 0.3, ease: "power2.in" }, 3.1);
tl.to(".logo", { scale: 0.9, opacity: 0, duration: 0.3, ease: "power2.in" }, 3.2);
```

### When elements share space across time

If element A exits before element B enters in the same area, both should have correct CSS positions for their respective hero frames. The timeline ordering guarantees they never visually coexist — but if you skip the layout step, you won't catch the case where they accidentally overlap due to a timing error.

### What counts as intentional overlap

Layered effects (glow behind text, shadow elements, background patterns) and z-stacked designs (card stacks, depth layers) are intentional. The layout step is about catching **unintentional** overlap — two headlines landing on top of each other, a stat covering a label, content bleeding off-frame.

## Data Attributes

### All Clips

| Attribute          | Required                          | Values                                                 |
| ------------------ | --------------------------------- | ------------------------------------------------------ |
| `id`               | Yes                               | Unique identifier                                      |
| `data-start`       | Yes                               | Seconds or clip ID reference (`"el-1"`, `"intro + 2"`) |
| `data-duration`    | Required for img/div/compositions | Seconds. Video/audio defaults to media duration.       |
| `data-track-index` | Yes                               | Integer. Same-track clips cannot overlap.              |
| `data-media-start` | No                                | Trim offset into source (seconds)                      |
| `data-volume`      | No                                | 0-1 (default 1)                                        |

`data-track-index` does **not** affect visual layering — use CSS `z-index`.

### Composition Clips

| Attribute                    | Required | Values                                       |
| ---------------------------- | -------- | -------------------------------------------- |
| `data-composition-id`        | Yes      | Unique composition ID                        |
| `data-start`                 | Yes      | Start time (root composition: use `"0"`)     |
| `data-duration`              | Yes      | Takes precedence over GSAP timeline duration |
| `data-width` / `data-height` | Yes      | Pixel dimensions (1920x1080 or 1080x1920)    |
| `data-composition-src`       | No       | Path to external HTML file                   |

## Composition Structure

Sub-compositions loaded via `data-composition-src` use a `<template>` wrapper. **Standalone compositions (the main index.html) do NOT use `<template>`** — they put the `data-composition-id` div directly in `<body>`. Using `<template>` on a standalone file hides all content from the browser and breaks rendering.

Sub-composition structure:

```html
<template id="my-comp-template">
  <div data-composition-id="my-comp" data-width="1920" data-height="1080">
    <!-- content -->
    <style>
      [data-composition-id="my-comp"] {
        /* scoped styles */
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      // tweens...
      window.__timelines["my-comp"] = tl;
    </script>
  </div>
</template>
```

Load in root: `<div id="el-1" data-composition-id="my-comp" data-composition-src="compositions/my-comp.html" data-start="0" data-duration="10" data-track-index="1"></div>`

## Video and Audio

Video must be `muted playsinline`. Audio is always a separate `<audio>` element:

```html
<video
  id="el-v"
  data-start="0"
  data-duration="30"
  data-track-index="0"
  src="video.mp4"
  muted
  playsinline
></video>
<audio
  id="el-a"
  data-start="0"
  data-duration="30"
  data-track-index="2"
  src="video.mp4"
  data-volume="1"
></audio>
```

## Timeline Contract

- All timelines start `{ paused: true }` — the player controls playback
- Register every timeline: `window.__timelines["<composition-id>"] = tl`
- Framework auto-nests sub-timelines — do NOT manually add them
- Duration comes from `data-duration`, not from GSAP timeline length
- Never create empty tweens to set duration

## Rules (Non-Negotiable)

**Deterministic:** No `Math.random()`, `Date.now()`, or time-based logic. Use a seeded PRNG if you need pseudo-random values (e.g. mulberry32).

**GSAP:** Only animate visual properties (`opacity`, `x`, `y`, `scale`, `rotation`, `color`, `backgroundColor`, `borderRadius`, transforms). Do NOT animate `visibility`, `display`, or call `video.play()`/`audio.play()`.

**Animation conflicts:** Never animate the same property on the same element from multiple timelines simultaneously.

**No `repeat: -1`:** Infinite-repeat timelines break the capture engine. Calculate the exact repeat count from composition duration: `repeat: Math.ceil(duration / cycleDuration) - 1`.

**Synchronous timeline construction:** Never build timelines inside `async`/`await`, `setTimeout`, or Promises. The capture engine reads `window.__timelines` synchronously after page load. Fonts are embedded by the compiler, so they're available immediately — no need to wait for font loading.

**Never do:**

1. Forget `window.__timelines` registration
2. Use video for audio — always muted video + separate `<audio>`
3. Nest video inside a timed div — use a non-timed wrapper
4. Use `data-layer` (use `data-track-index`) or `data-end` (use `data-duration`)
5. Animate video element dimensions — animate a wrapper div
6. Call play/pause/seek on media — framework owns playback
7. Create a top-level container without `data-composition-id`
8. Use `repeat: -1` on any timeline or tween — always finite repeats
9. Build timelines asynchronously (inside `async`, `setTimeout`, `Promise`)
10. Use `gsap.set()` on clip elements from later scenes — they don't exist in the DOM at page load. Use `tl.set(selector, vars, timePosition)` inside the timeline at or after the clip's `data-start` time instead.
11. Use `<br>` in content text — forced line breaks don't account for actual rendered font width. Text that wraps naturally + a `<br>` produces an extra unwanted break, causing overlap. Let text wrap via `max-width` instead. Exception: short display titles where each word is deliberately on its own line (e.g., "THE\nIMMORTAL\nGAME" at 130px).

## Scene Transitions (Non-Negotiable)

Every multi-scene composition MUST follow ALL of these rules. Violating any one of them is a broken composition.

1. **ALWAYS use transitions between scenes.** No jump cuts. No exceptions.
2. **ALWAYS use entrance animations on every scene.** Every element animates IN via `gsap.from()`. No element may appear fully-formed. If a scene has 5 elements, it needs 5 entrance tweens.
3. **NEVER use exit animations** except on the final scene. This means: NO `gsap.to()` that animates opacity to 0, y offscreen, scale to 0, or any other "out" animation before a transition fires. The transition IS the exit. The outgoing scene's content MUST be fully visible at the moment the transition starts.
4. **Final scene only:** The last scene may fade elements out (e.g., fade to black). This is the ONLY scene where `gsap.to(..., { opacity: 0 })` is allowed.

**WRONG — exit animation before transition:**

```js
// BANNED — this empties the scene before the transition can use it
tl.to("#s1-title", { opacity: 0, y: -40, duration: 0.4 }, 6.5);
tl.to("#s1-subtitle", { opacity: 0, duration: 0.3 }, 6.7);
// transition fires on empty frame
```

**RIGHT — entrance only, transition handles exit:**

```js
// Scene 1 entrance animations
tl.from("#s1-title", { y: 50, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.3);
tl.from("#s1-subtitle", { y: 30, opacity: 0, duration: 0.5, ease: "power2.out" }, 0.6);
// NO exit tweens — transition at 7.2s handles the scene change
// Scene 2 entrance animations
tl.from("#s2-heading", { x: -40, opacity: 0, duration: 0.6, ease: "expo.out" }, 8.0);
```

## Animation Guardrails

- Offset first animation 0.1-0.3s (not t=0)
- Vary eases across entrance tweens — use at least 3 different eases per scene
- Don't repeat an entrance pattern within a scene
- Avoid full-screen linear gradients on dark backgrounds (H.264 banding — use radial or solid + localized glow)
- 60px+ headlines, 20px+ body, 16px+ data labels for rendered video
- `font-variant-numeric: tabular-nums` on number columns

When no `visual-style.md` or animation direction is provided, follow [house-style.md](./house-style.md) for aesthetic defaults.

## Typography and Assets

- **Fonts:** Just write the `font-family` you want in CSS — the compiler embeds supported fonts automatically. If a font isn't supported, the compiler warns.
- Add `crossorigin="anonymous"` to external media
- For dynamic text overflow, use `window.__hyperframes.fitTextFontSize(text, { maxWidth, fontFamily, fontWeight })`
- All files live at the project root alongside `index.html`; sub-compositions use `../`

## Editing Existing Compositions

- Read the full composition first — match existing fonts, colors, animation patterns
- Only change what was requested
- Preserve timing of unrelated clips

## Output Checklist

- [ ] `npx hyperframes lint` and `npx hyperframes validate` both pass
- [ ] `npx hyperframes inspect` passes, or every reported overflow is intentionally marked
- [ ] Contrast warnings addressed (see Quality Checks below)
- [ ] Layout issues addressed (see Quality Checks below)
- [ ] Animation choreography verified (see Quality Checks below)

## Quality Checks

### Visual Inspect

`hyperframes inspect` runs the composition in headless Chrome, seeks through the timeline, and maps visual layout issues with timestamps, selectors, bounding boxes, and fix hints. Run it after `lint` and `validate`:

```bash
npx hyperframes inspect
npx hyperframes inspect --json
```

Failures usually mean text is spilling out of a bubble/card, a fixed-size label is clipping dynamic copy, or text has moved off the canvas. Fix by increasing container size or padding, reducing font size or letter spacing, adding a real `max-width` so text wraps inside the container, or using `window.__hyperframes.fitTextFontSize(...)` for dynamic copy.

Use `--samples 15` for dense videos and `--at 1.5,4,7.25` for specific hero frames. Repeated static issues are collapsed by default to avoid flooding agent context. If overflow is intentional for an entrance/exit animation, mark the element or ancestor with `data-layout-allow-overflow`. If a decorative element should never be audited, mark it with `data-layout-ignore`.

`hyperframes layout` is the compatibility alias for the same check.

### Contrast

`hyperframes validate` runs a WCAG contrast audit by default. It seeks to 5 timestamps, screenshots the page, samples background pixels behind every text element, and computes contrast ratios. Failures appear as warnings:

```
⚠ WCAG AA contrast warnings (3):
  · .subtitle "secondary text" — 2.67:1 (need 4.5:1, t=5.3s)
```

If warnings appear:

- On dark backgrounds: brighten the failing color until it clears 4.5:1 (normal text) or 3:1 (large text, 24px+ or 19px+ bold)
- On light backgrounds: darken it
- Stay within the palette family — don't invent a new color, adjust the existing one
- Re-run `hyperframes validate` until clean

Use `--no-contrast` to skip if iterating rapidly and you'll check later.

### Animation Map

After authoring animations, run the animation map to verify choreography:

```bash
node design-templates/hyperframes/scripts/animation-map.mjs <composition-dir> \
  --out <composition-dir>/.hyperframes/anim-map
```

Outputs a single `animation-map.json` with:

- **Per-tween summaries**: `"#card1 animates opacity+y over 0.50s. moves 23px up. fades in. ends at (120, 200)"`
- **ASCII timeline**: Gantt chart of all tweens across the composition duration
- **Stagger detection**: reports actual intervals (`"3 elements stagger at 120ms"`)
- **Dead zones**: periods over 1s with no animation — intentional hold or missing entrance?
- **Element lifecycles**: first/last animation time, final visibility
- **Scene snapshots**: visible element state at 5 key timestamps
- **Flags**: `offscreen`, `collision`, `invisible`, `paced-fast` (under 0.2s), `paced-slow` (over 2s)

Read the JSON. Scan summaries for anything unexpected. Check every flag — fix or justify. Verify the timeline shows the intended choreography rhythm. Re-run after fixes.

Skip on small edits (fixing a color, adjusting one duration). Run on new compositions and significant animation changes.

---

## References (loaded on demand)

- **[references/captions.md](references/captions.md)** — Captions, subtitles, lyrics, karaoke synced to audio. Tone-adaptive style detection, per-word styling, text overflow prevention, caption exit guarantees, word grouping. Read when adding any text synced to audio timing.
- **[references/tts.md](references/tts.md)** — Text-to-speech with Kokoro-82M. Voice selection, speed tuning, TTS+captions workflow. Read when generating narration or voiceover.
- **[references/audio-reactive.md](references/audio-reactive.md)** — Audio-reactive animation: map frequency bands and amplitude to GSAP properties. Read when visuals should respond to music, voice, or sound.
- **[references/css-patterns.md](references/css-patterns.md)** — CSS+GSAP marker highlighting: highlight, circle, burst, scribble, sketchout. Deterministic, fully seekable. Read when adding visual emphasis to text.
- **[references/typography.md](references/typography.md)** — Typography: font pairing, OpenType features, dark-background adjustments, font discovery script. **Always read** — every composition has text.
- **[references/motion-principles.md](references/motion-principles.md)** — Motion design principles: easing as emotion, timing as weight, choreography as hierarchy, scene pacing, ambient motion, anti-patterns. Read when choreographing GSAP animations.
- **[visual-styles.md](visual-styles.md)** — 8 named visual styles (Swiss Pulse, Velvet Standard, Deconstructed, Maximalist Type, Data Drift, Soft Signal, Folk Frequency, Shadow Cut) with hex palettes, GSAP easing signatures, and shader pairings. Read when user names a style or when generating DESIGN.md.
- **[house-style.md](house-style.md)** — Default motion, sizing, and color palettes when no style is specified.
- **[patterns.md](patterns.md)** — PiP, title cards, slide show patterns.
- **[data-in-motion.md](data-in-motion.md)** — Data, stats, and infographic patterns.
- **[references/transcript-guide.md](references/transcript-guide.md)** — Transcription commands, whisper models, external APIs, troubleshooting.
- **[references/dynamic-techniques.md](references/dynamic-techniques.md)** — Dynamic caption animation techniques (karaoke, clip-path, slam, scatter, elastic, 3D).

- **[references/transitions.md](references/transitions.md)** — Scene transitions: crossfades, wipes, reveals, shader transitions. Energy/mood selection, CSS vs WebGL guidance. **Always read for multi-scene compositions** — scenes without transitions feel like jump cuts.
  - [transitions/catalog.md](references/transitions/catalog.md) — Hard rules, scene template, and routing to per-type implementation code.
  - Shader transitions are in `@hyperframes/shader-transitions` (`packages/shader-transitions/`) — read package source, not skill files.
- **[references/html-in-canvas.md](references/html-in-canvas.md)** — HTML-in-Canvas (`drawElementImage`) for rendering live DOM as WebGL textures: 3D device mockups, shader-warped UIs, liquid glass, portals. Read when the user asks for `vfx-iphone-device`, `vfx-liquid-glass`, `vfx-portal`, or any "HTML mapped onto 3D / shader" effect. The render path auto-enables the Chrome flag, but the texture must be re-captured every frame for animated content — that's the most common cause of "the screen renders dead" output.

GSAP patterns and effects are in the `/gsap` skill.


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

