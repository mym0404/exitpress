# Ingest Blog

## Purpose
- The repo-local `ingest-blog` skill improves parser coverage from real public Naver Blog posts.
- It is a failure-driven parser coverage loop that discovers all parser gaps and creates one focused PR per parser support unit.
- The skill body lives at `.agents/skills/ingest-blog/SKILL.md`.

## Commands
```bash
bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts --blogId <blogId>
```

```bash
bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts \
  --blogId <blogId> \
  --reuseOutputDir <absolute-output-dir> \
  --rerunFailures \
  --focusSupportUnit <supportUnitKey>
```

```bash
bun .agents/skills/ingest-blog/scripts/check-support-unit-prs.ts \
  --outputDir <absolute-output-dir>
```

```bash
bun .agents/skills/ingest-blog/scripts/write-sample-fixture.ts \
  --blogId <blogId> \
  --logNo <logNo> \
  --id <fixtureId>
```

## Ingest Behavior
- Blog ingest uses `NaverBlogExporter` and forces remote asset references for the scan path.
- Image and thumbnail downloads stay disabled in the ingest scripts.
- Ingest-only helper modules and specs live under `.agents/skills/ingest-blog/scripts/lib`.
- A completed output for the same `blogId` can be reused when the manifest matches the blog and has `finishedAt`.
- When reusable output exists, rerun failed posts only unless `--forceFull` is explicitly requested.
- Previous successful posts are treated as stable during a failed-post rerun.
- Shared ingest output and aggregate run state stay under ignored `tmp/harness/ingest-blog/<runId>`.
- The first collect output's absolute `outputDir` is reused after branch switches with `--reuseOutputDir <absolute-output-dir>`.
- Relative `tmp/harness/...` reuse paths are not used while processing support-unit branches.
- `.cache/` is app runtime state and is not used for ingest workflow state.
- `--focusSupportUnit <key>` makes report generation and exit status use only the selected parser support unit.
- `check-support-unit-prs.ts` compares `failure-summary.json` support units with ready open PR body claim markers.

## Required Parser Coverage Outputs
- A real focused parser gap must be closed by adding a parser block or extending the owning block.
- Each fixed support unit needs one representative public sample fixture.
- Related knowledge changes are required when parser responsibility, fixture policy, output behavior, or verification expectations change.
- Unresolved focused failures are not fixed by adding placeholder fixtures or code. Report the reason, representative `logNo`, and inspect evidence instead.
- Other support units from the same blog stay out of the focused PR body, but each discovered support unit must get its own focused PR before the ingest turn is complete.

## Expected PR File Shape
- Before editing, infer whether the focused support unit is an existing-block edit or a new-block addition.
- Existing-block edits should normally touch the owning block file, its adjacent spec, one representative sample fixture, and durable knowledge only when the contract changed.
- New-block additions should normally add the block file, adjacent spec, owning editor registration, one representative sample fixture, and durable knowledge only when the contract changed.
- Committed `figure` evidence assets are allowed when report or PR evidence needs them.
- Renderer, exporter, shared AST types, UI, workflow, broad helpers, and unrelated knowledge stay out of the PR unless the focused failed HTML cannot fit existing contracts.
- If the necessary diff is wider than the expected file shape, the report should state why the wider change belongs to the focused support unit.

## Reports
- Every completed skill run writes `report.md`, `report.json`, and `evidence.md` under the ingest output directory.
- Full reports include ingest target, output reuse status, post counts, failed-post rerun result, parser changes, fixtures, knowledge updates, verification results, evidence, and unresolved failures.
- Focused reports include only the selected support unit, focused rerun result, parser changes, fixtures, knowledge updates, verification results, evidence, and unresolved focused failures.
- Evidence generation follows `.agents/knowledge/post-evidence.md`.
- Ingest report evidence uses the `figure` asset profile so PR/report images are stored in `.agents/knowledge/reference/assets/figure` instead of ignored `tmp` paths.
- Evidence capture errors make the report incomplete until fixed or explicitly explained.

## PR Policy
- Code, fixtures, knowledge, verification, and focused reports finish before PR handling.
- Invoking the repo-local `ingest-blog` skill is PR creation intent.
- Default behavior is to create ready PRs for all discovered support units without asking for confirmation.
- If a focused unit is safely deferred with no code or fixture changes, report the blocker and do not mark the ingest turn complete.
- Before editing each support unit branch, fetch `origin/main`.
- Multiple focused PRs are processed sequentially in the same working directory.
- Each support unit uses one branch named `worktree/ingest-blog-<safeSupportUnitKey>`, where `worktree/` is a branch prefix and no git worktree is created.
- Before moving to the next unit, `git status --short` must be clean so code from different PRs cannot mix.
- Before commit, push, or PR creation, the Local PR Gate must pass: `pnpm typecheck`, `pnpm test:coverage`, `pnpm smoke:ui`, and `pnpm check:unused`.
- If the Local PR Gate fails because of the focused diff, fix the diff and rerun the full gate. If the failure appears unrelated or flaky, rerun the failing command alone; if it still reproduces, stop PR creation and report the blocker.
- `pnpm check:local` is not part of the Local PR Gate because `pnpm typecheck` and `pnpm test:coverage` directly cover the CI-relevant type and Vitest checks.
- The PR title starts with exactly `[📦 New Block Parser]` when adding and registering a new parser block.
- The PR title starts with exactly `[🎉 Parser Improvement]` when extending or fixing an existing parser block.
- No other `ingest-blog` PR title prefix is used.
- The PR gets the `ai-generated` label.
- The PR body starts with one or two Korean summary lines that state what parser behavior changed.
- The hidden support unit claim marker follows the Korean summary.
- After the summary and marker, the visible PR body uses exactly three top-level sections: `# Parser Support`, `# Evidence`, and `# Original Html`.
- `# Parser Support` contains only `Editor` and `Parser Support` rows.
- `# Evidence` contains the raw-GitHub evidence image and rendered Markdown evidence without a source-post link.
- `# Original Html` contains the HTML that failed before the parser change in an `html` code fence.
- The visible PR body does not include source blog names, blog ids, log numbers, source-post URLs, or source-post link labels.
- PR Markdown evidence omits source frontmatter fields such as `source`, `blogId`, `logNo`, `publishedAt`, `category`, `categoryPath`, and `thumbnail`.
- PR evidence uses anonymous committed figure asset filenames so raw-GitHub image URLs do not reveal a source blog or post id.
- The PR body must not include visible root cause, changes, validation, notes, report, backlog, full-blog counts, or other support unit sections.
- Keep the hidden support unit claim marker as an HTML comment for the PR completion checker.
- PR evidence images use committed `figure` assets and `https://raw.githubusercontent.com/<owner>/<repo>/<headCommitSha>/<path>` URLs after push.
- PR evidence images must not use `tmp/`, `file://`, `.agents/...` relative paths, or paths that only render locally.
- PRs are ready for review by default. Do not create draft PRs, and do not count draft PR claims as complete.
- After PR creation, run `gh pr update-branch <number>` once when supported. A failed update-branch attempt is reported but does not block the support-unit PR.
- After each PR, run `check-support-unit-prs.ts --outputDir <absolute-output-dir>`.
- The turn may end only when the PR checker exits `0`.

## Coverage Target
- Use a public blog with unsupported parser blocks as the coverage target.
- Blogs with no unsupported parser blocks can check basic script health but are not parser coverage targets.
- Turn completion means every discovered `supportUnitKey` has a ready open PR body claim and `check-support-unit-prs.ts --outputDir <absolute-output-dir>` exits `0`.
- Aggregate target completion after merge still requires manifest `failureCount` `0`, empty failure groups, and no downloaded image files.

## Verification
- Validate the skill with the skill-creator `quick_validate.py` script against `.agents/skills/ingest-blog`.
- Check CLI surfaces with `bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts --help`, `bun .agents/skills/ingest-blog/scripts/write-sample-fixture.ts --help`, and `bun .agents/skills/ingest-blog/scripts/check-support-unit-prs.ts --help`.
- Use `bun scripts/post-evidence/capture-post-evidence.ts --help` for evidence CLI changes.
- Parser block changes need `pnpm test:parser-blocks` and `pnpm test:offline`.
- Broader parser, renderer, exporter, or UI state changes may require `pnpm check:local` or `pnpm check:full` according to `.agents/knowledge/verification.md`.
