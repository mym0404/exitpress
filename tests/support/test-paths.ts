import { mkdir, mkdtemp } from "node:fs/promises"
import path from "node:path"

const testRunRoot = path.resolve("tmp", "tests", `run-${process.pid}`)

export const createTestPath = (...segments: string[]) => path.join(testRunRoot, ...segments)

export const createTestTempDir = async (prefix: string) => {
  const parentDir = createTestPath("tmp")

  await mkdir(parentDir, { recursive: true })

  return mkdtemp(path.join(parentDir, prefix))
}
