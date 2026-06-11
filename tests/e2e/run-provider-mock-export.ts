import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { exportProviderPostUnit } from "@exitpress/engine/exporting/provider/ProviderPostExportUnit.js"
import { createMarkdownMockProvider } from "@tests/support/provider/MockBlogProviders.js"

const outputDir = await mkdtemp(path.join(tmpdir(), "exitpress-provider-mock-e2e-"))

try {
  const provider = createMarkdownMockProvider()
  const source = provider.parseSource("mock-blog")
  const scan = await provider.scan(source)
  const post = scan.posts[0]

  if (!post) {
    throw new Error("No mock post found")
  }

  const result = await exportProviderPostUnit({
    provider,
    source,
    outputDir,
    post,
    categories: scan.categories,
    options: defaultExportOptions(),
    uploadEnabled: false,
    abortSignal: null,
  })
  const markdown = await readFile(result.markdownFilePath, "utf8")

  if (!markdown.includes("Hello from markdown provider")) {
    throw new Error("Provider mock markdown output did not include expected content")
  }

  console.log("provider mock export passed")
} finally {
  await rm(outputDir, { recursive: true, force: true })
}
