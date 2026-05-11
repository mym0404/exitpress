# Refactoring Tasks

## Overall Success Criteria
- [x] legacy module tree를 `domain`, `shared`, `infra`, `integrations`, `parsing`, `markdown`, `exporting`, `server`, `ui` 구조로 해체
- [x] production 일반 모듈 250 LOC 이하 또는 명시 예외 기록
- [x] React app/feature component 400 LOC 이하
- [x] route handler 파일 250 LOC 이하
- [x] 단일 unit spec/support harness 800 LOC 이하
- [x] `tests/e2e/run-*.ts` 파일 300 LOC 이하
- [x] 순환 의존 0건
- [x] stale config path 0건
- [x] compatibility re-export 파일 0개
- [x] barrel `index.ts` 0개
- [x] `pnpm check:local` 통과
- [x] `pnpm check:unused` 통과
- [x] `pnpm smoke:ui` 통과
- [x] `pnpm check:full` 통과
- [x] `pnpm test:network` 통과 또는 외부 upload secret 제한 사유 기록

## Baseline
- [x] tracked 변경 없음 확인
- [x] 코드성 파일 수 기록: 268
- [x] LOC 상위 파일 기록
- [x] stale config path 확인
- [x] baseline `pnpm check:local` 실행: passed

## Module Tasks
- [x] 공용 계약을 `src/domain/*`으로 분리
- [x] 순수 helper를 `src/shared/*`로 분리
- [x] Node/runtime/http 인프라를 `src/infra/*`로 분리
- [x] Naver 수집 경계를 `src/integrations/naver-blog`로 분리
- [x] parser/editor/block 구조를 `src/parsing/naver-blog`로 재편
- [x] markdown renderer를 `src/markdown`로 분리
- [x] export workflow를 `src/exporting`으로 재편
- [x] server를 `http/routes/jobs/state/upload/static`으로 분리
- [x] UI app/options/results를 shell, step, panel, hook 단위로 분리
- [x] scripts를 `scripts/single-post`, `scripts/post-evidence`, `scripts/maintenance`로 분리
- [x] tests helper/e2e를 `tests/support`, `tests/e2e/scenarios`로 분리
- [x] AGENTS.md와 `.agents/knowledge/*` 갱신

## Import Gates
- [x] production `domain`은 `shared` 외 내부 상위 레이어 import 0건
- [x] production `shared`는 Node builtin import 0건
- [x] production `infra`는 `ui`, `server`, `exporting`, `parsing` import 0건
- [x] UI feature component의 legacy/server 직접 import 0건
- [x] `markdown`의 `exporting` import 0건
- [x] `integrations/naver-blog`의 `exporting`, `server`, `ui` import 0건
- [x] legacy test helper에서 e2e로 향하는 역방향 import 0건

## LOC Gates
- [x] 일반 production: 250 LOC 이하
- [x] 명시 예외: `src/server/upload/ImageUploadProviderMetadata.ts`는 provider option metadata catalogue 파일
- [x] React app/feature component: 400 LOC 이하
- [x] Route handler: 250 LOC 이하
- [x] Unit spec/support harness: 800 LOC 이하
- [x] E2E entry: 300 LOC 이하

## Stage Validation
- [x] 1단계 후 `pnpm check:local`: passed
- [x] 2단계 후 `pnpm check:local`: passed
- [x] 3단계 후 `pnpm check:local`: passed
- [x] 4단계 후 `pnpm check:local`: passed
- [x] 4단계 후 `pnpm test:parser-blocks`: passed
- [x] 5단계 후 `pnpm check:local`: passed
- [x] 6단계 후 `pnpm check:local`: passed
- [x] 6단계 후 `pnpm smoke:ui`: passed
- [x] 7단계 후 `pnpm check:local`: passed
- [x] 7단계 후 `pnpm smoke:ui`: passed
- [x] 8단계 후 `pnpm check:local`: passed
- [x] 8단계 후 `pnpm smoke:ui`: passed
- [x] 9단계 후 `pnpm check:local`: passed
- [x] final `pnpm check:local`: passed
- [x] final `pnpm check:unused`: passed
- [x] final `pnpm smoke:ui`: passed
- [x] final `pnpm check:full`: passed
- [x] final `pnpm test:network`: default live resume passed, SE2 table live resume passed, live upload token blocker recorded

## Subagent Validation
| Lens | Status | Notes |
| --- | --- | --- |
| parser | pass | SE2/SE3/SE4 locality, AST ownership, block registry locality, parser import 방향 통과 |
| export | pass | `PostExportUnit` 재사용, markdown/export decoupling, asset/upload/manifest 경계 통과 |
| server | pass | `HttpServer.ts` 축소, route/job/state/upload/static 분리, server spec support 분리 통과 |
| UI | pass | app shell, options steps, job results panels, API adapter, cross-layer import gate 통과 |
| scripts/tests | pass | CLI args/options/summary 분리, e2e scenario/support 분리, unit spec LOC gate 통과 |
| shared/infra | pass | domain/shared/infra production import 방향, alias/config stale path, cycle gate 통과 |

## Final Verification Notes
- [x] 2026-05-11 `pnpm check:local`: 102 files, 416 tests passed
- [x] 2026-05-11 `pnpm test:parser-blocks`: 43 files, 150 tests, 100% block coverage passed
- [x] 2026-05-11 `pnpm check:unused`: knip, tsc noUnused, tsserver passed
- [x] 2026-05-11 `pnpm smoke:ui`: build and 8 resume scenarios plus job smoke passed
- [x] 2026-05-11 `pnpm check:full`: `check:local` and `smoke:ui` passed
- [x] 2026-05-11 custom production import gate scan: violations 0
- [x] 2026-05-11 custom import graph cycle scan over source files: cycles 0
- [x] 2026-05-11 stale path scan: removed project old path references from config, docs, source, scripts, tests
- [x] 2026-05-11 `pnpm test:network`: default live resume passed with completedCount 2; SE2 table live resume passed with completedCount 4; live upload did not run in the full chain because `GOODBYE_UPLOAD_E2E=1` is not set
- [x] 2026-05-11 `GOODBYE_UPLOAD_E2E=1 bun tests/e2e/run-ui-live-upload.ts`: blocked before browser start because `GOODBYE_UPLOAD_E2E_GITHUB_TOKEN` is not present in shell env or `.env`
- [x] 2026-05-11 live resume fix: final completed manifest persist is scheduled after `jobStore.completeExport`
- [x] 2026-05-11 SE2 parser fix: top-level legacy `img.fx` / `img._postImage` nodes parse as image blocks
