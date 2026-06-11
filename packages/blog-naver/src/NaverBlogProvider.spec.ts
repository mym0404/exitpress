import { describe, expect, it } from "vitest"

import { createNaverBlogProvider } from "./NaverBlogProvider.js"

describe("createNaverBlogProvider", () => {
  it("parses a Naver Blog URL source", () => {
    const provider = createNaverBlogProvider()

    expect(provider.parseSource("https://blog.naver.com/mym0404")).toEqual({
      providerKey: "naver",
      sourceId: "mym0404",
      displayName: "mym0404",
      input: "https://blog.naver.com/mym0404",
    })
  })

  it("exposes Naver Blog block template definitions", () => {
    const provider = createNaverBlogProvider()
    const definitionKeys = provider
      .getBlockTemplateDefinitions()
      .map((definition) => definition.key)

    expect(definitionKeys).toContain("naver-se4:paragraph")
    expect(definitionKeys).toContain("naver-se4:image")
  })

  it("resolves a Naver post URL identity", () => {
    const provider = createNaverBlogProvider()

    expect(
      provider.resolvePostLinkIdentity?.("https://blog.naver.com/mym0404/223034929697"),
    ).toEqual({
      providerKey: "naver",
      sourceId: "mym0404",
      postId: "223034929697",
    })
  })
})
