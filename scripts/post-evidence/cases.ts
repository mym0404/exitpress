import { readFile } from "node:fs/promises"

import type { EvidenceAssetProfile } from "./paths.js"

export type EvidenceTarget =
  | {
      kind: "post"
    }
  | {
      kind: "inspect-path"
      path: string
    }

export type EvidenceCase = {
  blogId: string
  logNo: string
  metadata: string | Record<string, string | number | boolean | null | undefined>
  target: EvidenceTarget
  optionsPath?: string
}

export type EvidenceCliArgs = {
  cases: EvidenceCase[]
  outputDir?: string
  optionsPath?: string
  metadataCachePath?: string
  assetProfile: EvidenceAssetProfile
}

const usageText = `Usage:
  bun scripts/post-evidence/capture-post-evidence.ts --blogId my-blog --logNo 123 [--metadata key=value] [--target post|inspect-path --inspectPath 0.1] [--optionsPath options.json] [--metadataCachePath tmp/harness/post-evidence/metadata-cache.json] [--outputDir tmp/harness/post-evidence/case] [--assetProfile readme|figure|tmp]
  bun scripts/post-evidence/capture-post-evidence.ts --case cases.json [--metadataCachePath tmp/harness/post-evidence/metadata-cache.json] [--outputDir tmp/harness/post-evidence/run] [--assetProfile readme|figure|tmp]

Outputs evidence.md, report.json, Naver screenshots, and Markdown evidence.`

export const capturePostEvidenceUsage = () => usageText

const readValue = (args: string[], index: number) => {
  const value = args[index + 1]

  if (!value || value.startsWith("--")) {
    throw new Error(capturePostEvidenceUsage())
  }

  return value
}

const parseMetadataEntries = (entries: string[]) => {
  if (entries.length === 0) {
    return ""
  }

  const keyed = entries.every((entry) => entry.includes("="))

  if (!keyed) {
    return entries.join("\n")
  }

  return Object.fromEntries(
    entries.map((entry) => {
      const separatorIndex = entry.indexOf("=")

      return [entry.slice(0, separatorIndex), entry.slice(separatorIndex + 1)]
    }),
  )
}

const assertRecord = (value: unknown, context: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context} must be an object`)
  }

  return value as Record<string, unknown>
}

const assertString = (value: unknown, context: string) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${context} must be a non-empty string`)
  }

  return value
}

const parseTarget = (value: unknown, context: string): EvidenceTarget => {
  if (value === undefined || value === "post") {
    return { kind: "post" }
  }

  if (typeof value === "string") {
    return {
      kind: "inspect-path",
      path: value,
    }
  }

  const record = assertRecord(value, context)
  const kind = assertString(record.kind, `${context}.kind`)

  if (kind === "post") {
    return { kind: "post" }
  }

  if (kind === "inspect-path") {
    return {
      kind,
      path: assertString(record.path, `${context}.path`),
    }
  }

  throw new Error(`${context}.kind must be post or inspect-path`)
}

const parseAssetProfile = (value: string | undefined): EvidenceAssetProfile => {
  if (!value || value === "tmp") {
    return "tmp"
  }

  if (value === "readme" || value === "figure") {
    return value
  }

  throw new Error(capturePostEvidenceUsage())
}

const parseCaseObject = ({
  value,
  optionsPath,
  context,
}: {
  value: unknown
  optionsPath?: string
  context: string
}): EvidenceCase => {
  const record = assertRecord(value, context)

  return {
    blogId: assertString(record.blogId, `${context}.blogId`),
    logNo: assertString(record.logNo, `${context}.logNo`),
    metadata:
      typeof record.metadata === "string" ||
      (record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata))
        ? (record.metadata as EvidenceCase["metadata"])
        : "",
    target: parseTarget(record.target, `${context}.target`),
    ...(typeof record.optionsPath === "string"
      ? { optionsPath: record.optionsPath }
      : optionsPath
        ? { optionsPath }
        : {}),
  }
}

export const parseEvidenceCaseFile = async ({
  casePath,
  optionsPath,
}: {
  casePath: string
  optionsPath?: string
}) => {
  const parsed = JSON.parse(await readFile(casePath, "utf8")) as unknown
  const values = Array.isArray(parsed) ? parsed : [parsed]

  return values.map((value, index) =>
    parseCaseObject({
      value,
      optionsPath,
      context: `case[${index}]`,
    }),
  )
}

export const parseCapturePostEvidenceArgs = async (
  args: string[],
): Promise<EvidenceCliArgs | "help"> => {
  let blogId: string | undefined
  let logNo: string | undefined
  let target: "post" | "inspect-path" = "post"
  let inspectPath: string | undefined
  let outputDir: string | undefined
  let optionsPath: string | undefined
  let metadataCachePath: string | undefined
  let assetProfileValue: string | undefined
  let casePath: string | undefined
  const metadataEntries: string[] = []

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]

    if (arg === "--help" || arg === "-h") {
      return "help"
    }

    if (arg === "--blogId") {
      blogId = readValue(args, index)
      index++
      continue
    }

    if (arg === "--logNo") {
      logNo = readValue(args, index)
      index++
      continue
    }

    if (arg === "--metadata") {
      metadataEntries.push(readValue(args, index))
      index++
      continue
    }

    if (arg === "--target") {
      const value = readValue(args, index)

      if (value !== "post" && value !== "inspect-path") {
        throw new Error(capturePostEvidenceUsage())
      }

      target = value
      index++
      continue
    }

    if (arg === "--inspectPath") {
      inspectPath = readValue(args, index)
      index++
      continue
    }

    if (arg === "--optionsPath" || arg === "--options") {
      optionsPath = readValue(args, index)
      index++
      continue
    }

    if (arg === "--metadataCachePath") {
      metadataCachePath = readValue(args, index)
      index++
      continue
    }

    if (arg === "--outputDir") {
      outputDir = readValue(args, index)
      index++
      continue
    }

    if (arg === "--assetProfile") {
      assetProfileValue = readValue(args, index)
      index++
      continue
    }

    if (arg === "--case") {
      casePath = readValue(args, index)
      index++
      continue
    }

    throw new Error(capturePostEvidenceUsage())
  }

  const assetProfile = parseAssetProfile(assetProfileValue)

  if (casePath) {
    return {
      cases: await parseEvidenceCaseFile({
        casePath,
        optionsPath,
      }),
      ...(outputDir ? { outputDir } : {}),
      ...(optionsPath ? { optionsPath } : {}),
      ...(metadataCachePath ? { metadataCachePath } : {}),
      assetProfile,
    }
  }

  if (!blogId || !logNo || (target === "inspect-path" && !inspectPath)) {
    throw new Error(capturePostEvidenceUsage())
  }

  return {
    cases: [
      {
        blogId,
        logNo,
        metadata: parseMetadataEntries(metadataEntries),
        target:
          target === "post"
            ? { kind: "post" }
            : {
                kind: "inspect-path",
                path: inspectPath ?? "",
              },
        ...(optionsPath ? { optionsPath } : {}),
      },
    ],
    ...(outputDir ? { outputDir } : {}),
    ...(optionsPath ? { optionsPath } : {}),
    ...(metadataCachePath ? { metadataCachePath } : {}),
    assetProfile,
  }
}
