# Verification

## Source Of Truth
- Package scripts live in `package.json`.
- CI lives in `.github/workflows/required-checks.yml`.
- UI smoke and live harnesses live in `tests/e2e/*`.
- Sample fixture regression lives in `tests/support/sample-fixtures.spec.ts` and `tests/support/sample-fixtures.ts`.
- Test and harness temporary paths are rooted through `tests/support/test-paths.ts` under repo-local `tmp/`.

## Primary Commands
- `pnpm check:biome`: `biome check .`. Runs the repository formatting, import organization, and lint baseline.
- `pnpm check:local`: `pnpm check:biome && pnpm typecheck && pnpm test:offline`. Run after ordinary repository file changes.
- `pnpm check:unused`: `bun scripts/maintenance/check-unused.ts`. Run when removing, exporting, moving, or intentionally keeping source/test/script code that may be unused. This command is not part of `check:local`.
- `pnpm check:full`: `pnpm check:local && pnpm smoke:ui`. Run when user flow, UI state, exporter output, or shared runtime behavior may be affected.
- `pnpm smoke:ui`: `pnpm build:ui && bun tests/e2e/run-ui-smoke-suite.ts`. Verifies mock-based scan, export, upload, theme persistence, and resume UI.
- `pnpm test:network`: builds UI once, then runs live resume export, SE2 table resume export, and live upload e2e. It needs external network and upload credentials and creates remote state.
- `pnpm test:coverage`: runs the full Vitest suite once with V8 coverage, enforces global coverage thresholds, and also enforces 100% coverage for parser block implementation globs.

## Focused Commands
- `pnpm format:biome`: applies Biome formatter output during multi-step edits.
- `pnpm check:biome:write`: applies Biome safe fixes and import organization when the intended change includes repository-wide formatting or import ordering.
- `pnpm typecheck`: TypeScript contract check only.
- `pnpm test:offline`: Vitest suite. Sample fixture tests fetch live Naver post HTML before comparing expected output, using the sample cache only outside CI.
- `pnpm test:parser-blocks`: parser block implementation coverage gate. It runs block-level parser specs with 100% line, function, branch, and statement coverage for `src/parsing/naver-blog/se*/blocks` implementation files.
- `pnpm test:network:resume-export`: live Naver resume export without upload.
- `pnpm test:network:resume-export:se2-table`: live SE2 table resume export range.
- `pnpm test:network:upload`: live browser UI export and GitHub upload through PicList runtime.
- `pnpm dev`: user-facing HMR server on the default development port. Harnesses should not reuse it.
- `pnpm start`: builds UI and serves `dist/client` through `src/Server.ts`.
- `bun scripts/maintenance/update-open-pr-branches.ts --help`: GitHub PR branch update CLI surface check. `pnpm gh:update-branches` changes remote PR branches through `gh pr update-branch`.
- `bun scripts/post-evidence/capture-post-evidence.ts --help`: post evidence CLI surface check. Live smoke cases may open Playwright and Naver mobile pages. Evidence section behavior is documented in `.agents/knowledge/post-evidence.md`.
- `bun .agents/skills/ingest-blog/scripts/collect-blog-errors.ts --help`: parser coverage ingest CLI surface check. Ingest workflow behavior is documented in `.agents/knowledge/ingest-blog.md`.

## Ingest Blog PR Gate
- Before each `ingest-blog` support-unit PR, run `pnpm check:biome`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm smoke:ui`, and `pnpm check:unused`.
- `pnpm check:biome`, `pnpm typecheck`, `pnpm test:coverage`, and `pnpm smoke:ui` mirror the non-draft PR CI checks.
- `pnpm check:unused` is an extra local source/test/script dead-code gate and is not part of CI.
- Do not add `pnpm check:local` to this gate because `pnpm check:biome`, `pnpm typecheck`, and `pnpm test:coverage` cover the relevant formatting, import, type, and Vitest checks directly.
- Network e2e is required only when live fetch, live resume, or upload behavior changes.

## Parser Block Unit Test
- Parser block specs live beside parser block implementations under `src/parsing/naver-blog/se2/blocks/*`, `src/parsing/naver-blog/se3/blocks/*`, and `src/parsing/naver-blog/se4/blocks/*`.
- Each parser block spec file covers one parser block responsibility through the real `NaverBlogSE*Editor.parse()` dispatch path.
- Each parser block spec that owns configurable block output options includes an `applies every output option` test that verifies every exposed option through parser dispatch.
- Shared parser fixture helpers live only in `tests/support/parser-test-utils.ts`.
- `src/parsing/naver-blog/core/PostParser.spec.ts` covers parser routing, tag extraction, same-blog link rewrite, and editor-specific output selection behavior.
- Parser block implementation changes require `pnpm test:parser-blocks` and `pnpm test:offline`.
- Parser routing changes require `pnpm test:offline`.

## Unused Code Verification
- `pnpm check:unused` succeeds only when `scripts/maintenance/check-unused.ts` reports no unresolved `knip`, `tsc noUnused`, or `tsserver` unused diagnostics.
- `knip` runs with `--include files,exports,types,nsExports,nsTypes,enumMembers,namespaceMembers,duplicates --no-progress`.
- `tsc noUnused` runs `tsc -p tsconfig.json --noEmit --noUnusedLocals --noUnusedParameters --pretty false`.
- `tsserver` opens `src/Server.ts`, reads the configured project file list with `projectInfo`, then checks `src`, `tests`, and `scripts` TypeScript files with `semanticDiagnosticsSync` and `suggestionDiagnosticsSync`.
- The unused script filters tsserver diagnostics to TypeScript unused diagnostic codes: `6133`, `6138`, `6192`, `6196`, `6198`, `6199`.
- Static false positives are allowed only inside `scripts/maintenance/check-unused.ts` allowlists when the file or export is a real runtime entrypoint that static analysis cannot see.
- Exact allowlisted file and export entrypoints live in `scripts/maintenance/check-unused.ts`.
- The command covers source/test/script dead code. It does not check unused package dependencies because the `knip` invocation intentionally excludes dependency categories.
- A syntax or type error in the TypeScript project can make `check:unused` fail before dead-code cleanup is meaningful; restore the type baseline first, then interpret unused diagnostics.

## Coverage And Blind Spots
- Sample fixtures prove current code matches live Naver post HTML for the recorded fixture URLs. They do not use committed source HTML snapshots.
- `pnpm check:unused` proves no known unused source/test/script items remain under its configured analyzers and allowlists, but it does not prove runtime reachability for dynamic external integrations.
- `pnpm smoke:ui` uses mock flows and does not prove live Naver fetch or external upload behavior.
- `pnpm test:network:resume-export` proves live fetch and resume export, but not external upload.
- `pnpm test:network:upload` is the only bundled command that proves external upload state. It creates remote state.
- CI does not run network e2e, so live resume and external upload are proven only by explicit `pnpm test:network:*` runs.

## CI
- `.github/workflows/required-checks.yml` runs on non-draft pull requests.
- CI uses Node.js 24, pnpm 10, and Bun 1.3.13.
- CI restores the Playwright browser cache keyed by the installed Playwright version, then runs `pnpm exec playwright install --with-deps --only-shell chromium`.
- CI runs `pnpm check:biome`, `pnpm typecheck`, `pnpm smoke:ui`, `pnpm test:coverage`, then uploads `coverage/lcov.info` to Codecov. CI does not run `pnpm test:offline` separately because `pnpm test:coverage` already runs the full Vitest suite.

## Task Loops
- Run `pnpm format:biome` during multi-step edits before the validation command when formatting or imports may have drifted.
- Knowledge-only changes still need path and command spot checks. Run `pnpm check:local` when practical.
- Dead-code cleanup needs `pnpm check:unused`; use `pnpm check:local` separately for the normal type and test baseline.
- Parser block changes need `pnpm test:parser-blocks` and `pnpm test:offline`.
- Editor dispatch or sample fixture changes need `pnpm test:offline` at minimum.
- Evidence capture or ingest report changes need the relevant CLI `--help`, focused unit tests for evidence/reuse helpers, and at least one full-post or inspect-path smoke case when network/browser access is part of the changed behavior. Evidence section errors are report errors, so verify the generated `errorCount` or `evidenceErrorCount` before treating the report as complete.
- Exporter, renderer, manifest, upload, resume, or UI state changes need `pnpm smoke:ui`.
- Live resume or upload changes need the matching `pnpm test:network:*` command.
- If a command fails, compare the failure to the current diff before changing code. Report unrelated existing failures without calling them pass.
