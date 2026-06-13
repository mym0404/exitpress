---
name: ingest-blog
description: Ingest a public blog by blogKey and sourceInput to improve this repository's parser coverage. Use when Codex needs to export every public post without downloading images, summarize parse failures, implement or extend parser blocks for failed HTML, add representative sample fixtures, and create Korean ready PRs.
---

# Ingest Blog

Use this skill to raise concrete blog parser coverage from real public posts. Treat a blog ingest as a coverage-improvement loop that discovers all gaps and creates one focused PR for each parser support unit.

## Required Outcome

When parse errors are found, group failures into parser support units and process every discovered `supportUnitKey` before ending the turn. Each parser-support PR must contain exactly one focused support unit, and each fixed support unit must include both required outputs:

- Add a new parser block or extend the existing block that owns the failed HTML.
- Add a representative sample fixture for the fixed failure type.

A completed ingest check must publish the `.agents/skills/ingest-blog/checked.txt` update. If parser-support PRs are created for the ingest target, include the `checked.txt` update in the first ready PR only. If no unsupported parser blocks are found, create a ready PR that contains the `checked.txt` update instead of ending with only a local change.

Do not treat an unresolved or deferred support unit as complete. If a failure cannot be safely fixed in the current pass, leave code and fixtures unchanged for that unit, report the blocker with representative `postId` and inspect evidence, and do not end the turn as complete.
Other support units from the same blog stay out of the focused PR body, but they are not completion backlog; they must each get their own focused PR before the turn can end.

## Quick Commands

Use only ingest targets whose `blogKey/sourceId` pair is not already listed in `.agents/skills/ingest-blog/checked.txt` unless the user explicitly provides and confirms that exact already-checked target.
Before running an ingest check, read `.agents/skills/ingest-blog/checked.txt`; it stores one `blogKey/sourceId` pair per line.
After checking a target, append that exact pair to `checked.txt` on its own line if it is not already present.

Run ingest with remote asset references. If a completed output for the same `blogKey/sourceId` exists, reuse it and rerun only failed posts:

```bash
bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts --blogKey naver --sourceInput <sourceInput>
```

Force a new full ingest:

```bash
bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts --blogKey naver --sourceInput <sourceInput> --forceFull
```

Reuse a specific completed output and rerun only failed posts:

```bash
bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts \
  --blogKey naver \
  --sourceInput <sourceInput> \
  --reuseOutputDir <absolute-output-dir> \
  --rerunFailures
```

Rerun and report one parser support unit:

```bash
bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts \
  --blogKey naver \
  --sourceInput <sourceInput> \
  --reuseOutputDir <absolute-output-dir> \
  --rerunFailures \
  --focusSupportUnit <supportUnitKey>
```

Check whether every discovered support unit has a ready open PR:

```bash
bun .agents/skills/ingest-blog/scripts/check-support-unit-prs.ts \
  --outputDir <absolute-output-dir>
```

Create a fixture for one fixed representative post:

```bash
bun .agents/skills/ingest-blog/scripts/write-sample-fixture.ts \
  --blogKey naver \
  --sourceInput <sourceInput> \
  --postId <postId> \
  --id <fixtureId>
```

`collect-blog-errors.ts` and `write-sample-fixture.ts` force image handling to remote references and disable image and thumbnail downloads.

Create evidence for a source post or inspect path:

```bash
bun scripts/post-evidence/capture-post-evidence.ts \
  --blogKey naver \
  --sourceInput <sourceInput> \
  --postId <postId> \
  --target inspect-path \
  --inspectPath 0 \
  --metadataCachePath tmp/harness/post-evidence/metadata-cache.json
```

`--target post` renders Markdown with frontmatter. `--target inspect-path` renders only the selected block fragment and omits frontmatter.
Source screenshots capture the selected HTML node rather than the current viewport; long nodes may produce tall images.
Focused parser-support PR evidence must use `inspect-path` whenever an unsupported block path is known, including after the focused rerun succeeds. Use `post` only when no inspect path is available.
Ingest PR evidence renders as README-style Markdown sections with a source capture image and Markdown code fence, without a source-post link.
Use `--metadataCachePath` when generating multiple rows from one blog so post metadata scan results are reused.
Use `--assetProfile tmp` for local smoke output, `--assetProfile readme` for README assets, and `--assetProfile figure` for report or PR figures that must be committed.

## Workflow

1. Confirm `<blogKey>/<sourceId>` is absent from `.agents/skills/ingest-blog/checked.txt` before using it as the ingest target, unless the user explicitly confirmed rechecking an already listed target.
2. Run `collect-blog-errors.ts --blogKey <blogKey> --sourceInput <sourceInput>` unless the user explicitly asked for `--forceFull`.
3. Append `<blogKey>/<sourceId>` to `.agents/skills/ingest-blog/checked.txt` on its own line if it is not already present.
4. Record the absolute `outputDir` printed by the script.
5. Read `failure-summary.json` and freeze the full `discoveredSupportUnits` list for this ingest turn.
6. If no unsupported parser blocks were found, create a ready PR containing the `checked.txt` update and no parser code or fixture changes.
7. Run `check-support-unit-prs.ts --outputDir <absolute-output-dir>` to see which support units already have ready open PR claims.
8. Process every missing `supportUnitKey` sequentially in the same working directory. Do not create git worktrees.
9. For each unit, start from `origin/main` and create or switch to branch `worktree/ingest-blog-<safeSupportUnitKey>`, where `<safeSupportUnitKey>` replaces non-alphanumeric characters with `-`.
10. Before editing that unit, run `git fetch origin main`.
11. Skip the unit only when `origin/main` already supports it. A draft PR claim is not complete; convert it to ready or recreate it as ready before ending.
12. Inspect the focused failed HTML and identify the owning editor/block boundary.
13. Infer the expected PR file shape before editing. Use the owning editor/block boundary to decide whether this should be an existing-block edit or a new-block addition.
14. Implement the smallest parser block addition or extension that handles that DOM shape.
15. Add or extend the focused parser block spec beside the block implementation.
16. Add one representative sample fixture for the focused support unit with `write-sample-fixture.ts`.
17. Include the `checked.txt` update in the first ready PR created for this ingest target if no earlier ready PR for the same target already includes it.
18. Do not update knowledge documents for routine parser support. Use the Knowledge Boundary below only when the focused diff changes a cross-cutting repository contract.
19. Run the development verification commands listed below for the changed parser/block area.
20. Regenerate the report with `--reuseOutputDir <absolute-output-dir> --rerunFailures --focusSupportUnit <key>` so it reflects only the focused unit, fixtures, verification results, and evidence.
21. Run the Local PR Gate listed below.
22. Commit, push, and create the ready PR for that focused support unit. With `gh pr create`, do not pass `--draft`.
23. After PR creation, run `gh pr update-branch <number>` once when the command is available. If GitHub refuses, the branch is already current, or the command fails, report the result and continue; update-branch failure does not block completion.
24. Before moving to the next unit, run `git status --short`; tracked changes must be clean so code from different PRs cannot mix.
25. Run `check-support-unit-prs.ts --outputDir <absolute-output-dir>` after each PR and continue until it exits `0`.

Do not rerun the same blog as a full ingest after a completed output exists unless the user asked for `--forceFull` or the reusable manifest is invalid.
Store shared ingest output and aggregate run state only under ignored `tmp/harness/ingest-blog/<runId>`. Do not use `.cache` for this workflow because it is reserved for app runtime state.
After the first collect, use the printed absolute `outputDir` for every focused rerun and PR checker call. Relative `tmp/harness/...` paths are not used when switching branches because they can point at the wrong run state.

## Local PR Gate

Before committing, pushing, or creating a ready PR for each focused support unit, run all of these commands from the repository root:

```bash
pnpm typecheck
pnpm check:fmt
pnpm check:lint
pnpm test:coverage
pnpm smoke:ui
pnpm check:unused
```

If any command fails, do not commit, push, or create the PR. If the failure is caused by the focused diff, fix it and rerun the full Local PR Gate from the beginning. If the failure appears unrelated or flaky, rerun the failing command by itself to capture evidence; if it still reproduces, stop PR creation and report the blocker.

Do not add `pnpm check:local` to the Local PR Gate. `pnpm check:fmt`, `pnpm check:lint`, `pnpm typecheck`, and `pnpm test:coverage` directly cover the CI-relevant format, lint, type, and Vitest checks, while `pnpm check:unused` remains the local dead-code gate.

## Report Rules

Every completed skill run must leave these report artifacts:

- `report.md`
- `report.json`
- `evidence.md`
- evidence images under `.agents/knowledge/reference/assets/figure`

The report must include:

- ingest target and whether an output was reused
- total post count and failed post count
- failed-post rerun results
- parser support added or extended
- fixtures added
- verification commands and results
- evidence generated through `scripts/post-evidence/capture-post-evidence.ts` helpers
- unresolved focused failures and the reason each one is deferred

Keep evidence metadata as a short human note, such as the parser block behavior being demonstrated. Do not fill it with routine run state like source identity, post id, title, or status unless that value is the useful note for the section.

Use `--changesPath <json>` when rerunning the collector after code changes. The JSON may contain `parserChanges`, `fixtures`, `verification`, and `unresolved` arrays.
If unresolved focused failures remain, include one deferred reason per representative failure group in `unresolved`.
Treat non-zero evidence capture errors as an incomplete report and fix the evidence generation issue before using the report.

## PR Flow

An `ingest-blog` invocation is PR creation intent. After code, fixtures, verification, focused reports, and the Local PR Gate are ready, create a ready PR for each discovered support unit without asking for confirmation.
Do not offer `pr=ask`, `pr=none`, or other PR modes.
If there are no code or fixture changes for a focused support unit because it is safely deferred, do not create an empty PR; report the blocker and do not mark the ingest turn complete.
If the ingest target has no unsupported parser blocks, create a ready PR that updates only `.agents/skills/ingest-blog/checked.txt`. Use a concise Korean PR body that states the blog was checked and no parser-support changes were needed.

For a parser-support PR, the PR body must start with one or two Korean summary lines that state what parser behavior changed. Keep the summary concrete and visible before the hidden claim marker and sections.
After the parser-support summary and hidden claim marker, the visible PR body must use exactly these three top-level sections and no extra visible sections:

````markdown
<Korean summary of what changed>
<Optional second Korean summary line for fixture or verification context>

<!-- ingest-blog:supportUnitKey=<key> -->

# Parser Support

- Editor: `<editorType>`
- Parser Support: `<ParserSupportName>`

# Evidence

<raw-GitHub evidence image and rendered Markdown evidence>

# Original Html

```html
<HTML that failed before the parser change>
```
````

Do not add visible root cause, changes, validation, notes, report, backlog, full-blog sections, or other extra visible sections to the PR body.
Keep the hidden claim marker as an HTML comment for the PR completion checker, but do not add another visible section for it.
For a focused support-unit PR:

- Title must start with exactly `[📦 New Block Parser]` when adding and registering a new parser block.
- Title must start with exactly `[🎉 Parser Improvement]` when extending or fixing an existing parser block.
- Do not use any other `ingest-blog` PR title prefix.
- Add or create the GitHub labels `ai-generated` and `ingest-blog`.
- Include only the summary and fixed three-section body above.
- Include `.agents/skills/ingest-blog/checked.txt` in the first ready PR created for the ingest target.
- Include a hidden claim marker after the summary: `<!-- ingest-blog:supportUnitKey=<key> -->`.
- Do not include visible blog names, source identities, post ids, source-post URLs, or source-post link labels in the PR body.
- Do not include source frontmatter fields such as `source`, `blogKey`, `sourceId`, `postId`, `publishedAt`, `category`, `categoryPath`, or `thumbnail` in PR Markdown evidence.
- Use anonymous committed figure asset filenames so raw-GitHub image URLs do not reveal a source blog or post id.
- Run the Local PR Gate after the focused report is regenerated and before commit, push, or PR creation.
- PR evidence images must render on GitHub. Commit `figure` assets first, push the branch, then replace local or repo-relative image paths with `https://raw.githubusercontent.com/<owner>/<repo>/<headCommitSha>/<path>` URLs in the PR body.
- Do not use `tmp/`, `file://`, `.agents/...` relative paths, or Markdown/HTML image paths that only work locally in the PR body.
- Create ready PRs. Do not pass `--draft`, and do not count draft PRs as completed support units.
- Run `gh pr update-branch <number>` once after PR creation when supported; failure is non-blocking and should be reported.
- When one skill invocation creates multiple PRs, process support units sequentially in the same working directory. Use one branch per support unit and do not create git worktrees.
- After each PR, run `check-support-unit-prs.ts --outputDir <absolute-output-dir>`. The turn may end only when the checker exits `0`.

## Parser Fix Rules

- Keep changes scoped to the editor family that produced the failure.
- Prefer extending an existing block when the DOM is the same content family.
- Add a new block when the HTML has a distinct user-visible content responsibility or requires a different prop contract.
- Register a new block directly in the editor `supportedBlocks` list.
- Every parser block must define `templateDefinition`.
- Blocks that intentionally emit no Markdown use the `무시` preset with an empty template.
- Template presets must describe meaningful output shapes. Do not use generic labels.
- Parser blocks should expose structured props that name the content they parse. Do not reduce link-like, media-like, schedule-like, map-like, file-like, or embedded components to a single opaque `text` prop.
- If one block can only parse the right props for one content shape by weakening another shape, split the parser block.
- Do not add a registry, compatibility re-export, broad fallback parser, or catch-all block.
- Do not move block-specific parsing, output construction, or template strings into shared helpers. Keep them in the owning block file even when this duplicates a small template or object shape.
- Do not change renderer, shared parser contracts, or generic template evaluation unless the failed content cannot fit the current contracts.
- If a shared contract change is unavoidable, update shared types, renderer/exporter behavior, focused tests, fixtures, and cross-cutting knowledge together.
- Keep the PR file shape predictable from the chosen strategy:
  - Existing-block edit: touch the owning block file, its adjacent spec, and one representative sample fixture.
  - New-block addition: add the new block file, its adjacent spec, the owning editor registration, and one representative sample fixture.
  - Evidence assets may be included when the report or PR body needs committed `figure` images.
- Do not touch renderer, exporter, shared parser contracts, UI, workflow, broad helpers, or knowledge unless the focused failed HTML cannot be represented through existing contracts.
- If the necessary diff does not match the expected file shape, keep the wider change directly tied to the focused failure and document the reason in the report.

## Fixture Rules

- Add one public sample fixture per fixed failure type.
- Use fixture ids that describe the editor and dominant block behavior.
- Write `expected.md` for fixed behavior.
- Do not add `expected-error.md` for unresolved failures.
- Do not store source HTML in the fixture directory.
- Keep live HTML input through the existing sample fixture harness and cache.

## Knowledge Boundary

Do not edit root `AGENTS.md` or `.agents/knowledge/*.md` documents for ordinary parser support units.
Keep specific parser block behavior in the block implementation, adjacent spec, representative fixture, focused report, and PR evidence.

Do not update knowledge to record:

- a new parser block's exact parsing method
- selectors, module type strings, block keys, or DOM recipes
- fixture ids, sample inventory items, support unit findings, or source-post details
- behavior that is already captured by the focused code, spec, and fixture

Update knowledge only when the focused change alters a cross-cutting repository contract, such as shared AST shape, renderer/exporter output behavior, parser dispatch semantics, fixture harness policy, verification commands, or project ownership boundaries. Keep those updates at category or contract level and do not describe the specific block parsing method.

## Verification

For skill changes:

```bash
python3 /Users/mj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/ingest-blog
bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts --help
bun .agents/skills/ingest-blog/scripts/write-sample-fixture.ts --help
bun .agents/skills/ingest-blog/scripts/check-support-unit-prs.ts --help
bun scripts/post-evidence/capture-post-evidence.ts --help
```

For parser/block changes:

```bash
pnpm test:offline
pnpm check:local
```

Run `pnpm check:unused` when moving, exporting, removing, or intentionally keeping source/test/script code that may be unused.

For the required Local PR Gate before every focused support-unit PR:

```bash
pnpm typecheck
pnpm check:fmt
pnpm check:lint
pnpm test:coverage
pnpm smoke:ui
pnpm check:unused
```

## Coverage Target

Use a public blog that actually has unsupported parser blocks as the coverage target. A blog with no unsupported blocks can check basic script health, but it cannot prove this parser coverage workflow.

For a selected coverage target, turn completion means `check-support-unit-prs.ts --outputDir <absolute-output-dir>` exits `0` because every discovered `supportUnitKey` has a ready open PR claim. Draft PR claims do not satisfy completion. After those focused changes are merged, rerun a full ingest of the same target on `origin/main`; the aggregate pass is complete only when the generated manifest has `failureCount: 0`, failure groups are empty, and no image files are downloaded.
