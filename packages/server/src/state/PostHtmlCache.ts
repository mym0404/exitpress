import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { ensureDir } from "@exitpress/engine/infra/node/FilePaths.js"

import type { BlogPostContentCache } from "@exitpress/engine/blog/Blog.js"

const getPostHtmlCachePath = ({
  cacheDir,
  blogKey,
  sourceId,
  postId,
}: {
  cacheDir: string
  blogKey: string
  sourceId: string
  postId: string
}) =>
  path.join(
    cacheDir,
    encodeURIComponent(blogKey),
    encodeURIComponent(sourceId),
    `${encodeURIComponent(postId)}.html`,
  )

export const createPostHtmlCache = ({ cacheDir }: { cacheDir: string }): BlogPostContentCache => ({
  getPostHtml: async ({ blogKey, sourceId, postId }) => {
    try {
      return await readFile(getPostHtmlCachePath({ cacheDir, blogKey, sourceId, postId }), "utf8")
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return null
      }

      throw error
    }
  },
  setPostHtml: async ({ blogKey, sourceId, postId, html }) => {
    const cachePath = getPostHtmlCachePath({ cacheDir, blogKey, sourceId, postId })
    await ensureDir(path.dirname(cachePath))
    await writeFile(cachePath, html, "utf8")
  },
})
