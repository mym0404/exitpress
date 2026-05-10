import { mkdir, utimes, writeFile } from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { findLatestReusableIngestOutput, loadReusableIngestOutput } from "./ingest-output.js"
import type { ExportManifest } from "../../../src/modules/exporter/Types.js"
import { createTestTempDir } from "../../../tests/helpers/test-paths.js"

const createManifest = (overrides: Partial<ExportManifest> = {}): ExportManifest => ({
  blogId: "sample",
  profile: "gfm",
  options: {
    scope: {
      categoryIds: [],
      categoryMode: "selected-and-descendants",
      dateFrom: null,
      dateTo: null,
    },
    structure: {
      groupByCategory: true,
      includeDateInPostFolderName: true,
      includeLogNoInPostFolderName: false,
      slugStyle: "snake",
      slugWhitespace: "underscore",
      postFolderNameMode: "preset",
      postFolderNameCustomTemplate: "",
    },
    frontmatter: {
      enabled: true,
      fields: {
        title: true,
        source: true,
        blogId: true,
        logNo: true,
        publishedAt: true,
        category: true,
        categoryPath: true,
        tags: true,
        thumbnail: true,
        exportedAt: true,
        assetPaths: false,
      },
      aliases: {
        title: "",
        source: "",
        blogId: "",
        logNo: "",
        publishedAt: "",
        category: "",
        categoryPath: "",
        tags: "",
        thumbnail: "",
        exportedAt: "",
        assetPaths: "",
      },
    },
    blockOutputs: {
      defaults: {},
    },
    assets: {
      imageHandlingMode: "remote",
      compressionEnabled: false,
      downloadFailureMode: "fail",
      stickerAssetMode: "ignore",
      downloadImages: false,
      downloadThumbnails: false,
      includeImageCaptions: true,
      thumbnailSource: "post-list-first",
    },
    links: {
      sameBlogPostMode: "keep-source",
      sameBlogPostCustomUrlTemplate: "",
    },
  },
  selectedCategoryIds: [],
  startedAt: "2026-05-03T00:00:00.000Z",
  finishedAt: "2026-05-03T00:01:00.000Z",
  totalPosts: 1,
  successCount: 0,
  failureCount: 1,
  upload: {
    status: "not-requested",
    eligiblePostCount: 0,
    candidateCount: 0,
    uploadedCount: 0,
    failedCount: 0,
    terminalReason: null,
  },
  categories: [],
  posts: [
    {
      logNo: "1",
      title: "failed",
      source: "https://blog.naver.com/sample/1",
      category: {
        id: 0,
        name: "",
        path: [],
      },
      status: "failed",
      outputPath: null,
      assetPaths: [],
      upload: {
        eligible: false,
        candidateCount: 0,
        uploadedCount: 0,
        failedCount: 0,
        candidates: [],
        uploadedUrls: [],
        rewriteStatus: "pending",
        rewrittenAt: null,
      },
      error: "boom",
    },
  ],
  ...overrides,
})

describe("ingest output reuse helpers", () => {
  it("loads only completed matching manifests", async () => {
    const dir = await createTestTempDir("ingest-output-")
    await writeFile(path.join(dir, "manifest.json"), `${JSON.stringify(createManifest())}\n`, "utf8")

    const output = await loadReusableIngestOutput({
      blogId: "sample",
      outputDir: dir,
    })

    expect(output?.failedPosts).toHaveLength(1)
  })

  it("ignores unfinished manifests", async () => {
    const dir = await createTestTempDir("ingest-output-")
    await writeFile(
      path.join(dir, "manifest.json"),
      `${JSON.stringify(createManifest({ finishedAt: null }))}\n`,
      "utf8",
    )

    await expect(loadReusableIngestOutput({ blogId: "sample", outputDir: dir })).resolves.toBeNull()
  })

  it("finds the latest completed output for a blog", async () => {
    const root = await createTestTempDir("ingest-output-root-")
    const oldDir = path.join(root, "old")
    const newDir = path.join(root, "new")

    await mkdir(oldDir, { recursive: true })
    await mkdir(newDir, { recursive: true })
    await writeFile(
      path.join(oldDir, "manifest.json"),
      `${JSON.stringify(createManifest({ finishedAt: "2026-05-02T00:00:00.000Z" }))}\n`,
      "utf8",
    )
    await writeFile(
      path.join(newDir, "manifest.json"),
      `${JSON.stringify(createManifest({ finishedAt: "2026-05-03T00:00:00.000Z" }))}\n`,
      "utf8",
    )
    const now = new Date()
    await utimes(oldDir, now, now)
    await utimes(newDir, new Date("2026-05-01T00:00:00.000Z"), new Date("2026-05-01T00:00:00.000Z"))

    const output = await findLatestReusableIngestOutput({
      blogId: "sample",
      rootDir: root,
    })

    expect(output?.outputDir).toBe(newDir)
  })
})
