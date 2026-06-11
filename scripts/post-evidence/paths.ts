import path from "node:path"

import { ensureDir, resolveRepoPath } from "@exitpress/engine/infra/node/FilePaths.js"

export const allEvidenceAssetProfiles = ["readme", "figure", "tmp"] as const
// Evidence asset storage profile for persistent docs or temporary harness output.
export type EvidenceAssetProfile = (typeof allEvidenceAssetProfiles)[number]

const persistentAssetRoot = path.join(".agents", "knowledge", "reference", "assets")

// Converts user-provided labels into safe path segments.
export const safeEvidencePathSegment = (value: string) => {
  const segment = value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")

  return segment || "evidence"
}

// Creates a timestamped repo-local output directory for evidence captures.
export const createDefaultEvidenceOutputDir = ({
  blogId,
  logNo,
}: {
  blogId: string
  logNo?: string
}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const name = [
    safeEvidencePathSegment(blogId),
    logNo ? safeEvidencePathSegment(logNo) : null,
    timestamp,
  ]
    .filter(Boolean)
    .join("-")

  return path.join("tmp", "harness", "post-evidence", name)
}

// Resolves report and asset paths according to the selected evidence profile.
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

// Formats captured asset paths so Markdown remains portable from the report file.
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
