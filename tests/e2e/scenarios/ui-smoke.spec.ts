import { test } from "@playwright/test"

import { runUiSmoke } from "./ui-smoke.js"

test("mock export wizard smoke flow", async ({ browser }) => {
  await runUiSmoke({ browser })
})
