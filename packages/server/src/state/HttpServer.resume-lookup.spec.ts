import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import {
  baseScanResult,
  cleanupTestServerRoots,
  createTestHttpServer,
  startServer,
} from "@tests/support/server/HttpServerSpecHarness.js"
import { createTestPath, createTestTempDir } from "@tests/support/test-paths.js"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ExportJobState, ExportManifest } from "@exitpress/domain/export-job/Types.js"

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

describe("http server resume lookup", () => {
  it("looks up resumable jobs for an explicit output path", async () => {
    const rootDir = await createTestTempDir("export-manifest-lookup-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    const outputDir = path.join(rootDir, "resume-output")

    try {
      await mkdir(outputDir, { recursive: true })
      await writeFile(
        path.join(outputDir, "manifest.json"),
        JSON.stringify(
          {
            blogId: "mym0404",
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
              id: "job-lookup",
              phase: "export",
              request: {
                blogIdOrUrl: "mym0404",
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
                blogId: baseScanResult.blogId,
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

      const response = await fetch(`${baseUrl}/api/export-resume/lookup`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          outputDir,
        }),
      })
      const body = (await response.json()) as {
        resumedJob: ExportJobState | null
        resumeSummary: {
          outputDir: string
        } | null
      }

      expect(response.ok).toBe(true)
      expect(body.resumedJob?.id).toBe("job-lookup")
      expect(body.resumeSummary?.outputDir).toBe(outputDir)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("restores a resumable job for an explicit output path and persists that path", async () => {
    const rootDir = await createTestTempDir("export-manifest-restore-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    const outputDir = path.join(rootDir, "resume-output")

    try {
      await writeFile(
        settingsPath,
        JSON.stringify({
          lastOutputDir: createTestPath("http-server", "previous-output"),
        }),
      )
      await mkdir(outputDir, { recursive: true })
      await writeFile(
        path.join(outputDir, "manifest.json"),
        JSON.stringify(
          {
            blogId: "mym0404",
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
              id: "job-restore",
              phase: "export",
              request: {
                blogIdOrUrl: "mym0404",
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
                blogId: baseScanResult.blogId,
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

      const response = await fetch(`${baseUrl}/api/export-resume/restore`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          outputDir,
        }),
      })
      const body = (await response.json()) as {
        resumedJob: ExportJobState | null
      }

      expect(response.ok).toBe(true)
      expect(body.resumedJob?.id).toBe("job-restore")

      const saved = JSON.parse(await readFile(settingsPath, "utf8")) as {
        lastOutputDir: string
      }
      expect(saved.lastOutputDir).toBe(outputDir)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
