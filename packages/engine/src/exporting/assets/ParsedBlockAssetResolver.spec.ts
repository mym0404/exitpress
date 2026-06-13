import { describe, expect, it } from "vitest"

import { resolveParsedBlockAssetsForRender } from "./ParsedBlockAssetResolver.js"

describe("resolveParsedBlockAssetsForRender", () => {
  it("replaces top-level props with resolved asset references", async () => {
    const result = await resolveParsedBlockAssetsForRender({
      blocks: [
        {
          blockId: "blog:image",
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
          blockId: "blog:image",
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

  it("replaces nested asset paths in array props", async () => {
    const result = await resolveParsedBlockAssetsForRender({
      blocks: [
        {
          blockId: "blog:imageGroup",
          props: {
            images: [
              {
                url: "https://example.com/one.png",
                alt: "one",
              },
            ],
          },
          assets: {
            "images.0.url": {
              role: "image",
              sourceUrl: "https://example.com/one.png",
              required: true,
            },
          },
        },
      ],
      resolveAsset: async ({ role, sourceUrl }) => ({
        reference: "assets/one.png",
        record: {
          kind: role,
          sourceUrl,
          reference: "assets/one.png",
          relativePath: "assets/one.png",
          storageMode: "relative",
          uploadCandidate: null,
        },
      }),
    })

    expect(result.blocks[0]?.props.images).toEqual([
      {
        url: "assets/one.png",
        alt: "one",
      },
    ])
    expect(result.assetRecords).toHaveLength(1)
  })
})
