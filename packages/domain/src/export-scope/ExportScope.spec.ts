import { cloneExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { describe, expect, it } from "vitest"

import type { CategoryInfo, PostSummary } from "../blog/schema/BlogScan.js"

import { filterPostsByScope, isPostWithinScope, resolveSelectedCategoryIds } from "./ExportScope.js"

const categories: CategoryInfo[] = [
  {
    id: 1,
    name: "Algorithm",
    parentId: null,
    postCount: 2,
    isDivider: false,
    isOpen: true,
    path: ["Algorithm"],
    depth: 0,
  },
  {
    id: 2,
    name: "BOJ",
    parentId: 1,
    postCount: 1,
    isDivider: false,
    isOpen: true,
    path: ["Algorithm", "BOJ"],
    depth: 1,
  },
]

const posts: PostSummary[] = [
  {
    blogKey: "sample",
    sourceId: "mym0404",
    postId: "1",
    title: "First",
    publishedAt: "2024-01-03T12:00:00+09:00",
    categoryId: 1,
    categoryName: "Algorithm",
    source: "https://example.com/source-a/1",
    thumbnailUrl: null,
  },
  {
    blogKey: "sample",
    sourceId: "mym0404",
    postId: "2",
    title: "Second",
    publishedAt: "2024-01-04T12:00:00+09:00",
    categoryId: 2,
    categoryName: "BOJ",
    source: "https://example.com/source-a/2",
    thumbnailUrl: null,
  },
]

describe("export-scope", () => {
  it("resolves descendant categories when categoryMode includes descendants", () => {
    const options = cloneExportOptions({
      scope: {
        categoryIds: [1],
      },
    })

    expect(
      Array.from(
        resolveSelectedCategoryIds({
          categories,
          options,
        }),
      ),
    ).toEqual([1, 2])
  })

  it("filters posts by exact category and date range", () => {
    const options = cloneExportOptions({
      scope: {
        categoryIds: [2],
        categoryMode: "exact-selected",
        dateFrom: "2024-01-04",
        dateTo: "2024-01-04",
      },
    })

    expect(
      filterPostsByScope({
        posts,
        categories,
        options,
      }),
    ).toEqual([posts[1]])
    expect(
      isPostWithinScope({
        post: posts[0],
        categories,
        options,
      }),
    ).toBe(false)
  })
})
