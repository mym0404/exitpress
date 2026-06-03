# Detected Block Markdown Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show Markdown block output options only for configurable block families detected in the posts selected for export.

**Architecture:** Add a scoped block detection API after category/date selection. The API parses selected post bodies, stores detected block output keys in scan state, and uses a shared post HTML cache so export does not refetch post bodies already fetched during detection.

**Tech Stack:** Node.js ESM, TypeScript, Bun runtime, React, Vitest, Testing Library, existing Naver parser/export modules.

**VCS Rule:** Do not commit unless the user explicitly asks. This repository's project instruction overrides the generic frequent-commit guidance.

---

## File Structure

- Create `src/server/state/PostHtmlCache.ts`
  - File-backed implementation of `NaverBlogFetcherCache`.
- Create `src/server/state/PostHtmlCache.spec.ts`
  - Unit coverage for cache read/write and encoded filenames.
- Modify `src/server/http/ServerPaths.ts`
  - Add the default post HTML cache directory under `.cache/`.
- Modify `src/server/http/HttpServer.ts`
  - Create the shared post HTML cache and pass it to API routes and export runner.
- Modify `src/server/routes/ApiRouteContext.ts`
  - Add `postHtmlCache` to route context.
- Modify `src/server/jobs/HttpExportJobRunner.ts`
  - Accept `postHtmlCache` and pass it to `NaverBlogExporter`.
- Modify `src/exporting/workflow/NaverBlogExporter.ts`
  - Accept optional fetcher cache and inject it into `NaverBlogFetcher`.
- Create `src/exporting/workflow/DetectedBlockOutputScanner.ts`
  - Detect unique `outputSelectionKey` values from scoped posts.
- Create `src/exporting/workflow/DetectedBlockOutputScanner.spec.ts`
  - Unit coverage for scope filtering and unique key collection.
- Modify `src/domain/blog/Types.ts`
  - Add optional detected key fields to `ScanResult`.
- Modify `src/server/routes/ExportRoutes.ts`
  - Add `POST /api/scan-blocks`.
- Modify `src/server/routes/HttpServer.routes.spec.ts`
  - Route coverage for block detection.
- Modify `src/ui/features/common/hooks/UseWizardScanActions.ts`
  - Add block detection call and scan-cache merge.
- Modify `src/ui/features/common/hooks/UseWizardActions.ts`
  - Trigger detection after category selection and skip Markdown options when no configurable detected block exists.
- Modify `src/ui/app/AppStepView.tsx`
  - Pass filtered block output definitions into `ExportOptionsPanel`.
- Modify `src/ui/features/options/BlockOutputOptions.tsx`
  - Render only received definitions and return `null` for an empty list.
- Modify `src/ui/features/options/ExportOptionsPanel.spec.tsx`
  - Component coverage for filtered Markdown options.
- Modify `src/ui/app/App.workflow.spec.tsx`
  - Wizard coverage for detection before Markdown options and no-key skip behavior.
- Modify `.agents/knowledge/architecture.md` or `.agents/knowledge/upload.md` only if implementation changes persistent architecture or cache lifecycle beyond this feature.

## Task 1: Add Shared Post HTML Cache

**Files:**
- Create: `src/server/state/PostHtmlCache.ts`
- Create: `src/server/state/PostHtmlCache.spec.ts`
- Modify: `src/server/http/ServerPaths.ts`

- [ ] **Step 1: Write cache tests**

Add `src/server/state/PostHtmlCache.spec.ts`:

```ts
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import { createPostHtmlCache } from "./PostHtmlCache.js"

let tempDirs: string[] = []

const createTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "post-html-cache-"))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })))
  tempDirs = []
})

describe("createPostHtmlCache", () => {
  it("returns null when a cached post html file does not exist", async () => {
    const cache = createPostHtmlCache({ cacheDir: await createTempDir() })

    await expect(cache.getPostHtml?.({ blogId: "blog/a", logNo: "1" })).resolves.toBeNull()
  })

  it("writes and reads post html using an encoded blog and log key", async () => {
    const cache = createPostHtmlCache({ cacheDir: await createTempDir() })

    await cache.setPostHtml?.({
      blogId: "blog/a",
      logNo: "1/2",
      html: "<html>cached</html>",
    })

    await expect(cache.getPostHtml?.({ blogId: "blog/a", logNo: "1/2" })).resolves.toBe(
      "<html>cached</html>",
    )
  })
})
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
pnpm test:offline -- src/server/state/PostHtmlCache.spec.ts
```

Expected:

```text
FAIL src/server/state/PostHtmlCache.spec.ts
Error: Failed to resolve import "./PostHtmlCache.js"
```

- [ ] **Step 3: Implement cache module**

Add `src/server/state/PostHtmlCache.ts`:

```ts
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { NaverBlogFetcherCache } from "../../integrations/naver-blog/NaverBlogFetcher.js"

import { ensureDir } from "../../infra/node/FilePathUtils.js"

const getPostHtmlCachePath = ({
  cacheDir,
  blogId,
  logNo,
}: {
  cacheDir: string
  blogId: string
  logNo: string
}) => path.join(cacheDir, `${encodeURIComponent(blogId)}-${encodeURIComponent(logNo)}.html`)

export const createPostHtmlCache = ({ cacheDir }: { cacheDir: string }): NaverBlogFetcherCache => ({
  getPostHtml: async ({ blogId, logNo }) => {
    try {
      return await readFile(getPostHtmlCachePath({ cacheDir, blogId, logNo }), "utf8")
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return null
      }

      throw error
    }
  },
  setPostHtml: async ({ blogId, logNo, html }) => {
    await ensureDir(cacheDir)
    await writeFile(getPostHtmlCachePath({ cacheDir, blogId, logNo }), html, "utf8")
  },
})
```

- [ ] **Step 4: Add default cache path**

Modify `src/server/http/ServerPaths.ts`:

```ts
export const defaultPostHtmlCacheDir = path.join(cacheRoot, "post-html")
```

Place it beside `defaultScanCachePath` and `defaultSettingsPath`.

- [ ] **Step 5: Verify cache tests pass**

Run:

```bash
pnpm test:offline -- src/server/state/PostHtmlCache.spec.ts
```

Expected:

```text
PASS src/server/state/PostHtmlCache.spec.ts
```

## Task 2: Inject Cache Into Export

**Files:**
- Modify: `src/exporting/workflow/NaverBlogExporter.ts`
- Modify: `src/server/jobs/HttpExportJobRunner.ts`
- Modify: `src/server/http/HttpServer.ts`
- Modify: `src/server/routes/ApiRouteContext.ts`
- Test: `src/exporting/workflow/NaverBlogExporter.spec.ts`

- [ ] **Step 1: Add a failing exporter cache test**

In `src/exporting/workflow/NaverBlogExporter.spec.ts`, add this focused test near existing fetcher/cache export tests:

```ts
it("passes the injected post html cache to the Naver fetcher", async () => {
  const outputDir = await createTestTempDir("bulk-export-")
  const getPostHtml = vi.fn().mockResolvedValue(postHtml)
  const setPostHtml = vi.fn()
  const onProgress = vi.fn()

  vi.spyOn(NaverBlogFetcher.prototype, "downloadBinary").mockResolvedValue()
  vi.spyOn(NaverBlogFetcher.prototype, "fetchBinary").mockResolvedValue({
    bytes: Buffer.from("image"),
    contentType: "image/png",
  })

  const exporter = new NaverBlogExporter({
    request: {
      blogIdOrUrl: "https://blog.naver.com/mym0404",
      outputDir,
      profile: "gfm",
      options: defaultExportOptions(),
    },
    cachedScanResult: scanResult,
    fetcherCache: {
      getPostHtml,
      setPostHtml,
    },
    onProgress,
  })

  await exporter.run()

  expect(getPostHtml).toHaveBeenCalledWith({
    blogId: "mym0404",
    logNo: "223034929697",
  })
  expect(setPostHtml).not.toHaveBeenCalled()

  await rm(outputDir, { recursive: true, force: true })
})
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
pnpm test:offline -- src/exporting/workflow/NaverBlogExporter.spec.ts
```

Expected:

```text
FAIL src/exporting/workflow/NaverBlogExporter.spec.ts
```

The failure should be a missing `fetcherCache` constructor argument or an uncalled cache mock.

- [ ] **Step 3: Add exporter constructor support**

Modify `src/exporting/workflow/NaverBlogExporter.ts`:

```ts
import type { NaverBlogFetcherCache } from "../../integrations/naver-blog/NaverBlogFetcher.js"
```

Add a readonly field:

```ts
readonly fetcherCache: NaverBlogFetcherCache | undefined
```

Add the constructor argument:

```ts
fetcherCache?: NaverBlogFetcherCache
```

Set it:

```ts
this.fetcherCache = fetcherCache
```

Pass it to the fetcher:

```ts
const fetcher = new NaverBlogFetcher({
  blogId,
  cache: this.fetcherCache,
})
```

- [ ] **Step 4: Wire the cache through server runner**

Modify `src/server/jobs/HttpExportJobRunner.ts`:

```ts
import type { NaverBlogFetcherCache } from "../../integrations/naver-blog/NaverBlogFetcher.js"
```

Update `createHttpExportJobRunner` args:

```ts
export const createHttpExportJobRunner = ({
  jobStore,
  jobScanResults,
  postHtmlCache,
}: {
  jobStore: JobStore
  jobScanResults: Map<string, ScanResult | null>
  postHtmlCache?: NaverBlogFetcherCache
}) => {
```

Pass it into `NaverBlogExporter`:

```ts
const exporter = new NaverBlogExporter({
  request,
  cachedScanResult,
  fetcherCache: postHtmlCache,
  resumeState: resume
    ? {
        items: jobStore.get(jobId)?.items ?? [],
        manifest: jobStore.get(jobId)?.manifest ?? null,
      }
    : null,
  writeManifestFile: false,
  abortSignal: signal,
  onProgress: (progress) => {
    jobStore.updateProgress(jobId, progress)
    scheduleJobManifestPersist(jobId)
  },
  onItem: (item) => {
    jobStore.appendItem(jobId, item)
    scheduleJobManifestPersist(jobId)
  },
})
```

- [ ] **Step 5: Wire the cache through HTTP server and API context**

Modify `src/server/routes/ApiRouteContext.ts`:

```ts
import type { NaverBlogFetcherCache } from "../../integrations/naver-blog/NaverBlogFetcher.js"
```

Add:

```ts
postHtmlCache: NaverBlogFetcherCache
```

Modify `src/server/http/HttpServer.ts` imports:

```ts
import { createPostHtmlCache } from "../state/PostHtmlCache.js"
import { defaultPostHtmlCacheDir } from "./ServerPaths.js"
```

Create the cache before runners:

```ts
const postHtmlCache = createPostHtmlCache({ cacheDir: defaultPostHtmlCacheDir })
```

Pass it to `createHttpExportJobRunner`:

```ts
const exportJobRunner = createHttpExportJobRunner({
  jobStore,
  jobScanResults: state.jobScanResults,
  postHtmlCache,
})
```

Pass it to `createApiRoutes`:

```ts
const apiRoutes = createApiRoutes({
  jobStore,
  state,
  exportJobRunner,
  uploadJobRunner,
  uploadProviderSource,
  postHtmlCache,
  openLocalPath,
})
```

- [ ] **Step 6: Verify export cache wiring**

Run:

```bash
pnpm test:offline -- src/exporting/workflow/NaverBlogExporter.spec.ts
```

Expected:

```text
PASS src/exporting/workflow/NaverBlogExporter.spec.ts
```

## Task 3: Add Scoped Block Detection Service

**Files:**
- Create: `src/exporting/workflow/DetectedBlockOutputScanner.ts`
- Create: `src/exporting/workflow/DetectedBlockOutputScanner.spec.ts`

- [ ] **Step 1: Write scanner tests**

Add `src/exporting/workflow/DetectedBlockOutputScanner.spec.ts`:

```ts
import { describe, expect, it, vi } from "vitest"

import type { PostSummary, ScanResult } from "../../domain/blog/Types.js"

import { defaultExportOptions } from "../../domain/export-options/ExportOptions.js"

import { detectBlockOutputKeys } from "./DetectedBlockOutputScanner.js"

const buildPost = (logNo: string, categoryId: number): PostSummary => ({
  blogId: "mym0404",
  logNo,
  title: `post ${logNo}`,
  publishedAt: "2026-04-11T04:00:00.000Z",
  categoryId,
  categoryName: categoryId === 1 ? "Selected" : "Other",
  source: `https://blog.naver.com/mym0404/${logNo}`,
  thumbnailUrl: null,
})

const scanResult: ScanResult = {
  blogId: "mym0404",
  totalPostCount: 2,
  categories: [
    {
      id: 1,
      name: "Selected",
      parentId: null,
      postCount: 1,
      isDivider: false,
      isOpen: true,
      path: ["Selected"],
      depth: 0,
    },
    {
      id: 2,
      name: "Other",
      parentId: null,
      postCount: 1,
      isDivider: false,
      isOpen: true,
      path: ["Other"],
      depth: 0,
    },
  ],
  posts: [buildPost("1", 1), buildPost("2", 2)],
}

describe("detectBlockOutputKeys", () => {
  it("detects unique configurable block output keys from scoped posts only", async () => {
    const options = defaultExportOptions()
    options.scope.categoryIds = [1]
    const fetchPostHtml = vi.fn(async (logNo: string) =>
      logNo === "1"
        ? `
          <div class="se-main-container">
            <div class="se-component se-image">
              <img src="https://example.com/a.jpg" alt="a" />
            </div>
          </div>
        `
        : `
          <div class="se-main-container">
            <div class="se-component se-table"><table><tr><td>ignored</td></tr></table></div>
          </div>
        `,
    )

    await expect(
      detectBlockOutputKeys({
        scanResult,
        options,
        fetcher: { fetchPostHtml },
      }),
    ).resolves.toEqual(["naver-se4:image"])
    expect(fetchPostHtml).toHaveBeenCalledTimes(1)
    expect(fetchPostHtml).toHaveBeenCalledWith("1")
  })
})
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
pnpm test:offline -- src/exporting/workflow/DetectedBlockOutputScanner.spec.ts
```

Expected:

```text
FAIL src/exporting/workflow/DetectedBlockOutputScanner.spec.ts
Error: Failed to resolve import "./DetectedBlockOutputScanner.js"
```

- [ ] **Step 3: Implement scanner**

Add `src/exporting/workflow/DetectedBlockOutputScanner.ts`:

```ts
import type { ScanResult } from "../../domain/blog/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"
import type { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"

import { parsePostHtml } from "../../parsing/naver-blog/core/PostParser.js"
import { mapConcurrent } from "../../shared/async/AsyncUtils.js"

import { filterPostsByScope } from "./ExportScope.js"

const blockDetectionConcurrency = 3

export const detectBlockOutputKeys = async ({
  scanResult,
  options,
  fetcher,
}: {
  scanResult: ScanResult & { posts: NonNullable<ScanResult["posts"]> }
  options: ExportOptions
  fetcher: Pick<NaverBlogFetcher, "fetchPostHtml">
}) => {
  const scopedPosts = filterPostsByScope({
    posts: scanResult.posts,
    categories: scanResult.categories,
    options,
  })
  const detectedKeys = new Set<string>()

  await mapConcurrent({
    items: scopedPosts,
    concurrency: blockDetectionConcurrency,
    mapper: async (post) => {
      const html = await fetcher.fetchPostHtml(post.logNo)
      const parsedPost = parsePostHtml({
        html,
        sourceUrl: post.source,
        options: {
          blockOutputs: options.blockOutputs,
        },
      })

      parsedPost.blocks.forEach((block) => {
        if (block.outputSelectionKey) {
          detectedKeys.add(block.outputSelectionKey)
        }
      })
    },
  })

  return [...detectedKeys]
}
```

- [ ] **Step 4: Verify scanner tests pass**

Run:

```bash
pnpm test:offline -- src/exporting/workflow/DetectedBlockOutputScanner.spec.ts
```

Expected:

```text
PASS src/exporting/workflow/DetectedBlockOutputScanner.spec.ts
```

## Task 4: Add `/api/scan-blocks`

**Files:**
- Modify: `src/domain/blog/Types.ts`
- Modify: `src/server/routes/ExportRoutes.ts`
- Modify: `src/server/routes/HttpServer.routes.spec.ts`

- [ ] **Step 1: Extend scan result type**

Modify `src/domain/blog/Types.ts`:

```ts
export type ScanResult = {
  blogId: string
  totalPostCount: number
  categories: CategoryInfo[]
  posts?: PostSummary[]
  detectedBlockOutputKeys?: string[]
  detectedBlockOutputScopeSignature?: string
}
```

- [ ] **Step 2: Add route test**

In `src/server/routes/HttpServer.routes.spec.ts`, add a test that starts `createHttpServer()` with a mocked global `fetch`, calls `/api/scan-blocks`, and expects the detected image key:

```ts
it("detects block output keys for the scanned export scope", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (input) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.includes("PostView.naver")) {
        return new Response(
          `
            <div class="se-main-container">
              <div class="se-component se-image">
                <img src="https://example.com/a.jpg" alt="a" />
              </div>
            </div>
          `,
          { status: 200 },
        )
      }

      throw new Error(`unexpected fetch: ${url}`)
    }),
  )

  const { baseUrl, close } = await startTestServer()

  try {
    const response = await fetch(`${baseUrl}/api/scan-blocks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        blogIdOrUrl: "mym0404",
        scanResult,
        options: defaultExportOptions(),
      }),
    })
    const body = (await response.json()) as { detectedBlockOutputKeys: string[] }

    expect(response.status).toBe(200)
    expect(body.detectedBlockOutputKeys).toEqual(["naver-se4:image"])
  } finally {
    await close()
  }
})
```

Use the existing server test harness helpers in that file instead of adding a new helper.

- [ ] **Step 3: Run the route test to verify failure**

Run:

```bash
pnpm test:offline -- src/server/routes/HttpServer.routes.spec.ts
```

Expected:

```text
FAIL src/server/routes/HttpServer.routes.spec.ts
```

The new test should fail with a `404` for `/api/scan-blocks`.

- [ ] **Step 4: Implement route**

Modify `src/server/routes/ExportRoutes.ts` imports:

```ts
import { detectBlockOutputKeys } from "../../exporting/workflow/DetectedBlockOutputScanner.js"
```

Add this branch after `/api/scan` and before `/api/export`:

```ts
if (method === "POST" && url.pathname === "/api/scan-blocks") {
  const payload = await parseJsonPayload<{
    blogIdOrUrl?: string
    scanResult?: ScanResult
    options?: PartialExportOptions
  }>(request)

  if (!payload.blogIdOrUrl?.trim() || !payload.scanResult?.posts) {
    sendJson({
      response,
      statusCode: 400,
      body: { error: "blogIdOrUrl와 posts가 포함된 scanResult는 필수입니다." },
    })
    return true
  }

  const blogId = extractBlogId(payload.blogIdOrUrl)
  const options = state.cloneOptions(payload.options)
  const detectedBlockOutputKeys = await detectBlockOutputKeys({
    scanResult: payload.scanResult as ScanResult & { posts: NonNullable<ScanResult["posts"]> },
    options,
    fetcher: new NaverBlogFetcher({
      blogId,
      cache: postHtmlCache,
    }),
  })
  const orderByKey = new Map(state.blockOutputDefinitions.map((definition, index) => [definition.key, index]))

  sendJson({
    response,
    statusCode: 200,
    body: {
      detectedBlockOutputKeys: detectedBlockOutputKeys.sort(
        (left, right) => (orderByKey.get(left) ?? Number.MAX_SAFE_INTEGER) - (orderByKey.get(right) ?? Number.MAX_SAFE_INTEGER),
      ),
    },
  })
  return true
}
```

Also destructure `postHtmlCache` from the route context:

```ts
({ jobStore, state, exportJobRunner, postHtmlCache }: ApiRouteContext) =>
```

- [ ] **Step 5: Verify route test passes**

Run:

```bash
pnpm test:offline -- src/server/routes/HttpServer.routes.spec.ts
```

Expected:

```text
PASS src/server/routes/HttpServer.routes.spec.ts
```

## Task 5: Trigger Detection In Wizard Flow

**Files:**
- Modify: `src/ui/features/common/hooks/UseWizardActionTypes.ts`
- Modify: `src/ui/features/common/hooks/UseWizardScanActions.ts`
- Modify: `src/ui/features/common/hooks/UseWizardActions.ts`
- Modify: `src/ui/features/common/shell/WizardFlow.tsx`
- Test: `src/ui/app/App.workflow.spec.tsx`

- [ ] **Step 1: Add workflow test for detection before Markdown options**

In `src/ui/app/App.workflow.spec.tsx`, update the main flow fetch mock so `/api/scan-blocks` returns:

```ts
if (url.endsWith("/api/scan-blocks")) {
  return buildJsonResponse({
    detectedBlockOutputKeys: ["naver-se4:image"],
  })
}
```

Add expectations after clicking the category next button:

```ts
await user.click(screen.getByRole("button", { name: "구조 설정" }))

await waitFor(() => {
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/scan-blocks",
    expect.objectContaining({
      method: "POST",
    }),
  )
})
```

Then keep the existing step expectations.

- [ ] **Step 2: Add workflow test for skipping Markdown when no configurable keys are found**

Add a new test in `src/ui/app/App.workflow.spec.tsx`:

```ts
it("skips Markdown options when block detection finds no configurable block outputs", async () => {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = typeof input === "string" ? input : input.toString()
    const bootstrapResponse = getBootstrapResponse(url)

    if (bootstrapResponse) {
      return bootstrapResponse
    }

    if (url.endsWith("/api/scan")) {
      return buildJsonResponse(scanResult)
    }

    if (url.endsWith("/api/scan-blocks")) {
      return buildJsonResponse({ detectedBlockOutputKeys: [] })
    }

    throw new Error(`unexpected fetch: ${url}`)
  })

  vi.stubGlobal("fetch", fetchMock)

  const user = renderApp()

  await user.type(screen.getByLabelText("블로그 ID 또는 URL"), "mym0404")
  await user.click(screen.getByRole("button", { name: "카테고리 불러오기" }))
  await waitFor(() => {
    expect(document.querySelector('[data-step-view="category-selection"]')).not.toBeNull()
  })

  await user.click(screen.getByRole("button", { name: "구조 설정" }))
  await waitFor(() => {
    expect(document.querySelector('[data-step-view="structure-options"]')).not.toBeNull()
  })
  await user.click(screen.getByRole("button", { name: "Frontmatter 설정" }))
  await user.click(screen.getByRole("button", { name: "Assets 설정" }))

  await waitFor(() => {
    expect(document.querySelector('[data-step-view="assets-options"]')).not.toBeNull()
    expect(document.querySelector('[data-step-view="markdown-options"]')).toBeNull()
  })
})
```

- [ ] **Step 3: Run workflow tests to verify failure**

Run:

```bash
pnpm test:offline -- src/ui/app/App.workflow.spec.tsx
```

Expected:

```text
FAIL src/ui/app/App.workflow.spec.tsx
```

The failure should show `/api/scan-blocks` was not called or Markdown options were not skipped.

- [ ] **Step 4: Add block detection action**

Modify `src/ui/features/common/hooks/UseWizardScanActions.ts`:

```ts
const getBlockDetectionScopeSignature = (options: Pick<ExportOptions, "scope">) =>
  JSON.stringify(options.scope)
```

Add this import:

```ts
import type { ExportOptions } from "../../../../domain/export-options/Types.js"
```

Add `options` to `WizardScanActionsArgs` in `UseWizardActionTypes.ts`.

Inside `useWizardScanActions`, destructure `options`, and add:

```ts
const ensureDetectedBlockOutputs = useCallback(async () => {
  if (!activeScanResult?.posts) {
    setCategoryStatus("먼저 스캔을 완료해야 합니다.")
    return false
  }

  const scopeSignature = getBlockDetectionScopeSignature(options)

  if (
    activeScanResult.detectedBlockOutputScopeSignature === scopeSignature &&
    activeScanResult.detectedBlockOutputKeys
  ) {
    return true
  }

  setScanPending(true)
  setCategoryStatus("선택한 글의 Markdown 블록을 확인하는 중입니다.")

  try {
    const response = await postJson<{ detectedBlockOutputKeys: string[] }>("/api/scan-blocks", {
      blogIdOrUrl: currentScanTarget,
      scanResult: activeScanResult,
      options,
    })

    setScanCache((current) => ({
      ...current,
      [currentScanTarget]: {
        ...activeScanResult,
        detectedBlockOutputKeys: response.detectedBlockOutputKeys,
        detectedBlockOutputScopeSignature: scopeSignature,
      },
    }))
    setCategoryStatus(readyCategoryStatus)

    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setErrorScanStatus(message)
    setCategoryStatus("Markdown 블록 확인에 실패했습니다. 다시 시도하세요.")
    toast.error("Markdown 블록 확인에 실패했습니다.", {
      description: message,
    })
    return false
  } finally {
    setScanPending(false)
  }
}, [
  activeScanResult,
  currentScanTarget,
  options,
  setCategoryStatus,
  setErrorScanStatus,
  setScanCache,
  setScanPending,
])
```

Return it:

```ts
return {
  ensureScanResult,
  ensureDetectedBlockOutputs,
  handleBlogInputChange,
  ...categoryActions,
}
```

- [ ] **Step 5: Trigger detection from category selection**

Modify `src/ui/features/common/hooks/UseWizardActions.ts`:

```ts
const {
  ensureScanResult,
  ensureDetectedBlockOutputs,
  handleBlogInputChange,
  handleOutputDirChange,
  handleOutputDirBlur,
  handleCategoryToggle,
  handleSelectAllCategories,
  handleClearAllCategories,
} = useWizardScanActions(args)
```

Add this branch in `goToNextStep` before diagnostics:

```ts
if (setupStep === "category-selection") {
  if (await ensureDetectedBlockOutputs()) {
    setSetupStep("structure-options")
  }
  return
}
```

Add `ensureDetectedBlockOutputs` to the dependency list.

- [ ] **Step 6: Skip Markdown options when no detected keys exist**

Modify `src/ui/features/common/hooks/UseWizardActions.ts` generic next-step branch:

```ts
if (
  setupStep === "frontmatter-options" &&
  activeScanResult?.detectedBlockOutputKeys?.length === 0
) {
  setSetupStep("assets-options")
  return
}
```

Keep the existing `WizardFlow.tsx` button labels. Do not add explanatory UI copy for the skip behavior.

- [ ] **Step 7: Verify workflow tests pass**

Run:

```bash
pnpm test:offline -- src/ui/app/App.workflow.spec.tsx
```

Expected:

```text
PASS src/ui/app/App.workflow.spec.tsx
```

## Task 6: Filter Markdown Options By Detected Keys

**Files:**
- Modify: `src/ui/app/AppStepView.tsx`
- Modify: `src/ui/features/options/BlockOutputOptions.tsx`
- Modify: `src/ui/features/options/ExportOptionsPanel.spec.tsx`

- [ ] **Step 1: Add component test for filtered definitions**

In `src/ui/features/options/ExportOptionsPanel.spec.tsx`, add:

```ts
it("renders only detected Markdown block output definitions", () => {
  render(
    <ExportOptionsPanel
      step="markdown"
      outputDir={testOutputDir}
      options={defaultExportOptions()}
      optionDescriptions={optionDescriptions}
      blockOutputDefinitions={blockOutputDefinitions.filter(
        (definition) => definition.key === "naver-se4:image",
      )}
      frontmatterFieldOrder={frontmatterFieldOrder}
      frontmatterFieldMeta={frontmatterFieldMeta}
      frontmatterValidationErrors={[]}
      onOptionsChange={vi.fn()}
    />,
  )

  expect(document.querySelector('[data-block-output-card="naver-se4:image"]')).not.toBeNull()
  expect(document.querySelector('[data-block-output-card="naver-se4:formula"]')).toBeNull()
})
```

- [ ] **Step 2: Run component test**

Run:

```bash
pnpm test:offline -- src/ui/features/options/ExportOptionsPanel.spec.tsx
```

Expected:

```text
PASS src/ui/features/options/ExportOptionsPanel.spec.tsx
```

This may already pass because `MarkdownOptionsStep` renders the definitions it receives. Keep the test as regression coverage.

- [ ] **Step 3: Filter definitions at the app boundary**

Modify `src/ui/app/AppStepView.tsx` before the final `return`:

```ts
const detectedBlockOutputKeys = activeScanResult?.detectedBlockOutputKeys
const markdownBlockOutputDefinitions = detectedBlockOutputKeys
  ? (defaults.blockOutputDefinitions ?? []).filter((definition) =>
      detectedBlockOutputKeys.includes(definition.key),
    )
  : (defaults.blockOutputDefinitions ?? [])
```

Pass the filtered value:

```tsx
blockOutputDefinitions={markdownBlockOutputDefinitions}
```

- [ ] **Step 4: Add defensive empty Markdown state**

Modify `src/ui/features/options/BlockOutputOptions.tsx`:

```tsx
if (blockOutputGroups.length === 0) {
  return null
}
```

Place it after `const blockOutputGroups = groupBlockOutputDefinitionsByEditor(blockOutputDefinitions)`. This is defensive because the normal wizard skips the step when no detected configurable keys exist.

- [ ] **Step 5: Verify option tests pass**

Run:

```bash
pnpm test:offline -- src/ui/features/options/ExportOptionsPanel.spec.tsx
```

Expected:

```text
PASS src/ui/features/options/ExportOptionsPanel.spec.tsx
```

## Task 7: Prove Detection Cache Reuse End To End

**Files:**
- Modify: `src/server/routes/HttpServer.routes.spec.ts`
- Modify: `src/exporting/workflow/NaverBlogExporter.spec.ts` only if Task 2 coverage is not enough

- [ ] **Step 1: Add route-level cache reuse test**

In `src/server/routes/HttpServer.routes.spec.ts`, add a test that:

- starts the test server,
- mocks `fetch` for one post HTML request,
- calls `/api/scan-blocks`,
- then calls `/api/export` with the same scan result,
- asserts the post HTML network fetch happened once.

Expected assertion shape:

```ts
const postHtmlFetchCalls = fetchMock.mock.calls.filter(([input]) =>
  String(input).includes("PostView.naver"),
)

expect(postHtmlFetchCalls).toHaveLength(1)
```

Use existing job polling helpers in the file to wait until export completes before asserting.

- [ ] **Step 2: Run route tests to verify behavior**

Run:

```bash
pnpm test:offline -- src/server/routes/HttpServer.routes.spec.ts
```

Expected:

```text
PASS src/server/routes/HttpServer.routes.spec.ts
```

If this fails because the export job completes asynchronously after the assertion, use the existing polling pattern in `HttpServer.routes.spec.ts` and wait until the job status is completed or failed.

## Task 8: Final Verification And Knowledge Check

**Files:**
- Potentially modify: `.agents/knowledge/architecture.md`
- Potentially modify: `.agents/knowledge/upload.md`

- [ ] **Step 1: Decide whether knowledge docs need updates**

Read the changed behavior against:

```bash
sed -n '1,120p' .agents/knowledge/architecture.md
sed -n '1,120p' .agents/knowledge/upload.md
```

Update only if the implementation creates a durable new cache lifecycle or changes server/export responsibility boundaries. If only the design doc describes this feature and code names are self-explanatory, no knowledge update is required.

- [ ] **Step 2: Run formatter if imports changed**

Run:

```bash
pnpm format
```

Expected:

```text
oxfmt completes without errors
```

- [ ] **Step 3: Run local baseline**

Run:

```bash
pnpm check:local
```

Expected:

```text
pnpm check:fmt, pnpm check:lint, pnpm typecheck, and pnpm test:offline pass
```

- [ ] **Step 4: Run UI smoke**

Run:

```bash
pnpm smoke:ui
```

Expected:

```text
UI smoke suite passes
```

- [ ] **Step 5: Report remaining risk**

Report these facts in the final implementation summary:

- Whether `pnpm check:local` passed.
- Whether `pnpm smoke:ui` passed.
- Whether any failures were pre-existing or unrelated to this change.
- Whether post HTML network fetch reuse was covered by tests.

## Self-Review

- Spec coverage: The plan covers scoped detection, UI filtering, no duplicate post HTML fetches, all-or-nothing failure behavior, and verification.
- Marker scan: No unfinished markers remain.
- Type consistency: `detectedBlockOutputKeys` and `detectedBlockOutputScopeSignature` are introduced in `ScanResult` and reused consistently in UI flow.
- Scope check: The plan is a single feature across server detection, shared cache, and wizard filtering. These pieces are coupled by the user-visible flow and should be implemented together.
