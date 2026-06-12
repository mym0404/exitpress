import { getSourceUrl, normalizeAssetUrl } from "@exitpress/blog-naver/NaverUrl.js"
import { sanitizeCategoryName } from "@exitpress/domain/blog/CategoryName.js"
import * as HttpRequests from "@exitpress/engine/infra/http/HttpRequests.js"
import { log } from "@exitpress/engine/infra/runtime/Logger.js"
import { mapConcurrent } from "@exitpress/engine/shared/async/util/AsyncTasks.js"
import { toKstDateTime } from "@exitpress/engine/shared/datetime/util/toKstDateTime.js"

import type { CategoryInfo, ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"

import type { CategoryApiItem, PostApiItem } from "./schema/NaverBlogApi.js"

import { fetchNaverBlogJson } from "./NaverBlogJsonClient.js"
import { binaryHeaders, htmlHeaders } from "./NaverBlogRequestHeaders.js"

export type NaverBlogFetcherCache = {
  getPostHtml?: (input: {
    sourceId: string
    postId: string
  }) => string | null | Promise<string | null>
  setPostHtml?: (input: { sourceId: string; postId: string; html: string }) => void | Promise<void>
}

const pageSize = 30
const postListConcurrency = 3
const defaultRetryDelays = [0, 1_000, 2_000, 4_000]
const defaultRequestTimeoutMs = 5_000

export class NaverBlogFetcher {
  readonly blogId: string
  readonly requestTimeoutMs: number
  readonly retryDelays: number[]
  readonly cache?: NaverBlogFetcherCache

  constructor({
    blogId,
    requestTimeoutMs,
    retryDelays,
    cache,
  }: {
    blogId: string
    requestTimeoutMs?: number
    retryDelays?: number[]
    cache?: NaverBlogFetcherCache
  }) {
    this.blogId = blogId
    this.requestTimeoutMs = requestTimeoutMs ?? defaultRequestTimeoutMs
    this.retryDelays = retryDelays ?? defaultRetryDelays
    this.cache = cache
  }

  async getPostCount() {
    const result = await this.fetchJson<{ postCount: number }>({
      url: `https://m.blog.naver.com/api/blogs/${this.blogId}/contents-count`,
    })

    return result.postCount
  }

  async getCategories() {
    const result = await this.fetchJson<{
      mylogCategoryList: CategoryApiItem[]
    }>({
      url: `https://m.blog.naver.com/api/blogs/${this.blogId}/category-list`,
    })

    const categories = result.mylogCategoryList.map((category) => ({
      id: category.categoryNo,
      name: sanitizeCategoryName(category.categoryName),
      parentId: category.parentCategoryNo,
      postCount: category.postCnt,
      isDivider: category.divisionLine,
      isOpen: category.openYN,
      path: [] as string[],
    }))

    const categoryMap = new Map(categories.map((category) => [category.id, category]))

    const resolvePath = (categoryId: number): string[] => {
      const category = categoryMap.get(categoryId)

      if (!category || category.isDivider) {
        return []
      }

      const parentPath = category.parentId ? resolvePath(category.parentId) : []

      return [...parentPath, category.name]
    }

    return categories
      .filter((category) => !category.isDivider && category.isOpen)
      .map((category) => ({
        ...category,
        path: resolvePath(category.id),
        depth: Math.max(resolvePath(category.id).length - 1, 0),
      })) satisfies CategoryInfo[]
  }

  async scanBlog({ includePosts = false }: { includePosts?: boolean } = {}): Promise<ScanResult> {
    const [totalPostCount, categories] = await Promise.all([
      this.getPostCount(),
      this.getCategories(),
    ])
    const posts = includePosts
      ? await this.getAllPosts({
          expectedTotal: totalPostCount,
        })
      : undefined

    return {
      sourceId: this.blogId,
      totalPostCount,
      categories,
      ...(posts ? { posts } : {}),
    } satisfies ScanResult
  }

  async getAllPosts({ expectedTotal }: { expectedTotal?: number } = {}) {
    const resolvedExpectedTotal = expectedTotal ?? (await this.getPostCount())
    const totalPages = Math.max(1, Math.ceil(resolvedExpectedTotal / pageSize))
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    const pageResults = await mapConcurrent({
      items: pageNumbers,
      concurrency: postListConcurrency,
      mapper: async (page) => {
        const result = await this.fetchJson<{
          items: PostApiItem[]
        }>({
          url: `https://m.blog.naver.com/api/blogs/${this.blogId}/post-list?page=${page}&itemCount=${pageSize}&categoryNo=0`,
        })
        const pageItems = result.items
          .filter(
            (item) => !item.notOpen && !item.postBlocked && !item.buddyOpen && !item.bothBuddyOpen,
          )
          .map((item) => ({
            sourceId: this.blogId,
            postId: String(item.logNo),
            title: item.titleWithInspectMessage.trim(),
            publishedAt: toKstDateTime(item.addDate),
            categoryId: item.categoryNo,
            categoryName: sanitizeCategoryName(item.categoryName),
            source: getSourceUrl({
              blogId: this.blogId,
              logNo: String(item.logNo),
            }),
            thumbnailUrl: item.thumbnailUrl ? normalizeAssetUrl(item.thumbnailUrl) : null,
          }))

        log(`목록 수집 ${page}페이지 완료`)

        return {
          page,
          items: pageItems,
        }
      },
    })

    return pageResults
      .sort((left, right) => left.page - right.page)
      .flatMap((pageResult) => pageResult.items)
  }

  async fetchPostHtml(logNo: string) {
    const cachedHtml = await this.cache?.getPostHtml?.({
      sourceId: this.blogId,
      postId: logNo,
    })

    if (typeof cachedHtml === "string") {
      return cachedHtml
    }

    const response = await HttpRequests.fetchResponseWithRetry({
      url: `https://m.blog.naver.com/PostView.naver?blogId=${this.blogId}&logNo=${logNo}`,
      headers: htmlHeaders({
        blogId: this.blogId,
      }),
      failureLabel: "글 HTML 요청 실패",
      retryDelays: this.retryDelays,
      requestTimeoutMs: this.requestTimeoutMs,
    })

    const html = await response.text()

    await this.cache?.setPostHtml?.({
      sourceId: this.blogId,
      postId: logNo,
      html,
    })

    return html
  }

  async downloadBinary({
    sourceUrl,
    destinationPath,
  }: {
    sourceUrl: string
    destinationPath: string
  }) {
    await HttpRequests.downloadBinary({
      sourceUrl: normalizeAssetUrl(sourceUrl),
      destinationPath,
      headers: binaryHeaders,
      failureLabel: "자산 다운로드 실패",
      retryDelays: this.retryDelays,
      requestTimeoutMs: this.requestTimeoutMs,
    })
  }

  async fetchBinary({ sourceUrl }: { sourceUrl: string }) {
    return HttpRequests.fetchBinary({
      sourceUrl: normalizeAssetUrl(sourceUrl),
      headers: binaryHeaders,
      failureLabel: "자산 다운로드 실패",
      retryDelays: this.retryDelays,
      requestTimeoutMs: this.requestTimeoutMs,
    })
  }
  private async fetchJson<Result>({ url }: { url: string }): Promise<Result> {
    return fetchNaverBlogJson({
      blogId: this.blogId,
      url,
      retryDelays: this.retryDelays,
      requestTimeoutMs: this.requestTimeoutMs,
    })
  }
}
