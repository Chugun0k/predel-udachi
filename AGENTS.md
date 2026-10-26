# Codex project instructions — Предел удачи

## Mission
Build an anonymous probability-learning game for a second-year course. The complete task statements stored in `src/catalog.js` are the canonical public content. The game MUST teach the required theory and walk a learner through progressive micro-exercises before expecting full solutions. It is NOT a quiz-only platform.

## Nonnegotiable constraints
1. Every included task (currently 90) MUST remain a distinct `catalog` entry. Do not silently merge tasks or change task IDs.
2. Exclude `S02-Q14` and `S03-Q10` (starred), plus `S01-Q02` and `S02-Q12` (direct dependencies on unavailable lectures), from completion metrics; keep all four documented exclusions.
3. Mark `implemented: true` **only** when the full lesson path works and its correctness tests pass.
4. Each lesson MUST contain: conceptual theory → hands-on interaction/example → at least two atomic exercises → actual source-level final task (with a proof scaffold when it requests a proof) → explanatory feedback and hints.
5. Preserve formulas, statements and assumptions from `src/catalog.js`. Do not add identifying source metadata. For missing definitions or lecture context, explicitly flag the dependency without naming an institution or author.
6. Do not leak the final answer in theory or early hints; avoid making every exercise multiple-choice. Use numerical, symbolic, drag, graph, or proof-order interactions.
7. XP must be earned once per unique step, regardless of repeated clicks. **Progress is the number of mastered seminar tasks / 90, not the number of viewed pages.** Never erase a correct step because of a wrong answer or missing streak.
8. Mobile first: narrow-screen checks. No external image generation, API calls, analytics or accounts necessary. Keep the app offline-friendly.
9. Keep learning content separate from rendering. Avoid a single monolithic HTML as the editable source. `play.html` is generated output.
10. After changes: `npm test`, run browser smoke tests when possible, `npm run standalone`, and update `docs/TASK_AUDIT.csv` / lesson status accurately.

## Existing architecture
- `src/catalog.js`: anonymous task inventory (90 included / 4 documented exclusions).
- `src/lessons.js`: lesson schema, currently three completed vertical slices.
- `src/engine.js`: evaluation & progression.
- `src/app.js`: visual shell, visual experiments and event delegation.
- `src/styles.css`: warm editorial/board-game design system.
- `scripts/build_standalone.py` inlines source into `play.html`.

## How to add a new task
1. Select a **single** `needs_authoring` task in chronological order, unless directed otherwise.
2. Inspect the full statement in `src/catalog.js`, not the short title alone.
3. Write a short concept map (what distinct theorem / technique / proof structure this source task teaches).
4. Implement a new `lessons[id]` with multiple stages; use one manipulable illustration / experiment; preserve every part (a/b/c...) in the final mastery check.
5. Check conceptual understanding without giving away the solution. For formal proofs, author interactive proof steps with explicit math logic (not answer selection alone).
6. Add or extend automated checks for answer grading, math boundaries and all subparts.
7. Update the implemented flag safely, update tests and docs, rebuild standalone, and manually verify on desktop and mobile.

## Definition of done for each task
- All source task subparts and assumptions covered by the final boss.
- Theory and prerequisites correct and comprehensible with no needed unstated theorem.
- 2–6 atomic steps, responsive to errors, two graduated hints.
- At least one interactive visualization or genuinely useful worked microexample.
- Review / practice path and one-time XP.
- Tests for right/wrong/boundary answers; screenshots/mobile verification.
- Catalog status `ready`, no broken links, no skipped seminar IDs.

## Near-term refactor recommendation
Content-backed JSON schema + validators, semantic subtask progress, proof-builder answer types, progress export/import and spaced repetition. Do not implement all these at once: keep vertical slices working.



# UI/UX Design Contract

## Product identity

«Предел удачи» is a focused probability-learning workspace, not a SaaS
landing page or analytics dashboard.

Its visual direction is:

- mathematical editorial design;
- tactile tabletop-game details;
- an illustrated university laboratory;
- dense but calm learning surfaces;
- expressive navigation that becomes quiet during problem solving.

Preserve lesson content, mathematical correctness, progress semantics,
task IDs and interaction behavior during visual redesigns.

## Design decision hierarchy

When rules conflict, use this order:

1. accessibility and mathematical readability;
2. learning-task clarity;
3. existing product identity and content;
4. responsive behavior;
5. visual originality;
6. decorative style.

Do not choose an unusual solution merely because it is unusual.
Familiar controls should remain familiar.

## Required UI workflow

For substantial UI work:

1. Use `zack-design-router` to classify the task.
2. Use `zack-anti-ai-look` for the initial diagnosis.
3. Use `anti-ui-slop` to write a product-specific design contract
   and enumerate required states.
4. Use `ui-ux-pro-max` for accessibility, responsive layout,
   typography and interaction validation.
5. Inspect the existing implementation before editing.
6. Capture before/after views at 390, 768 and 1440 px.

Do not blindly combine skill recommendations. Project constraints and
learning UX take precedence.

## Hard bans

- No purple/blue/pink gradients or gradient text.
- Do not use Tailwind-default indigo colors such as `#6366F1`
  and `#8B5CF6`.
- No pure `#000` or `#FFF` for large reading surfaces.
- No emoji as functional icons. Use accessible inline SVG.
- No generic `shadow-md`, `shadow-lg` or `transition: all`.
- No card-inside-card nesting deeper than two visual surfaces.
- No three identical promotional cards.
- No invented testimonials, metrics, achievements or activity.
- No body text below 16 px in lesson content.
- No font without verified Cyrillic coverage.
- No external font, icon or image dependency in the standalone build.

## Layout and hierarchy

- The active lesson is the primary surface.
- Campaign framing and navigation must not push the lesson below the
  first viewport.
- Use asymmetry only when it clarifies importance.
- Navigation, lesson content and supporting context must not have equal
  visual weight.
- Vary spacing according to meaning: related controls stay close;
  stage changes receive more space.
- Use one dominant action per stage.
- Avoid page-level horizontal scrolling.
- Mathematical blocks and large source tables may scroll internally.

## Typography

- Use no more than two font families.
- Use a proportional type scale with no more than six recurring sizes.
- Body text: at least 16 px with line-height 1.55–1.75.
- Avoid exaggerated “huge heading + tiny metadata” hierarchy.
- Use display typography sparingly; the lesson body must remain dominant.
- Verify Cyrillic, Latin, Greek symbols and KaTeX together.
- Bundle production fonts locally in `play.html`.

## Color and surfaces

- Use semantic design tokens; components must not contain arbitrary
  theme-specific hex values.
- Keep one primary accent plus semantic success, warning and error colors.
- Prefer surface contrast and spacing over borders and shadows.
- Texture may be used only when subtle, performant and non-interfering
  with text or mathematical notation.

## Themes

Support `light`, `dark` and `system` preferences.

- Store the explicit user choice locally.
- Apply the saved/system theme before first paint.
- Use `color-scheme` for native controls.
- Build dark mode as a separate warm laboratory palette, not as an
  automatic color inversion.
- Verify normal text contrast of at least 4.5:1 in both themes.
- Check KaTeX, tables, experiments, feedback states and SVG diagrams
  separately in both themes.
- The theme control must have an accessible name, visible focus and a
  text alternative to its icon.

## Interaction and accessibility

- Minimum touch target: 44 × 44 px.
- All actions require hover, active, focus-visible and disabled states.
- Do not encode correctness using color alone.
- Respect `prefers-reduced-motion`.
- Preserve keyboard navigation and predictable focus order.
- Focus mode must reduce chrome without removing progress context or
  access to the chapter map.

## Finish gate

A UI change is incomplete until:

- `npm test` passes;
- desktop, tablet and mobile screenshots are inspected;
- light and dark themes are inspected;
- keyboard navigation is checked;
- no page-level overflow or clipped formulas remain;
- `npm run standalone` succeeds;
- generated `play.html` remains fully offline;
- no lesson, progress or grading behavior has regressed.
