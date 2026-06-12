import path from "node:path"
import { fileURLToPath } from "node:url"

import { createTestPath } from "@tests/support/test-paths.js"
import { describe, expect, it } from "vitest"

import { getProjectTempPath, resolveRepoPath } from "../infra/node/FilePaths.js"

import { delay, mapConcurrent } from "./async/util/AsyncTasks.js"
import { toErrorMessage } from "./error/util/toErrorMessage.js"

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url))
const relativeTempOutputDir = path.relative(repoRoot, createTestPath("shared", "output"))
const relativeTempClientDir = path.relative(repoRoot, createTestPath("shared", "dist", "client"))
const absoluteTempExportDir = createTestPath("shared", "export")

describe("shared behavior", () => {
  it("formats errors and preserves item order in concurrent mapping", async () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom")
    expect(toErrorMessage("plain")).toBe("plain")

    await delay(0)

    const results = await mapConcurrent({
      items: [30, 0, 10],
      concurrency: 2,
      mapper: async (ms, index) => {
        await delay(ms)
        return `${index}:${ms}`
      },
    })

    expect(results).toEqual(["0:30", "1:0", "2:10"])
  })

  it("resolves relative paths from the repository root", () => {
    expect(resolveRepoPath(relativeTempOutputDir)).toBe(
      path.resolve(repoRoot, relativeTempOutputDir),
    )
    expect(resolveRepoPath(relativeTempClientDir)).toBe(
      path.resolve(repoRoot, relativeTempClientDir),
    )
    expect(resolveRepoPath(absoluteTempExportDir)).toBe(absoluteTempExportDir)
    expect(getProjectTempPath("shared", "scratch")).toBe(
      path.join(repoRoot, "tmp", "shared", "scratch"),
    )
  })
})
