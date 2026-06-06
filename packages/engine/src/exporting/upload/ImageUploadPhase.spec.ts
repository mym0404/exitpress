import { createTestPath } from "@tests/support/test-paths.js"
import { describe, expect, it, vi } from "vitest"

import type { UploadCandidate } from "@exitpress/domain/export-job/Types.js"

import type { ImageUploadProgress } from "./ImageUploadPhase.js"

import { ImageUploadPhaseError, runImageUploadPhase } from "./ImageUploadPhase.js"

const testExportDir = createTestPath("image-upload-phase", "export")

const createCandidate = (
  localPath: string,
  sourceUrl = `https://example.com/${localPath}`,
): UploadCandidate => ({
  kind: "image",
  sourceUrl,
  localPath,
  markdownReference: `../../${localPath}`,
})

describe("runImageUploadPhase", () => {
  it("uploads deduped candidates one by one and reports monotonic progress", async () => {
    const progressUpdates: ImageUploadProgress[] = []
    const startedCandidates: string[] = []
    const uploadedCandidates: string[] = []
    const upload = vi
      .fn()
      .mockResolvedValueOnce([{ imgUrl: "https://cdn.example.com/a.png" }])
      .mockResolvedValueOnce([{ url: "https://cdn.example.com/b.png" }])
    const client = {
      changeCurrentUploader: vi.fn(),
      upload,
    }

    const results = await runImageUploadPhase(
      {
        outputDir: testExportDir,
        candidates: [
          createCandidate("public/a.png"),
          createCandidate("public/a.png", "https://example.com/duplicate-a.png"),
          createCandidate("public/b.png"),
        ],
        uploaderKey: "github",
        uploaderConfig: {
          repo: "owner/name",
        },
        onAssetStart: (candidate) => {
          startedCandidates.push(candidate.localPath)
        },
        onAssetUploaded: ({ result }) => {
          uploadedCandidates.push(result.candidate.localPath)
        },
        onProgress: (progress) => progressUpdates.push(progress),
      },
      async () => client,
    )

    expect(client.changeCurrentUploader).toHaveBeenCalledWith("github", {
      repo: "owner/name",
    })
    expect(upload.mock.calls).toEqual([
      [[`${testExportDir}/public/a.png`]],
      [[`${testExportDir}/public/b.png`]],
    ])
    expect(startedCandidates).toEqual(["public/a.png", "public/b.png"])
    expect(uploadedCandidates).toEqual(["public/a.png", "public/b.png"])
    expect(progressUpdates).toEqual([
      {
        total: 2,
        uploadedCount: 0,
        lastCompletedLocalPath: null,
      },
      {
        total: 2,
        uploadedCount: 1,
        lastCompletedLocalPath: "public/a.png",
      },
      {
        total: 2,
        uploadedCount: 2,
        lastCompletedLocalPath: "public/b.png",
      },
    ])
    expect(results).toEqual([
      {
        candidate: createCandidate("public/a.png"),
        uploadedUrl: "https://cdn.example.com/a.png",
      },
      {
        candidate: createCandidate("public/b.png"),
        uploadedUrl: "https://cdn.example.com/b.png",
      },
    ])
  })

  it("keeps already uploaded results on failure after partial success", async () => {
    const progressUpdates: ImageUploadProgress[] = []
    const client = {
      changeCurrentUploader: vi.fn(),
      upload: vi
        .fn()
        .mockResolvedValueOnce([{ imgUrl: "https://cdn.example.com/a.png" }])
        .mockResolvedValueOnce(new Error("provider failed")),
    }

    const uploadPromise = runImageUploadPhase(
      {
        outputDir: testExportDir,
        candidates: [createCandidate("public/a.png"), createCandidate("public/b.png")],
        uploaderKey: "github",
        uploaderConfig: {
          repo: "owner/name",
        },
        onProgress: (progress) => progressUpdates.push(progress),
      },
      async () => client,
    )

    await expect(uploadPromise).rejects.toBeInstanceOf(ImageUploadPhaseError)

    try {
      await uploadPromise
    } catch (error) {
      expect(error).toBeInstanceOf(ImageUploadPhaseError)
      expect((error as ImageUploadPhaseError).uploadedResults).toEqual([
        {
          candidate: createCandidate("public/a.png"),
          uploadedUrl: "https://cdn.example.com/a.png",
        },
      ])
    }

    expect(progressUpdates).toEqual([
      {
        total: 2,
        uploadedCount: 0,
        lastCompletedLocalPath: null,
      },
      {
        total: 2,
        uploadedCount: 1,
        lastCompletedLocalPath: "public/a.png",
      },
    ])
  })
})
