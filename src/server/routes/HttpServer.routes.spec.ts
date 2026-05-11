import { afterEach, describe, expect, it, vi } from "vitest"
import type { ScanResult } from "../../domain/blog/Types.js"
import type { UploadProviderCatalogResponse } from "../../domain/upload/UploadProviderTypes.js"
import {
  baseScanResult,
  cleanupTestServerRoots,
  createOversizedPreviewMarkdown,
  createPosts,
  createTestHttpServer,
  startServer,
} from "../../../tests/support/server/HttpServerSpecHarness.js"
import { createTestTempDir } from "../../../tests/support/test-paths.js"
import { buildMarkdownViewerShareUrl } from "../../exporting/post/MarkdownViewerShareUrl.js"
import { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"
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

describe("http server local routes", () => {
  it("returns the runtime-backed upload provider catalog", async () => {
    activeServer = createTestHttpServer()
    const baseUrl = await startServer(activeServer)

    const response = await fetch(`${baseUrl}/api/upload-providers`)
    const body = (await response.json()) as UploadProviderCatalogResponse

    expect(response.status).toBe(200)
    expect(body.defaultProviderKey).toBe("github")
    expect(body.providers.map((provider) => provider.key)).toEqual(["github", "tcyun"])
    expect(body.providers[1]?.fields.map((field) => field.inputType)).toEqual([
      "text",
      "number",
      "select",
      "checkbox",
    ])
  })

  it("loads upload providers lazily and hides internal runtime errors", async () => {
    const uploadProviderSource = {
      getCatalog: vi.fn(async () => {
        throw new Error("runtime bootstrap failed")
      }),
      normalizeProviderFields: vi.fn(),
    }

    activeServer = createTestHttpServer({
      uploadProviderSource,
    })
    const baseUrl = await startServer(activeServer)

    expect(uploadProviderSource.getCatalog).not.toHaveBeenCalled()

    const defaultsResponse = await fetch(`${baseUrl}/api/export-defaults`)
    expect(defaultsResponse.status).toBe(200)
    expect(uploadProviderSource.getCatalog).not.toHaveBeenCalled()

    const response = await fetch(`${baseUrl}/api/upload-providers`)
    const body = (await response.json()) as {
      error: string
    }

    expect(response.status).toBe(503)
    expect(body.error).toBe("업로드 설정을 불러오지 못했습니다.")
    expect(body.error).not.toContain("PicList")
    expect(uploadProviderSource.getCatalog).toHaveBeenCalledTimes(1)
  })

  it("opens a local output file through the action api", async () => {
    const rootDir = await createTestTempDir("open-local-file-")
    const targetPath = path.join(rootDir, "posts", "first", "index.md")
    const openLocalPath = vi.fn(async () => {})

    try {
      await mkdir(path.dirname(targetPath), { recursive: true })
      await writeFile(targetPath, "# hello")

      activeServer = createTestHttpServer({
        openLocalPath,
      })
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/local-file/open`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseUrl,
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify({
          outputDir: rootDir,
          outputPath: "posts/first/index.md",
        }),
      })

      expect(response.status).toBe(204)
      expect(openLocalPath).toHaveBeenCalledWith(targetPath)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("builds a preview link from the current markdown file through the action api", async () => {
    const rootDir = await createTestTempDir("preview-local-file-")
    const targetPath = path.join(rootDir, "posts", "first", "index.md")

    try {
      await mkdir(path.dirname(targetPath), { recursive: true })
      await writeFile(targetPath, "# hello")

      activeServer = createTestHttpServer()
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/local-file/preview-link`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseUrl,
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify({
          outputDir: rootDir,
          outputPath: "posts/first/index.md",
        }),
      })
      const body = (await response.json()) as {
        previewUrl: string
      }

      expect(response.status).toBe(200)
      expect(body.previewUrl).toMatch(/^https:\/\/markdownviewer\.pages\.dev\/#share=/)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("rejects preview-link requests for missing files", async () => {
    const rootDir = await createTestTempDir("preview-local-file-missing-")

    try {
      activeServer = createTestHttpServer()
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/local-file/preview-link`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseUrl,
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify({
          outputDir: rootDir,
          outputPath: "posts/first/index.md",
        }),
      })

      expect(response.status).toBe(404)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("rejects preview-link requests that escape the output root", async () => {
    const rootDir = await createTestTempDir("preview-local-file-escape-")

    try {
      activeServer = createTestHttpServer()
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/local-file/preview-link`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseUrl,
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify({
          outputDir: rootDir,
          outputPath: "../outside.md",
        }),
      })

      expect(response.status).toBe(400)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("returns 422 when a preview link cannot be generated", async () => {
    const rootDir = await createTestTempDir("preview-local-file-too-large-")
    const targetPath = path.join(rootDir, "posts", "first", "index.md")
    const markdown = createOversizedPreviewMarkdown()

    expect(buildMarkdownViewerShareUrl(markdown)).toBeNull()

    try {
      await mkdir(path.dirname(targetPath), { recursive: true })
      await writeFile(targetPath, markdown, "utf8")

      activeServer = createTestHttpServer()
      const baseUrl = await startServer(activeServer)

      const response = await fetch(`${baseUrl}/api/local-file/preview-link`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseUrl,
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify({
          outputDir: rootDir,
          outputPath: "posts/first/index.md",
        }),
      })

      expect(response.status).toBe(422)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it("persists scan results to a json file and reuses them after app reloads", async () => {
    const rootDir = await createTestTempDir("scan-cache-")
    const scanCachePath = path.join(rootDir, "scan-cache.json")
    const scanBlogSpy = vi.spyOn(NaverBlogFetcher.prototype, "scanBlog").mockResolvedValue({
      ...baseScanResult,
      posts: createPosts(null),
    })

    try {
      activeServer = createTestHttpServer({
        scanCachePath,
      })
      let baseUrl = await startServer(activeServer)

      const firstResponse = await fetch(`${baseUrl}/api/scan`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          blogIdOrUrl: "https://blog.naver.com/mym0404",
        }),
      })

      expect(firstResponse.status).toBe(200)
      expect(scanBlogSpy).toHaveBeenCalledTimes(1)
      expect(await readFile(scanCachePath, "utf8")).toContain('"mym0404"')

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

      activeServer = createTestHttpServer({
        scanCachePath,
      })
      baseUrl = await startServer(activeServer)

      const secondResponse = await fetch(`${baseUrl}/api/scan`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          blogIdOrUrl: "https://blog.naver.com/mym0404",
        }),
      })
      const secondBody = (await secondResponse.json()) as ScanResult

      expect(secondResponse.status).toBe(200)
      expect(secondBody.blogId).toBe("mym0404")
      expect(scanBlogSpy).toHaveBeenCalledTimes(1)

      const forcedResponse = await fetch(`${baseUrl}/api/scan`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          blogIdOrUrl: "https://blog.naver.com/mym0404",
          forceRefresh: true,
        }),
      })

      expect(forcedResponse.status).toBe(200)
      expect(scanBlogSpy).toHaveBeenCalledTimes(2)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
