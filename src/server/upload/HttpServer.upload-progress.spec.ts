import { access, rm } from "node:fs/promises"
import path from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import type { UploadCandidate } from "../../domain/export-job/Types.js"

import {
  cleanupTestServerRoots,
  createTestHttpServer,
  createUploadPayload,
  mockFetcher,
  startServer,
  uploadHtml,
  waitForJob,
} from "../../../tests/support/server/HttpServerSpecHarness.js"
import { createTestPath, createTestTempDir } from "../../../tests/support/test-paths.js"
import { defaultExportOptions } from "../../domain/export-options/ExportOptions.js"
import { AbortOperationError } from "../../infra/runtime/AbortOperation.js"

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

describe("http server upload progress", () => {
  it("cancels an active upload job before resetting output", async () => {
    const rootDir = await createTestTempDir("upload-reset-active-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    const outputDir = path.join(rootDir, "output")
    let signalSeen = false
    let resolveStarted = () => {}
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })
    const uploadPhaseRunner = vi.fn(
      async ({ abortSignal }: { abortSignal?: AbortSignal | null }) => {
        resolveStarted()

        while (!abortSignal?.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 5))
        }

        signalSeen = true
        throw new AbortOperationError()
      },
    )

    mockFetcher({
      html: uploadHtml,
      thumbnailUrl: "https://example.com/thumb.png",
    })

    try {
      activeServer = createTestHttpServer({
        settingsPath,
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
        }),
      })
      const exportBody = (await exportResponse.json()) as {
        jobId: string
      }

      await waitForJob({
        baseUrl,
        jobId: exportBody.jobId,
        accept: (job) => job.status === "upload-ready",
      })

      const uploadResponse = await fetch(`${baseUrl}/api/export/${exportBody.jobId}/upload`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseUrl,
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify(
          createUploadPayload({
            repo: "owner/name",
            token: "ghp_test_upload_token",
          }),
        ),
      })

      expect(uploadResponse.status).toBe(202)
      await started

      const resetResponse = await fetch(`${baseUrl}/api/export-reset`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          outputDir,
          jobId: exportBody.jobId,
        }),
      })

      expect(resetResponse.status).toBe(200)
      expect(signalSeen).toBe(true)
      await expect(access(outputDir)).rejects.toMatchObject({ code: "ENOENT" })

      const jobResponse = await fetch(`${baseUrl}/api/export/${exportBody.jobId}`)
      expect(jobResponse.status).toBe(404)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("exposes nonzero uploadedCount while the job is still uploading", async () => {
    let releaseUpload = () => {}
    const uploadPhaseRunner = vi.fn(
      async ({
        candidates,
        onProgress,
      }: {
        candidates: UploadCandidate[]
        onProgress?: (progress: {
          total: number
          uploadedCount: number
          lastCompletedLocalPath: string | null
        }) => void
      }) => {
        onProgress?.({
          total: candidates.length,
          uploadedCount: 0,
          lastCompletedLocalPath: null,
        })
        onProgress?.({
          total: candidates.length,
          uploadedCount: 1,
          lastCompletedLocalPath: candidates[0]?.localPath ?? null,
        })

        await new Promise<void>((resolve) => {
          releaseUpload = resolve
        })

        return candidates.map((candidate) => ({
          candidate,
          uploadedUrl: `https://cdn.example.com/${candidate.localPath}`,
        }))
      },
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
        outputDir: createTestPath("http-server", "upload-progress-output"),
        options,
      }),
    })
    const exportBody = (await exportResponse.json()) as {
      jobId: string
    }

    await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-ready",
    })

    const uploadResponse = await fetch(`${baseUrl}/api/export/${exportBody.jobId}/upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify(
        createUploadPayload({
          repo: "owner/name",
          token: "ghp_upload_progress",
        }),
      ),
    })

    const uploadingJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "uploading" && job.upload.uploadedCount === 1,
    })

    expect(uploadResponse.status).toBe(202)
    expect(uploadingJob.upload.status).toBe("uploading")
    expect(uploadingJob.upload.uploadedCount).toBe(1)
    expect(uploadingJob.items[0]?.upload.uploadedCount).toBe(1)
    expect(uploadingJob.logs.some((entry) => entry.message.includes("문서 치환"))).toBe(false)

    releaseUpload()

    const completedJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-completed",
    })

    expect(completedJob.logs.some((entry) => entry.message.includes("문서 치환 완료"))).toBe(true)
  })

  it("preserves uploadedCount when rewrite fails after upload results return", async () => {
    const uploadPhaseRunner = vi.fn(async ({ candidates }: { candidates: UploadCandidate[] }) =>
      candidates.map((candidate) => ({
        candidate,
        uploadedUrl: `https://cdn.example.com/${candidate.localPath}`,
      })),
    )
    const postUploadRewriter = vi.fn(async () => {
      throw new Error("rewrite failed")
    })

    mockFetcher({
      html: uploadHtml,
      thumbnailUrl: "https://example.com/thumb.png",
    })

    activeServer = createTestHttpServer({
      uploadPhaseRunner,
      postUploadRewriter,
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
        outputDir: createTestPath("http-server", "rewrite-failure-output"),
        options,
      }),
    })
    const exportBody = (await exportResponse.json()) as {
      jobId: string
    }

    await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-ready",
    })

    const uploadResponse = await fetch(`${baseUrl}/api/export/${exportBody.jobId}/upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify(
        createUploadPayload({
          repo: "owner/name",
          token: "ghp_rewrite_failure",
        }),
      ),
    })
    const failedJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-failed",
    })

    expect(uploadResponse.status).toBe(202)
    expect(uploadPhaseRunner).toHaveBeenCalledTimes(1)
    expect(postUploadRewriter).toHaveBeenCalledTimes(1)
    expect(failedJob.upload.uploadedCount).toBe(failedJob.upload.candidateCount)
    expect(failedJob.upload.failedCount).toBe(0)
    expect(failedJob.items[0]?.upload.uploadedCount).toBe(failedJob.items[0]?.upload.candidateCount)
  })
})
