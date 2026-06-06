import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import { createPostHtmlCache } from "./PostHtmlCache.js"

let tempDirs: string[] = []

const createTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "post-html-cache-"))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })))
  tempDirs = []
})

describe("createPostHtmlCache", () => {
  it("returns null when a cached post html file does not exist", async () => {
    const cache = createPostHtmlCache({ cacheDir: await createTempDir() })

    await expect(cache.getPostHtml?.({ blogId: "blog/a", logNo: "1" })).resolves.toBeNull()
  })

  it("writes and reads post html using an encoded blog and log key", async () => {
    const cache = createPostHtmlCache({ cacheDir: await createTempDir() })

    await cache.setPostHtml?.({
      blogId: "blog/a",
      logNo: "1/2",
      html: "<html>cached</html>",
    })

    await expect(cache.getPostHtml?.({ blogId: "blog/a", logNo: "1/2" })).resolves.toBe(
      "<html>cached</html>",
    )
  })

  it("keeps cache entries separate when encoded blog and log keys contain dashes", async () => {
    const cache = createPostHtmlCache({ cacheDir: await createTempDir() })

    await cache.setPostHtml?.({
      blogId: "a-b",
      logNo: "c",
      html: "<html>a-b c</html>",
    })
    await cache.setPostHtml?.({
      blogId: "a",
      logNo: "b-c",
      html: "<html>a b-c</html>",
    })

    await expect(cache.getPostHtml?.({ blogId: "a-b", logNo: "c" })).resolves.toBe(
      "<html>a-b c</html>",
    )
    await expect(cache.getPostHtml?.({ blogId: "a", logNo: "b-c" })).resolves.toBe(
      "<html>a b-c</html>",
    )
  })
})
