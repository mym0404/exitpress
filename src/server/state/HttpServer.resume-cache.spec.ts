import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import type { ScanResult } from "../../domain/blog/Types.js"
import type { ExportJobState, ExportManifest } from "../../domain/export-job/Types.js"

import {
  baseScanResult,
  cleanupTestServerRoots,
  createPosts,
  createTestHttpServer,
  startServer,
} from "../../../tests/support/server/HttpServerSpecHarness.js"
import { createTestTempDir } from "../../../tests/support/test-paths.js"
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

describe("http server resume cache", () => {
  it("does not hydrate resumed jobs from temporary output directories", async () => {
    const rootDir = await createTestTempDir("export-manifest-temp-resume-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    const outputDir = await mkdtemp(path.join("/tmp", "goodbye-temp-resume-output-"))

    try {
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
              id: "job-temp-resume",
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

      const response = await fetch(`${baseUrl}/api/export-defaults`)
      const body = (await response.json()) as {
        lastOutputDir: string
        resumedJob: ExportJobState | null
        resumeSummary: {
          outputDir: string
        } | null
        resumedScanResult: ScanResult | null
      }

      expect(response.ok).toBe(true)
      expect(body.lastOutputDir).toBe(outputDir)
      expect(body.resumedJob).toBeNull()
      expect(body.resumeSummary).toBeNull()
      expect(body.resumedScanResult).toBeNull()
    } finally {
      await rm(outputDir, { recursive: true, force: true })
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("restores full resumed scan posts from scan cache when manifest snapshot was compacted", async () => {
    const rootDir = await createTestTempDir("export-manifest-resume-cache-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    const scanCachePath = path.join(rootDir, "scan-cache.json")
    const outputDir = path.join(rootDir, "output")
    const cachedScanResult: ScanResult = {
      ...baseScanResult,
      posts: createPosts(null),
    }

    try {
      await mkdir(outputDir, { recursive: true })
      await writeFile(
        settingsPath,
        JSON.stringify({
          lastOutputDir: outputDir,
        }),
      )
      await writeFile(
        scanCachePath,
        JSON.stringify({
          scans: {
            [cachedScanResult.blogId]: cachedScanResult,
          },
        }),
      )
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
            totalPosts: 1,
            successCount: 0,
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
              id: "job-resume",
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
                total: 1,
                completed: 0,
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
                blogId: cachedScanResult.blogId,
                totalPostCount: cachedScanResult.totalPostCount,
              },
              summary: {
                status: "running",
                outputDir,
                totalPosts: 1,
                completedCount: 0,
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
        scanCachePath,
      })
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/export-defaults`)
      const body = (await response.json()) as {
        resumedScanResult: ScanResult | null
      }

      expect(response.ok).toBe(true)
      expect(body.resumedScanResult?.posts).toEqual(cachedScanResult.posts)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
