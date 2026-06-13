import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import {
  cleanupTestServerRoots,
  createTestHttpServer,
  createUploadPayload,
  mockFetcher,
  startServer,
  uploadHtml,
  waitForJob,
} from "@tests/support/server/HttpServerSpecHarness.js"
import { createTestPath } from "@tests/support/test-paths.js"
import { afterEach, describe, expect, it, vi } from "vitest"

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
  it("fails automatic upload with a safe reason and without persisting provider values", async () => {
    const uploadPhaseRunner = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("GitHub rejected token ghp_export_upload_token for export/target"),
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
        blogKey: "naver",
        sourceInput: "https://blog.naver.com/mym0404",
        outputDir: createTestPath("http-server", "upload-retry-output"),
        options,
        uploadProvider: createUploadPayload({
          repo: "export/target",
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
    const serializedJob = JSON.stringify(failedJob)

    expect(failedJob.error).toContain("[redacted]")
    expect(failedJob.upload.status).toBe("upload-failed")
    expect(uploadPhaseRunner).toHaveBeenCalledTimes(1)
    expect(serializedJob).not.toContain("owner/name")
    expect(serializedJob).not.toContain("ghp_retry_secret")
    expect(serializedJob).not.toContain("export/target")
    expect(serializedJob).not.toContain("ghp_export_upload_token")
  })
})
