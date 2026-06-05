import { describe, expect, it, vi } from "vitest"

import type { AssetCandidate, BlockRenderInput } from "../../domain/template/Types.js"

import { resolveAssetCandidatesForRender } from "./AssetCandidateResolver.js"

const renderInputs = (): BlockRenderInput[] => [
  {
    template: "![${alt}](${url})",
    props: {
      url: "",
      alt: "cover",
    },
  },
]

const candidates = (): AssetCandidate[] => [
  {
    assetRole: "image",
    sourceUrl: "https://example.com/cover.png",
    targetPropPath: ["0", "url"],
    dedupKey: "https://example.com/cover.png",
    required: true,
  },
]

describe("resolveAssetCandidatesForRender", () => {
  it("injects final URLs before rendering", async () => {
    const resolveAsset = vi.fn(async () => ({
      reference: "assets/cover.png",
      record: {
        kind: "image" as const,
        sourceUrl: "https://example.com/cover.png",
        reference: "assets/cover.png",
        relativePath: "assets/cover.png",
        storageMode: "relative" as const,
        uploadCandidate: null,
      },
    }))

    const result = await resolveAssetCandidatesForRender({
      renderInputs: renderInputs(),
      assetCandidates: candidates(),
      resolveAsset,
    })

    expect(result.renderInputs[0]?.props.url).toBe("assets/cover.png")
    expect(resolveAsset).toHaveBeenCalledWith({
      assetRole: "image",
      sourceUrl: "https://example.com/cover.png",
      dedupKey: "https://example.com/cover.png",
    })
  })
})
