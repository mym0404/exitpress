import { defineConfig, devices } from "@playwright/test"

const isCi = process.env.CI === "true"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: 1,
  reporter: isCi ? [["list"], ["github"]] : [["list"]],
  timeout: 300_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    ...devices["Desktop Chrome"],
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "smoke",
      testMatch: /.*smoke\.spec\.ts/,
    },
    {
      name: "live",
      testMatch: /.*live.*\.spec\.ts/,
    },
  ],
})
