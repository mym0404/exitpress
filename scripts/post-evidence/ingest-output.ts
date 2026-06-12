import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import { extractBlogId } from "@exitpress/blog-naver/NaverUrl.js"
import { resolveRepoPath } from "@exitpress/engine/infra/node/FilePaths.js"

import type {
  ExportManifest,
  PostManifestEntry,
} from "@exitpress/domain/export-job/schema/ExportManifest.js"

export type ReusableIngestOutput = {
  outputDir: string
  manifestPath: string
  manifest: ExportManifest
  failedPosts: PostManifestEntry[]
}

const isNotFoundError = (error: unknown) =>
  error instanceof Error &&
  typeof (error as { code?: unknown }).code === "string" &&
  (error as { code?: unknown }).code === "ENOENT"

const readManifest = async (manifestPath: string): Promise<ExportManifest | null> => {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8")) as ExportManifest
  } catch (error) {
    if (isNotFoundError(error)) {
      return null
    }

    throw error
  }
}

export const loadReusableIngestOutput = async ({
  sourceId,
  outputDir,
}: {
  sourceId: string
  outputDir: string
}): Promise<ReusableIngestOutput | null> => {
  const resolvedSourceId = extractBlogId(sourceId)
  const resolvedOutputDir = resolveRepoPath(outputDir)
  const manifestPath = path.join(resolvedOutputDir, "manifest.json")
  const manifest = await readManifest(manifestPath)

  if (!manifest || manifest.sourceId !== resolvedSourceId || !manifest.finishedAt) {
    return null
  }

  return {
    outputDir: resolvedOutputDir,
    manifestPath,
    manifest,
    failedPosts: manifest.posts.filter((post) => post.status === "failed"),
  }
}

export const findLatestReusableIngestOutput = async ({
  sourceId,
  rootDir = path.join("tmp", "harness", "ingest-blog"),
}: {
  sourceId: string
  rootDir?: string
}): Promise<ReusableIngestOutput | null> => {
  const resolvedRootDir = resolveRepoPath(rootDir)
  const safeSourceId = extractBlogId(sourceId)

  try {
    const entries = await readdir(resolvedRootDir, {
      withFileTypes: true,
      encoding: "utf8",
    })

    const candidates = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const outputDir = path.join(resolvedRootDir, entry.name)
          const reusable = await loadReusableIngestOutput({
            sourceId: safeSourceId,
            outputDir,
          })

          if (!reusable) {
            return null
          }

          const finishedAt = reusable.manifest.finishedAt

          if (!finishedAt) {
            return null
          }

          return {
            reusable,
            finishedAt,
          }
        }),
    )

    return (
      candidates
        .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
        .sort((left, right) => right.finishedAt.localeCompare(left.finishedAt))[0]?.reusable ?? null
    )
  } catch (error) {
    if (isNotFoundError(error)) {
      return null
    }

    throw error
  }
}
