import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const repoRoot = process.cwd()
const packageRoot = path.join(repoRoot, "packages")
const forbiddenPatterns = [
  /\bBase[A-Z][A-Za-z0-9_]*\b/,
  /\bAbstract[A-Z][A-Za-z0-9_]*\b/,
  /\b[A-Z][A-Za-z0-9_]*Contract\b/,
  /\b[A-Z][A-Za-z0-9_]*Schema\b/,
]
type DirectoryEntry = {
  name: string
  isDirectory: () => boolean
}

const listSourceFiles = async (dir: string): Promise<string[]> => {
  let entries: DirectoryEntry[]

  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return []
    }

    throw error
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        return listSourceFiles(fullPath)
      }

      return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : []
    }),
  )

  return files.flat()
}

const packageEntries = await readdir(packageRoot, { withFileTypes: true })
const blogPackageSrcDirs = packageEntries
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("blog-"))
  .map((entry) => path.join(packageRoot, entry.name, "src"))

const violations: string[] = []

for (const packageSrcDir of blogPackageSrcDirs) {
  const files = await listSourceFiles(packageSrcDir)

  for (const file of files) {
    const text = await readFile(file, "utf8")

    if (forbiddenPatterns.some((pattern) => pattern.test(text))) {
      violations.push(path.relative(repoRoot, file))
    }
  }
}

if (violations.length > 0) {
  throw new Error(
    `Provider-neutral abstractions must live in domain or engine, not blog packages:\n${[
      ...new Set(violations),
    ].join("\n")}`,
  )
}

console.log("blog provider boundary check passed")
