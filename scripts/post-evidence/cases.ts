import { readFile } from "node:fs/promises"

import type { EvidenceAssetProfile } from "./paths.js"

import { allEvidenceAssetProfiles } from "./paths.js"

const evidenceTargetPostKind = "post" as const
const evidenceTargetInspectPathKind = "inspect-path" as const
const allEvidenceTargetKinds = [evidenceTargetPostKind, evidenceTargetInspectPathKind] as const
type EvidenceTargetKind = (typeof allEvidenceTargetKinds)[number]
const evidenceCliHelpResult = "help" as const

// Evidence capture target, either the full post or one inspect path.
export type EvidenceTarget =
  | {
      kind: typeof evidenceTargetPostKind
    }
  | {
      kind: typeof evidenceTargetInspectPathKind
      path: string
    }

// Input case for one post evidence capture.
export type EvidenceCase = {
  blogKey: string
  sourceInput: string
  sourceId: string
  postId: string
  metadata: string | Record<string, string | number | boolean | null | undefined>
  target: EvidenceTarget
  optionsPath?: string
}

// Parsed CLI options for post evidence capture runs.
export type EvidenceCliArgs = {
  cases: EvidenceCase[]
  outputDir?: string
  optionsPath?: string
  metadataCachePath?: string
  assetProfile: EvidenceAssetProfile
}

const usageText = `Usage:
  bun scripts/post-evidence/capture-post-evidence.ts --blogKey naver --sourceInput my-blog --postId 123 [--metadata key=value] [--target post|inspect-path --inspectPath 0.1] [--optionsPath options.json] [--metadataCachePath tmp/harness/post-evidence/metadata-cache.json] [--outputDir tmp/harness/post-evidence/case] [--assetProfile readme|figure|tmp]
  bun scripts/post-evidence/capture-post-evidence.ts --case cases.json [--metadataCachePath tmp/harness/post-evidence/metadata-cache.json] [--outputDir tmp/harness/post-evidence/run] [--assetProfile readme|figure|tmp]

Outputs evidence.md, report.json, source capture images, and Markdown evidence.`

export const capturePostEvidenceUsage = () => usageText

const readValue = (args: string[], index: number) => {
  const value = args[index + 1]

  if (!value || value.startsWith("--")) {
    throw new Error(capturePostEvidenceUsage())
  }

  return value
}

const isEvidenceAssetProfile = (value: string): value is EvidenceAssetProfile =>
  allEvidenceAssetProfiles.some((profile) => profile === value)

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
  if (value === undefined || value === evidenceTargetPostKind) {
    return { kind: evidenceTargetPostKind }
  }

  if (typeof value === "string") {
    return {
      kind: evidenceTargetInspectPathKind,
      path: value,
    }
  }

  const record = assertRecord(value, context)
  const kind = assertString(record.kind, `${context}.kind`)

  if (kind === evidenceTargetPostKind) {
    return { kind: evidenceTargetPostKind }
  }

  if (kind === evidenceTargetInspectPathKind) {
    return {
      kind,
      path: assertString(record.path, `${context}.path`),
    }
  }

  throw new Error(`${context}.kind must be post or inspect-path`)
}

const parseAssetProfile = (value: string | undefined): EvidenceAssetProfile => {
  if (!value) {
    return "tmp"
  }

  if (isEvidenceAssetProfile(value)) {
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
  const sourceInput = assertString(record.sourceInput, `${context}.sourceInput`)

  return {
    blogKey: assertString(record.blogKey, `${context}.blogKey`),
    sourceInput,
    sourceId: typeof record.sourceId === "string" ? record.sourceId : sourceInput,
    postId: assertString(record.postId, `${context}.postId`),
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
): Promise<EvidenceCliArgs | typeof evidenceCliHelpResult> => {
  let blogKey: string | undefined
  let sourceInput: string | undefined
  let postId: string | undefined
  let target: EvidenceTargetKind = evidenceTargetPostKind
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
      return evidenceCliHelpResult
    }

    if (arg === "--blogKey") {
      blogKey = readValue(args, index)
      index++
      continue
    }

    if (arg === "--sourceInput") {
      sourceInput = readValue(args, index)
      index++
      continue
    }

    if (arg === "--postId") {
      postId = readValue(args, index)
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

      if (!allEvidenceTargetKinds.includes(value as EvidenceTargetKind)) {
        throw new Error(capturePostEvidenceUsage())
      }

      target = value as EvidenceTargetKind
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

  if (!blogKey || !sourceInput || !postId || (target === "inspect-path" && !inspectPath)) {
    throw new Error(capturePostEvidenceUsage())
  }

  return {
    cases: [
      {
        blogKey,
        sourceInput,
        sourceId: sourceInput,
        postId,
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
