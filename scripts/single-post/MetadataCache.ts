import { mkdir, writeFile as writeFileDefault } from "node:fs/promises"
import path from "node:path"

import { log } from "@exitpress/engine/infra/runtime/Logger.js"

import type { SinglePostFetcher } from "@exitpress/blog-naver/exporting/SinglePostExport.js"
import type { PostSummary, ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"

type SinglePostMetadataCacheFile = {
  blogKey: string
  sourceId: string
  scan: ScanResult
  posts: PostSummary[]
}

type CreateSinglePostMetadataCachingFetcherArgs = {
  blogKey: string
  sourceId: string
  cachePath: string | null
  readFile: (path: string, encoding: "utf8") => Promise<string>
  writeFile?: (path: string, contents: string, encoding: "utf8") => Promise<void>
  createFetcher: (input: { sourceId: string }) => SinglePostFetcher | Promise<SinglePostFetcher>
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === "string"

const isPostSummary = (value: unknown): value is PostSummary => {
  if (!isObject(value)) {
    return false
  }

  return (
    isString(value.blogKey) &&
    isString(value.sourceId) &&
    isString(value.postId) &&
    isString(value.title) &&
    isString(value.publishedAt) &&
    typeof value.categoryId === "number" &&
    isString(value.categoryName) &&
    isString(value.source) &&
    (value.thumbnailUrl === null || isString(value.thumbnailUrl))
  )
}

const isScanResult = (value: unknown): value is ScanResult => {
  if (!isObject(value)) {
    return false
  }

  return (
    isString(value.blogKey) &&
    isString(value.sourceId) &&
    typeof value.totalPostCount === "number" &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => isObject(category) && isString(category.name))
  )
}

const parseCacheFile = (value: unknown): SinglePostMetadataCacheFile | null => {
  if (!isObject(value)) {
    return null
  }

  if (
    !isString(value.blogKey) ||
    !isString(value.sourceId) ||
    !isScanResult(value.scan) ||
    !Array.isArray(value.posts)
  ) {
    return null
  }

  if (value.scan.sourceId !== value.sourceId) {
    return null
  }

  if (value.scan.blogKey !== value.blogKey) {
    return null
  }

  if (!value.posts.every(isPostSummary)) {
    return null
  }

  if (
    value.posts.some((post) => post.blogKey !== value.blogKey || post.sourceId !== value.sourceId)
  ) {
    return null
  }

  return {
    blogKey: value.blogKey,
    sourceId: value.sourceId,
    scan: value.scan,
    posts: value.posts,
  }
}

export const createSinglePostMetadataCachingFetcher = async ({
  blogKey,
  sourceId,
  cachePath,
  readFile: readFileImpl,
  writeFile,
  createFetcher,
}: CreateSinglePostMetadataCachingFetcherArgs): Promise<SinglePostFetcher> => {
  const resolvedCachePath = cachePath ? path.resolve(cachePath) : null
  const writeFileImpl = writeFile ?? writeFileDefault
  const baseFetcher = await createFetcher({
    sourceId,
  })

  let cachedScan: ScanResult | null = null
  let cachedPosts: PostSummary[] | null = null

  if (resolvedCachePath) {
    try {
      const cacheText = await readFileImpl(resolvedCachePath, "utf8")
      const cache = parseCacheFile(JSON.parse(cacheText))

      if (!cache) {
        throw new Error("cache contents are invalid")
      }

      if (cache.blogKey !== blogKey) {
        throw new Error(`blogKey mismatch: expected ${blogKey}, received ${cache.blogKey}`)
      }

      if (cache.sourceId !== sourceId) {
        throw new Error(`sourceId mismatch: expected ${sourceId}, received ${cache.sourceId}`)
      }

      cachedScan = cache.scan
      cachedPosts = cache.posts
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      if (!message.includes("ENOENT")) {
        log(`metadata cache 재사용 실패: ${resolvedCachePath}`)
        throw new Error(`Invalid metadata cache in ${resolvedCachePath}: ${message}`)
      }
    }
  }

  const persistCache = async () => {
    if (!resolvedCachePath || !cachedScan || !cachedPosts) {
      return
    }

    await mkdir(path.dirname(resolvedCachePath), { recursive: true })
    await writeFileImpl(
      resolvedCachePath,
      `${JSON.stringify(
        {
          blogKey,
          sourceId,
          scan: cachedScan,
          posts: cachedPosts,
        },
        null,
        2,
      )}\n`,
      "utf8",
    )
  }

  return {
    scanBlog: async () => {
      if (cachedScan) {
        return cachedScan
      }

      cachedScan = await baseFetcher.scanBlog()
      await persistCache()
      return cachedScan
    },
    getAllPosts: async () => {
      if (cachedPosts) {
        return cachedPosts
      }

      cachedPosts = await baseFetcher.getAllPosts()
      await persistCache()
      return cachedPosts
    },
    fetchPostHtml: async (requestedPostId: string) => baseFetcher.fetchPostHtml(requestedPostId),
    downloadBinary: async (input) => baseFetcher.downloadBinary(input),
    fetchBinary: async (input) => baseFetcher.fetchBinary(input),
  }
}
