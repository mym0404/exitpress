# Agent Guide

## Project Overview

- This repository is a local export tool for public blog posts, with Naver runtime and provider adapters for additional blog platforms.
- It scans posts, parses provider/editor-specific content into blocks, renders Markdown, writes assets, and keeps resumable export state.
- The repo maintains a React web UI, server API, export engine, fixture regression tests, browser smoke coverage, and live network e2e coverage.

## Tech Stack

- Runtime versions are pinned by `mise.toml`: Node.js, pnpm, and Bun.
- Run repo commands through `mise exec -- pnpm ...`.
- The codebase uses TypeScript ESM, React, Vite, Tailwind CSS v4, shadcn/Radix primitives, Oxfmt, Oxlint, Vitest, and Playwright.

## Project Structure

```text
.
|-- AGENTS.md                 # agent entry and knowledge router
|-- .agents/knowledge/        # evergreen repo-local agent knowledge
|-- packages/domain/          # shared contracts and pure option/path logic
|-- packages/engine/          # provider interfaces, Naver engine, render/export/assets/upload rewrite
|-- packages/blog-naver/      # concrete Naver provider adapter
|-- packages/blog-tistory/    # minimal concrete Tistory provider adapter
|-- packages/server/          # local HTTP API, jobs, state, upload catalog, static serving
|-- packages/web/             # React export wizard, Storybook view, UI primitives
|-- scripts/                  # single-post, evidence, Storybook, maintenance CLIs
|-- tests/                    # Vitest/Playwright tests, fixtures, shared test support
|-- package.json              # repo-native commands
|-- pnpm-workspace.yaml       # package workspace
`-- mise.toml                 # toolchain source of truth
```

## Architecture

- Main runtime starts in the server package and serves the web UI plus HTTP APIs.
- Shared cross-package contracts live in owning folders under `schema/`.
- Shared utilities live in owning folders under `util/`; a single exported utility uses the function name as the file name.
- Dependency direction is `web -> domain`, `server -> domain, engine`, `engine -> domain`, and `blog-* -> domain, engine`.
- Read `.agents/knowledge/architecture.md` before changing package boundaries or runtime flow.

## Design System

- UI rules live in `.agents/knowledge/DESIGN.md`.
- UI changes use existing primitives, tokens, and dark-first wizard patterns.
- shadcn/Radix primitive implementations are used as-is; avoid testing their internals.

## Operating Rules

- Keep changes surgical and match nearby code style.
- Do not create branches, commits, pushes, PRs, or worktrees unless the user explicitly asks.
- Keep temporary harness/config output under repo-local `tmp/` or `.cache/` as documented.
- Do not preserve legacy compatibility shims unless the user explicitly asks for backward compatibility.
- Prefer Vitest for unit/integration/provider checks and Playwright Test for browser smoke/e2e; do not add new custom test runners or validation scripts when a standard runner can express the check.

## Validation Routes

- `mise exec -- pnpm check:test`: Vitest unit, integration, fixture, and provider checks.
- `mise exec -- pnpm check:playwright`: Playwright browser smoke and live e2e checks.
- `mise exec -- pnpm check:coverage`: Vitest coverage thresholds.
- `mise exec -- pnpm check:unused`: dead-code and unused export baseline; run after deleting, moving, or renaming code.
- `mise exec -- pnpm check:fmt`, `check:lint`, `check:type`, `check:build:server`, `check:build:web`, and `check:storybook`: focused static/build/catalog checks.
- Full validation details and blind spots live in `.agents/knowledge/verification.md`.

## Knowledge Router

- `.agents/knowledge/architecture.md`
- `.agents/knowledge/code-style.md`
- `.agents/knowledge/domain.md`
- `.agents/knowledge/parser-architecture.md`
- `.agents/knowledge/parser-blocks.md`
- `.agents/knowledge/upload.md`
- `.agents/knowledge/verification.md`
- `.agents/knowledge/DESIGN.md`
- `.agents/knowledge/browser-verification.md`
- `.agents/knowledge/fixtures.md`
- `.agents/knowledge/post-evidence.md`
- `.agents/knowledge/single-post-verification.md`

## Knowledge System

- Root `AGENTS.md` is the only router.
- Evergreen repo-local knowledge lives under `.agents/knowledge/*`.
- Update this file and the relevant knowledge documents in the same change whenever structure, runtime entrypoints, validation commands, ownership boundaries, or documented behavior change.
- Task-local scope, temporary criteria, one-off preferences, and examples are not durable repository knowledge unless the user explicitly makes them general or code changes make them current truth.
- Current knowledge describes the existing repository state and must not be used by itself to reject intentional functional or structural changes.
