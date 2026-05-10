import path from "node:path"

import { ensureDir, resolveRepoPath } from "../../../src/modules/common/FilePathUtils.js"

export type EvidenceAssetProfile = "readme" | "figure" | "tmp"

const persistentAssetRoot = path.join(".agents", "knowledge", "reference", "assets")

export const safeEvidencePathSegment = (value: string) => {
  const segment = value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")

  return segment || "evidence"
}

export const createDefaultEvidenceOutputDir = ({
  blogId,
  logNo,
}: {
  blogId: string
  logNo?: string
}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const name = [safeEvidencePathSegment(blogId), logNo ? safeEvidencePathSegment(logNo) : null, timestamp]
    .filter(Boolean)
    .join("-")

  return path.join("tmp", "harness", "post-evidence", name)
}

export const resolveEvidenceOutputPaths = async ({
  outputDir,
  assetProfile,
}: {
  outputDir: string
  assetProfile: EvidenceAssetProfile
}) => {
  const resolvedOutputDir = resolveRepoPath(outputDir)
  const assetDir =
    assetProfile === "tmp"
      ? path.join(resolvedOutputDir, "assets")
      : resolveRepoPath(path.join(persistentAssetRoot, assetProfile))

  await ensureDir(resolvedOutputDir)
  await ensureDir(assetDir)

  return {
    outputDir: resolvedOutputDir,
    evidencePath: path.join(resolvedOutputDir, "evidence.md"),
    reportPath: path.join(resolvedOutputDir, "report.json"),
    assetDir,
  }
}

export const toMarkdownAssetPath = ({
  markdownFilePath,
  assetPath,
}: {
  markdownFilePath: string
  assetPath: string
}) => {
  const repoRelativePath = path.relative(resolveRepoPath("."), assetPath).split(path.sep).join("/")

  if (repoRelativePath.startsWith(`${persistentAssetRoot}/`)) {
    return repoRelativePath
  }

  return path.relative(path.dirname(markdownFilePath), assetPath).split(path.sep).join("/")
}
