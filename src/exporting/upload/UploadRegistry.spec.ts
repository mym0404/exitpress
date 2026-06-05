import { describe, expect, it, vi } from "vitest"

import { createUploadRegistry } from "./UploadRegistry.js"

describe("createUploadRegistry", () => {
  it("uploads the same local asset once for concurrent callers", async () => {
    const upload = vi.fn(async () => ({
      uploadedUrl: "https://cdn.example.com/a.png",
    }))
    const registry = createUploadRegistry({ upload })

    const [left, right] = await Promise.all([
      registry.uploadOnce({
        uploadKey: "sha256:a",
        localPath: "/tmp/a.png",
      }),
      registry.uploadOnce({
        uploadKey: "sha256:a",
        localPath: "/tmp/a.png",
      }),
    ])

    expect(left).toBe("https://cdn.example.com/a.png")
    expect(right).toBe("https://cdn.example.com/a.png")
    expect(upload).toHaveBeenCalledTimes(1)
    expect(registry.getSnapshot()["sha256:a"]).toMatchObject({
      status: "uploaded",
      uploadedUrl: "https://cdn.example.com/a.png",
    })
  })

  it("uses seeded uploaded entries without another upload", async () => {
    const upload = vi.fn()
    const registry = createUploadRegistry({
      upload,
      seed: {
        "sha256:a": {
          uploadKey: "sha256:a",
          localPath: "/tmp/a.png",
          status: "uploaded",
          uploadedUrl: "https://cdn.example.com/a.png",
        },
      },
    })

    await expect(
      registry.uploadOnce({
        uploadKey: "sha256:a",
        localPath: "/tmp/a.png",
      }),
    ).resolves.toBe("https://cdn.example.com/a.png")
    expect(upload).not.toHaveBeenCalled()
  })
})
