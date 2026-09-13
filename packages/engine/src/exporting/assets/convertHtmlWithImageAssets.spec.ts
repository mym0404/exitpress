import { describe, expect, it } from "vitest"

import { convertHtmlWithImageAssets } from "./convertHtmlWithImageAssets.js"
import { resolveParsedBlockAssetsForRender } from "./ParsedBlockAssetResolver.js"

const resolveHtml = async (
  html: string,
  reference: string,
  format: "markdown" | "html" = "markdown",
) => {
  const { text, assets } = convertHtmlWithImageAssets({ html, format })
  const result = await resolveParsedBlockAssetsForRender({
    blocks: [{ blockId: "blog:paragraph", props: { text }, assets }],
    resolveAsset: async ({ role, sourceUrl }) => ({
      reference,
      record: {
        kind: role,
        sourceUrl,
        reference,
        relativePath: null,
        storageMode: "remote",
        uploadCandidate: null,
      },
    }),
  })
  expect(JSON.stringify(result.blocks)).not.toContain('"text":"EXITPRESSINLINEIMAGE')
  expect(result.blocks[0]?.props.text).not.toContain("EXITPRESSINLINEIMAGE")
  return result
}

describe("inline image assets", () => {
  it("resolves actual images while preserving the same URL in text and code", async () => {
    const result = await resolveHtml(
      '<p>https://example.com/img.png <code>https://example.com/img.png</code><img src="https://example.com/img.png" alt="diagram"></p>',
      "local/image.png",
    )
    expect(result.blocks[0]?.props.text).toBe(
      "https://example.com/img.png `https://example.com/img.png`![diagram](local/image.png)",
    )
    expect(result.assetRecords).toHaveLength(1)
  })

  it("keeps duplicate images and their distinct captions in source order", async () => {
    const result = await resolveHtml(
      '<p><img src="https://example.com/img.png" alt="first"> and <img src="https://example.com/img.png" alt="second"></p>',
      "local/image.png",
    )
    expect(result.blocks[0]?.props.text).toBe(
      "![first](local/image.png) and ![second](local/image.png)",
    )
    expect(result.assetRecords).toHaveLength(2)
  })

  it("omits only the failed image while preserving its surrounding link and text", async () => {
    const result = await resolveHtml(
      '<p>Before <a href="https://example.com/video"><img src="https://example.com/img.png" alt="preview">Video</a> after</p>',
      "",
    )
    expect(result.blocks[0]?.props.text).toBe("Before [Video](https://example.com/video) after")
  })

  it("preserves the remote source reference when download failure policy retains it", async () => {
    const result = await resolveHtml(
      '<p>Caption <img src="https://example.com/img.png" alt="original"></p>',
      "https://example.com/img.png",
    )
    expect(result.blocks[0]?.props.text).toBe("Caption ![original](https://example.com/img.png)")
  })

  it("propagates download failure when the resolver uses fail policy", async () => {
    const { text, assets } = convertHtmlWithImageAssets({
      html: '<p>Caption<img src="https://example.com/img.png"></p>',
    })
    await expect(
      resolveParsedBlockAssetsForRender({
        blocks: [{ blockId: "blog:paragraph", props: { text }, assets }],
        resolveAsset: async () => {
          throw new Error("download failed")
        },
      }),
    ).rejects.toThrow("download failed")
  })

  it("escapes a resolved Markdown destination with spaces and parentheses", async () => {
    const result = await resolveHtml(
      '<p>Caption<img src="https://example.com/img.png" alt="[diagram] $&"></p>',
      "local/a (1) $&.png",
    )
    expect(result.blocks[0]?.props.text).toBe(
      String.raw`Caption![\[diagram\] \$&](<local/a \(1\) $&.png>)`,
    )
  })

  it("serializes resolved raw HTML image attributes without breaking a table", async () => {
    const result = await resolveHtml(
      '<table><tr><td><img src="https://example.com/img.png" alt="diagram"></td><td>text</td></tr></table>',
      'https://example.com/a?x="&y=<b>&z=$&',
      "html",
    )
    expect(result.blocks[0]?.props.text).toBe(
      '<table><tbody><tr><td><img src="https://example.com/a?x=&quot;&amp;y=<b>&amp;z=$&amp;" alt="diagram"></td><td>text</td></tr></tbody></table>',
    )
  })

  it("does not register images embedded in a source code example", () => {
    const result = convertHtmlWithImageAssets({
      html: '<pre><code>&lt;img src="https://example.com/img.png"&gt;</code></pre>',
    })
    expect(result.assets).toEqual({})
    expect(result.text).toContain('<img src="https://example.com/img.png">')
  })
})
