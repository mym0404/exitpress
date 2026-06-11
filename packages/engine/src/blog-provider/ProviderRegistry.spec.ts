import { describe, expect, it } from "vitest"

import type { BlogProvider } from "./BlogProvider.js"

import { createProviderRegistry } from "./ProviderRegistry.js"

const createProvider = (key: string): BlogProvider => ({
  key,
  label: `${key} provider`,
  parseSource: (input) => ({
    providerKey: key,
    sourceId: input,
    displayName: input,
    input,
  }),
  scan: async (source) => ({
    source,
    totalPostCount: 0,
    categories: [],
    posts: [],
  }),
  loadPostContent: async () => ({
    kind: "markdown",
    markdown: "# empty",
    sourceUrl: "https://example.com",
    tags: [],
  }),
  parseContent: () => ({
    tags: [],
    blocks: [{ blockId: `${key}:paragraph`, props: { text: "empty" } }],
  }),
  getBlockTemplateDefinitions: () => [],
})

describe("createProviderRegistry", () => {
  it("finds registered providers by key", () => {
    const registry = createProviderRegistry([createProvider("naver"), createProvider("tistory")])

    expect(registry.get("naver")?.label).toBe("naver provider")
    expect(registry.require("tistory").key).toBe("tistory")
    expect(registry.list().map((provider) => provider.key)).toEqual(["naver", "tistory"])
  })

  it("rejects duplicate provider keys", () => {
    expect(() =>
      createProviderRegistry([createProvider("naver"), createProvider("naver")]),
    ).toThrow("Duplicate blog provider key: naver")
  })

  it("throws for missing required provider", () => {
    const registry = createProviderRegistry([])

    expect(() => registry.require("missing")).toThrow("Unknown blog provider key: missing")
  })
})
