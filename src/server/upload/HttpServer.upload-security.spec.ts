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
import { createTestPath } from "../../../tests/support/test-paths.js"
import { defaultExportOptions } from "../../domain/export-options/ExportOptions.js"

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

describe("http server upload security", () => {
  it("rejects cross-site style upload requests", async () => {
    const uploadPhaseRunner = vi.fn()

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
        outputDir: createTestPath("http-server", "cross-site-output"),
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
        origin: "https://evil.example",
      },
      body: JSON.stringify(createUploadPayload({ repo: "owner/name" })),
    })
    const body = (await uploadResponse.json()) as {
      error: string
    }

    expect(uploadResponse.status).toBe(403)
    expect(body.error).toContain("same-origin")
    expect(uploadPhaseRunner).not.toHaveBeenCalled()
  })

  it("rejects upload requests that omit the Origin header", async () => {
    const uploadPhaseRunner = vi.fn()

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
        outputDir: createTestPath("http-server", "missing-origin-output"),
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
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify(createUploadPayload({ repo: "owner/name" })),
    })
    const body = (await uploadResponse.json()) as {
      error: string
    }

    expect(uploadResponse.status).toBe(403)
    expect(body.error).toContain("same-origin")
    expect(uploadPhaseRunner).not.toHaveBeenCalled()
  })

  it("keeps a safe upload failure reason and allows retry from upload-failed jobs", async () => {
    const uploadPhaseRunner = vi
      .fn()
      .mockRejectedValueOnce(new Error("GitHub rejected token ghp_retry_secret for owner/name"))
      .mockImplementationOnce(async ({ candidates }: { candidates: UploadCandidate[] }) =>
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
        outputDir: createTestPath("http-server", "upload-retry-output"),
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

    const firstUploadResponse = await fetch(`${baseUrl}/api/export/${exportBody.jobId}/upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify(
        createUploadPayload({
          repo: "owner/name",
          token: "ghp_retry_secret",
        }),
      ),
    })
    const failedJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-failed",
    })

    expect(firstUploadResponse.status).toBe(202)
    expect(failedJob.error).toContain("[redacted]")
    expect(failedJob.error).not.toContain("owner/name")
    expect(failedJob.error).not.toContain("ghp_retry_secret")
    expect(failedJob.upload.status).toBe("upload-failed")

    const retryResponse = await fetch(`${baseUrl}/api/export/${exportBody.jobId}/upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify(
        createUploadPayload({
          repo: "owner/name",
          token: "ghp_retry_fixed",
        }),
      ),
    })
    const completedJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-completed",
    })

    expect(retryResponse.status).toBe(202)
    expect(uploadPhaseRunner).toHaveBeenCalledTimes(2)
    expect(completedJob.upload.status).toBe("upload-completed")
    expect(JSON.stringify(completedJob)).not.toContain("ghp_retry_fixed")
  })
})
