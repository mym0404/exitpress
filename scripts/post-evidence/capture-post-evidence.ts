#!/usr/bin/env bun

import { toErrorMessage } from "../../src/shared/error/ErrorUtils.js"
import { capturePostEvidence } from "./capture.js"
import { capturePostEvidenceUsage, parseCapturePostEvidenceArgs } from "./cases.js"

const run = async () => {
  const args = await parseCapturePostEvidenceArgs(process.argv.slice(2))

  if (args === "help") {
    console.log(capturePostEvidenceUsage())
    return
  }

  const report = await capturePostEvidence({
    cases: args.cases,
    outputDir: args.outputDir,
    assetProfile: args.assetProfile,
    metadataCachePath: args.metadataCachePath,
  })

  console.log(
    [
      `outputDir: ${report.outputDir}`,
      `evidencePath: ${report.evidencePath}`,
      `reportPath: ${report.reportPath}`,
      `rows: ${report.rows.length}`,
      `errors: ${report.errorCount}`,
    ].join("\n"),
  )

  if (report.errorCount > 0) {
    process.exitCode = 1
  }
}

try {
  await run()
} catch (error) {
  console.error(toErrorMessage(error))
  process.exitCode = 1
}
