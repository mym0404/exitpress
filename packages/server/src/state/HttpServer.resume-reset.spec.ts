import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { NaverBlogExporter } from "@exitpress/blog-naver/exporting/NaverBlogExporter.js"
import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { AbortOperationError } from "@exitpress/engine/infra/runtime/AbortOperation.js"
import {
  baseScanResult,
  cleanupTestServerRoots,
  createTestHttpServer,
  createUploadPayload,
  startServer,
} from "@tests/support/server/HttpServerSpecHarness.js"
import { createTestTempDir } from "@tests/support/test-paths.js"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { ExportManifest } from "@exitpress/domain/export-job/schema/ExportManifest.js"

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

describe("http server resume reset", () => {
  it("clears the resumed output directory and bootstrap state", async () => {
    const rootDir = await createTestTempDir("export-reset-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    const outputDir = path.join(rootDir, "output")

    try {
      await mkdir(outputDir, { recursive: true })
      await writeFile(
        settingsPath,
        JSON.stringify({
          lastOutputDir: outputDir,
        }),
      )
      await writeFile(
        path.join(outputDir, "manifest.json"),
        JSON.stringify(
          {
            sourceId: "mym0404",
            profile: "gfm",
            options: defaultExportOptions(),
            selectedCategoryIds: [84],
            startedAt: "2026-04-11T04:00:00.000Z",
            finishedAt: null,
            totalPosts: 3,
            successCount: 1,
            failureCount: 0,
            upload: {
              status: "not-requested",
              eligiblePostCount: 0,
              candidateCount: 0,
              uploadedCount: 0,
              failedCount: 0,
              terminalReason: null,
            },
            categories: baseScanResult.categories,
            posts: [],
            job: {
              id: "job-reset",
              phase: "export",
              request: {
                sourceInput: "mym0404",
                outputDir,
                profile: "gfm",
                options: defaultExportOptions(),
              },
              status: "running",
              createdAt: "2026-04-11T04:00:00.000Z",
              startedAt: "2026-04-11T04:00:01.000Z",
              finishedAt: null,
              updatedAt: "2026-04-11T04:00:02.000Z",
              progress: {
                total: 3,
                completed: 1,
                failed: 0,
              },
              upload: {
                status: "not-requested",
                eligiblePostCount: 0,
                candidateCount: 0,
                uploadedCount: 0,
                failedCount: 0,
                terminalReason: null,
              },
              error: null,
              scanResult: {
                sourceId: baseScanResult.sourceId,
                totalPostCount: baseScanResult.totalPostCount,
              },
              summary: {
                status: "running",
                outputDir,
                totalPosts: 3,
                completedCount: 1,
                failedCount: 0,
                uploadCandidateCount: 0,
                uploadedCount: 0,
              },
            },
          } satisfies ExportManifest,
          null,
          2,
        ),
        "utf8",
      )

      activeServer = createTestHttpServer({
        settingsPath,
      })
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/export-reset`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          outputDir,
          jobId: "job-reset",
        }),
      })
      const body = (await response.json()) as {
        lastOutputDir: string
        resumedJob: ExportJobState | null
      }

      expect(response.status).toBe(200)
      expect(body.lastOutputDir).toBe("./output")
      expect(body.resumedJob?.request.outputDir).not.toBe(outputDir)
      await expect(access(outputDir)).rejects.toMatchObject({ code: "ENOENT" })

      const saved = JSON.parse(await readFile(settingsPath, "utf8")) as {
        lastOutputDir: string
      }
      expect(saved.lastOutputDir).toBe("./output")
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("cancels an active export job before resetting output", async () => {
    const rootDir = await createTestTempDir("export-reset-active-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    const outputDir = path.join(rootDir, "output")
    let signalSeen = false
    let resolveStarted = () => {}
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })

    vi.spyOn(NaverBlogExporter.prototype, "run").mockImplementation(
      async function (this: NaverBlogExporter) {
        resolveStarted()

        while (!this.abortSignal?.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 5))
        }

        signalSeen = true
        throw new AbortOperationError()
      },
    )

    try {
      activeServer = createTestHttpServer({
        settingsPath,
      })
      const baseUrl = await startServer(activeServer)

      const exportResponse = await fetch(`${baseUrl}/api/export`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sourceInput: "https://blog.naver.com/mym0404",
          outputDir,
          options: defaultExportOptions(),
          uploadProvider: createUploadPayload({
            repo: "owner/name",
            token: "ghp_export_upload_token",
          }),
        }),
      })
      const exportBody = (await exportResponse.json()) as {
        jobId: string
      }

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

  it("returns an error when manifest.json is invalid", async () => {
    const rootDir = await createTestTempDir("export-manifest-invalid-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    const outputDir = path.join(rootDir, "output")

    try {
      await mkdir(outputDir, { recursive: true })
      await writeFile(
        settingsPath,
        JSON.stringify({
          lastOutputDir: outputDir,
        }),
      )
      await writeFile(path.join(outputDir, "manifest.json"), "{invalid", "utf8")

      activeServer = createTestHttpServer({
        settingsPath,
      })
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/export-defaults`)
      const body = (await response.json()) as {
        error: string
      }

      expect(response.status).toBe(500)
      expect(body.error).toContain("JSON")
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
