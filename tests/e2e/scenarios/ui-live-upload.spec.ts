import { test } from "@playwright/test"

import { runUiLiveUpload } from "./ui-live-upload.js"

test("live upload rewrites exported image URLs", async ({ browser }) => {
  await runUiLiveUpload({ browser })
})
