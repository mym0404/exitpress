import { test } from "@playwright/test"

import { runUiResumeSmoke } from "./ui-resume-smoke.js"

test("mock resume states smoke flow", async ({ browser }) => {
  await runUiResumeSmoke({ browser })
})
