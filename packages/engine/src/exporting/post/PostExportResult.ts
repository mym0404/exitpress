import path from "node:path"

import { toErrorMessage } from "@exitpress/engine/shared/error/ErrorUtils.js"

import type { CategoryInfo, PostSummary } from "@exitpress/domain/blog/Types.js"
import type { ExportJobItem, PostManifestEntry } from "@exitpress/domain/export-job/Types.js"

import type { createPostUploadSummary } from "../manifest/ExportManifestProgress.js"

export type ProcessedPostResult = {
  manifestEntry: PostManifestEntry
  jobItem: ExportJobItem
  uploadCandidateLocalPaths: string[]
  uploadEligible: boolean
}

export const createSuccessPostResult = ({
  post,
  category,
  outputDir,
  markdownFilePath,
  assetPaths,
  upload,
}: {
  post: PostSummary
  category: CategoryInfo
  outputDir: string
  markdownFilePath: string
  assetPaths: string[]
  upload: ReturnType<typeof createPostUploadSummary>
}): ProcessedPostResult => {
  const manifestEntry = {
    logNo: post.logNo,
    title: post.title,
    source: post.source,
    category: {
      id: category.id,
      name: category.name,
      path: category.path,
    },
    status: "success",
    outputPath: path.relative(outputDir, markdownFilePath).split(path.sep).join("/"),
    assetPaths,
    upload,
    error: null,
  } satisfies PostManifestEntry

  return {
    manifestEntry,
    jobItem: {
      id: manifestEntry.outputPath ?? `failed:${post.logNo}`,
      logNo: post.logNo,
      title: post.title,
      source: post.source,
      category: manifestEntry.category,
      status: "success",
      outputPath: manifestEntry.outputPath,
      assetPaths,
      upload,
      error: null,
      updatedAt: new Date().toISOString(),
    },
    uploadCandidateLocalPaths: upload.candidates.map((candidate) => candidate.localPath),
    uploadEligible: upload.eligible,
  }
}

export const createFailedPostResult = ({
  post,
  category,
  error,
}: {
  post: PostSummary
  category: CategoryInfo
  error: unknown
}): ProcessedPostResult => {
  const upload = {
    eligible: false,
    candidateCount: 0,
    uploadedCount: 0,
    failedCount: 0,
    candidates: [],
    uploadedUrls: [],
    rewriteStatus: "pending" as const,
    rewrittenAt: null,
  }
  const manifestEntry = {
    logNo: post.logNo,
    title: post.title,
    source: post.source,
    category: {
      id: category.id,
      name: category.name,
      path: category.path,
    },
    status: "failed",
    outputPath: null,
    assetPaths: [],
    upload,
    error: toErrorMessage(error),
  } satisfies PostManifestEntry

  return {
    manifestEntry,
    jobItem: {
      id: `failed:${post.logNo}`,
      logNo: post.logNo,
      title: post.title,
      source: post.source,
      category: manifestEntry.category,
      status: "failed",
      outputPath: null,
      assetPaths: [],
      upload,
      error: manifestEntry.error,
      updatedAt: new Date().toISOString(),
    },
    uploadCandidateLocalPaths: [],
    uploadEligible: false,
  }
}
