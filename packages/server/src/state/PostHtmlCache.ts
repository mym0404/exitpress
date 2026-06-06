import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { ensureDir } from "@exitpress/engine/infra/node/util/FilePaths.js"

import type { NaverBlogFetcherCache } from "@exitpress/engine/integrations/naver-blog/NaverBlogFetcher.js"

const getPostHtmlCachePath = ({
  cacheDir,
  blogId,
  logNo,
}: {
  cacheDir: string
  blogId: string
  logNo: string
}) => path.join(cacheDir, encodeURIComponent(blogId), `${encodeURIComponent(logNo)}.html`)

export const createPostHtmlCache = ({ cacheDir }: { cacheDir: string }): NaverBlogFetcherCache => ({
  getPostHtml: async ({ blogId, logNo }) => {
    try {
      return await readFile(getPostHtmlCachePath({ cacheDir, blogId, logNo }), "utf8")
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return null
      }

      throw error
    }
  },
  setPostHtml: async ({ blogId, logNo, html }) => {
    const cachePath = getPostHtmlCachePath({ cacheDir, blogId, logNo })
    await ensureDir(path.dirname(cachePath))
    await writeFile(cachePath, html, "utf8")
  },
})
