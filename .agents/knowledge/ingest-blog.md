# Ingest Blog

## Purpose
- The repo-local `ingest-blog` skill improves parser coverage from real public Naver Blog posts.
- It is a failure-driven parser coverage loop that discovers parser gaps and groups them into parser support units.
- The skill body at `.agents/skills/ingest-blog/SKILL.md` is the source of truth for run steps, target history, branch handling, PR titles, labels, body shape, and completion checks.
- This document keeps only repository-level contracts that affect parser coverage work.

## CLI Entry Points
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

## Repository Contracts
- Blog ingest uses `NaverBlogExporter` and forces remote asset references for the scan path.
- Image and thumbnail downloads stay disabled in the ingest scripts.
- Ingest-only helper modules and specs live under `.agents/skills/ingest-blog/scripts/lib`.
- A completed output for the same `blogId` can be reused when the manifest matches the blog and has `finishedAt`.
- When reusable output exists, rerun failed posts only unless `--forceFull` is explicitly requested.
- Previous successful posts are treated as stable during a failed-post rerun.
- Shared ingest output and aggregate run state stay under ignored `tmp/harness/ingest-blog/<runId>`.
- `.cache/` is app runtime state and is not used for ingest workflow state.
- `--focusSupportUnit <key>` makes report generation and exit status use only the selected parser support unit.
- A real focused parser gap must be closed by adding a parser block or extending the owning block.
- Each fixed support unit needs one representative public sample fixture.
- Related knowledge changes are required when parser responsibility, fixture policy, output behavior, or verification expectations change.
- Unresolved focused failures are not fixed by adding placeholder fixtures or code. Report the reason, representative `logNo`, and inspect evidence instead.

## Change Boundary
- Before editing, infer whether the focused support unit is an existing-block edit or a new-block addition.
- Existing-block edits should normally touch the owning block file, its adjacent spec, one representative sample fixture, and durable knowledge only when the contract changed.
- New-block additions should normally add the block file, adjacent spec, owning editor registration, one representative sample fixture, and durable knowledge only when the contract changed.
- Committed `figure` evidence assets are allowed when report or PR evidence needs them.
- Renderer, exporter, shared AST types, UI, workflow, broad helpers, and unrelated knowledge stay out of the PR unless the focused failed HTML cannot fit existing contracts.
- If the necessary diff is wider than the expected file shape, the report should state why the wider change belongs to the focused support unit.

## Reports And Evidence
- Every completed skill run writes `report.md`, `report.json`, and `evidence.md` under the ingest output directory.
- Evidence generation follows `.agents/knowledge/post-evidence.md`.
- Ingest report evidence uses the `figure` asset profile so PR/report images are stored in `.agents/knowledge/reference/assets/figure` instead of ignored `tmp` paths.
- Evidence capture errors make the report incomplete until fixed or explicitly explained.

## Verification
- Validate the skill with the skill-creator `quick_validate.py` script against `.agents/skills/ingest-blog`.
- Check CLI surfaces with `bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts --help`, `bun .agents/skills/ingest-blog/scripts/write-sample-fixture.ts --help`, and `bun .agents/skills/ingest-blog/scripts/check-support-unit-prs.ts --help`.
- Use `bun scripts/post-evidence/capture-post-evidence.ts --help` for evidence CLI changes.
- Parser block changes need `mise exec -- pnpm test:parser-blocks` and `mise exec -- pnpm test:offline`.
- Broader parser, renderer, exporter, or UI state changes may require `mise exec -- pnpm check:local` or `mise exec -- pnpm check:full` according to `.agents/knowledge/verification.md`.
