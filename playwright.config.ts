import { defineConfig, devices } from "@playwright/test"

const isCi = process.env.CI === "true"
const workers = isCi ? 1 : 8

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers,
  reporter: isCi ? [["list"], ["github"]] : [["list"]],
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    ...devices["Desktop Chrome"],
    trace: "on-first-retry",
  },
})
