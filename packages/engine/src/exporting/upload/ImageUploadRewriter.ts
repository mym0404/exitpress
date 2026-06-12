import * as fs from "node:fs/promises"
import path from "node:path"

import { UPLOAD_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"

import type { ExportJobItem } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type {
  ExportManifest,
  PostManifestEntry,
} from "@exitpress/domain/export-job/schema/ExportManifest.js"

import type { FileOps } from "./AtomicFileWrite.js"
import type { ImageUploadResult } from "./ImageUploadPhase.js"

import { writeFileAtomically } from "./AtomicFileWrite.js"

type RewrittenPostResult = {
  markdownPath: string
  post: PostManifestEntry
  item: ExportJobItem
}

type RewriteResult = {
  manifest: ExportManifest
  items: ExportJobItem[]
}

const ensureHttpUrl = (value: string) => {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new Error("Image upload result must be an absolute http(s) URL.")
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Image upload result must be an absolute http(s) URL.")
  }

  if (parsed.username || parsed.password) {
    throw new Error("Image upload result must not include URL credentials.")
  }

  for (const [key] of parsed.searchParams.entries()) {
    if (
      /(^x-amz-|token|sig|signature|credential|expires|policy|key-pair-id|googleaccessid)/i.test(
        key,
      )
    ) {
      throw new Error("Image upload result must not include signed or secret-bearing query params.")
    }
  }
}

export const rewriteImageUploadPost = async ({
  outputDir,
  post,
  item,
  uploadResults,
  rewrittenAt = new Date().toISOString(),
  fileOps = fs,
}: {
  outputDir: string
  post: PostManifestEntry
  item: ExportJobItem
  uploadResults: ImageUploadResult[]
  rewrittenAt?: string
  fileOps?: FileOps
}): Promise<RewrittenPostResult> => {
  if (!post.outputPath || !item.outputPath) {
    throw new Error(`Missing output path for ${post.postId}.`)
  }

  const uploadResultByLocalPath = new Map(
    uploadResults.map((result) => [result.candidate.localPath, result]),
  )
  const markdownPath = path.join(outputDir, post.outputPath)
  let rewrittenMarkdown = await fileOps.readFile(markdownPath, "utf8")
  const resultByReference = new Map<string, string>()
  const uploadedUrls: string[] = []

  for (const candidate of post.upload.candidates) {
    const matchedResult = uploadResultByLocalPath.get(candidate.localPath)

    if (!matchedResult) {
      throw new Error(`Missing upload result for ${candidate.localPath}.`)
    }

    ensureHttpUrl(matchedResult.uploadedUrl)

    if (!rewrittenMarkdown.includes(candidate.markdownReference)) {
      throw new Error(`Missing markdown reference for ${candidate.localPath}.`)
    }

    rewrittenMarkdown = rewrittenMarkdown
      .split(candidate.markdownReference)
      .join(matchedResult.uploadedUrl)
    resultByReference.set(candidate.markdownReference, matchedResult.uploadedUrl)
    uploadedUrls.push(matchedResult.uploadedUrl)
  }

  await writeFileAtomically({
    finalPath: markdownPath,
    content: rewrittenMarkdown,
    fileOps,
  })

  return {
    markdownPath,
    post: {
      ...post,
      assetPaths: post.assetPaths.map((assetPath) => resultByReference.get(assetPath) ?? assetPath),
      upload: {
        ...post.upload,
        uploadedCount: post.upload.candidateCount,
        failedCount: 0,
        uploadedUrls,
        rewriteStatus: "completed",
        rewrittenAt,
      },
    },
    item: {
      ...item,
      assetPaths: item.assetPaths.map((assetPath) => resultByReference.get(assetPath) ?? assetPath),
      upload: {
        ...item.upload,
        uploadedCount: item.upload.candidateCount,
        failedCount: 0,
        uploadedUrls,
        rewriteStatus: "completed",
        rewrittenAt,
      },
      updatedAt: rewrittenAt,
    },
  }
}

export const writeImageUploadManifestSnapshot = async ({
  outputDir,
  manifest,
  fileOps = fs,
}: {
  outputDir: string
  manifest: ExportManifest
  fileOps?: FileOps
}) => {
  await writeFileAtomically({
    finalPath: path.join(outputDir, "manifest.json"),
    content: JSON.stringify(manifest, null, 2),
    fileOps,
  })
}

export const rewriteUploadedAssets = async ({
  outputDir,
  manifest,
  items,
  uploadResults,
  fileOps = fs,
}: {
  outputDir: string
  manifest: ExportManifest
  items: ExportJobItem[]
  uploadResults: ImageUploadResult[]
  fileOps?: FileOps
}): Promise<RewriteResult> => {
  const normalizedItems =
    items.length > 0
      ? items
      : manifest.posts.map((post) => ({
          id: post.outputPath ?? `failed:${post.postId}`,
          postId: post.postId,
          title: post.title,
          source: post.source,
          category: post.category,
          status: post.status,
          outputPath: post.outputPath,
          assetPaths: post.assetPaths,
          upload: post.upload,
          error: post.error,
          updatedAt: new Date().toISOString(),
        }))
  let nextManifest = {
    ...manifest,
    posts: [...manifest.posts],
  }
  let nextItems = [...normalizedItems]
  const itemById = new Map(
    nextItems.map((item) => [item.outputPath ?? `failed:${item.postId}`, item]),
  )

  for (const post of nextManifest.posts) {
    if (!post.outputPath || post.upload.candidateCount === 0) {
      continue
    }

    const item = itemById.get(post.outputPath)

    if (!item) {
      continue
    }

    const rewritten = await rewriteImageUploadPost({
      outputDir,
      post,
      item,
      uploadResults,
      fileOps,
    })

    nextManifest = {
      ...nextManifest,
      posts: nextManifest.posts.map((currentPost) =>
        currentPost.outputPath === rewritten.post.outputPath ? rewritten.post : currentPost,
      ),
    }
    nextItems = nextItems.map((currentItem) =>
      currentItem.outputPath === rewritten.item.outputPath ? rewritten.item : currentItem,
    )
  }

  nextManifest = {
    ...nextManifest,
    upload: {
      ...nextManifest.upload,
      status: UPLOAD_STATUSES.UPLOAD_COMPLETED,
      uploadedCount: nextManifest.upload.candidateCount,
      failedCount: 0,
      terminalReason: null,
    },
  }

  await writeImageUploadManifestSnapshot({
    outputDir,
    manifest: nextManifest,
    fileOps,
  })

  return {
    manifest: nextManifest,
    items: nextItems,
  }
}
