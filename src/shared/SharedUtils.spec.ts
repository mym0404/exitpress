import { describe, expect, it } from "vitest"
import { createTestPath } from "../../tests/support/test-paths.js"
import { extractBlogId, normalizeAssetUrl } from "../domain/blog/NaverUrl.js"
import { getProjectTempPath, resolveRepoPath } from "../infra/node/FilePathUtils.js"
import { delay, mapConcurrent } from "./async/AsyncUtils.js"
import { toErrorMessage } from "./error/ErrorUtils.js"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = fileURLToPath(new URL("../..", import.meta.url))
const relativeTempOutputDir = path.relative(repoRoot, createTestPath("utils", "output"))
const relativeTempClientDir = path.relative(repoRoot, createTestPath("utils", "dist", "client"))
const absoluteTempExportDir = createTestPath("utils", "export")

describe("common utils", () => {
  it("extracts blog ids from supported inputs and rejects blank values", () => {
    expect(extractBlogId("https://blog.naver.com/mym0404")).toBe("mym0404")
    expect(extractBlogId("PostList.naver?blogId=query-blog&categoryNo=1")).toBe("query-blog")
    expect(extractBlogId("  plain-blog-id  ")).toBe("plain-blog-id")
    expect(() => extractBlogId("   ")).toThrow("blogId 또는 blog URL을 입력해야 합니다.")
  })

  it("normalizes asset urls and preserves invalid inputs", () => {
    expect(normalizeAssetUrl("https://mblogthumb-phinf.pstatic.net/a.png")).toBe(
      "https://mblogthumb-phinf.pstatic.net/a.png?type=w800",
    )
    expect(normalizeAssetUrl("https://mblogthumb-phinf.pstatic.net/a.png?type=w2")).toBe(
      "https://mblogthumb-phinf.pstatic.net/a.png?type=w2",
    )
    expect(normalizeAssetUrl("https://mblogthumb-phinf.pstatic.net/a.png?type=")).toBe(
      "https://mblogthumb-phinf.pstatic.net/a.png?type=w800",
    )
    expect(normalizeAssetUrl("  not-a-url  ")).toBe("not-a-url")
    expect(normalizeAssetUrl("   ")).toBe("")
  })

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
    expect(getProjectTempPath("utils", "scratch")).toBe(
      path.join(repoRoot, "tmp", "utils", "scratch"),
    )
  })
})
