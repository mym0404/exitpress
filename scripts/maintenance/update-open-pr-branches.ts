#!/usr/bin/env bun
import { execFile } from "node:child_process"
import { promisify } from "node:util"

type PullRequest = {
  number: number
  title: string
  headRefName: string
  baseRefName: string
  mergeStateStatus: string
}

const OPEN_PR_LIMIT = "1000"
const execFileAsync = promisify(execFile)

const usage = () => `Usage:
  bun scripts/maintenance/update-open-pr-branches.ts
  bun scripts/maintenance/update-open-pr-branches.ts --help`

const toRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const toErrorMessage = (error: unknown) => {
  const record = toRecord(error)
  const stderr = record && typeof record.stderr === "string" ? record.stderr.trim() : ""
  const stdout = record && typeof record.stdout === "string" ? record.stdout.trim() : ""

  return stderr || stdout || (error instanceof Error ? error.message : String(error))
}

const runGh = async (args: string[]) => {
  const { stdout, stderr } = await execFileAsync("gh", args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  })

  return {
    stdout,
    stderr,
  }
}

const loadOpenPullRequests = async () => {
  const { stdout } = await runGh([
    "pr",
    "list",
    "--state",
    "open",
    "--limit",
    OPEN_PR_LIMIT,
    "--json",
    "number,title,headRefName,baseRefName,mergeStateStatus",
  ])

  return JSON.parse(stdout) as PullRequest[]
}

const formatPullRequest = (pullRequest: PullRequest) =>
  `#${pullRequest.number} ${pullRequest.title} (${pullRequest.headRefName} -> ${pullRequest.baseRefName}, ${pullRequest.mergeStateStatus})`

const updatePullRequestBranch = async (pullRequest: PullRequest) => {
  const result = await runGh(["pr", "update-branch", String(pullRequest.number)])
  const output = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n")

  if (output) {
    console.log(output)
  }
}

const main = async () => {
  const args = process.argv.slice(2)

  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    console.log(usage())
    return
  }

  if (args.length > 0) {
    throw new Error(usage())
  }

  const pullRequests = await loadOpenPullRequests()

  if (pullRequests.length === 0) {
    console.log("No open PRs found.")
    return
  }

  console.log(`Found ${pullRequests.length} open PR(s).`)

  const failures: Array<{ pullRequest: PullRequest; error: string }> = []

  for (const pullRequest of pullRequests) {
    console.log(`Updating ${formatPullRequest(pullRequest)}`)

    try {
      await updatePullRequestBranch(pullRequest)
    } catch (error) {
      failures.push({
        pullRequest,
        error: toErrorMessage(error),
      })
    }
  }

  if (failures.length > 0) {
    console.error(`Failed to update ${failures.length} PR(s):`)

    for (const failure of failures) {
      console.error(`- ${formatPullRequest(failure.pullRequest)}: ${failure.error}`)
    }

    process.exitCode = 1
    return
  }

  console.log("All open PR branches were updated.")
}

try {
  await main()
} catch (error) {
  console.error(toErrorMessage(error))
  process.exitCode = 2
}
