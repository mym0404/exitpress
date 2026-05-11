import { constants } from "node:fs"
import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))

const repoRoot = path.resolve(here, "../../..")

export const repoPath = (...segments: string[]) => path.join(repoRoot, ...segments)

export const pathExists = async (targetPath: string) => {
  try {
    await access(targetPath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export const readUtf8 = (targetPath: string) => readFile(targetPath, "utf8")

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

export const ensureHarnessDir = async (...segments: string[]) => {
  const targetPath = repoPath("tmp", "harness", ...segments)
  await mkdir(targetPath, {
    recursive: true,
  })

  return targetPath
}
