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

describe("http server upload start", () => {
  it("accepts same-origin upload actions for upload-ready jobs without persisting provider fields", async () => {
    const uploadPhaseRunner = vi.fn(
      async ({
        candidates,
        uploaderConfig,
      }: {
        candidates: UploadCandidate[]
        uploaderConfig: Record<string, unknown>
      }) => {
        expect(candidates).toHaveLength(1)
        expect(candidates[0]?.localPath).toMatch(/^public\/[a-f0-9]{64}\.png$/)
        expect(uploaderConfig).toMatchObject({
          branch: "main",
          repo: "owner/name",
          token: "ghp_test_upload_token",
          customUrl: "https://cdn.jsdelivr.net/gh/mym0404/ia2@main",
        })
        expect(uploaderConfig).not.toHaveProperty("path")

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
        outputDir: createTestPath("http-server", "upload-ready-output"),
        options,
      }),
    })
    const exportBody = (await exportResponse.json()) as {
      jobId: string
    }
    const readyJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-ready",
    })

    expect(readyJob.upload.status).toBe("upload-ready")
    expect(readyJob.upload.candidateCount).toBe(1)

    const uploadResponse = await fetch(`${baseUrl}/api/export/${exportBody.jobId}/upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify(
        createUploadPayload({
          branch: "main",
          repo: "owner/name",
          path: "/",
          token: "ghp_test_upload_token",
          customUrl: "https://cdn.jsdelivr.net/gh/mym0404/ia2@main",
        }),
      ),
    })
    const completedJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-completed",
    })
    const serializedJob = JSON.stringify(completedJob)

    expect(uploadResponse.status).toBe(202)
    expect(uploadPhaseRunner).toHaveBeenCalledTimes(1)
    expect(completedJob.upload.status).toBe("upload-completed")
    expect(completedJob.upload.uploadedCount).toBe(completedJob.upload.candidateCount)
    expect(completedJob.items[0]?.upload.uploadedUrls).toHaveLength(1)
    expect(completedJob.items[0]?.upload.uploadedUrls[0]).toMatch(
      /^https:\/\/cdn\.example\.com\/public\/[a-f0-9]{64}\.png$/,
    )
    expect(completedJob.items[0]).not.toHaveProperty("externalPreviewUrl")
    expect(serializedJob).not.toContain("providerFields")
    expect(serializedJob).not.toContain("ghp_test_upload_token")
    expect(serializedJob).not.toContain("owner/name")
  })

  it("preserves false and 0 in normalized provider fields", async () => {
    const uploadPhaseRunner = vi.fn(
      async ({
        candidates,
        uploaderConfig,
      }: {
        candidates: UploadCandidate[]
        uploaderConfig: Record<string, unknown>
      }) => {
        expect(uploaderConfig).toEqual({
          permission: 0,
          port: 0,
          secretId: "secret-id-123",
          slim: false,
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
        outputDir: createTestPath("http-server", "upload-provider-scalars-output"),
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
        createUploadPayload(
          {
            permission: 0,
            port: 0,
            secretId: "secret-id-123",
            slim: false,
          },
          "tcyun",
        ),
      ),
    })

    expect(uploadResponse.status).toBe(202)
    await vi.waitFor(() => {
      expect(uploadPhaseRunner).toHaveBeenCalledTimes(1)
    })
  })

  it("redacts only string provider fields in upload failures", async () => {
    const uploadPhaseRunner = vi.fn().mockRejectedValueOnce(new Error("secret-id-xyz false 0"))

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
        outputDir: createTestPath("http-server", "upload-provider-redaction-output"),
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
        createUploadPayload(
          {
            permission: 0,
            port: 0,
            secretId: "secret-id-xyz",
            slim: false,
          },
          "tcyun",
        ),
      ),
    })
    const failedJob = await waitForJob({
      baseUrl,
      jobId: exportBody.jobId,
      accept: (job) => job.status === "upload-failed",
    })

    expect(uploadResponse.status).toBe(202)
    expect(failedJob.error).toContain("[redacted]")
    expect(failedJob.error).toContain("false")
    expect(failedJob.error).toContain("0")
    expect(failedJob.error).not.toContain("secret-id-xyz")
  })
})
