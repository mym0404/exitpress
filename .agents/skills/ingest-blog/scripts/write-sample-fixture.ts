#!/usr/bin/env bun

import { access, writeFile } from "node:fs/promises"
import path from "node:path"

import type { AssetRecord } from "../../../../packages/domain/src/export-job/schema/UploadState.js"

import { extractBlogId } from "../../../../packages/domain/src/blog/NaverUrl.js"
import { defaultExportOptions } from "../../../../packages/domain/src/export-options/ExportOptions.js"
import { getCategoryForPost } from "../../../../packages/engine/src/exporting/paths/ExportPaths.js"
import {
  ensureDir,
  resolveRepoPath,
} from "../../../../packages/engine/src/infra/node/util/FilePaths.js"
import { NaverBlogFetcher } from "../../../../packages/engine/src/integrations/naver-blog/NaverBlogFetcher.js"
import { renderMarkdownPost } from "../../../../packages/engine/src/markdown/util/renderMarkdownPost.js"
import { parsePostHtml } from "../../../../packages/engine/src/parsing/naver-blog/core/PostParser.js"
import { createNaverBlogDefaultBlockTemplateMap } from "../../../../packages/engine/src/parsing/naver-blog/NaverBlog.js"
import { toErrorMessage } from "../../../../packages/engine/src/shared/error/util/toErrorMessage.js"

type FixtureArgs = {
  blogId: string
  logNo: string
  id: string
  force: boolean
}

const usage = () => `Usage:
  bun .agents/skills/ingest-blog/scripts/write-sample-fixture.ts --blogId <blogId> --logNo <logNo> --id <fixtureId> [--force]

Creates tests/fixtures/samples/<id>/expected.md with remote asset references and no image downloads.`

const readValue = (args: string[], index: number) => {
  const value = args[index + 1]

  if (!value || value.startsWith("--")) {
    throw new Error(usage())
  }

  return value
}

const parseArgs = (args: string[]): FixtureArgs | "help" => {
  let blogId: string | undefined
  let logNo: string | undefined
  let id: string | undefined
  let force = false

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]

    if (arg === "--help" || arg === "-h") {
      return "help"
    }

    if (arg === "--blogId") {
      blogId = readValue(args, index)
      index++
      continue
    }

    if (arg === "--logNo") {
      logNo = readValue(args, index)
      index++
      continue
    }

    if (arg === "--id") {
      id = readValue(args, index)
      index++
      continue
    }

    if (arg === "--force") {
      force = true
      continue
    }

    throw new Error(usage())
  }

  if (!blogId || !logNo || !id) {
    throw new Error(usage())
  }

  return {
    blogId,
    logNo,
    id,
    force,
  }
}

const createFixtureOptions = () => {
  const options = defaultExportOptions()

  options.assets.imageHandlingMode = "remote"
  options.assets.compressionEnabled = false
  options.assets.downloadImages = false
  options.assets.downloadThumbnails = false
  options.frontmatter.fields.exportedAt = false

  return options
}

const resolveSampleFixtureLinkUrl = (url: string) => {
  const volatileDownloadUrl =
    /^https:\/\/download\.blog\.naver\.com\/open\/.+\/([^/?#]+)([?#].*)?$/.exec(url)

  return volatileDownloadUrl
    ? `https://download.blog.naver.com/open/${volatileDownloadUrl[1]}`
    : url
}

const pathExists = async (targetPath: string) => {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

const assertFixtureId = (id: string) => {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error("fixture id must use lowercase letters, digits, and hyphens")
  }
}

const run = async () => {
  const args = parseArgs(process.argv.slice(2))

  if (args === "help") {
    console.log(usage())
    return
  }

  assertFixtureId(args.id)

  const blogId = extractBlogId(args.blogId)
  const fetcher = new NaverBlogFetcher({
    blogId,
  })
  const scan = await fetcher.scanBlog()
  const posts = await fetcher.getAllPosts({
    expectedTotal: scan.totalPostCount,
  })
  const post = posts.find((entry) => entry.logNo === args.logNo)

  if (!post) {
    throw new Error(`public post metadata not found: ${blogId}/${args.logNo}`)
  }

  const categoryMap = new Map(scan.categories.map((category) => [category.id, category]))
  const category = getCategoryForPost({
    categories: categoryMap,
    categoryId: post.categoryId,
    categoryName: post.categoryName,
  })
  const options = createFixtureOptions()
  const fixtureDir = resolveRepoPath(path.join("tests", "fixtures", "samples", args.id))
  const expectedMarkdownPath = path.join(fixtureDir, "expected.md")
  const expectedErrorPath = path.join(fixtureDir, "expected-error.md")

  if (
    !args.force &&
    ((await pathExists(expectedMarkdownPath)) || (await pathExists(expectedErrorPath)))
  ) {
    throw new Error(
      `fixture already exists: ${fixtureDir}. Re-run with --force to overwrite expected.md.`,
    )
  }

  const html = await fetcher.fetchPostHtml(post.logNo)
  const parsedPost = parsePostHtml({
    html,
    sourceUrl: post.source,
    options: {
      ...options,
      resolveLinkUrl: resolveSampleFixtureLinkUrl,
    },
  })
  const rendered = await renderMarkdownPost({
    post,
    category,
    parsedPost,
    defaultBlockTemplates: createNaverBlogDefaultBlockTemplateMap(),
    markdownFilePath: expectedMarkdownPath,
    options,
    resolveAsset: async ({ kind, sourceUrl }) =>
      ({
        kind,
        sourceUrl,
        reference: sourceUrl,
        relativePath: null,
        storageMode: "remote",
        uploadCandidate: null,
      }) satisfies AssetRecord,
  })

  await ensureDir(fixtureDir)
  await writeFile(
    expectedMarkdownPath,
    rendered.markdown.endsWith("\n") ? rendered.markdown : `${rendered.markdown}\n`,
    "utf8",
  )

  console.log(
    [
      `fixtureId: ${args.id}`,
      `expectedMarkdownPath: ${expectedMarkdownPath}`,
      `blogId: ${blogId}`,
      `logNo: ${post.logNo}`,
      `blockIds: ${parsedPost.blocks.map((block) => block.blockId).join(", ") || "(none)"}`,
      `assetRecordCount: ${rendered.assetRecords.length}`,
      `downloadedAssetFileCount: 0`,
    ].join("\n"),
  )
}

try {
  await run()
} catch (error) {
  console.error(toErrorMessage(error))
  process.exitCode = 1
}
