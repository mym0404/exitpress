import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { ensureDir } from "@exitpress/engine/infra/node/FilePaths.js"

import type { NaverBlogFetcherCache } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"

const getPostHtmlCachePath = ({
  cacheDir,
  sourceId,
  postId,
}: {
  cacheDir: string
  sourceId: string
  postId: string
}) => path.join(cacheDir, encodeURIComponent(sourceId), `${encodeURIComponent(postId)}.html`)

export const createPostHtmlCache = ({ cacheDir }: { cacheDir: string }): NaverBlogFetcherCache => ({
  getPostHtml: async ({ sourceId, postId }) => {
    try {
      return await readFile(getPostHtmlCachePath({ cacheDir, sourceId, postId }), "utf8")
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return null
      }

      throw error
    }
  },
  setPostHtml: async ({ sourceId, postId, html }) => {
    const cachePath = getPostHtmlCachePath({ cacheDir, sourceId, postId })
    await ensureDir(path.dirname(cachePath))
    await writeFile(cachePath, html, "utf8")
  },
})
