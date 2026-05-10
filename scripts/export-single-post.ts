#!/usr/bin/env bun

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { cloneExportOptions } from "../src/modules/exporter/ExportOptions.js"
import { NaverBlog } from "../src/modules/blog/NaverBlog.js"
import { exportSinglePost } from "../src/modules/exporter/SinglePostExport.js"
import { inspectSinglePost } from "../src/modules/exporter/SinglePostInspect.js"
import { createSinglePostMetadataCachingFetcher } from "./lib/single-post-metadata-cache.js"
import {
  parseSinglePostCliArgs,
  readSinglePostOptions,
  renderSinglePostInspectSummary,
  renderSinglePostSummary,
} from "./lib/single-post-cli.js"

export type RunSinglePostCliDeps = {
  argv?: string[]
  readFile?: typeof readFile
  writeFile?: typeof writeFile
  mkdir?: typeof mkdir
  exportSinglePost?: typeof exportSinglePost
  inspectSinglePost?: typeof inspectSinglePost
  stdoutWrite?: (text: string) => void
  stderrWrite?: (text: string) => void
}

export const runSinglePostCli = async ({
  argv = process.argv.slice(2),
  readFile: readFileImpl = readFile,
  writeFile: writeFileImpl = writeFile,
  mkdir: mkdirImpl = mkdir,
  exportSinglePost: exportSinglePostImpl = exportSinglePost,
  inspectSinglePost: inspectSinglePostImpl = inspectSinglePost,
  stdoutWrite = (text) => {
    process.stdout.write(text)
  },
  stderrWrite = (text) => {
    console.error(text)
  },
}: RunSinglePostCliDeps = {}) => {
  const {
    blogId,
    logNo,
    outputDir,
    reportPath,
    manualReviewMarkdownPath,
    metadataCachePath,
    optionsPath,
    inspect,
    stdout,
  } =
    parseSinglePostCliArgs(argv)
  const resolvedManualReviewMarkdownPath = manualReviewMarkdownPath
    ? path.resolve(manualReviewMarkdownPath)
    : null
  const resolvedMetadataCachePath = metadataCachePath ? path.resolve(metadataCachePath) : null

  const options = cloneExportOptions(
    optionsPath ? await readSinglePostOptions({ optionsPath, readFile: readFileImpl }) : undefined,
    { blockOutputDefinitions: new NaverBlog().getBlockOutputDefinitions() },
  )

  if (inspect) {
    const diagnostics = await inspectSinglePostImpl({
      blogId,
      logNo,
      options,
    })
    const report = {
      ...diagnostics,
      metadataCachePath: resolvedMetadataCachePath,
    }

    if (reportPath) {
      await mkdirImpl(path.dirname(reportPath), { recursive: true })
      await writeFileImpl(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
    }

    stderrWrite(
      renderSinglePostInspectSummary({
        diagnostics,
        reportPath,
      }),
    )

    if (stdout) {
      stdoutWrite(`${JSON.stringify(report, null, 2)}\n`)
    }

    return
  }

  if (!outputDir) {
    throw new Error("outputDir is required for export mode.")
  }

  const diagnostics = await exportSinglePostImpl({
    blogId,
    logNo,
    outputDir,
    options,
    createFetcher: resolvedMetadataCachePath
      ? async (input) =>
          createSinglePostMetadataCachingFetcher({
            blogId: input.blogId,
            cachePath: resolvedMetadataCachePath,
            readFile: readFileImpl,
            writeFile: writeFileImpl,
          })
      : undefined,
  })

  if (reportPath) {
    await mkdirImpl(path.dirname(reportPath), { recursive: true })
    await writeFileImpl(
      reportPath,
      `${JSON.stringify(
        {
          ...diagnostics,
          exporterMarkdownFilePath: diagnostics.markdownFilePath,
          manualReviewMarkdownFilePath: resolvedManualReviewMarkdownPath,
          metadataCachePath: resolvedMetadataCachePath,
        },
        null,
        2,
      )}\n`,
      "utf8",
    )
  }

  if (resolvedManualReviewMarkdownPath) {
    await mkdirImpl(path.dirname(resolvedManualReviewMarkdownPath), { recursive: true })
    await writeFileImpl(
      resolvedManualReviewMarkdownPath,
      diagnostics.markdown.endsWith("\n") ? diagnostics.markdown : `${diagnostics.markdown}\n`,
      "utf8",
    )
  }

  stderrWrite(
    renderSinglePostSummary({
      blogId: diagnostics.post.blogId,
      logNo: diagnostics.post.logNo,
      blockTypes: diagnostics.blockTypes,
      exporterMarkdownFilePath: diagnostics.markdownFilePath,
      manualReviewMarkdownFilePath: resolvedManualReviewMarkdownPath,
      metadataCachePath: resolvedMetadataCachePath,
    }),
  )

  if (stdout) {
    stdoutWrite(diagnostics.markdown.endsWith("\n") ? diagnostics.markdown : `${diagnostics.markdown}\n`)
  }
}

const run = async () => {
  try {
    await runSinglePostCli()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}

const isMainModule = path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)

if (isMainModule) {
  void run()
}

export { run as runSinglePostExportCli }
