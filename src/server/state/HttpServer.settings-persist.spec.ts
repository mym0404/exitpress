import { afterEach, describe, expect, it, vi } from "vitest"
import {
  cleanupTestServerRoots,
  createTestHttpServer,
  startServer,
} from "../../../tests/support/server/HttpServerSpecHarness.js"
import { createTestTempDir } from "../../../tests/support/test-paths.js"
import { readFile, rm, writeFile } from "node:fs/promises"
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

describe("http server settings persist", () => {
  it("falls back to defaults when the settings file is malformed", async () => {
    const rootDir = await createTestTempDir("export-settings-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")
    await writeFile(settingsPath, "{broken", "utf8")

    try {
      activeServer = createTestHttpServer({
        settingsPath,
      })
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/export-defaults`)
      const body = (await response.json()) as {
        options: {
          structure: {
            groupByCategory: boolean
            slugStyle: string
            postFolderNameMode: string
          }
          scope: {
            categoryIds: number[]
          }
        }
        lastOutputDir: string
      }

      expect(response.status).toBe(200)
      expect(body.options.structure.groupByCategory).toBe(true)
      expect(body.options.structure.slugStyle).toBe("snake")
      expect(body.options.structure.postFolderNameMode).toBe("preset")
      expect(body.options.scope.categoryIds).toEqual([])
      expect(body.lastOutputDir).toBe("./output")
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("persists export settings without category ids", async () => {
    const rootDir = await createTestTempDir("export-settings-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")

    try {
      activeServer = createTestHttpServer({
        settingsPath,
      })
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/export-settings`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          options: {
            scope: {
              categoryIds: [101],
              categoryMode: "exact-selected",
              dateFrom: "2026-04-01",
              dateTo: null,
            },
            structure: {
              groupByCategory: false,
              slugStyle: "kebab",
              slugWhitespace: "dash",
              postFolderNameMode: "custom-template",
              postFolderNameCustomTemplate: "{date}-{slug}",
            },
          },
        }),
      })

      const saved = JSON.parse(await readFile(settingsPath, "utf8")) as {
        options: {
          scope?: {
            categoryMode?: string
            dateFrom?: string | null
            dateTo?: string | null
            categoryIds?: number[]
          }
          structure?: {
            groupByCategory?: boolean
            slugStyle?: string
            slugWhitespace?: string
            postFolderNameMode?: string
            postFolderNameCustomTemplate?: string
          }
        }
        lastOutputDir?: string
      }

      expect(response.status).toBe(204)
      expect(saved.options.scope).toEqual({
        categoryMode: "exact-selected",
        dateFrom: "2026-04-01",
        dateTo: null,
      })
      expect(saved.options.scope?.categoryIds).toBeUndefined()
      expect(saved.options.structure).toEqual({
        groupByCategory: false,
        slugStyle: "kebab",
        slugWhitespace: "dash",
        postFolderNameMode: "custom-template",
        postFolderNameCustomTemplate: "{date}-{slug}",
      })
      expect(saved.lastOutputDir).toBe("./output")
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("rejects invalid persisted export settings payloads", async () => {
    const rootDir = await createTestTempDir("export-settings-")
    const settingsPath = path.join(rootDir, "export-ui-settings.json")

    try {
      activeServer = createTestHttpServer({
        settingsPath,
      })
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/export-settings`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          options: {
            frontmatter: {
              enabled: true,
              fields: {
                title: true,
                source: true,
              },
              aliases: {
                title: "shared",
                source: "shared",
              },
            },
          },
        }),
      })

      const body = (await response.json()) as {
        error: string
      }

      expect(response.status).toBe(400)
      expect(body.error).toContain("같은 alias")
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
