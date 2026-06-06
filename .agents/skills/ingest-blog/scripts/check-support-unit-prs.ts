#!/usr/bin/env bun

import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import type { SupportUnitClaimPullRequest } from "./lib/ingest-pr-check.js"

import { resolveRepoPath } from "../../../../packages/engine/src/infra/node/util/FilePaths.js"

import { createSupportUnitPrCheck, extractDiscoveredSupportUnits } from "./lib/ingest-pr-check.js"

type CheckArgs = {
  outputDir?: string
  summaryPath?: string
}

const execFileAsync = promisify(execFile)

const usage = () => `Usage:
  bun .agents/skills/ingest-blog/scripts/check-support-unit-prs.ts --outputDir /absolute/path/to/tmp/harness/ingest-blog/my-blog
  bun .agents/skills/ingest-blog/scripts/check-support-unit-prs.ts --summaryPath /absolute/path/to/failure-summary.json

Options:
  --outputDir <dir>      Completed ingest output directory. Defaults summary path to <dir>/failure-summary.json.
  --summaryPath <path>  Read a specific failure-summary.json path.

Checks ready open PR bodies for <!-- ingest-blog:supportUnitKey=... --> claims for every discovered support unit.`

const readValue = (args: string[], index: number) => {
  const value = args[index + 1]

  if (!value || value.startsWith("--")) {
    throw new Error(usage())
  }

  return value
}

const parseArgs = (args: string[]): CheckArgs | "help" => {
  let outputDir: string | undefined
  let summaryPath: string | undefined

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]

    if (arg === "--help" || arg === "-h") {
      return "help"
    }

    if (arg === "--outputDir") {
      outputDir = readValue(args, index)
      index++
      continue
    }

    if (arg === "--summaryPath") {
      summaryPath = readValue(args, index)
      index++
      continue
    }

    throw new Error(usage())
  }

  if (!outputDir && !summaryPath) {
    throw new Error(usage())
  }

  return {
    ...(outputDir ? { outputDir } : {}),
    ...(summaryPath ? { summaryPath } : {}),
  }
}

const toRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const parsePullRequests = (value: unknown): SupportUnitClaimPullRequest[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const record = toRecord(item)

        if (!record) {
          return []
        }

        return [
          {
            ...(typeof record.number === "number" ? { number: record.number } : {}),
            ...(typeof record.title === "string" ? { title: record.title } : {}),
            ...(typeof record.body === "string" || record.body === null
              ? { body: record.body }
              : {}),
            ...(typeof record.headRefName === "string" ? { headRefName: record.headRefName } : {}),
            ...(typeof record.isDraft === "boolean" ? { isDraft: record.isDraft } : {}),
            ...(typeof record.url === "string" ? { url: record.url } : {}),
          },
        ]
      })
    : []

const loadOpenPullRequests = async () => {
  const { stdout } = await execFileAsync(
    "gh",
    ["pr", "list", "--state", "open", "--json", "number,title,body,headRefName,isDraft,url"],
    {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  )

  return parsePullRequests(JSON.parse(stdout))
}

const formatPullRequest = (pullRequest: SupportUnitClaimPullRequest) => {
  const number = pullRequest.number ? `#${pullRequest.number}` : "(unknown PR)"
  const title = pullRequest.title ? ` ${pullRequest.title}` : ""
  const url = pullRequest.url ? ` ${pullRequest.url}` : ""

  return `${number}${title}${url}`
}

const run = async () => {
  const args = parseArgs(process.argv.slice(2))

  if (args === "help") {
    console.log(usage())
    return
  }

  const summaryPath = resolveRepoPath(
    args.summaryPath ?? path.join(args.outputDir ?? "", "failure-summary.json"),
  )
  const summary = JSON.parse(await readFile(summaryPath, "utf8")) as unknown
  const supportUnits = extractDiscoveredSupportUnits(summary)
  const pullRequests = await loadOpenPullRequests()
  const check = createSupportUnitPrCheck({
    supportUnits,
    pullRequests,
  })

  console.log(
    [
      `summaryPath: ${summaryPath}`,
      `supportUnitCount: ${check.totalSupportUnitCount}`,
      `readySupportUnitCount: ${check.claimedSupportUnitCount}`,
      `missingSupportUnitCount: ${check.missingSupportUnits.length}`,
      `draftOnlyClaimCount: ${check.draftOnlyClaims.length}`,
      ...(check.missingSupportUnits.length === 0
        ? ["missingSupportUnits: (none)"]
        : [
            "missingSupportUnits:",
            ...check.missingSupportUnits.map((unit) => `- ${unit.supportUnitKey}`),
          ]),
      ...(check.draftOnlyClaims.length === 0
        ? ["draftOnlyClaims: (none)"]
        : [
            "draftOnlyClaims:",
            ...check.draftOnlyClaims.map(
              (claim) => `- ${claim.supportUnitKey}: ${formatPullRequest(claim.pullRequest)}`,
            ),
          ]),
    ].join("\n"),
  )

  if (!check.complete) {
    process.exitCode = 1
  }
}

try {
  await run()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 2
}
