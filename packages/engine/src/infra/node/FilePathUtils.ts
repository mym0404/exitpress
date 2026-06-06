import { mkdir, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

let repoRootDir: string | undefined

export const resolveRepoPath = (targetPath: string) => {
  repoRootDir ??= fileURLToPath(new URL("../../../../..", import.meta.url))

  return path.isAbsolute(targetPath) ? targetPath : path.resolve(repoRootDir, targetPath)
}

export const getProjectTempPath = (...segments: string[]) =>
  resolveRepoPath(path.join("tmp", ...segments))

export const ensureDir = async (targetPath: string) => {
  await mkdir(targetPath, { recursive: true })
}

export const recreateDir = async (targetPath: string) => {
  await rm(targetPath, { recursive: true, force: true })
  await mkdir(targetPath, { recursive: true })
}

export const relativePathFrom = ({ from, to }: { from: string; to: string }) =>
  path.relative(path.dirname(from), to).split(path.sep).join("/")
