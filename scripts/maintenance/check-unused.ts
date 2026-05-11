import { spawn } from "node:child_process"
import path from "node:path"

type CommandResult = {
  code: number
  stdout: string
  stderr: string
}

type KnipIssueItem = {
  name: string
  line?: number
  col?: number
}

type KnipIssue = {
  file: string
  files: KnipIssueItem[]
  exports: KnipIssueItem[]
  types: KnipIssueItem[]
  nsExports: KnipIssueItem[]
  nsTypes: KnipIssueItem[]
  enumMembers: KnipIssueItem[]
  namespaceMembers: KnipIssueItem[]
  duplicates: KnipIssueItem[]
}

type TsserverResponse = {
  type: "response"
  request_seq: number
  command: string
  success: boolean
  message?: string
  body?: unknown
}

type TsserverProjectInfo = {
  configFileName?: string
  fileNames?: string[]
}

type TsserverDiagnostic = {
  text?: string
  message?: string
  code?: number
  category?: string
  start?: {
    line?: number
    offset?: number
  }
}

const sourceRoots = ["src", "tests", "scripts"]
const unusedDiagnosticCodes = new Set([6133, 6138, 6192, 6196, 6198, 6199])
const allowedKnipFileEntries: Record<string, string> = {
  ".agents/skills/ingest-blog/scripts/collect-blog-errors.ts": "ingest-blog skill CLI entrypoint",
  ".agents/skills/ingest-blog/scripts/check-support-unit-prs.ts":
    "ingest-blog skill CLI entrypoint",
  ".agents/skills/ingest-blog/scripts/write-sample-fixture.ts": "ingest-blog skill CLI entrypoint",
  "scripts/post-evidence/capture-post-evidence.ts": "manual evidence capture CLI entrypoint",
  "scripts/post-evidence/capture.ts": "manual evidence capture CLI dependency",
  "scripts/post-evidence/cases.ts": "manual evidence capture CLI dependency",
  "scripts/post-evidence/paths.ts": "manual evidence capture CLI dependency",
  "scripts/post-evidence/playwright.ts": "manual evidence capture CLI dependency",
  "tests/support/e2e/run-live-server.ts": "spawned by live resume harness",
  "tests/e2e/scenarios/ui-resume-smoke.ts": "spawned through smoke suite entrypoint",
  "tests/e2e/scenarios/ui-smoke.ts": "spawned through smoke suite entrypoint",
  "tests/e2e/run-ui-resume-smoke.ts": "spawned by smoke suite",
  "tests/e2e/run-ui-smoke.ts": "spawned by smoke suite",
  "vitest.parser-blocks.config.ts": "parser block coverage config entrypoint",
}
const allowedKnipExports: Record<string, string> = {
  "scripts/single-post/export-single-post.ts:runSinglePostExportCli": "script entrypoint alias",
  "src/parsing/naver-blog/core/PostParser.ts:parsePostHtmlWithBlockEvidence":
    "manual evidence capture CLI dependency",
  "scripts/post-evidence/cases.ts:capturePostEvidenceUsage":
    "manual evidence capture CLI dependency",
  "scripts/post-evidence/cases.ts:parseEvidenceCaseFile": "manual evidence capture CLI dependency",
  "scripts/post-evidence/paths.ts:safeEvidencePathSegment":
    "manual evidence capture CLI dependency",
  "scripts/post-evidence/paths.ts:createDefaultEvidenceOutputDir":
    "manual evidence capture CLI dependency",
  "scripts/post-evidence/paths.ts:resolveEvidenceOutputPaths":
    "manual evidence capture CLI dependency",
}
const allowedKnipTypes: Record<string, string> = {
  ".agents/skills/ingest-blog/scripts/lib/ingest-focus.ts:SupportUnitFailureGroup":
    "ingest-blog skill CLI dependency",
  ".agents/skills/ingest-blog/scripts/lib/ingest-pr-check.ts:SupportUnitClaimPullRequest":
    "ingest-blog skill CLI dependency",
  "scripts/post-evidence/cases.ts:EvidenceTarget": "manual evidence capture CLI dependency",
  "scripts/post-evidence/cases.ts:EvidenceCase": "manual evidence capture CLI dependency",
  "scripts/post-evidence/cases.ts:EvidenceCliArgs": "manual evidence capture CLI dependency",
  "scripts/post-evidence/ingest-output.ts:ReusableIngestOutput": "ingest-blog skill CLI dependency",
  "scripts/post-evidence/evidence.ts:EvidenceMarkdownSection":
    "manual evidence capture CLI dependency",
}

const runCommand = (command: string, args: string[]): Promise<CommandResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: "pipe",
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []

    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
    child.on("error", reject)
    child.on("exit", (code) => {
      resolve({
        code: code ?? 1,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      })
    })
  })

const createKnipLine = ({
  type,
  file,
  item,
}: {
  type: string
  file: string
  item?: KnipIssueItem
}) => {
  if (!item) {
    return `${type} ${file}`
  }

  const position = item.line ? `:${item.line}${item.col ? `:${item.col}` : ""}` : ""

  return `${type} ${file}${position} ${item.name}`
}

const isAllowedKnipItem = ({
  type,
  file,
  item,
}: {
  type: string
  file: string
  item?: KnipIssueItem
}) => {
  if (type === "file") {
    return Object.hasOwn(allowedKnipFileEntries, file)
  }

  if (type === "export" && item) {
    return Object.hasOwn(allowedKnipExports, `${file}:${item.name}`)
  }

  if (type === "type" && item) {
    return Object.hasOwn(allowedKnipTypes, `${file}:${item.name}`)
  }

  return false
}

const parseKnipIssues = (stdout: string) => {
  if (!stdout.trim()) {
    return []
  }

  const parsed = JSON.parse(stdout) as { issues?: KnipIssue[] }
  const lines: string[] = []

  for (const issue of parsed.issues ?? []) {
    const groups: Array<[string, KnipIssueItem[]]> = [
      ["file", issue.files],
      ["export", issue.exports],
      ["type", issue.types],
      ["namespace export", issue.nsExports],
      ["namespace type", issue.nsTypes],
      ["enum member", issue.enumMembers],
      ["namespace member", issue.namespaceMembers],
      ["duplicate", issue.duplicates],
    ]

    for (const [type, items] of groups) {
      for (const item of items ?? []) {
        if (!isAllowedKnipItem({ type, file: issue.file, item })) {
          lines.push(createKnipLine({ type, file: issue.file, item }))
        }
      }
    }
  }

  return lines
}

const runKnip = async () => {
  const result = await runCommand("pnpm", [
    "exec",
    "knip",
    "--reporter",
    "json",
    "--include",
    "files,exports,types,nsExports,nsTypes,enumMembers,namespaceMembers,duplicates",
    "--no-progress",
  ])

  return {
    result,
    issues: result.stdout.trim() ? parseKnipIssues(result.stdout) : [],
  }
}

const runNoUnusedTsc = async () =>
  runCommand("pnpm", [
    "exec",
    "tsc",
    "-p",
    "tsconfig.json",
    "--noEmit",
    "--noUnusedLocals",
    "--noUnusedParameters",
    "--pretty",
    "false",
  ])

const isSourceFile = (fileName: string) => {
  const relativePath = path.relative(process.cwd(), fileName)

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return false
  }

  return (
    sourceRoots.some(
      (root) => relativePath === root || relativePath.startsWith(`${root}${path.sep}`),
    ) &&
    (relativePath.endsWith(".ts") || relativePath.endsWith(".tsx")) &&
    !relativePath.endsWith(".d.ts")
  )
}

const runTsserver = async () =>
  new Promise<string[]>((resolve, reject) => {
    const child = spawn("./node_modules/.bin/tsserver", ["--useInferredProjectPerProjectRoot"], {
      cwd: process.cwd(),
      stdio: "pipe",
    })
    let seq = 0
    let lineBuffer = ""
    const responses = new Map<number, (response: TsserverResponse) => void>()
    const issues: string[] = []
    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error("tsserver timed out"))
    }, 60_000)

    const request = (command: string, args: Record<string, unknown>) =>
      new Promise<TsserverResponse>((requestResolve) => {
        const requestSeq = ++seq
        responses.set(requestSeq, requestResolve)
        child.stdin.write(
          `${JSON.stringify({ seq: requestSeq, type: "request", command, arguments: args })}\n`,
        )
      })

    const parseMessage = (line: string) => {
      if (!line.trim() || line.startsWith("Content-Length")) {
        return
      }

      const message = JSON.parse(line) as TsserverResponse | { type: string }
      if (message.type !== "response") {
        return
      }

      const response = message as TsserverResponse
      responses.get(response.request_seq)?.(response)
      responses.delete(response.request_seq)
    }

    child.stdout.on("data", (chunk) => {
      lineBuffer += String(chunk)
      const lines = lineBuffer.split(/\r?\n/)
      lineBuffer = lines.pop() ?? ""

      for (const line of lines) {
        parseMessage(line)
      }
    })

    child.stderr.on("data", (chunk) => {
      issues.push(`tsserver stderr ${String(chunk).trim()}`)
    })
    child.on("error", reject)

    const run = async () => {
      const projectFile = path.join(process.cwd(), "src", "Server.ts")
      const openResponse = await request("open", {
        file: projectFile,
        projectRootPath: process.cwd(),
      })

      if (!openResponse.success) {
        issues.push(`tsserver open failed ${openResponse.message ?? projectFile}`)
      }

      const projectInfoResponse = await request("projectInfo", {
        file: projectFile,
        needFileNameList: true,
      })

      if (!projectInfoResponse.success) {
        issues.push(`tsserver projectInfo failed ${projectInfoResponse.message ?? projectFile}`)
        return
      }

      const body = projectInfoResponse.body as TsserverProjectInfo
      const fileNames = (body.fileNames ?? []).filter(isSourceFile)

      for (const file of fileNames) {
        await request("open", {
          file,
          projectRootPath: process.cwd(),
        })

        for (const command of ["semanticDiagnosticsSync", "suggestionDiagnosticsSync"]) {
          const response = await request(command, { file })

          if (!response.success) {
            issues.push(
              `tsserver ${command} failed ${path.relative(process.cwd(), file)} ${response.message ?? ""}`,
            )
            continue
          }

          for (const diagnostic of (response.body ?? []) as TsserverDiagnostic[]) {
            if (!diagnostic.code || !unusedDiagnosticCodes.has(diagnostic.code)) {
              continue
            }

            const text = diagnostic.text ?? diagnostic.message ?? "diagnostic"
            const line = diagnostic.start?.line ? `:${diagnostic.start.line}` : ""
            const code = diagnostic.code ? ` TS${diagnostic.code}` : ""
            issues.push(`tsserver ${path.relative(process.cwd(), file)}${line}${code} ${text}`)
          }
        }
      }
    }

    run()
      .then(() => {
        clearTimeout(timeout)
        child.kill()
        resolve(issues)
      })
      .catch((error: unknown) => {
        clearTimeout(timeout)
        child.kill()
        reject(error)
      })
  })

const printSection = ({ title, lines }: { title: string; lines: string[] }) => {
  if (lines.length === 0) {
    console.log(`✅ ${title}: no issues`)
    return
  }

  console.log(`❌ ${title}: ${lines.length} issue(s)`)
  for (const line of lines) {
    console.log(`- ${line}`)
  }
}

const main = async () => {
  const [knip, tsc, tsserverIssues] = await Promise.all([
    runKnip(),
    runNoUnusedTsc(),
    runTsserver(),
  ])
  const tscOutput = [tsc.stdout.trim(), tsc.stderr.trim()].filter(Boolean).join("\n")
  const tscIssues = tsc.code === 0 ? [] : tscOutput.split(/\r?\n/).filter(Boolean)

  printSection({ title: "knip", lines: knip.issues })
  printSection({ title: "tsc noUnused", lines: tscIssues })
  printSection({ title: "tsserver", lines: tsserverIssues })

  if (knip.issues.length > 0 || tscIssues.length > 0 || tsserverIssues.length > 0) {
    process.exitCode = 1
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
