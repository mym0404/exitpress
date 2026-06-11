import { mkdir, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

let repoRootDir: string | undefined

// Resolves a repo-relative path while preserving absolute input.
export const resolveRepoPath = (targetPath: string) => {
  repoRootDir ??= fileURLToPath(new URL("../../../../../..", import.meta.url))

  return path.isAbsolute(targetPath) ? targetPath : path.resolve(repoRootDir, targetPath)
}

// Builds a path under the repo-local temporary directory.
export const getProjectTempPath = (...segments: string[]) =>
  resolveRepoPath(path.join("tmp", ...segments))

// Creates the target directory and any missing parents.
export const ensureDir = async (targetPath: string) => {
  await mkdir(targetPath, { recursive: true })
}

// Recreates a directory from an empty state.
export const recreateDir = async (targetPath: string) => {
  await rm(targetPath, { recursive: true, force: true })
  await mkdir(targetPath, { recursive: true })
}

// Returns a POSIX-style relative path for markdown and manifest output.
export const relativePathFrom = ({ from, to }: { from: string; to: string }) =>
  path.relative(path.dirname(from), to).split(path.sep).join("/")
