import { spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import { readFile, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { test } from "@playwright/test"

import type { ChildProcessWithoutNullStreams } from "node:child_process"

import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { ExportManifest } from "@exitpress/domain/export-job/schema/ExportManifest.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"

import { createTestTempDir } from "../../support/test-paths.js"

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url))

const liveResumeCase = {
  sourceId: "mym0404",
  dateFrom: "2017-03-31",
  dateTo: "2017-03-31",
  categoryId: "17",
  delayedPostId: "220971956932",
  expectedPosts: "2",
} as const

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`request failed: ${response.status} ${url}`)
  }

  return (await response.json()) as T
}

const postJson = async <T>({ url, body }: { url: string; body: unknown }) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`request failed: ${response.status} ${url}`)
  }

  return (await response.json()) as T
}

const waitForJob = async ({
  baseUrl,
  jobId,
  accept,
}: {
  baseUrl: string
  jobId: string
  accept: (job: ExportJobState) => boolean
}) => {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const job = await fetchJson<ExportJobState>(`${baseUrl}/api/export/${jobId}`)

    if (accept(job)) {
      return job
    }

    await wait(1_000)
  }

  throw new Error(`timed out while waiting for job ${jobId}`)
}

const waitForManifest = async ({
  manifestPath,
  accept,
}: {
  manifestPath: string
  accept: (manifest: ExportManifest) => boolean
}) => {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ExportManifest

      if (accept(manifest)) {
        return manifest
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error
      }
    }

    await wait(500)
  }

  throw new Error(`timed out while waiting for manifest ${manifestPath}`)
}

const waitForServerReady = (child: ChildProcessWithoutNullStreams) =>
  new Promise<string>((resolve, reject) => {
    let stdoutBuffer = ""
    let stderrBuffer = ""

    const cleanup = () => {
      child.stdout.off("data", handleStdout)
      child.stderr.off("data", handleStderr)
      child.off("exit", handleExit)
    }

    const handleStdout = (chunk: Buffer) => {
      stdoutBuffer += chunk.toString("utf8")

      const readyLine = stdoutBuffer
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => /^READY \d+$/.test(line))

      if (!readyLine) {
        return
      }

      cleanup()
      resolve(`http://127.0.0.1:${readyLine.slice("READY ".length)}`)
    }

    const handleStderr = (chunk: Buffer) => {
      stderrBuffer += chunk.toString("utf8")
    }

    const handleExit = (code: number | null) => {
      cleanup()
      reject(new Error(`live server exited before ready: code=${code}\n${stderrBuffer}`))
    }

    child.stdout.on("data", handleStdout)
    child.stderr.on("data", handleStderr)
    child.on("exit", handleExit)
  })

const startServer = async ({
  settingsPath,
  scanCachePath,
  postHtmlCacheDir,
  delayedPostIds = [],
  delayMs = 0,
}: {
  settingsPath: string
  scanCachePath: string
  postHtmlCacheDir: string
  delayedPostIds?: string[]
  delayMs?: number
}) => {
  const child = spawn("bun", ["./tests/support/e2e/run-live-server.ts"], {
    cwd: repoRoot,
    detached: true,
    env: {
      ...process.env,
      NODE_ENV: "development",
      EXITPRESS_SETTINGS_PATH: settingsPath,
      EXITPRESS_SCAN_CACHE_PATH: scanCachePath,
      EXITPRESS_POST_HTML_CACHE_DIR: postHtmlCacheDir,
      EXITPRESS_LIVE_FETCH_DELAY_LOGNOS: delayedPostIds.join(","),
      EXITPRESS_LIVE_FETCH_DELAY_MS: String(delayMs),
    },
    stdio: ["pipe", "pipe", "pipe"],
  })

  const baseUrl = await waitForServerReady(child)

  return {
    child,
    baseUrl,
  }
}

const stopServer = async ({
  child,
  signal = "SIGTERM",
}: {
  child: ChildProcessWithoutNullStreams
  signal?: NodeJS.Signals
}) =>
  new Promise<void>((resolve) => {
    if (child.exitCode !== null) {
      resolve()
      return
    }

    child.once("exit", () => resolve())

    try {
      process.kill(-child.pid!, signal)
    } catch {
      child.kill(signal)
    }
  })

const buildScopedOptions = ({
  scopedCategoryId,
  scopedDateFrom,
  scopedDateTo,
}: {
  scopedCategoryId: number
  scopedDateFrom: string
  scopedDateTo: string
}) => {
  const options: ExportOptions = defaultExportOptions()

  options.scope.categoryMode = "exact-selected"
  options.scope.categoryIds = [scopedCategoryId]
  options.scope.dateFrom = scopedDateFrom
  options.scope.dateTo = scopedDateTo
  options.assets.imageHandlingMode = "remote"

  return options
}

const runUiLiveResumeExport = async () => {
  const sourceId = process.env.EXITPRESS_LIVE_RESUME_BLOG_ID ?? liveResumeCase.sourceId
  const scopedDateFrom = process.env.EXITPRESS_LIVE_RESUME_DATE_FROM ?? liveResumeCase.dateFrom
  const scopedDateTo = process.env.EXITPRESS_LIVE_RESUME_DATE_TO ?? liveResumeCase.dateTo
  const scopedCategoryId = Number(
    process.env.EXITPRESS_LIVE_RESUME_CATEGORY_ID ?? liveResumeCase.categoryId,
  )
  const delayedPostId =
    process.env.EXITPRESS_LIVE_RESUME_DELAY_LOGNO ?? liveResumeCase.delayedPostId
  const expectedScopedPostCount = Number(
    process.env.EXITPRESS_LIVE_RESUME_EXPECTED_POSTS ?? liveResumeCase.expectedPosts,
  )
  const scopedOutputDir = `output/live-resume-e2e-${randomUUID()}`
  const isWithinScopedDateRange = (publishedAt: string) => {
    const publishedDate = publishedAt.slice(0, 10)

    return publishedDate >= scopedDateFrom && publishedDate <= scopedDateTo
  }
  const tempRoot = await createTestTempDir("exitpress-live-resume-export-")
  const settingsPath = path.join(tempRoot, "export-ui-settings.json")
  const scanCachePath = path.join(tempRoot, "scan-cache.json")
  const postHtmlCacheDir = path.join(tempRoot, "post-html")
  const manifestPath = path.join(repoRoot, scopedOutputDir, "manifest.json")
  let firstServer: { child: ChildProcessWithoutNullStreams; baseUrl: string } | null = null
  let secondServer: { child: ChildProcessWithoutNullStreams; baseUrl: string } | null = null

  try {
    const activeFirstServer = await startServer({
      settingsPath,
      scanCachePath,
      postHtmlCacheDir,
      delayedPostIds: [delayedPostId],
      delayMs: 30_000,
    })
    firstServer = activeFirstServer

    const scanResult = await postJson<ScanResult>({
      url: `${activeFirstServer.baseUrl}/api/scan`,
      body: {
        blogKey: "naver",
        sourceInput: sourceId,
      },
    })

    const scopedPosts = (scanResult.posts ?? []).filter(
      (post) => post.categoryId === scopedCategoryId && isWithinScopedDateRange(post.publishedAt),
    )

    if (scopedPosts.length !== expectedScopedPostCount) {
      throw new Error(
        `live resume scope drifted: expected exactly ${expectedScopedPostCount} posts for category ${scopedCategoryId} from ${scopedDateFrom} to ${scopedDateTo}, got ${scopedPosts.length}`,
      )
    }

    if (!scopedPosts.some((post) => post.postId === delayedPostId)) {
      throw new Error(
        `live resume delayed target is missing from the scoped posts: ${delayedPostId}`,
      )
    }

    const exportResponse = await postJson<{ jobId: string }>({
      url: `${activeFirstServer.baseUrl}/api/export`,
      body: {
        blogKey: "naver",
        sourceInput: sourceId,
        outputDir: scopedOutputDir,
        options: buildScopedOptions({
          scopedCategoryId,
          scopedDateFrom,
          scopedDateTo,
        }),
        scanResult,
      },
    })

    const jobId = exportResponse.jobId?.trim()

    if (!jobId) {
      throw new Error("export response did not return a jobId")
    }

    await waitForJob({
      baseUrl: activeFirstServer.baseUrl,
      jobId,
      accept: (job) => job.status === "running" && job.progress.completed >= 1,
    })

    const partialManifest = await waitForManifest({
      manifestPath,
      accept: (manifest) =>
        manifest.job?.id === jobId &&
        manifest.job?.status === "running" &&
        manifest.job.request.outputDir === scopedOutputDir &&
        manifest.job.request.options.assets.imageHandlingMode === "remote",
    })

    if (partialManifest.job?.scanResult && "posts" in partialManifest.job.scanResult) {
      throw new Error("partial manifest should not persist scanResult.posts")
    }

    await stopServer({
      child: activeFirstServer.child,
      signal: "SIGKILL",
    })
    firstServer = null

    const activeSecondServer = await startServer({
      settingsPath,
      scanCachePath,
      postHtmlCacheDir,
    })
    secondServer = activeSecondServer

    const defaults = await fetchJson<{
      resumedJob: ExportJobState | null
      resumedScanResult: ScanResult | null
    }>(`${activeSecondServer.baseUrl}/api/export-defaults`)

    if (defaults.resumedJob?.id !== jobId || !defaults.resumedJob.resumeAvailable) {
      throw new Error("bootstrap did not expose a resumable running job")
    }

    const resumedScanPosts = defaults.resumedScanResult?.posts ?? []

    if (
      resumedScanPosts.length < expectedScopedPostCount ||
      !scopedPosts.every((post) =>
        resumedScanPosts.some((resumedPost) => resumedPost.postId === post.postId),
      )
    ) {
      throw new Error("bootstrap did not restore cached scan posts for the resumed job")
    }

    await postJson<{ jobId: string; status: string }>({
      url: `${activeSecondServer.baseUrl}/api/export/${jobId}/resume`,
      body: {},
    })

    const completedJob = await waitForJob({
      baseUrl: activeSecondServer.baseUrl,
      jobId,
      accept: (job) => job.status === "completed",
    })
    const completedManifest = await waitForManifest({
      manifestPath,
      accept: (manifest) =>
        manifest.job?.status === "completed" &&
        manifest.successCount === expectedScopedPostCount &&
        manifest.totalPosts === expectedScopedPostCount,
    })

    if (
      completedJob.progress.completed !== expectedScopedPostCount ||
      completedJob.progress.failed !== 0
    ) {
      throw new Error(`unexpected completed job progress: ${JSON.stringify(completedJob.progress)}`)
    }

    for (const post of completedManifest.posts) {
      if (!post.outputPath) {
        throw new Error(`completed manifest post outputPath missing: ${post.postId}`)
      }
    }
  } finally {
    if (firstServer) {
      await stopServer({
        child: firstServer.child,
      })
    }

    if (secondServer) {
      await stopServer({
        child: secondServer.child,
      })
    }

    await rm(path.join(repoRoot, scopedOutputDir), {
      recursive: true,
      force: true,
    })
    await rm(tempRoot, {
      recursive: true,
      force: true,
    })
  }
}

test.describe("live", () => {
  test("resume export completes after restart for scoped Naver posts", async () => {
    await runUiLiveResumeExport()
  })
})
