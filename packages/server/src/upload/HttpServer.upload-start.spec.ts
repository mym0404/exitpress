import { access, readFile } from "node:fs/promises"
import path from "node:path"

import {
  cleanupTestServerRoots,
  createUploadReadyJob,
  createTestHttpServer,
  createUploadPayload,
  startServer,
} from "@tests/support/server/HttpServerSpecHarness.js"
import { createTestPath } from "@tests/support/test-paths.js"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { UploadCandidate } from "@exitpress/domain/export-job/schema/UploadState.js"
import type { UploadProviderFields } from "@exitpress/domain/upload/schema/UploadProvider.js"

import { JobStore } from "../jobs/JobStore.js"

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
  it("tests an upload provider with a temporary PNG without creating job state", async () => {
    let assetPath: string | null = null
    const jobStore = new JobStore()
    const normalizedFields = {
      branch: "main",
      enabled: false,
      path: " nested/path ",
      retryLimit: 0,
      repo: "owner/name",
      token: "ghp_test_upload_token",
    } satisfies UploadProviderFields
    const uploadPhaseRunner = vi.fn(
      async ({
        outputDir,
        candidates,
        uploaderConfig,
      }: {
        outputDir: string
        candidates: UploadCandidate[]
        uploaderConfig: Record<string, unknown>
      }) => {
        expect(candidates).toHaveLength(1)
        const candidate = candidates[0]!

        assetPath = path.join(outputDir, candidate.localPath)
        const bytes = await readFile(assetPath)

        expect(bytes.subarray(0, 8)).toEqual(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        )
        expect(uploaderConfig).toEqual({
          branch: "main",
          enabled: false,
          path: "nested/path",
          retryLimit: 0,
          repo: "owner/name",
          token: "ghp_test_upload_token",
        })

        return [
          {
            candidate,
            uploadedUrl: "https://cdn.example.com/test-upload.png",
          },
        ]
      },
    )

    activeServer = createTestHttpServer({
      jobStore,
      uploadPhaseRunner,
      uploadProviderSource: {
        getCatalog: vi.fn(),
        normalizeProviderFields: vi.fn(async (providerKey: string) =>
          providerKey === "github" ? normalizedFields : null,
        ),
      },
    })
    const baseUrl = await startServer(activeServer)

    const response = await fetch(`${baseUrl}/api/upload-providers/test`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify({
        providerKey: " github ",
        providerFields: normalizedFields,
      }),
    })
    const body = (await response.json()) as {
      uploadedUrl: string
    }

    expect(response.status).toBe(200)
    expect(body.uploadedUrl).toBe("https://cdn.example.com/test-upload.png")
    expect(uploadPhaseRunner).toHaveBeenCalledTimes(1)
    expect(jobStore.jobs.size).toBe(0)
    expect(assetPath).not.toBeNull()
    await expect(access(assetPath!)).rejects.toThrow("ENOENT")
  })

  it("sanitizes upload provider test failures", async () => {
    const normalizedFields = {
      permission: 0,
      secretId: "secret-id-xyz",
      slim: false,
    } satisfies UploadProviderFields
    const uploadPhaseRunner = vi.fn().mockRejectedValueOnce(new Error("secret-id-xyz false 0"))

    activeServer = createTestHttpServer({
      uploadPhaseRunner,
      uploadProviderSource: {
        getCatalog: vi.fn(),
        normalizeProviderFields: vi.fn(async () => normalizedFields),
      },
    })
    const baseUrl = await startServer(activeServer)

    const response = await fetch(`${baseUrl}/api/upload-providers/test`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify({
        providerKey: "tcyun",
        providerFields: normalizedFields,
      }),
    })
    const body = (await response.json()) as {
      error: string
    }

    expect(response.status).toBe(502)
    expect(body.error).toContain("[redacted]")
    expect(body.error).toContain("false")
    expect(body.error).toContain("0")
    expect(body.error).not.toContain("secret-id-xyz")
  })

  it("hides provider values when upload provider test normalization fails", async () => {
    const secretValue = "ghp_test_normalize_secret"
    const uploadPhaseRunner = vi.fn()

    activeServer = createTestHttpServer({
      uploadPhaseRunner,
      uploadProviderSource: {
        getCatalog: vi.fn(),
        normalizeProviderFields: vi.fn(async () => {
          throw new Error(`invalid token ${secretValue}`)
        }),
      },
    })
    const baseUrl = await startServer(activeServer)

    const response = await fetch(`${baseUrl}/api/upload-providers/test`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify({
        providerKey: "github",
        providerFields: {
          repo: "owner/name",
          token: secretValue,
        },
      }),
    })
    const body = (await response.json()) as {
      error: string
    }

    expect(response.status).toBe(400)
    expect(body.error).toContain("업로드 provider 설정")
    expect(body.error).not.toContain(secretValue)
    expect(body.error).not.toContain("owner/name")
    expect(uploadPhaseRunner).not.toHaveBeenCalled()
  })

  it("rejects non-json upload provider test requests", async () => {
    const uploadPhaseRunner = vi.fn()

    activeServer = createTestHttpServer({
      uploadPhaseRunner,
    })
    const baseUrl = await startServer(activeServer)

    const response = await fetch(`${baseUrl}/api/upload-providers/test`, {
      method: "POST",
      headers: {
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: "providerKey=github",
    })
    const body = (await response.json()) as {
      error: string
    }

    expect(response.status).toBe(415)
    expect(body.error).toContain("application/json")
    expect(uploadPhaseRunner).not.toHaveBeenCalled()
  })

  it("rejects non-same-origin upload provider test requests", async () => {
    const uploadPhaseRunner = vi.fn()

    activeServer = createTestHttpServer({
      uploadPhaseRunner,
    })
    const baseUrl = await startServer(activeServer)

    const response = await fetch(`${baseUrl}/api/upload-providers/test`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
      },
      body: JSON.stringify(createUploadPayload({ repo: "owner/name" })),
    })
    const body = (await response.json()) as {
      error: string
    }

    expect(response.status).toBe(403)
    expect(body.error).toContain("same-origin")
    expect(uploadPhaseRunner).not.toHaveBeenCalled()
  })

  it("does not expose a manual upload start route", async () => {
    const jobStore = new JobStore()
    const uploadPhaseRunner = vi.fn()
    const job = await createUploadReadyJob({
      jobStore,
      outputDir: createTestPath("http-server", "manual-upload-route-output"),
    })

    activeServer = createTestHttpServer({
      jobStore,
      uploadPhaseRunner,
    })
    const baseUrl = await startServer(activeServer)

    const uploadResponse = await fetch(`${baseUrl}/api/export/${job.id}/upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify(createUploadPayload({ repo: "owner/name" })),
    })

    expect(uploadResponse.status).toBe(404)
    expect(uploadPhaseRunner).not.toHaveBeenCalled()
  })
})
