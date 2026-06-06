import path from "node:path"

import { resolveRepoPath } from "@exitpress/engine/infra/node/util/FilePaths.js"
import { describe, expect, it } from "vitest"

import { toMarkdownAssetPath } from "./paths.js"

describe("toMarkdownAssetPath", () => {
  it("keeps tmp assets relative to the generated evidence document", () => {
    const markdownPath = resolveRepoPath("tmp/harness/post-evidence/run/evidence.md")
    const assetPath = resolveRepoPath("tmp/harness/post-evidence/run/assets/naver.png")

    expect(toMarkdownAssetPath({ markdownFilePath: markdownPath, assetPath })).toBe(
      "assets/naver.png",
    )
  })

  it("keeps persistent evidence assets repo-root relative", () => {
    const markdownPath = resolveRepoPath("tmp/harness/post-evidence/run/evidence.md")
    const assetPath = resolveRepoPath(
      path.join(".agents", "knowledge", "reference", "assets", "figure", "naver.png"),
    )

    expect(toMarkdownAssetPath({ markdownFilePath: markdownPath, assetPath })).toBe(
      ".agents/knowledge/reference/assets/figure/naver.png",
    )
  })
})
