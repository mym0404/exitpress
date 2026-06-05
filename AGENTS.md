# Agent Guide

## Project Overview
- 이 저장소는 공개 블로그 글을 수집해 플랫폼별 parser block으로 렌더 대상 block을 만들고, Markdown, frontmatter, 자산 파일, `manifest.json`으로 export하는 로컬 도구다.
- 로컬 웹 UI, 단건 export CLI, fixture-first regression, Playwright UI smoke, live network e2e를 함께 유지한다.

## Tech Stack
- `mise.toml`로 Node.js 24.16.0, pnpm 11.5.1, Bun 1.3.14를 고정하고, `pnpm` 단일 저장소에서 Node.js ESM, TypeScript, Bun 기반 TS 실행을 사용한다.
- 이 저장소에서 Node, pnpm, Bun 실행은 `mise`가 기준이다. 에이전트 셸에서 `pnpm`이 Corepack 래퍼로 잡히면 bare `pnpm`을 쓰지 말고 `mise exec -- pnpm <script>`를 실행한다.
- 웹 UI는 React, Vite, Tailwind CSS v4, shadcn/Radix, Sonner로 구성된다.
- 포맷과 import 정렬은 Oxfmt, 기본 lint는 Oxlint가 맡는다.
- 검증은 Oxfmt, Oxlint, Vitest, `tests/e2e/*` Playwright/Bun harness가 맡는다.

## Project Structure
```text
.
|-- AGENTS.md                         # root router for coding agents
|-- .agents/
|   |-- knowledge/                    # repo-local evergreen knowledge
|   `-- skills/ingest-blog/           # repo-local parser coverage workflow
|-- src/
|   |-- Server.ts                     # local server entrypoint
|   |-- domain/                       # parser, blog, export option/job, upload contracts
|   |-- shared/                       # runtime-neutral collection, text, date, error helpers
|   |-- infra/                        # Node, HTTP, runtime adapters
|   |-- integrations/naver-blog/      # current Naver Blog API and HTML fetch boundary
|   |-- parsing/naver-blog/           # parser core plus SE2, SE3, SE4 families
|   |-- markdown/                     # parsed block to Markdown renderer
|   |-- exporting/                    # workflow, post, assets, paths, upload
|   |-- server/                       # HTTP API, jobs, local state, upload catalog
|   `-- ui/
|       |-- app/                       # React route shell and wizard/storybook entry selection
|       |-- features/storybook/        # static Storybook catalog, preview UI, and bundled capture assets
|       |-- features/common/           # shell, hooks, and shared wizard/status UI
|       `-- styles/                    # global tokens and theme CSS
|-- scripts/
|   |-- single-post/                  # single post export CLI
|   |-- post-evidence/                # evidence capture/render helpers
|   `-- maintenance/                  # repository maintenance CLIs
|-- tests/
|   |-- e2e/                          # Playwright/Bun UI and live harnesses
|   |-- fixtures/samples/             # public sample expected outputs
|   `-- support/                      # fixture, server, and test-path helpers
|-- public/brand/                     # UI brand assets
|-- mise.toml                         # tool runtime versions
|-- .oxfmtrc.json                     # Oxfmt formatting and import sorting config
|-- .oxlintrc.json                    # Oxlint lint config
|-- .github/workflows/required-checks.yml
|-- .github/workflows/pages.yml       # Storybook-only GitHub Pages deployment
`-- package.json                      # repo-native commands
```

## Runtime And Architecture
- 서버 시작점은 `src/Server.ts`, HTTP API는 `src/server/http/HttpServer.ts`다.
- export 파이프라인은 `src/exporting/workflow/NaverBlogExporter.ts`에서 `fetch -> parse -> review -> render -> write -> manifest` 순서로 따라간다.
- parser seam은 `src/parsing/naver-blog/core/PostParser.ts`, `src/parsing/naver-blog/NaverBlog.ts`, `src/parsing/naver-blog/core/*`, `src/parsing/naver-blog/se2|se3|se4/*`다.
- UI 셸은 `src/ui/app/App.tsx`, 공용 shell/hook/status는 `src/ui/features/common/*`, Storybook page와 capture asset은 `src/ui/features/storybook/*`, 전역 토큰은 `src/ui/styles/globals.css`다.

## Design System
- UI 기준은 `.agents/knowledge/DESIGN.md`다.
- theme/token source of truth는 `src/ui/styles/globals.css`, primitive layer는 `src/ui/components/ui/*`다.
- dark-first single-column wizard, shadcn primitive 우선, 아이콘은 `@remixicon/react`만 유지한다.

## Operating Rules
- source of truth 우선순위는 사용자 지시, 루트 `AGENTS.md`, 코드/설정/테스트, `.agents/knowledge/*.md`, reference 문서다.
- 영속 UI 설정과 서버 파일 캐시는 `.cache/` 아래에 저장한다. 임시 테스트, harness, 런타임 config 파일은 repo-local `tmp/` 아래에 둔다.
- AI agent, test, harness가 서버를 띄울 때는 사용자 `mise exec -- pnpm dev`와 공유 `.cache/export-ui-settings.json`을 피하고, 별도 `EXITPRESS_SETTINGS_PATH`, `EXITPRESS_SCAN_CACHE_PATH`, repo-local `tmp/`, 비기본 `PORT` 또는 `listen(0)`을 쓴다.
- GitHub Pages는 repository settings에서 GitHub Actions source를 사용하고, `vite.pages.config.ts`의 `/exitpress/storybook/` base로 Storybook route만 배포한다.
- README, ingest report, PR 설명에 쓰는 evidence section 계약은 `.agents/knowledge/post-evidence.md`를 따른다.
- commit, push, PR 생성은 사용자가 명시적으로 요청한 경우에만 수행한다.

## Validation Routes
- `mise exec -- pnpm format`: Oxfmt formatter와 import sorting을 적용한다. 구조 변경이나 대량 import 수정 중간에 실행한다.
- `mise exec -- pnpm check:fmt`: Oxfmt formatting과 import sorting 기준선이다.
- `mise exec -- pnpm check:lint`: Oxlint lint 기준선이다.
- `mise exec -- pnpm check:local`: 저장소 파일 변경 뒤 기본 기준선이다. `check:fmt`, `check:lint`, `typecheck`, `test:offline`을 실행한다. 샘플 fixture 테스트는 live Naver HTML을 캐시하며 필요 시 네트워크를 쓴다.
- `mise exec -- pnpm check:unused`: source, test, script 코드의 dead code 기준선이다. `check:local`에는 포함되지 않는다.
- `mise exec -- pnpm check:full`: `check:local`에 Playwright smoke UI를 더한 넓은 로컬 회귀다.
- `mise exec -- pnpm smoke:ui`: mock 기반 UI 흐름과 복구 경로를 확인한다. 코어 사용자 흐름이나 상태 전이를 바꾼 뒤 실행한다.
- `mise exec -- pnpm exec vite build --config vite.pages.config.ts`: GitHub Pages용 Storybook 정적 산출물을 `dist/pages/storybook`에 만든다.
- `mise exec -- pnpm test:network`: live resume export, SE2 table resume export, live upload e2e를 순서대로 실행한다. 외부 네트워크와 upload secret이 필요하고 remote state를 만든다.
- 검증 명령이 실패하면 현재 작업이 만든 회귀인지 먼저 본다. 현재 작업 때문이면 고치고, 기존 상태나 다른 변경 때문이면 실패 명령과 영향 범위를 보고한다.

## Knowledge Router
- Architecture: `.agents/knowledge/architecture.md`
- Parser architecture and file layout: `.agents/knowledge/parser-architecture.md`
- Parser block contract: `.agents/knowledge/parser-blocks.md`
- Verification: `.agents/knowledge/verification.md`
- Product domain and output rules: `.agents/knowledge/domain.md`
- Sample fixtures: `.agents/knowledge/fixtures.md`
- Post evidence sections: `.agents/knowledge/post-evidence.md`
- Upload and resume lifecycle: `.agents/knowledge/upload.md`
- UI design system: `.agents/knowledge/DESIGN.md`
- Browser/manual UI verification: `.agents/knowledge/browser-verification.md`
- Single post verification: `.agents/knowledge/single-post-verification.md`
- Code style and local workflow: `.agents/knowledge/code-style.md`

## Knowledge System
- 루트 `AGENTS.md`는 agent entry와 지식 라우터 역할을 맡고, 영속 지식은 `.agents/knowledge/*`에 둔다.
- 프로젝트 구조, runtime entrypoint, 검증 명령, ownership boundary, 문서화된 동작이 바뀌면 같은 변경에서 루트 `AGENTS.md`와 관련 `.agents/knowledge/*` 문서를 함께 갱신한다.
- 작업별 범위, 성공 기준, 임시 제약, 선호, 예시는 사용자가 일반 지식으로 저장하라고 명시했거나 저장소 변경으로 현재 사실이 된 경우에만 영속 지식으로 남긴다.
- 현재 repository knowledge는 기존 상태를 설명한다. 의도된 기능 변경이나 구조 변경을 거절하는 근거로 단독 사용하지 않는다.
- Knowledge는 전체 코드 목록을 복제하지 않고 오래 유지되는 책임 경계, 운영 계약, 검증 기준만 담는다.
