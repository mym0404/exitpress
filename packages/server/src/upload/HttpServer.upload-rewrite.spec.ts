import { readFile } from "node:fs/promises"
import path from "node:path"

import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { NaverBlogFetcher } from "@exitpress/engine/integrations/naver-blog/NaverBlogFetcher.js"
import {
  baseScanResult,
  cleanupTestServerRoots,
  createPost,
  createTestHttpServer,
  createUploadPayload,
  mockFetcher,
  startServer,
  textOnlyHtml,
  uploadHtml,
  waitForJob,
} from "@tests/support/server/HttpServerSpecHarness.js"
import { createTestPath } from "@tests/support/test-paths.js"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { UploadCandidate } from "@exitpress/domain/export-job/schema/UploadState.js"

let activeServer: ReturnType<typeof createTestHttpServer> | null = null

afterEach(async () => {
  vi.restoreAllMocks()

  if (activeServer) {
    await new Promise<void>((resolve, reject) => {
      activeServer?.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
    activeServer = null
  }

  await cleanupTestServerRoots()
})

describe("http server upload rewrite", () => {
  it("automatically uploads and rewrites markdown and manifest during export", async () => {
    const outputDir = createTestPath("http-server", "auto-upload-rewrite-output")
    const uploadPhaseRunner = vi.fn(async ({ candidates }: { candidates: UploadCandidate[] }) =>
      candidates.map((candidate) => ({
        candidate,
        uploadedUrl: `https://cdn.example.com/${candidate.localPath}`,
      })),
    )

    mockFetcher({
      html: uploadHtml,
      thumbnailUrl: "https://example.com/thumb.png",
    })

    activeServer = createTestHttpServer({
      uploadPhaseRunner,
    })
    const baseUrl = await startServer(activeServer)
    const options = defaultExportOptions()

    options.assets.imageHandlingMode = "download-and-upload"

    const exportResponse = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        blogIdOrUrl: "https://blog.naver.com/mym0404",
        outputDir,
        options,
        uploadProvider: createUploadPayload({
          repo: "owner/name",
          token: "ghp_export_upload_token",
        }),
      }),
    })
    const exportBody = (await exportResponse.json()) as {
      jobId: string
    }
    const completedJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-completed",
    })
    const outputPath = completedJob.items[0]?.outputPath
    const localPath = uploadPhaseRunner.mock.calls[0]?.[0].candidates[0]?.localPath
    const uploadedUrl = `https://cdn.example.com/${localPath}`
    const markdown = await readFile(path.join(outputDir, outputPath!), "utf8")
    const manifest = await readFile(path.join(outputDir, "manifest.json"), "utf8")

    expect(uploadPhaseRunner).toHaveBeenCalledTimes(1)
    expect(localPath).toBeTruthy()
    expect(markdown).toContain(uploadedUrl)
    expect(markdown).not.toContain(`](${localPath})`)
    expect(markdown).not.toContain(`thumbnail: ${localPath}`)
    expect(manifest).toContain(uploadedUrl)
    expect(manifest).not.toContain("ghp_export_upload_token")
    expect(manifest).not.toContain("owner/name")
    expect(completedJob.upload.uploadedCount).toBe(completedJob.upload.candidateCount)
  })

  it("keeps earlier rewritten posts completed when a later ready post rewrite fails", async () => {
    const scanResult: ScanResult = {
      ...baseScanResult,
      totalPostCount: 2,
      categories: [
        {
          ...baseScanResult.categories[0]!,
          postCount: 2,
        },
      ],
    }
    const posts = [
      createPost({
        logNo: "223034929697",
        title: "첫 번째 글",
        thumbnailUrl: "https://example.com/thumb.png",
      }),
      createPost({
        logNo: "223034929698",
        title: "두 번째 글",
        thumbnailUrl: "https://example.com/thumb.png",
      }),
    ]
    const uploadPhaseRunner = vi.fn(async ({ candidates }: { candidates: UploadCandidate[] }) =>
      candidates.map((candidate) => ({
        candidate,
        uploadedUrl: `https://cdn.example.com/${candidate.localPath}`,
      })),
    )
    let rewriteCallCount = 0
    const postUploadRewriter = vi.fn(
      async ({
        post,
        item,
        uploadResults,
        rewrittenAt,
      }: {
        post: NonNullable<ExportJobState["manifest"]>["posts"][number]
        item: ExportJobState["items"][number]
        uploadResults: Array<{ candidate: UploadCandidate; uploadedUrl: string }>
        rewrittenAt?: string
      }) => {
        rewriteCallCount += 1

        if (rewriteCallCount === 2) {
          throw new Error("rewrite failed")
        }

        const uploadedUrls = post.upload.candidates.map((candidate) => {
          const matched = uploadResults.find(
            (result) => result.candidate.localPath === candidate.localPath,
          )

          if (!matched) {
            throw new Error(`missing upload result for ${candidate.localPath}`)
          }

          return matched.uploadedUrl
        })
        const completedAt = rewrittenAt ?? "2026-04-21T00:00:03.000Z"
        return {
          markdownPath: `/tmp/${post.outputPath}`,
          post: {
            ...post,
            assetPaths: uploadedUrls,
            upload: {
              ...post.upload,
              uploadedCount: post.upload.candidateCount,
              failedCount: 0,
              uploadedUrls,
              rewriteStatus: "completed" as const,
              rewrittenAt: completedAt,
            },
          },
          item: {
            ...item,
            assetPaths: uploadedUrls,
            upload: {
              ...item.upload,
              uploadedCount: item.upload.candidateCount,
              failedCount: 0,
              uploadedUrls,
              rewriteStatus: "completed" as const,
              rewrittenAt: completedAt,
            },
            updatedAt: completedAt,
          },
        }
      },
    )
    const manifestSnapshotWriter = vi.fn(async () => {})

    vi.spyOn(NaverBlogFetcher.prototype, "scanBlog").mockResolvedValue(scanResult)
    vi.spyOn(NaverBlogFetcher.prototype, "getAllPosts").mockResolvedValue(posts)
    vi.spyOn(NaverBlogFetcher.prototype, "fetchPostHtml").mockResolvedValue(uploadHtml)
    vi.spyOn(NaverBlogFetcher.prototype, "downloadBinary").mockResolvedValue()
    vi.spyOn(NaverBlogFetcher.prototype, "fetchBinary").mockResolvedValue({
      bytes: Buffer.from("shared-image"),
      contentType: "image/png",
    })

    activeServer = createTestHttpServer({
      uploadPhaseRunner,
      postUploadRewriter,
      manifestSnapshotWriter,
    })
    const baseUrl = await startServer(activeServer)
    const options = defaultExportOptions()

    options.assets.imageHandlingMode = "download-and-upload"

    const exportResponse = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        blogIdOrUrl: "https://blog.naver.com/mym0404",
        outputDir: createTestPath("http-server", "batch-rewrite-failure-output"),
        options,
        uploadProvider: createUploadPayload({
          repo: "owner/name",
          token: "ghp_export_upload_token",
        }),
      }),
    })
    const exportBody = (await exportResponse.json()) as {
      jobId: string
    }

    const failedJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "failed",
    })

    expect(postUploadRewriter).toHaveBeenCalledTimes(2)
    expect(manifestSnapshotWriter).toHaveBeenCalledTimes(1)
    expect(failedJob.upload.status).toBe("upload-failed")
    expect(failedJob.items[0]?.upload.rewriteStatus).toBe("completed")
    expect(failedJob.items[0]?.upload.failedCount).toBe(0)
    expect(failedJob.items[1]?.upload.rewriteStatus).toBe("failed")
    expect(failedJob.manifest?.posts[0]?.upload.rewriteStatus).toBe("completed")
    expect(failedJob.manifest?.posts[1]?.upload.rewriteStatus).toBe("failed")
  })

  it("finishes zero-candidate download-and-upload jobs as completed with skipped-no-candidates", async () => {
    mockFetcher({
      html: textOnlyHtml,
      thumbnailUrl: null,
    })

    activeServer = createTestHttpServer()
    const baseUrl = await startServer(activeServer)
    const options = defaultExportOptions()

    options.assets.imageHandlingMode = "download-and-upload"
    options.assets.thumbnailSource = "none"

    const exportResponse = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        blogIdOrUrl: "https://blog.naver.com/mym0404",
        outputDir: createTestPath("http-server", "zero-candidates-output"),
        options,
        uploadProvider: createUploadPayload({
          repo: "owner/name",
          token: "ghp_export_upload_token",
        }),
      }),
    })
    const exportBody = (await exportResponse.json()) as {
      jobId: string
    }
    const completedJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "completed",
    })
    expect(completedJob.upload.status).toBe("skipped")
    expect(completedJob.upload.terminalReason).toBe("skipped-no-candidates")
  })
})
