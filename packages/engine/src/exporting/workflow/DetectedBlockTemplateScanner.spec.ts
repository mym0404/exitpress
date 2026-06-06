import { cloneExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { describe, expect, it, vi } from "vitest"

import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"

import { detectBlockTemplateKeys } from "./DetectedBlockTemplateScanner.js"

const categories = [
  {
    id: 1,
    name: "Image",
    parentId: null,
    postCount: 2,
    isDivider: false,
    isOpen: true,
    path: ["Image"],
    depth: 0,
  },
  {
    id: 2,
    name: "Table",
    parentId: null,
    postCount: 1,
    isDivider: false,
    isOpen: true,
    path: ["Table"],
    depth: 0,
  },
]

const scanResult: ScanResult & { posts: NonNullable<ScanResult["posts"]> } = {
  blogId: "mym0404",
  totalPostCount: 3,
  categories,
  posts: [
    {
      blogId: "mym0404",
      logNo: "1",
      title: "Image post",
      publishedAt: "2024-01-03T12:00:00+09:00",
      categoryId: 1,
      categoryName: "Image",
      source: "https://blog.naver.com/mym0404/1",
      thumbnailUrl: null,
    },
    {
      blogId: "mym0404",
      logNo: "3",
      title: "Second image post",
      publishedAt: "2024-01-05T12:00:00+09:00",
      categoryId: 1,
      categoryName: "Image",
      source: "https://blog.naver.com/mym0404/3",
      thumbnailUrl: null,
    },
    {
      blogId: "mym0404",
      logNo: "2",
      title: "Table post",
      publishedAt: "2024-01-04T12:00:00+09:00",
      categoryId: 2,
      categoryName: "Table",
      source: "https://blog.naver.com/mym0404/2",
      thumbnailUrl: null,
    },
  ],
}

const createSe4Html = (componentHtml: string) => `
  <html>
    <head>
      <script>var data = { smartEditorVersion: 4 }</script>
    </head>
    <body>
      <div id="viewTypeSelector">
        ${componentHtml}
      </div>
    </body>
  </html>
`

const se4ImageHtml = createSe4Html(`
  <div class="se-component se-image">
    <a class="se-module-image-link" data-linkdata='{"src":"https://example.com/image.png"}'>
      <img src="https://example.com/image.png" alt="diagram" />
    </a>
  </div>
`)

const se4TableHtml = createSe4Html(`
  <div class="se-component se-table">
    <table><tbody><tr><td>cell</td></tr></tbody></table>
  </div>
`)

describe("detectBlockTemplateKeys", () => {
  it("fetches scoped posts and returns unique output selection keys", async () => {
    const options = cloneExportOptions({
      scope: {
        categoryIds: [1],
        categoryMode: "exact-selected",
      },
    })
    const fetchPostHtml = vi.fn(async (logNo: string) => {
      if (logNo === "1" || logNo === "3") {
        return se4ImageHtml
      }

      return se4TableHtml
    })

    await expect(
      detectBlockTemplateKeys({
        scanResult,
        options,
        fetcher: {
          fetchPostHtml,
        },
      }),
    ).resolves.toEqual(["naver-se4:image"])
    expect(fetchPostHtml).toHaveBeenCalledTimes(2)
    expect(fetchPostHtml.mock.calls.map(([logNo]) => logNo).sort()).toEqual(["1", "3"])
    expect(fetchPostHtml).not.toHaveBeenCalledWith("2")
  })
})
