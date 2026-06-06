import { constants } from "node:fs"
import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))

const repoRoot = path.resolve(here, "../../..")

// Resolves paths from the repository root for e2e harness files.
export const repoPath = (...segments: string[]) => path.join(repoRoot, ...segments)

// Checks file existence without throwing for missing paths.
export const pathExists = async (targetPath: string) => {
  try {
    await access(targetPath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

// Reads UTF-8 fixture or harness files.
export const readUtf8 = (targetPath: string) => readFile(targetPath, "utf8")

// Writes UTF-8 harness files, creating parent directories first.
export const writeUtf8 = async ({
  targetPath,
  content,
}: {
  targetPath: string
  content: string
}) => {
  await mkdir(path.dirname(targetPath), {
    recursive: true,
  })
  await writeFile(targetPath, content)
}

// Creates a repo-local temporary directory for e2e runs.
export const ensureHarnessDir = async (...segments: string[]) => {
  const targetPath = repoPath("tmp", "harness", ...segments)
  await mkdir(targetPath, {
    recursive: true,
  })

  return targetPath
}
