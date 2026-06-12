#!/usr/bin/env bun

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { exportSinglePost } from "@exitpress/blog-naver/exporting/SinglePostExport.js"
import { inspectSinglePost } from "@exitpress/blog-naver/exporting/SinglePostInspect.js"
import { cloneExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"

import { createSinglePostMetadataCachingFetcher } from "./MetadataCache.js"
import { parseSinglePostCliArgs } from "./SinglePostArgs.js"
import { readSinglePostOptions } from "./SinglePostOptions.js"
import { renderSinglePostInspectSummary, renderSinglePostSummary } from "./SinglePostSummary.js"

// Injectable dependencies keep the single-post CLI testable without shelling out.
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

// Runs the single-post export or inspect command from parsed CLI arguments.
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
    sourceId,
    postId,
    outputDir,
    reportPath,
    manualReviewMarkdownPath,
    metadataCachePath,
    optionsPath,
    inspect,
    stdout,
  } = parseSinglePostCliArgs(argv)
  const resolvedManualReviewMarkdownPath = manualReviewMarkdownPath
    ? path.resolve(manualReviewMarkdownPath)
    : null
  const resolvedMetadataCachePath = metadataCachePath ? path.resolve(metadataCachePath) : null

  const options = cloneExportOptions(
    optionsPath ? await readSinglePostOptions({ optionsPath, readFile: readFileImpl }) : undefined,
  )

  if (inspect) {
    const diagnostics = await inspectSinglePostImpl({
      sourceId,
      postId,
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
    sourceId,
    postId,
    outputDir,
    options,
    createFetcher: resolvedMetadataCachePath
      ? async (input) =>
          createSinglePostMetadataCachingFetcher({
            sourceId: input.sourceId,
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
      sourceId: diagnostics.post.sourceId,
      postId: diagnostics.post.postId,
      blockIds: diagnostics.blockIds,
      exporterMarkdownFilePath: diagnostics.markdownFilePath,
      manualReviewMarkdownFilePath: resolvedManualReviewMarkdownPath,
      metadataCachePath: resolvedMetadataCachePath,
    }),
  )

  if (stdout) {
    stdoutWrite(
      diagnostics.markdown.endsWith("\n") ? diagnostics.markdown : `${diagnostics.markdown}\n`,
    )
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
