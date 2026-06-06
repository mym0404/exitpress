import { execFile } from "node:child_process"
import path from "node:path"

import { resolveRepoPath } from "@exitpress/engine/infra/node/util/FilePaths.js"

import type { IncomingMessage } from "node:http"

const TEMP_OUTPUT_ROOTS = ["/tmp", "/private/tmp"] as const

// Accepts local file actions only from same-origin XHR requests.
export const isSameOriginUploadRequest = (request: IncomingMessage) => {
  if (request.headers["x-requested-with"] !== "XMLHttpRequest") {
    return false
  }

  const originHeader = request.headers.origin
  const hostHeader = request.headers.host

  if (!originHeader || !hostHeader) {
    return false
  }

  try {
    return new URL(originHeader).host === hostHeader
  } catch {
    return false
  }
}

// Checks path containment after resolving relative path traversal.
export const isPathInsideRoot = ({
  rootPath,
  targetPath,
}: {
  rootPath: string
  targetPath: string
}) => {
  const relativePath = path.relative(rootPath, targetPath)

  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
}

// Resolves a requested output file against the configured output root.
export const resolveLocalOutputTargetPath = ({
  outputDir,
  outputPath,
}: {
  outputDir: string
  outputPath: string
}) => {
  const outputRoot = resolveRepoPath(outputDir.trim())
  const targetPath = path.resolve(outputRoot, outputPath.trim())

  return {
    outputRoot,
    targetPath,
  }
}

// Detects temporary resume output directories that should not be opened as final output.
export const isTemporaryResumeOutputDir = (outputDir: string) => {
  const trimmedOutputDir = outputDir.trim()

  if (!trimmedOutputDir) {
    return false
  }

  const resolvedOutputDir = path.resolve(trimmedOutputDir)

  return TEMP_OUTPUT_ROOTS.some((rootPath) =>
    isPathInsideRoot({
      rootPath,
      targetPath: resolvedOutputDir,
    }),
  )
}

// Opens a local output path using the platform default file handler.
export const openLocalPathWithSystem = async (targetPath: string) => {
  await new Promise<void>((resolve, reject) => {
    const [command, args]: [string, string[]] =
      process.platform === "darwin"
        ? ["open", [targetPath]]
        : process.platform === "win32"
          ? ["cmd", ["/c", "start", "", targetPath]]
          : ["xdg-open", [targetPath]]

    execFile(command, args, (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}
