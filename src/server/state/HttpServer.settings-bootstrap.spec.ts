import { afterEach, describe, expect, it, vi } from "vitest"
import type { ExportJobState, ExportManifest } from "../../domain/export-job/Types.js"
import {
  baseScanResult,
  cleanupTestServerRoots,
  createTestHttpServer,
  startServer,
  waitForJob,
} from "../../../tests/support/server/HttpServerSpecHarness.js"
import { createTestTempDir } from "../../../tests/support/test-paths.js"
import { defaultExportOptions } from "../../domain/export-options/ExportOptions.js"
import { NaverBlogExporter } from "../../exporting/workflow/NaverBlogExporter.js"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

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

describe("http server settings bootstrap", () => {
  it("keeps the newer in-memory job when bootstrap sees an older manifest snapshot", async () => {
    const rootDir = await createTestTempDir("export-manifest-stale-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    const outputDir = path.join(rootDir, "output")
    const staleManifest = {
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
        status: "not-requested" as const,
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
        phase: "export" as const,
        request: {
          blogIdOrUrl: "mym0404",
          outputDir,
          profile: "gfm" as const,
          options: defaultExportOptions(),
        },
        status: "running" as const,
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
          status: "not-requested" as const,
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
          status: "running" as const,
          outputDir,
          totalPosts: 3,
          completedCount: 1,
          failedCount: 0,
          uploadCandidateCount: 0,
          uploadedCount: 0,
        },
      },
    } satisfies ExportManifest

    let resolveRun: ((manifest: ExportManifest) => void) | undefined
    const runPromise = new Promise<ExportManifest>((resolve) => {
      resolveRun = resolve
    })
    const exporterRunSpy = vi
      .spyOn(NaverBlogExporter.prototype, "run")
      .mockImplementation(() => runPromise)

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
        JSON.stringify(staleManifest, null, 2),
        "utf8",
      )

      activeServer = createTestHttpServer({
        settingsPath,
      })
      const baseUrl = await startServer(activeServer)

      const firstBootstrap = await fetch(`${baseUrl}/api/export-defaults`)
      const firstBody = (await firstBootstrap.json()) as {
        resumedJob: ExportJobState | null
      }

      expect(firstBootstrap.status).toBe(200)
      expect(firstBody.resumedJob?.resumeAvailable).toBe(true)

      const resumeResponse = await fetch(`${baseUrl}/api/export/job-resume/resume`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: "{}",
      })

      expect(resumeResponse.status).toBe(202)

      await vi.waitFor(async () => {
        const persistedManifest = JSON.parse(
          await readFile(path.join(outputDir, "manifest.json"), "utf8"),
        ) as ExportManifest

        expect(persistedManifest.job?.updatedAt).not.toBe(staleManifest.job.updatedAt)
      })

      await writeFile(
        path.join(outputDir, "manifest.json"),
        JSON.stringify(staleManifest, null, 2),
        "utf8",
      )

      const secondBootstrap = await fetch(`${baseUrl}/api/export-defaults`)
      const secondBody = (await secondBootstrap.json()) as {
        resumedJob: ExportJobState | null
      }

      expect(secondBootstrap.status).toBe(200)
      expect(secondBody.resumedJob?.id).toBe("job-resume")
      expect(secondBody.resumedJob?.resumeAvailable).toBe(false)

      if (resolveRun) {
        resolveRun({
          ...staleManifest,
          finishedAt: "2026-04-11T04:00:06.000Z",
          job: {
            ...staleManifest.job,
            updatedAt: "2026-04-11T04:00:06.000Z",
            status: "completed",
            finishedAt: "2026-04-11T04:00:06.000Z",
            summary: {
              ...staleManifest.job.summary,
              status: "completed",
              completedCount: 3,
            },
          },
          successCount: 3,
        })
      }
      await waitForJob({
        baseUrl,
        jobId: "job-resume",
        accept: (job) => job.status === "completed",
      })
      await vi.waitFor(async () => {
        const completedManifest = JSON.parse(
          await readFile(path.join(outputDir, "manifest.json"), "utf8"),
        ) as ExportManifest

        expect(completedManifest.job?.status).toBe("completed")
        expect(completedManifest.job?.summary.status).toBe("completed")
      })
      await vi.waitFor(() => {
        expect(exporterRunSpy).toHaveBeenCalledTimes(1)
      })
    } finally {
      if (resolveRun) {
        resolveRun(staleManifest)
      }
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("loads persisted export settings from the project settings file", async () => {
    const rootDir = await createTestTempDir("export-settings-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")

    await writeFile(
      settingsPath,
      JSON.stringify(
        {
          options: {
            scope: {
              categoryIds: [101, 202],
              dateFrom: "2026-04-01",
            },
            structure: {
              groupByCategory: false,
            },
            frontmatter: {
              aliases: {
                title: "postTitle",
              },
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    )

    try {
      activeServer = createTestHttpServer({
        settingsPath,
      })
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/export-defaults`)
      const body = (await response.json()) as {
        options: {
          scope: {
            categoryIds: number[]
            dateFrom: string | null
          }
          structure: {
            groupByCategory: boolean
            slugStyle: string
            slugWhitespace: string
            postFolderNameMode: string
            postFolderNameCustomTemplate: string
          }
          frontmatter: {
            aliases: {
              title: string
            }
          }
        }
        lastOutputDir: string
      }

      expect(response.status).toBe(200)
      expect(body.options.scope.categoryIds).toEqual([])
      expect(body.options.scope.dateFrom).toBe("2026-04-01")
      expect(body.options.structure.groupByCategory).toBe(false)
      expect(body.options.structure.slugStyle).toBe("snake")
      expect(body.options.structure.slugWhitespace).toBe("underscore")
      expect(body.options.structure.postFolderNameMode).toBe("preset")
      expect(body.options.structure.postFolderNameCustomTemplate).toBe("")
      expect(body.options.frontmatter.aliases.title).toBe("postTitle")
      expect(body.lastOutputDir).toBe("./output")
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
