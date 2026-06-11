# Blog Provider Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 Naver export 동작을 보존하면서 provider-neutral core 계약을 만들고, 새 provider 하네스에서 `blog-naver`와 최소 `blog-tistory`를 검증한다.

**Architecture:** `domain`은 직렬화 가능한 블로그 provider DTO와 content document 계약을 소유하고, `engine`은 런타임 인터페이스, registry, provider export harness를 소유한다. `blog-*` 패키지는 core 계약을 구현하는 concrete provider만 가진다. 이번 범위에서는 `server`를 바꾸지 않으므로 기존 서버용 Naver entrypoint와 새 provider 하네스 경로가 공존한다.

**Tech Stack:** TypeScript ESM, Bun, pnpm through `mise exec -- pnpm`, Vitest, Playwright/Bun e2e, Cheerio, existing engine Markdown renderer and asset store.

**VCS Rule:** 사용자가 명시적으로 요청하기 전에는 commit, push, PR을 만들지 않는다. 계획 실행 중 checkpoint가 필요하면 `git status --short`로 범위만 확인한다.

---

## Scope Rules

- Do not modify `packages/server/**` in this plan.
- Do not wire Tistory into the product UI in this plan.
- Do not remove legacy Naver imports used by server in this plan.
- Do not create provider-neutral `Base*`, `Abstract*`, `*Contract`, or `*Schema` types under `packages/blog-*`.
- Do not implement bot-detection bypass, VPN, proxy rotation, stealth browser, or fingerprint spoofing.
- Do run live e2e gates before calling implementation complete.

## File Structure

- Create `packages/domain/src/blog-provider/schema/BlogProvider.ts`
  - Owns serializable provider-neutral DTOs: `BlogSource`, `BlogPostRef`, `BlogContentDocument`, `BlogPostIdentity`, `BlogScanResult`.
- Create `packages/domain/src/blog-provider/schema/BlogProvider.spec.ts`
  - Locks content kind literals and representative DTO shapes.
- Create `packages/engine/src/blog-provider/BlogProvider.ts`
  - Owns runtime interfaces: `BlogProvider`, `BlogFetcher`, `BlogContentParser`, `BlogEditor`, `BlockParser`.
- Create `packages/engine/src/blog-provider/ProviderRegistry.ts`
  - Owns provider registration and duplicate key protection.
- Create `packages/engine/src/blog-provider/FetchPolicy.ts`
  - Owns request budget, concurrency, retry, and backoff primitives.
- Create `packages/engine/src/blog-provider/ProviderRegistry.spec.ts`
  - Verifies registry lookup and duplicate key failure.
- Create `packages/engine/src/blog-provider/FetchPolicy.spec.ts`
  - Verifies request budget, retry-after parsing, and backoff decision behavior.
- Create `packages/engine/src/exporting/provider/ProviderPostExportUnit.ts`
  - Exports one `BlogPostRef` through `BlogProvider.loadPostContent` and `BlogProvider.parseContent`.
- Create `packages/engine/src/exporting/provider/ProviderPostExportUnit.spec.ts`
  - Verifies markdown, html, and pre-parsed block providers can export through the same harness.
- Create `tests/support/provider/MockBlogProviders.ts`
  - Provides deterministic markdown/html/blocks providers for e2e-style engine harness tests.
- Create `tests/e2e/run-provider-mock-export.ts`
  - Runs provider-neutral mock export without server.
- Create `packages/blog-naver/package.json`
  - Workspace package for new Naver provider path.
- Create `packages/blog-naver/src/NaverBlogProvider.ts`
  - Concrete Naver provider for provider harness.
- Create `packages/blog-naver/src/NaverBlogProvider.spec.ts`
  - Verifies source parsing, template definitions, and output parity against legacy Naver parser path.
- Create `packages/blog-tistory/package.json`
  - Workspace package for minimal Tistory provider.
- Create `packages/blog-tistory/src/TistoryBlogProvider.ts`
  - Concrete Tistory provider with single public post URL support.
- Create `packages/blog-tistory/src/TistoryBlogProvider.spec.ts`
  - Verifies URL parsing and minimal HTML parsing with local fixture.
- Create `tests/e2e/run-provider-tistory-live.ts`
  - Runs live Tistory provider export from `EXITPRESS_TISTORY_LIVE_POST_URL`.
- Create `scripts/maintenance/check-blog-provider-boundaries.ts`
  - Verifies common abstractions are not defined in `packages/blog-*`.
- Modify `package.json`
  - Adds provider e2e and boundary check scripts.
- Modify `tsconfig.json`
  - Adds path aliases for `@exitpress/blog-naver/*` and `@exitpress/blog-tistory/*`.
- Modify `pnpm-workspace.yaml`
  - Already includes `packages/*`; no package glob change expected.
- Modify `.agents/knowledge/architecture.md`
  - Documents new provider package boundary and server exclusion for this scope.
- Modify `.agents/knowledge/verification.md`
  - Documents provider e2e, live Tistory e2e, and boundary check commands.

## Task 1: Baseline E2E Inventory

**Files:**
- Create: `docs/superpowers/e2e/blog-provider-refactor-inventory.md`

- [ ] **Step 1: Write the inventory document**

Create `docs/superpowers/e2e/blog-provider-refactor-inventory.md` with this content:

```markdown
# Blog Provider Refactor E2E Inventory

## Required Existing Gates
- `mise exec -- pnpm smoke:ui`
  - Covers mock browser UI flows for scan, options, block scan, export, upload progress, resume, and result screen.
- `mise exec -- pnpm test:network`
  - Covers live Naver resume export, live SE2 table export, and live upload flow.

## Required New Gates
- `mise exec -- pnpm test:provider:mock`
  - Covers provider-neutral engine export with markdown, html, and pre-parsed block mock providers.
- `mise exec -- pnpm test:provider:tistory`
  - Covers minimal live Tistory public post export through provider harness.
- `mise exec -- pnpm check:blog-boundaries`
  - Fails if provider-neutral abstractions are defined inside `packages/blog-*`.

## Scope Notes
- `server` is not migrated in this scope.
- Existing server Naver entrypoints stay until the next provider registry scope.
- Tistory is not exposed in the UI in this scope.
```

- [ ] **Step 2: Verify inventory file exists**

Run:

```bash
test -f docs/superpowers/e2e/blog-provider-refactor-inventory.md && sed -n '1,120p' docs/superpowers/e2e/blog-provider-refactor-inventory.md
```

Expected:

```text
# Blog Provider Refactor E2E Inventory
```

- [ ] **Step 3: Confirm no code changed**

Run:

```bash
git status --short
```

Expected: only docs changes from this task plus any pre-existing user changes.

## Task 2: Domain Provider DTOs

**Files:**
- Create: `packages/domain/src/blog-provider/schema/BlogProvider.ts`
- Create: `packages/domain/src/blog-provider/schema/BlogProvider.spec.ts`

- [ ] **Step 1: Write failing domain tests**

Create `packages/domain/src/blog-provider/schema/BlogProvider.spec.ts`:

```ts
import { describe, expect, it } from "vitest"

import { allBlogContentKinds } from "./BlogProvider.js"

import type {
  BlogContentDocument,
  BlogPostIdentity,
  BlogPostRef,
  BlogSource,
} from "./BlogProvider.js"

describe("blog provider domain schema", () => {
  it("keeps content kinds stable", () => {
    expect(allBlogContentKinds).toEqual(["html", "markdown", "blocks"])
  })

  it("represents provider-neutral source and post identity", () => {
    const source = {
      providerKey: "tistory",
      sourceId: "fixture-blog",
      displayName: "Fixture Blog",
      input: "https://fixture.tistory.com",
    } satisfies BlogSource
    const post = {
      providerKey: source.providerKey,
      sourceId: source.sourceId,
      postId: "42",
      title: "Fixture Post",
      sourceUrl: "https://fixture.tistory.com/42",
      publishedAt: "2026-06-10T00:00:00.000Z",
      categoryId: 0,
      categoryName: "Uncategorized",
      thumbnailUrl: undefined,
    } satisfies BlogPostRef
    const identity = {
      providerKey: "tistory",
      sourceId: "fixture-blog",
      postId: "42",
    } satisfies BlogPostIdentity

    expect(post.sourceId).toBe(source.sourceId)
    expect(identity.postId).toBe(post.postId)
  })

  it("allows html, markdown, and pre-parsed block content", () => {
    const documents = [
      {
        kind: "html",
        html: "<h1>Hello</h1>",
        sourceUrl: "https://example.com/html",
        tags: [],
      },
      {
        kind: "markdown",
        markdown: "# Hello",
        sourceUrl: "https://example.com/md",
        tags: ["markdown"],
      },
      {
        kind: "blocks",
        blocks: [{ blockId: "mock:paragraph", props: { text: "Hello" } }],
        sourceUrl: "https://example.com/blocks",
        tags: [],
      },
    ] satisfies BlogContentDocument[]

    expect(documents.map((document) => document.kind)).toEqual(["html", "markdown", "blocks"])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
mise exec -- pnpm test:offline -- packages/domain/src/blog-provider/schema/BlogProvider.spec.ts
```

Expected:

```text
FAIL packages/domain/src/blog-provider/schema/BlogProvider.spec.ts
```

Failure reason should mention missing `./BlogProvider.js`.

- [ ] **Step 3: Add domain DTOs**

Create `packages/domain/src/blog-provider/schema/BlogProvider.ts`:

```ts
import type { ParsedBlock } from "../../parser/schema/ParsedPost.js"

export const allBlogContentKinds = ["html", "markdown", "blocks"] as const
export type BlogContentKind = (typeof allBlogContentKinds)[number]

export type BlogSource = {
  providerKey: string
  sourceId: string
  displayName: string
  input: string
}

export type BlogCategoryRef = {
  id: number
  name: string
  parentId: number | undefined
  postCount: number
  path: string[]
  depth: number
}

export type BlogPostRef = {
  providerKey: string
  sourceId: string
  postId: string
  title: string
  sourceUrl: string
  publishedAt: string
  categoryId: number
  categoryName: string
  thumbnailUrl: string | undefined
}

export type BlogScanResult = {
  source: BlogSource
  totalPostCount: number
  categories: BlogCategoryRef[]
  posts: BlogPostRef[]
}

export type BlogPostIdentity = {
  providerKey: string
  sourceId: string
  postId: string
}

export type BlogHtmlContentDocument = {
  kind: "html"
  html: string
  sourceUrl: string
  tags: string[]
}

export type BlogMarkdownContentDocument = {
  kind: "markdown"
  markdown: string
  sourceUrl: string
  tags: string[]
}

export type BlogBlocksContentDocument = {
  kind: "blocks"
  blocks: ParsedBlock[]
  sourceUrl: string
  tags: string[]
}

export type BlogContentDocument =
  | BlogHtmlContentDocument
  | BlogMarkdownContentDocument
  | BlogBlocksContentDocument
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
mise exec -- pnpm test:offline -- packages/domain/src/blog-provider/schema/BlogProvider.spec.ts
```

Expected:

```text
PASS packages/domain/src/blog-provider/schema/BlogProvider.spec.ts
```

- [ ] **Step 5: Run typecheck for new DTOs**

Run:

```bash
mise exec -- pnpm typecheck
```

Expected:

```text
Found 0 errors.
```

## Task 3: Engine Runtime Interfaces And Registry

**Files:**
- Create: `packages/engine/src/blog-provider/BlogProvider.ts`
- Create: `packages/engine/src/blog-provider/ProviderRegistry.ts`
- Create: `packages/engine/src/blog-provider/ProviderRegistry.spec.ts`

- [ ] **Step 1: Write failing registry tests**

Create `packages/engine/src/blog-provider/ProviderRegistry.spec.ts`:

```ts
import { describe, expect, it } from "vitest"

import { createProviderRegistry } from "./ProviderRegistry.js"

import type { BlogProvider } from "./BlogProvider.js"

const createProvider = (key: string): BlogProvider => ({
  key,
  label: `${key} provider`,
  parseSource: (input) => ({
    providerKey: key,
    sourceId: input,
    displayName: input,
    input,
  }),
  scan: async (source) => ({
    source,
    totalPostCount: 0,
    categories: [],
    posts: [],
  }),
  loadPostContent: async () => ({
    kind: "markdown",
    markdown: "# empty",
    sourceUrl: "https://example.com",
    tags: [],
  }),
  parseContent: () => ({
    tags: [],
    blocks: [{ blockId: `${key}:paragraph`, props: { text: "empty" } }],
  }),
  getBlockTemplateDefinitions: () => [],
})

describe("createProviderRegistry", () => {
  it("finds registered providers by key", () => {
    const registry = createProviderRegistry([createProvider("naver"), createProvider("tistory")])

    expect(registry.get("naver")?.label).toBe("naver provider")
    expect(registry.require("tistory").key).toBe("tistory")
    expect(registry.list().map((provider) => provider.key)).toEqual(["naver", "tistory"])
  })

  it("rejects duplicate provider keys", () => {
    expect(() => createProviderRegistry([createProvider("naver"), createProvider("naver")])).toThrow(
      "Duplicate blog provider key: naver",
    )
  })

  it("throws for missing required provider", () => {
    const registry = createProviderRegistry([])

    expect(() => registry.require("missing")).toThrow("Unknown blog provider key: missing")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
mise exec -- pnpm test:offline -- packages/engine/src/blog-provider/ProviderRegistry.spec.ts
```

Expected:

```text
FAIL packages/engine/src/blog-provider/ProviderRegistry.spec.ts
```

Failure reason should mention missing `./ProviderRegistry.js`.

- [ ] **Step 3: Add runtime interfaces**

Create `packages/engine/src/blog-provider/BlogProvider.ts`:

```ts
import type {
  BlogContentDocument,
  BlogPostIdentity,
  BlogPostRef,
  BlogScanResult,
  BlogSource,
} from "@exitpress/domain/blog-provider/schema/BlogProvider.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { ParsedBlock, ParsedPost } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { ParserBlockOptions } from "@exitpress/domain/parser/schema/ParserBlockOptions.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"

export type BlogFetcher = {
  scan: (source: BlogSource) => Promise<BlogScanResult>
  loadPostContent: (input: {
    source: BlogSource
    post: BlogPostRef
    signal?: AbortSignal
  }) => Promise<BlogContentDocument>
  downloadBinary?: (input: { sourceUrl: string; destinationPath: string }) => Promise<void>
}

export type BlogContentParser = {
  parseContent: (input: {
    source: BlogSource
    post: BlogPostRef
    content: BlogContentDocument
    options: Pick<ExportOptions, "blockOutputs" | "assets"> & {
      resolveLinkUrl?: (url: string) => string
    }
  }) => ParsedPost
}

export type BlogEditor = {
  type: string
  label: string
  canParse: (input: BlogContentDocument) => boolean
  parse: (input: {
    content: BlogContentDocument
    options: ParserBlockOptions
    resolveLinkUrl?: (url: string) => string
  }) => ParsedPost
  getBlockTemplateDefinitions: () => BlockTemplateDefinition[]
}

export type BlockParser = {
  id: string
  label: string
  parse: (input: {
    content: BlogContentDocument
    options: ParserBlockOptions
  }) => ParsedBlock[]
}

export type BlogProvider = BlogFetcher &
  BlogContentParser & {
    key: string
    label: string
    parseSource: (input: string) => BlogSource
    getBlockTemplateDefinitions: () => BlockTemplateDefinition[]
    resolvePostLinkIdentity?: (url: string) => BlogPostIdentity | undefined
  }
```

- [ ] **Step 4: Add provider registry**

Create `packages/engine/src/blog-provider/ProviderRegistry.ts`:

```ts
import type { BlogProvider } from "./BlogProvider.js"

export type ProviderRegistry = {
  list: () => BlogProvider[]
  get: (key: string) => BlogProvider | undefined
  require: (key: string) => BlogProvider
}

export const createProviderRegistry = (providers: BlogProvider[]): ProviderRegistry => {
  const providerByKey = new Map<string, BlogProvider>()

  providers.forEach((provider) => {
    if (providerByKey.has(provider.key)) {
      throw new Error(`Duplicate blog provider key: ${provider.key}`)
    }

    providerByKey.set(provider.key, provider)
  })

  return {
    list: () => [...providerByKey.values()],
    get: (key) => providerByKey.get(key),
    require: (key) => {
      const provider = providerByKey.get(key)

      if (!provider) {
        throw new Error(`Unknown blog provider key: ${key}`)
      }

      return provider
    },
  }
}
```

- [ ] **Step 5: Run registry tests**

Run:

```bash
mise exec -- pnpm test:offline -- packages/engine/src/blog-provider/ProviderRegistry.spec.ts
```

Expected:

```text
PASS packages/engine/src/blog-provider/ProviderRegistry.spec.ts
```

## Task 4: Fetch Policy Core

**Files:**
- Create: `packages/engine/src/blog-provider/FetchPolicy.ts`
- Create: `packages/engine/src/blog-provider/FetchPolicy.spec.ts`

- [ ] **Step 1: Write failing fetch policy tests**

Create `packages/engine/src/blog-provider/FetchPolicy.spec.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  consumeRequestBudget,
  createDefaultFetchPolicy,
  getRetryDelayMs,
  parseRetryAfterMs,
} from "./FetchPolicy.js"

describe("FetchPolicy", () => {
  it("creates conservative defaults", () => {
    expect(createDefaultFetchPolicy()).toEqual({
      concurrency: 1,
      minimumIntervalMs: 1_000,
      timeoutMs: 10_000,
      retryDelaysMs: [0, 1_000, 3_000],
      requestBudget: 30,
      cacheTtlMs: 86_400_000,
    })
  })

  it("consumes request budget without going negative", () => {
    expect(consumeRequestBudget({ remaining: 2 })).toEqual({ remaining: 1, allowed: true })
    expect(consumeRequestBudget({ remaining: 0 })).toEqual({ remaining: 0, allowed: false })
  })

  it("parses Retry-After seconds", () => {
    expect(parseRetryAfterMs("3")).toBe(3_000)
  })

  it("prefers Retry-After over retry schedule", () => {
    expect(getRetryDelayMs({ retryAfter: "5", retryDelaysMs: [0, 1_000], attemptIndex: 1 })).toBe(
      5_000,
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
mise exec -- pnpm test:offline -- packages/engine/src/blog-provider/FetchPolicy.spec.ts
```

Expected:

```text
FAIL packages/engine/src/blog-provider/FetchPolicy.spec.ts
```

- [ ] **Step 3: Add FetchPolicy implementation**

Create `packages/engine/src/blog-provider/FetchPolicy.ts`:

```ts
export type FetchPolicy = {
  concurrency: number
  minimumIntervalMs: number
  timeoutMs: number
  retryDelaysMs: number[]
  requestBudget: number
  cacheTtlMs: number
}

export const createDefaultFetchPolicy = (): FetchPolicy => ({
  concurrency: 1,
  minimumIntervalMs: 1_000,
  timeoutMs: 10_000,
  retryDelaysMs: [0, 1_000, 3_000],
  requestBudget: 30,
  cacheTtlMs: 86_400_000,
})

export const consumeRequestBudget = ({ remaining }: { remaining: number }) => {
  if (remaining <= 0) {
    return { remaining: 0, allowed: false }
  }

  return { remaining: remaining - 1, allowed: true }
}

export const parseRetryAfterMs = (value: string | undefined) => {
  if (!value) {
    return undefined
  }

  const seconds = Number(value)

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000
  }

  const dateMs = Date.parse(value)

  if (!Number.isFinite(dateMs)) {
    return undefined
  }

  return Math.max(0, dateMs - Date.now())
}

export const getRetryDelayMs = ({
  retryAfter,
  retryDelaysMs,
  attemptIndex,
}: {
  retryAfter?: string
  retryDelaysMs: number[]
  attemptIndex: number
}) => parseRetryAfterMs(retryAfter) ?? retryDelaysMs[attemptIndex] ?? undefined
```

- [ ] **Step 4: Run fetch policy tests**

Run:

```bash
mise exec -- pnpm test:offline -- packages/engine/src/blog-provider/FetchPolicy.spec.ts
```

Expected:

```text
PASS packages/engine/src/blog-provider/FetchPolicy.spec.ts
```

## Task 5: Provider Export Unit

**Files:**
- Create: `tests/support/provider/MockBlogProviders.ts`
- Create: `packages/engine/src/exporting/provider/ProviderPostExportUnit.ts`
- Create: `packages/engine/src/exporting/provider/ProviderPostExportUnit.spec.ts`

- [ ] **Step 1: Write failing provider export tests**

Create `packages/engine/src/exporting/provider/ProviderPostExportUnit.spec.ts`:

```ts
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { createMarkdownMockProvider } from "@tests/support/provider/MockBlogProviders.js"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { exportProviderPostUnit } from "./ProviderPostExportUnit.js"

let tempDir = ""

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "exitpress-provider-export-"))
})

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

describe("exportProviderPostUnit", () => {
  it("exports markdown provider content through the shared renderer", async () => {
    const provider = createMarkdownMockProvider()
    const source = provider.parseSource("mock-blog")
    const scan = await provider.scan(source)
    const post = scan.posts[0]!
    const options = defaultExportOptions()

    const result = await exportProviderPostUnit({
      provider,
      source,
      outputDir: tempDir,
      post,
      categories: scan.categories,
      options,
      uploadEnabled: false,
      abortSignal: null,
    })

    expect(result.jobItem.status).toBe("success")
    expect(result.blockIds).toEqual(["mock:paragraph"])

    const markdown = await readFile(result.markdownFilePath, "utf8")
    expect(markdown).toContain("Hello from markdown provider")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
mise exec -- pnpm test:offline -- packages/engine/src/exporting/provider/ProviderPostExportUnit.spec.ts
```

Expected:

```text
FAIL packages/engine/src/exporting/provider/ProviderPostExportUnit.spec.ts
```

- [ ] **Step 3: Add mock provider**

Create `tests/support/provider/MockBlogProviders.ts`:

```ts
import type { BlogProvider } from "@exitpress/engine/blog-provider/BlogProvider.js"

const sourceUrl = "https://mock.example.com/posts/hello"

export const createMarkdownMockProvider = (): BlogProvider => ({
  key: "mock-markdown",
  label: "Mock Markdown",
  parseSource: (input) => ({
    providerKey: "mock-markdown",
    sourceId: input,
    displayName: input,
    input,
  }),
  scan: async (source) => ({
    source,
    totalPostCount: 1,
    categories: [
      {
        id: 0,
        name: "Uncategorized",
        parentId: undefined,
        postCount: 1,
        path: ["Uncategorized"],
        depth: 0,
      },
    ],
    posts: [
      {
        providerKey: "mock-markdown",
        sourceId: source.sourceId,
        postId: "hello",
        title: "Hello",
        sourceUrl,
        publishedAt: "2026-06-10T00:00:00.000Z",
        categoryId: 0,
        categoryName: "Uncategorized",
        thumbnailUrl: undefined,
      },
    ],
  }),
  loadPostContent: async () => ({
    kind: "markdown",
    markdown: "Hello from markdown provider",
    sourceUrl,
    tags: ["mock"],
  }),
  parseContent: ({ content }) => {
    if (content.kind !== "markdown") {
      throw new Error(`Unsupported mock content kind: ${content.kind}`)
    }

    return {
      tags: content.tags,
      blocks: [{ blockId: "mock:paragraph", props: { text: content.markdown } }],
    }
  },
  getBlockTemplateDefinitions: () => [
    {
      key: "mock:paragraph",
      label: "Mock Paragraph",
      description: "Paragraph emitted by the markdown mock provider.",
      props: [{ name: "text", label: "text", type: "string" }],
      presets: [{ label: "Default", template: "{{ text }}" }],
    },
  ],
})
```

- [ ] **Step 4: Add provider export unit**

Create `packages/engine/src/exporting/provider/ProviderPostExportUnit.ts`:

```ts
import { writeFile } from "node:fs/promises"
import path from "node:path"

import type { BlogCategoryRef, BlogPostRef, BlogSource } from "@exitpress/domain/blog-provider/schema/BlogProvider.js"
import type { CategoryInfo, PostSummary } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { BlogProvider } from "@exitpress/engine/blog-provider/BlogProvider.js"

import { AssetStore } from "../assets/AssetStore.js"
import { createPostUploadSummary } from "../manifest/ExportManifestProgress.js"
import { buildMarkdownFilePath } from "../paths/ExportPaths.js"
import { dedupeUploadCandidatesByLocalPath } from "../upload/util/dedupeUploadCandidatesByLocalPath.js"
import { createSuccessPostResult } from "../post/PostExportResult.js"
import { ensureDir } from "../../infra/node/util/FilePaths.js"
import { throwIfAborted } from "../../infra/runtime/AbortOperation.js"
import { renderMarkdownPost } from "../../markdown/util/renderMarkdownPost.js"

const toCategoryInfo = (category: BlogCategoryRef): CategoryInfo => ({
  id: category.id,
  name: category.name,
  parentId: category.parentId ?? null,
  postCount: category.postCount,
  isDivider: false,
  isOpen: true,
  path: category.path,
  depth: category.depth,
})

const toPostSummary = ({ post }: { post: BlogPostRef }): PostSummary => ({
  blogId: post.sourceId,
  logNo: post.postId,
  title: post.title,
  publishedAt: post.publishedAt,
  categoryId: post.categoryId,
  categoryName: post.categoryName,
  source: post.sourceUrl,
  thumbnailUrl: post.thumbnailUrl ?? null,
})

export const exportProviderPostUnit = async ({
  provider,
  source,
  outputDir,
  post,
  categories,
  options,
  uploadEnabled,
  abortSignal,
}: {
  provider: BlogProvider
  source: BlogSource
  outputDir: string
  post: BlogPostRef
  categories: BlogCategoryRef[]
  options: ExportOptions
  uploadEnabled: boolean
  abortSignal: AbortSignal | null
}) => {
  const summary = toPostSummary({ post })
  const category = toCategoryInfo(
    categories.find((candidate) => candidate.id === post.categoryId) ??
      categories[0] ?? {
        id: post.categoryId,
        name: post.categoryName,
        parentId: undefined,
        postCount: 1,
        path: [post.categoryName],
        depth: 0,
      },
  )
  const markdownFilePath = buildMarkdownFilePath({
    outputDir,
    post: summary,
    category,
    options,
  })
  const assetStore = new AssetStore({
    outputDir,
    downloader: provider.downloadBinary
      ? { downloadBinary: provider.downloadBinary }
      : { downloadBinary: async () => undefined },
    options,
  })
  const content = await provider.loadPostContent({
    source,
    post,
    signal: abortSignal ?? undefined,
  })

  throwIfAborted(abortSignal)

  const parsedPost = provider.parseContent({
    source,
    post,
    content,
    options: {
      blockOutputs: options.blockOutputs,
      assets: options.assets,
    },
  })
  const rendered = await renderMarkdownPost({
    post: summary,
    category,
    parsedPost,
    defaultBlockTemplates: Object.fromEntries(
      provider.getBlockTemplateDefinitions().flatMap((definition) => {
        const template = definition.presets[0]?.template

        return template === undefined ? [] : [[definition.key, template]]
      }),
    ),
    markdownFilePath,
    options,
    resolveAsset: async (input) => assetStore.saveAsset(input),
  })

  throwIfAborted(abortSignal)
  await ensureDir(path.dirname(markdownFilePath))
  await writeFile(markdownFilePath, rendered.markdown, "utf8")

  const assetPaths = rendered.assetRecords
    .map((asset) => asset.relativePath)
    .filter((assetPath): assetPath is string => Boolean(assetPath))
  const uploadCandidates = uploadEnabled
    ? dedupeUploadCandidatesByLocalPath(
        rendered.assetRecords
          .map((asset) => asset.uploadCandidate)
          .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate)),
      )
    : []

  return {
    ...createSuccessPostResult({
      post: summary,
      category,
      outputDir,
      markdownFilePath,
      assetPaths,
      upload: createPostUploadSummary(uploadCandidates),
    }),
    markdown: rendered.markdown,
    markdownFilePath,
    blockIds: [...new Set(parsedPost.blocks.map((block) => block.blockId))],
    assetPaths,
  }
}
```

- [ ] **Step 5: Run provider export test**

Run:

```bash
mise exec -- pnpm test:offline -- packages/engine/src/exporting/provider/ProviderPostExportUnit.spec.ts
```

Expected:

```text
PASS packages/engine/src/exporting/provider/ProviderPostExportUnit.spec.ts
```

## Task 6: Provider Mock E2E Script

**Files:**
- Create: `tests/e2e/run-provider-mock-export.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing e2e script**

Create `tests/e2e/run-provider-mock-export.ts`:

```ts
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { exportProviderPostUnit } from "@exitpress/engine/exporting/provider/ProviderPostExportUnit.js"
import { createMarkdownMockProvider } from "@tests/support/provider/MockBlogProviders.js"

const tempDir = await mkdtemp(path.join(os.tmpdir(), "exitpress-provider-mock-e2e-"))

try {
  const provider = createMarkdownMockProvider()
  const source = provider.parseSource("mock-blog")
  const scan = await provider.scan(source)
  const post = scan.posts[0]

  if (!post) {
    throw new Error("mock provider did not return a post")
  }

  const result = await exportProviderPostUnit({
    provider,
    source,
    outputDir: tempDir,
    post,
    categories: scan.categories,
    options: defaultExportOptions(),
    uploadEnabled: false,
    abortSignal: null,
  })
  const markdown = await readFile(result.markdownFilePath, "utf8")

  if (!markdown.includes("Hello from markdown provider")) {
    throw new Error(`mock provider markdown did not contain expected text: ${markdown}`)
  }

  console.log("provider mock export passed")
} finally {
  await rm(tempDir, { recursive: true, force: true })
}
```

- [ ] **Step 2: Run script to verify it fails before package script wiring**

Run:

```bash
mise exec -- pnpm exec bun tests/e2e/run-provider-mock-export.ts
```

Expected before previous tasks are complete:

```text
error: Cannot find module
```

Expected after previous tasks are complete:

```text
provider mock export passed
```

- [ ] **Step 3: Add package script**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "test:provider:mock": "bun tests/e2e/run-provider-mock-export.ts"
  }
}
```

Keep all existing scripts and add this key near other `test:*` scripts.

- [ ] **Step 4: Run provider mock script**

Run:

```bash
mise exec -- pnpm test:provider:mock
```

Expected:

```text
provider mock export passed
```

## Task 7: Blog Package Workspace Scaffolding

**Files:**
- Create: `packages/blog-naver/package.json`
- Create: `packages/blog-tistory/package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Write package manifests**

Create `packages/blog-naver/package.json`:

```json
{
  "name": "@exitpress/blog-naver",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    "./*.js": {
      "types": "./src/*.ts",
      "default": "./src/*.ts"
    }
  },
  "dependencies": {
    "@exitpress/domain": "workspace:*",
    "@exitpress/engine": "workspace:*",
    "cheerio": "catalog:",
    "domhandler": "catalog:"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

Create `packages/blog-tistory/package.json`:

```json
{
  "name": "@exitpress/blog-tistory",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    "./*.js": {
      "types": "./src/*.ts",
      "default": "./src/*.ts"
    }
  },
  "dependencies": {
    "@exitpress/domain": "workspace:*",
    "@exitpress/engine": "workspace:*",
    "cheerio": "catalog:"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

- [ ] **Step 2: Add TypeScript path aliases**

Modify `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@exitpress/blog-naver/*": ["packages/blog-naver/src/*"],
      "@exitpress/blog-tistory/*": ["packages/blog-tistory/src/*"]
    }
  }
}
```

Keep existing path aliases unchanged.

- [ ] **Step 3: Install workspace links**

Run:

```bash
mise exec -- pnpm install --lockfile-only
```

Expected:

```text
Done
```

- [ ] **Step 4: Verify workspace packages resolve**

Run:

```bash
mise exec -- pnpm typecheck
```

Expected:

```text
Found 0 errors.
```

## Task 8: Blog Naver Provider Harness

**Files:**
- Create: `packages/blog-naver/src/NaverBlogProvider.ts`
- Create: `packages/blog-naver/src/NaverBlogProvider.spec.ts`

- [ ] **Step 1: Write failing Naver provider tests**

Create `packages/blog-naver/src/NaverBlogProvider.spec.ts`:

```ts
import { describe, expect, it } from "vitest"

import { createNaverBlogProvider } from "./NaverBlogProvider.js"

describe("createNaverBlogProvider", () => {
  it("parses Naver blog source input", () => {
    const provider = createNaverBlogProvider()

    expect(provider.parseSource("https://blog.naver.com/mym0404")).toEqual({
      providerKey: "naver",
      sourceId: "mym0404",
      displayName: "mym0404",
      input: "https://blog.naver.com/mym0404",
    })
  })

  it("exposes Naver block template definitions", () => {
    const provider = createNaverBlogProvider()
    const keys = provider.getBlockTemplateDefinitions().map((definition) => definition.key)

    expect(keys).toContain("naver-se4:paragraph")
    expect(keys).toContain("naver-se4:image")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
mise exec -- pnpm test:offline -- packages/blog-naver/src/NaverBlogProvider.spec.ts
```

Expected:

```text
FAIL packages/blog-naver/src/NaverBlogProvider.spec.ts
```

- [ ] **Step 3: Add Naver provider adapter**

Create `packages/blog-naver/src/NaverBlogProvider.ts`:

```ts
import { extractBlogId } from "@exitpress/domain/blog/NaverUrl.js"
import { NaverBlogFetcher } from "@exitpress/engine/integrations/naver-blog/NaverBlogFetcher.js"
import { NaverBlog } from "@exitpress/engine/parsing/naver-blog/NaverBlog.js"
import { parsePostHtml } from "@exitpress/engine/parsing/naver-blog/core/PostParser.js"

import type { BlogPostRef, BlogSource } from "@exitpress/domain/blog-provider/schema/BlogProvider.js"
import type { BlogProvider } from "@exitpress/engine/blog-provider/BlogProvider.js"

export const createNaverBlogProvider = (): BlogProvider => {
  const blog = new NaverBlog()

  return {
    key: "naver",
    label: "Naver Blog",
    parseSource: (input) => {
      const sourceId = extractBlogId(input)

      return {
        providerKey: "naver",
        sourceId,
        displayName: sourceId,
        input,
      }
    },
    scan: async (source: BlogSource) => {
      const fetcher = new NaverBlogFetcher({ blogId: source.sourceId })
      const scan = await fetcher.scanBlog({ includePosts: true })

      return {
        source,
        totalPostCount: scan.totalPostCount,
        categories: scan.categories.map((category) => ({
          id: category.id,
          name: category.name,
          parentId: category.parentId ?? undefined,
          postCount: category.postCount,
          path: category.path,
          depth: category.depth,
        })),
        posts: (scan.posts ?? []).map((post) => ({
          providerKey: "naver",
          sourceId: post.blogId,
          postId: post.logNo,
          title: post.title,
          sourceUrl: post.source,
          publishedAt: post.publishedAt,
          categoryId: post.categoryId,
          categoryName: post.categoryName,
          thumbnailUrl: post.thumbnailUrl ?? undefined,
        })),
      }
    },
    loadPostContent: async ({ source, post }: { source: BlogSource; post: BlogPostRef }) => {
      const fetcher = new NaverBlogFetcher({ blogId: source.sourceId })
      const html = await fetcher.fetchPostHtml(post.postId)

      return {
        kind: "html",
        html,
        sourceUrl: post.sourceUrl,
        tags: [],
      }
    },
    parseContent: ({ content, options }) => {
      if (content.kind !== "html") {
        throw new Error(`Naver provider only supports html content: ${content.kind}`)
      }

      return parsePostHtml({
        html: content.html,
        sourceUrl: content.sourceUrl,
        options,
      })
    },
    getBlockTemplateDefinitions: () => blog.getBlockTemplateDefinitions(),
  }
}
```

This adapter intentionally uses legacy Naver engine entrypoints because `server` is not migrated in this scope. The next server registry scope removes those legacy entrypoints.

- [ ] **Step 4: Run Naver provider tests**

Run:

```bash
mise exec -- pnpm test:offline -- packages/blog-naver/src/NaverBlogProvider.spec.ts
```

Expected:

```text
PASS packages/blog-naver/src/NaverBlogProvider.spec.ts
```

## Task 9: Blog Tistory Minimal Provider

**Files:**
- Create: `packages/blog-tistory/src/TistoryBlogProvider.ts`
- Create: `packages/blog-tistory/src/TistoryBlogProvider.spec.ts`

- [ ] **Step 1: Write failing Tistory provider tests**

Create `packages/blog-tistory/src/TistoryBlogProvider.spec.ts`:

```ts
import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { describe, expect, it, vi } from "vitest"

import { createTistoryBlogProvider } from "./TistoryBlogProvider.js"

const html = String.raw`
  <html>
    <head>
      <title>Fixture Tistory Post</title>
      <meta property="og:title" content="Fixture Tistory Post" />
      <meta property="article:published_time" content="2026-06-10T00:00:00+09:00" />
    </head>
    <body>
      <article>
        <h1>Fixture Tistory Post</h1>
        <p>Hello from Tistory.</p>
        <p><a href="https://example.com">Example Link</a></p>
      </article>
    </body>
  </html>
`

describe("createTistoryBlogProvider", () => {
  it("parses Tistory post URL source", () => {
    const provider = createTistoryBlogProvider({ fetchText: async () => html })

    expect(provider.parseSource("https://sample.tistory.com/42")).toEqual({
      providerKey: "tistory",
      sourceId: "sample.tistory.com",
      displayName: "sample.tistory.com",
      input: "https://sample.tistory.com/42",
    })
  })

  it("loads and parses a minimal public post", async () => {
    const fetchText = vi.fn(async () => html)
    const provider = createTistoryBlogProvider({ fetchText })
    const source = provider.parseSource("https://sample.tistory.com/42")
    const scan = await provider.scan(source)
    const post = scan.posts[0]!
    const content = await provider.loadPostContent({ source, post })
    const options = defaultExportOptions()
    const parsed = provider.parseContent({
      source,
      post,
      content,
      options: {
        blockOutputs: options.blockOutputs,
        assets: options.assets,
      },
    })

    expect(post.title).toBe("Fixture Tistory Post")
    expect(fetchText).toHaveBeenCalledWith("https://sample.tistory.com/42")
    expect(parsed.blocks.map((block) => block.blockId)).toEqual([
      "tistory:heading",
      "tistory:paragraph",
      "tistory:paragraph",
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
mise exec -- pnpm test:offline -- packages/blog-tistory/src/TistoryBlogProvider.spec.ts
```

Expected:

```text
FAIL packages/blog-tistory/src/TistoryBlogProvider.spec.ts
```

- [ ] **Step 3: Add Tistory provider**

Create `packages/blog-tistory/src/TistoryBlogProvider.ts`:

```ts
import * as cheerio from "cheerio"

import type { BlogPostRef, BlogSource } from "@exitpress/domain/blog-provider/schema/BlogProvider.js"
import type { BlogProvider } from "@exitpress/engine/blog-provider/BlogProvider.js"

const getMetaContent = ($: cheerio.CheerioAPI, selector: string) =>
  $(selector).attr("content")?.trim()

const toTistoryPostId = (input: string) => {
  const url = new URL(input)
  const pathId = url.pathname.split("/").filter(Boolean).at(-1)

  if (!pathId) {
    throw new Error("Tistory post URL must include a post path")
  }

  return pathId
}

export const createTistoryBlogProvider = ({
  fetchText = async (url: string) => {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Tistory fetch failed: ${response.status}`)
    }

    return response.text()
  },
}: {
  fetchText?: (url: string) => Promise<string>
} = {}): BlogProvider => ({
  key: "tistory",
  label: "Tistory",
  parseSource: (input) => {
    const url = new URL(input)

    return {
      providerKey: "tistory",
      sourceId: url.host,
      displayName: url.host,
      input,
    }
  },
  scan: async (source: BlogSource) => {
    const postId = toTistoryPostId(source.input)
    const html = await fetchText(source.input)
    const $ = cheerio.load(html)
    const title = getMetaContent($, 'meta[property="og:title"]') ?? $("title").first().text().trim()
    const publishedAt =
      getMetaContent($, 'meta[property="article:published_time"]') ?? new Date(0).toISOString()

    return {
      source,
      totalPostCount: 1,
      categories: [
        {
          id: 0,
          name: "Uncategorized",
          parentId: undefined,
          postCount: 1,
          path: ["Uncategorized"],
          depth: 0,
        },
      ],
      posts: [
        {
          providerKey: "tistory",
          sourceId: source.sourceId,
          postId,
          title,
          sourceUrl: source.input,
          publishedAt,
          categoryId: 0,
          categoryName: "Uncategorized",
          thumbnailUrl: undefined,
        },
      ],
    }
  },
  loadPostContent: async ({ source, post }: { source: BlogSource; post: BlogPostRef }) => ({
    kind: "html",
    html: await fetchText(post.sourceUrl || source.input),
    sourceUrl: post.sourceUrl,
    tags: [],
  }),
  parseContent: ({ content }) => {
    if (content.kind !== "html") {
      throw new Error(`Tistory provider only supports html content: ${content.kind}`)
    }

    const $ = cheerio.load(content.html)
    const $root = $("article").first().length ? $("article").first() : $("body")

    return {
      tags: content.tags,
      blocks: $root
        .find("h1,h2,h3,p")
        .toArray()
        .flatMap((node) => {
          const $node = $(node)
          const text = $node.text().trim()

          if (!text) {
            return []
          }

          if (/^h[1-3]$/i.test(node.tagName)) {
            return [{ blockId: "tistory:heading", props: { level: 1, text } }]
          }

          return [{ blockId: "tistory:paragraph", props: { text } }]
        }),
    }
  },
  getBlockTemplateDefinitions: () => [
    {
      key: "tistory:heading",
      label: "Tistory Heading",
      description: "Heading parsed from Tistory public HTML.",
      props: [
        { name: "level", label: "level", type: "number" },
        { name: "text", label: "text", type: "string" },
      ],
      presets: [{ label: "Default", template: "{{ '#'.repeat(level) }} {{ text }}" }],
    },
    {
      key: "tistory:paragraph",
      label: "Tistory Paragraph",
      description: "Paragraph parsed from Tistory public HTML.",
      props: [{ name: "text", label: "text", type: "string" }],
      presets: [{ label: "Default", template: "{{ text }}" }],
    },
  ],
})
```

- [ ] **Step 4: Run Tistory provider tests**

Run:

```bash
mise exec -- pnpm test:offline -- packages/blog-tistory/src/TistoryBlogProvider.spec.ts
```

Expected:

```text
PASS packages/blog-tistory/src/TistoryBlogProvider.spec.ts
```

## Task 10: Tistory Provider Live E2E

**Files:**
- Create: `tests/e2e/run-provider-tistory-live.ts`
- Modify: `package.json`

- [ ] **Step 1: Write live Tistory e2e script**

Create `tests/e2e/run-provider-tistory-live.ts`:

```ts
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { createTistoryBlogProvider } from "@exitpress/blog-tistory/TistoryBlogProvider.js"
import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { exportProviderPostUnit } from "@exitpress/engine/exporting/provider/ProviderPostExportUnit.js"

const postUrl = process.env.EXITPRESS_TISTORY_LIVE_POST_URL

if (!postUrl) {
  throw new Error("EXITPRESS_TISTORY_LIVE_POST_URL is required for Tistory live provider e2e")
}

const tempDir = await mkdtemp(path.join(os.tmpdir(), "exitpress-provider-tistory-live-"))

try {
  const provider = createTistoryBlogProvider()
  const source = provider.parseSource(postUrl)
  const scan = await provider.scan(source)
  const post = scan.posts[0]

  if (!post) {
    throw new Error(`Tistory scan returned no posts for ${postUrl}`)
  }

  const result = await exportProviderPostUnit({
    provider,
    source,
    outputDir: tempDir,
    post,
    categories: scan.categories,
    options: defaultExportOptions(),
    uploadEnabled: false,
    abortSignal: null,
  })
  const markdown = await readFile(result.markdownFilePath, "utf8")

  if (!markdown.includes(post.title)) {
    throw new Error(`Tistory markdown did not contain title "${post.title}"`)
  }

  if (!markdown.trim()) {
    throw new Error("Tistory markdown was empty")
  }

  console.log(`provider tistory live export passed: ${post.sourceUrl}`)
} finally {
  await rm(tempDir, { recursive: true, force: true })
}
```

- [ ] **Step 2: Add package script**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "test:provider:tistory": "bun tests/e2e/run-provider-tistory-live.ts"
  }
}
```

Keep existing scripts and `test:provider:mock`.

- [ ] **Step 3: Run live e2e with explicit URL**

Run:

```bash
test -n "$EXITPRESS_TISTORY_LIVE_POST_URL" && mise exec -- pnpm test:provider:tistory
```

Expected when `EXITPRESS_TISTORY_LIVE_POST_URL` is set to the dedicated public Tistory test post URL:

```text
provider tistory live export passed:
```

Expected without the environment variable:

```text
EXITPRESS_TISTORY_LIVE_POST_URL is required for Tistory live provider e2e
```

## Task 11: Boundary Check

**Files:**
- Create: `scripts/maintenance/check-blog-provider-boundaries.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing boundary check script**

Create `scripts/maintenance/check-blog-provider-boundaries.ts`:

```ts
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const repoRoot = process.cwd()
const blogPackageRoot = path.join(repoRoot, "packages")
const forbiddenPatterns = [
  /\bBase[A-Z][A-Za-z0-9_]*\b/,
  /\bAbstract[A-Z][A-Za-z0-9_]*\b/,
  /\b[A-Z][A-Za-z0-9_]*Contract\b/,
  /\b[A-Z][A-Za-z0-9_]*Schema\b/,
]

const listFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        return listFiles(fullPath)
      }

      return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : []
    }),
  )

  return files.flat()
}

const packageEntries = await readdir(blogPackageRoot, { withFileTypes: true })
const blogPackages = packageEntries
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("blog-"))
  .map((entry) => path.join(blogPackageRoot, entry.name, "src"))

const violations: string[] = []

for (const packageSrc of blogPackages) {
  const files = await listFiles(packageSrc)

  for (const file of files) {
    const text = await readFile(file, "utf8")

    forbiddenPatterns.forEach((pattern) => {
      if (pattern.test(text)) {
        violations.push(path.relative(repoRoot, file))
      }
    })
  }
}

if (violations.length > 0) {
  throw new Error(
    `Provider-neutral abstractions must live in domain or engine, not blog packages:\n${[
      ...new Set(violations),
    ].join("\n")}`,
  )
}

console.log("blog provider boundary check passed")
```

- [ ] **Step 2: Add package script**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "check:blog-boundaries": "bun scripts/maintenance/check-blog-provider-boundaries.ts"
  }
}
```

- [ ] **Step 3: Run boundary check**

Run:

```bash
mise exec -- pnpm check:blog-boundaries
```

Expected:

```text
blog provider boundary check passed
```

## Task 12: Documentation Updates

**Files:**
- Modify: `.agents/knowledge/architecture.md`
- Modify: `.agents/knowledge/verification.md`

- [ ] **Step 1: Update architecture knowledge**

In `.agents/knowledge/architecture.md`, update the boundaries section to include:

```markdown
- Blog provider-neutral DTOs live in `packages/domain/src/blog-provider/schema/`.
- Blog provider runtime interfaces, registry, fetch policy, and provider harnesses live in `packages/engine/src/blog-provider/` and `packages/engine/src/exporting/provider/`.
- Concrete providers live in `packages/blog-*`.
- `blog-*` packages may depend on domain and engine, but must not define provider-neutral base types or contracts.
- Server provider registry migration is outside the current provider harness scope; existing server Naver entrypoints remain until that migration.
```

- [ ] **Step 2: Update verification knowledge**

In `.agents/knowledge/verification.md`, add provider verification commands:

```markdown
- `mise exec -- pnpm test:provider:mock`: provider-neutral engine export harness with mock providers.
- `test -n "$EXITPRESS_TISTORY_LIVE_POST_URL" && mise exec -- pnpm test:provider:tistory`: live Tistory provider export harness.
- `mise exec -- pnpm check:blog-boundaries`: prevents provider-neutral abstractions from being defined under `packages/blog-*`.
- Provider refactor completion requires `mise exec -- pnpm check:full`, `mise exec -- pnpm test:network`, `mise exec -- pnpm test:provider:mock`, `mise exec -- pnpm test:provider:tistory`, and `mise exec -- pnpm check:blog-boundaries`.
```

- [ ] **Step 3: Review docs**

Run:

```bash
sed -n '1,120p' .agents/knowledge/architecture.md
sed -n '1,160p' .agents/knowledge/verification.md
```

Expected: both files describe provider boundaries and provider verification commands.

## Task 13: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run focused provider tests**

Run:

```bash
mise exec -- pnpm test:offline -- packages/domain/src/blog-provider/schema/BlogProvider.spec.ts packages/engine/src/blog-provider/ProviderRegistry.spec.ts packages/engine/src/blog-provider/FetchPolicy.spec.ts packages/engine/src/exporting/provider/ProviderPostExportUnit.spec.ts packages/blog-naver/src/NaverBlogProvider.spec.ts packages/blog-tistory/src/TistoryBlogProvider.spec.ts
```

Expected:

```text
PASS
```

- [ ] **Step 2: Run provider mock e2e**

Run:

```bash
mise exec -- pnpm test:provider:mock
```

Expected:

```text
provider mock export passed
```

- [ ] **Step 3: Run provider boundary check**

Run:

```bash
mise exec -- pnpm check:blog-boundaries
```

Expected:

```text
blog provider boundary check passed
```

- [ ] **Step 4: Run live Tistory provider e2e**

Run:

```bash
test -n "$EXITPRESS_TISTORY_LIVE_POST_URL" && mise exec -- pnpm test:provider:tistory
```

Expected:

```text
provider tistory live export passed:
```

- [ ] **Step 5: Run existing local baseline**

Run:

```bash
mise exec -- pnpm check:full
```

Expected:

```text
check:full completes successfully
```

- [ ] **Step 6: Run existing live network baseline**

Run:

```bash
mise exec -- pnpm test:network
```

Expected:

```text
test:network completes successfully
```

- [ ] **Step 7: Confirm server was not modified**

Run:

```bash
git diff --name-only -- packages/server
```

Expected: no output.

- [ ] **Step 8: Confirm changed files are in scope**

Run:

```bash
git status --short
```

Expected: changes are limited to provider contracts, engine provider harness, `blog-naver`, `blog-tistory`, provider e2e, package scripts, TypeScript paths, and knowledge docs. Existing user changes may still appear and must not be reverted.
