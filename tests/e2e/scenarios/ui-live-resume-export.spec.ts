import { test } from "@playwright/test"

import type { ResumeCaseId } from "./ui-live-resume-export.js"

import { resumeCases, runUiLiveResumeExport } from "./ui-live-resume-export.js"

for (const resumeCaseId of Object.keys(resumeCases) as ResumeCaseId[]) {
  test(`live resume export completes after restart (${resumeCaseId})`, async () => {
    await runUiLiveResumeExport({ resumeCaseId })
  })
}
