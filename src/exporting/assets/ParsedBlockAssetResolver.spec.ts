import { describe, expect, it } from "vitest"

import { resolveParsedBlockAssetsForRender } from "./ParsedBlockAssetResolver.js"

describe("resolveParsedBlockAssetsForRender", () => {
  it("replaces top-level props with resolved asset references", async () => {
    const result = await resolveParsedBlockAssetsForRender({
      blocks: [
        {
          blockId: "naver-se4:image",
          props: {
            url: "https://example.com/image.png",
            alt: "image",
          },
          assets: {
            url: {
              role: "image",
              sourceUrl: "https://example.com/image.png",
              required: true,
            },
          },
        },
      ],
      resolveAsset: async ({ role, sourceUrl }) => ({
        reference: "assets/image.png",
        record: {
          kind: role,
          sourceUrl,
          reference: "assets/image.png",
          relativePath: "assets/image.png",
          storageMode: "relative",
          uploadCandidate: null,
        },
      }),
    })

    expect(result.blocks[0]?.props.url).toBe("assets/image.png")
    expect(result.assetRecords).toHaveLength(1)
  })

  it("omits blocks when required assets resolve to empty references", async () => {
    const result = await resolveParsedBlockAssetsForRender({
      blocks: [
        {
          blockId: "naver-se4:image",
          props: {
            url: "https://example.com/image.png",
          },
          assets: {
            url: {
              role: "image",
              sourceUrl: "https://example.com/image.png",
              required: true,
            },
          },
        },
      ],
      resolveAsset: async ({ role, sourceUrl }) => ({
        reference: "",
        record: {
          kind: role,
          sourceUrl,
          reference: "",
          relativePath: null,
          storageMode: "remote",
          uploadCandidate: null,
        },
      }),
    })

    expect(result.blocks).toEqual([])
  })
})
