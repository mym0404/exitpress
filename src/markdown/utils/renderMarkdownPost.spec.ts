import { describe, expect, it } from "vitest"

import type { CategoryInfo, PostSummary } from "../../domain/blog/Types.js"
import type { AssetRecord } from "../../domain/export-job/Types.js"
import type { ParsedPost } from "../../domain/parser/Types.js"

import { createTestPath } from "../../../tests/support/test-paths.js"
import { defaultExportOptions } from "../../domain/export-options/ExportOptions.js"
import { tableTemplate } from "../../domain/template/DefaultTemplates.js"

import { renderMarkdownPost } from "./renderMarkdownPost.js"

const markdownFilePath = createTestPath("markdown-renderer", "posts", "test.md")

const category: CategoryInfo = {
  id: 1,
  name: "Algorithm",
  parentId: null,
  postCount: 1,
  isDivider: false,
  isOpen: true,
  path: ["Algorithm"],
  depth: 0,
}

const post: PostSummary = {
  blogId: "mym0404",
  logNo: "223034929697",
  title: "테스트 글",
  publishedAt: "2023-03-04T13:00:00+09:00",
  categoryId: 1,
  categoryName: "Algorithm",
  source: "https://blog.naver.com/mym0404/223034929697",
  thumbnailUrl: "https://example.com/thumb.png",
}

const defaultBlockTemplates = {
  "naver-se4:paragraph": "${text}",
  "naver-se4:quote": "> ${text}",
  "naver-se4:image": "![${alt}](${url})",
  "naver-se4:video": "[${title}](${url})",
  "naver-se4:table": tableTemplate,
}

const createAssetRecord = ({
  kind,
  sourceUrl,
  reference,
}: {
  kind: "image" | "thumbnail"
  sourceUrl: string
  reference: string
}) =>
  ({
    kind,
    sourceUrl,
    reference,
    relativePath: reference === sourceUrl ? null : reference,
    storageMode: reference === sourceUrl ? ("remote" as const) : ("relative" as const),
    uploadCandidate: null,
  }) satisfies AssetRecord

const render = ({
  parsedPost,
  options = defaultExportOptions(),
  resolveAsset = async ({ kind, sourceUrl }: { kind: "image" | "thumbnail"; sourceUrl: string }) =>
    createAssetRecord({
      kind,
      sourceUrl,
      reference: sourceUrl.includes("thumb") ? "assets/thumb.png" : "assets/image.png",
    }),
}: {
  parsedPost: ParsedPost
  options?: ReturnType<typeof defaultExportOptions>
  resolveAsset?: (input: { kind: "image" | "thumbnail"; sourceUrl: string }) => Promise<AssetRecord>
}) =>
  renderMarkdownPost({
    post,
    category,
    parsedPost,
    defaultBlockTemplates,
    markdownFilePath,
    options,
    resolveAsset: async ({ kind, sourceUrl }) => resolveAsset({ kind, sourceUrl }),
  })

describe("renderMarkdownPost", () => {
  it("renders parsed blocks with default block templates", async () => {
    const rendered = await render({
      parsedPost: {
        tags: ["algo"],
        blocks: [
          { blockId: "naver-se4:paragraph", props: { text: "본문입니다." } },
          { blockId: "naver-se4:quote", props: { text: "인용문" } },
          {
            blockId: "naver-se4:video",
            props: {
              title: "Demo",
              url: "https://example.com/video",
              thumbnailUrl: "https://example.com/video-thumb.png",
              width: 640,
              height: 360,
            },
          },
        ],
      },
    })

    expect(rendered.markdown).toContain("title: 테스트 글")
    expect(rendered.markdown).toContain("본문입니다.")
    expect(rendered.markdown).toContain("> 인용문")
    expect(rendered.markdown).toContain("[Demo](https://example.com/video)")
    expect(rendered.markdown).not.toContain("\nvideo:")
  })

  it("uses custom templates by blockId", async () => {
    const options = defaultExportOptions()
    options.blockOutputs.templates["naver-se4:paragraph"] = "CUSTOM ${text}"

    const rendered = await render({
      options,
      parsedPost: {
        tags: [],
        blocks: [{ blockId: "naver-se4:paragraph", props: { text: "본문" } }],
      },
    })

    expect(rendered.markdown).toContain("CUSTOM 본문")
  })

  it("resolves block asset records into top-level props", async () => {
    const rendered = await render({
      parsedPost: {
        tags: [],
        blocks: [
          {
            blockId: "naver-se4:image",
            props: {
              url: "https://example.com/image.png",
              alt: "image",
              caption: null,
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
      },
    })

    expect(rendered.markdown).toContain("![image](assets/image.png)")
    expect(rendered.assetRecords).toContainEqual(
      expect.objectContaining({
        kind: "image",
        sourceUrl: "https://example.com/image.png",
        reference: "assets/image.png",
      }),
    )
  })

  it("omits a block when a required asset resolves to an empty reference", async () => {
    const rendered = await render({
      parsedPost: {
        tags: [],
        blocks: [
          {
            blockId: "naver-se4:image",
            props: {
              url: "https://example.com/missing.png",
              alt: "missing",
              caption: null,
            },
            assets: {
              url: {
                role: "image",
                sourceUrl: "https://example.com/missing.png",
                required: true,
              },
            },
          },
        ],
      },
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          reference: "",
        }),
    })

    expect(rendered.markdown).not.toContain("missing")
  })

  it("fails clearly when a default template is missing", async () => {
    await expect(
      render({
        parsedPost: {
          tags: [],
          blocks: [{ blockId: "naver-se4:unknown", props: { text: "본문" } }],
        },
      }),
    ).rejects.toThrow("Parser block template is missing: naver-se4:unknown")
  })
})
