import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { createTistoryBlogProvider } from "@exitpress/blog-tistory/TistoryBlogProvider.js"
import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { exportProviderPostUnit } from "@exitpress/engine/exporting/provider/ProviderPostExportUnit.js"

const postUrl = process.env.EXITPRESS_TISTORY_LIVE_POST_URL

if (!postUrl) {
  throw new Error("EXITPRESS_TISTORY_LIVE_POST_URL is required for Tistory live provider e2e")
}

const tempDir = await mkdtemp(path.join(os.tmpdir(), "exitpress-provider-tistory-live-"))

try {
  const provider = createTistoryBlogProvider()
  const source = provider.parseSource(postUrl)
  const scan = await provider.scan(source)
  const post = scan.posts[0]

  if (!post) {
    throw new Error(`Tistory scan returned no posts for ${postUrl}`)
  }

  const result = await exportProviderPostUnit({
    provider,
    source,
    outputDir: tempDir,
    post,
    categories: scan.categories,
    options: defaultExportOptions(),
    uploadEnabled: false,
    abortSignal: null,
  })
  const markdown = await readFile(result.markdownFilePath, "utf8")

  if (!markdown.includes(post.title)) {
    throw new Error(`Tistory markdown did not contain title "${post.title}"`)
  }

  if (!markdown.trim()) {
    throw new Error("Tistory markdown was empty")
  }

  console.log(`provider tistory live export passed: ${post.sourceUrl}`)
} finally {
  await rm(tempDir, { recursive: true, force: true })
}
