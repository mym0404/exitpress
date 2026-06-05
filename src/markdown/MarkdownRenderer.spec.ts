import { describe, expect, it } from "vitest"

import type { ParsedPost as AstParsedPost } from "../domain/ast/Types.js"
import type { CategoryInfo, PostSummary } from "../domain/blog/Types.js"
import type { AssetRecord } from "../domain/export-job/Types.js"

import { createTestPath } from "../../tests/support/test-paths.js"
import { defaultExportOptions } from "../domain/export-options/ExportOptions.js"

import { convertAstParsedPostToTemplatePost } from "./AstRenderInputAdapter.js"
import { renderMarkdownPost } from "./MarkdownRenderer.js"

const testMarkdownFilePath = createTestPath(
  "markdown-renderer",
  "output",
  "posts",
  "Algorithm",
  "test.md",
)

const category: CategoryInfo = {
  id: 84,
  name: "PS 알고리즘, 팁",
  parentId: 79,
  postCount: 49,
  isDivider: false,
  isOpen: true,
  path: ["Algorithm", "PS 알고리즘, 팁"],
  depth: 1,
}

const post: PostSummary = {
  blogId: "mym0404",
  logNo: "223034929697",
  title: "테스트 글",
  publishedAt: "2023-03-04T13:00:00+09:00",
  categoryId: 84,
  categoryName: "PS 알고리즘, 팁",
  source: "https://blog.naver.com/mym0404/223034929697",
  thumbnailUrl: "https://example.com/thumb.png",
}

const publicImagePath = "../../public/hash-image.png"
const publicThumbnailPath = "../../public/hash-thumbnail.png"
const publicVideoThumbnailPath = "../../public/hash-video-thumbnail.png"

const createAssetRecord = ({
  kind,
  sourceUrl,
  relativePath,
  reference,
  storageMode = "relative",
}: {
  kind: "image" | "thumbnail"
  sourceUrl: string
  relativePath: string | null
  reference?: string
  storageMode?: "relative" | "remote"
}) =>
  ({
    kind,
    sourceUrl,
    reference: reference ?? relativePath ?? sourceUrl,
    relativePath,
    storageMode,
    uploadCandidate:
      storageMode === "relative" && relativePath
        ? {
            kind,
            sourceUrl,
            localPath: `Algorithm/test/${relativePath}`,
            markdownReference: relativePath,
          }
        : null,
  }) satisfies AssetRecord

const parsedPostBlocks: AstParsedPost["blocks"] = [
  { type: "heading", level: 2, text: "섹션" },
  { type: "paragraph", text: "본문입니다." },
  { type: "formula", formula: "f(n)=n+1", display: true },
  { type: "formula", formula: "g(n)=n-1", display: false },
  { type: "code", language: "ts", code: "const a = 1" },
  {
    type: "imageGroup",
    images: [
      {
        sourceUrl: "https://example.com/image-1.png",
        originalSourceUrl: null,
        alt: "one",
        caption: null,
        mediaKind: "image",
      },
      {
        sourceUrl: "https://example.com/image-2.png",
        originalSourceUrl: null,
        alt: "two",
        caption: "caption",
        mediaKind: "image",
      },
    ],
  },
  {
    type: "table",
    complex: false,
    html: "<table><tr><td>a</td></tr></table>",
    rows: [
      [
        {
          text: "col",
          html: "col",
          colspan: 1,
          rowspan: 1,
          isHeader: true,
        },
      ],
      [
        {
          text: "value",
          html: "value",
          colspan: 1,
          rowspan: 1,
          isHeader: false,
        },
      ],
    ],
  },
  {
    type: "paragraph",
    text: "[External article](https://example.com/article)",
  },
  {
    type: "video",
    video: {
      title: "Demo",
      thumbnailUrl: "https://example.com/video-thumb.png",
      sourceUrl: "https://blog.naver.com/mym0404/223034929697",
      vid: "vid",
      inkey: "inkey",
      width: 640,
      height: 360,
    },
  },
]

const astParsedPost: AstParsedPost = {
  tags: ["algo"],
  videos: [
    {
      title: "Demo",
      thumbnailUrl: "https://example.com/video-thumb.png",
      sourceUrl: "https://blog.naver.com/mym0404/223034929697",
      vid: "vid",
      inkey: "inkey",
      width: 640,
      height: 360,
    },
  ],
  blocks: parsedPostBlocks,
}

const createParsedPost = (
  overrides: Partial<AstParsedPost> = {},
  options = defaultExportOptions(),
) =>
  convertAstParsedPostToTemplatePost({
    parsedPost: {
      ...astParsedPost,
      ...overrides,
    },
    blockOutputs: options.blockOutputs,
    assets: options.assets,
  })

const parsedPost = createParsedPost()

describe("renderMarkdownPost", () => {
  it("renders frontmatter, formula wrappers, and asset paths", async () => {
    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost,
      markdownFilePath: testMarkdownFilePath,
      options: defaultExportOptions(),
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: sourceUrl.includes("video")
            ? publicVideoThumbnailPath
            : sourceUrl.includes("thumb")
              ? publicThumbnailPath
              : publicImagePath,
        }),
    })

    expect(rendered.markdown).toContain("title: 테스트 글")
    expect(rendered.markdown).toContain("## 섹션")
    expect(rendered.markdown).toContain("$$\nf(n)=n+1\n$$")
    expect(rendered.markdown).toContain("$g(n)=n-1$")
    expect(rendered.markdown).toContain(`![one](${publicImagePath})`)
    expect(rendered.markdown).not.toContain("_caption_")
    expect(rendered.markdown).toContain("| col |")
    expect(rendered.markdown).toContain("[External article](https://example.com/article)")
    expect(rendered.markdown).toContain("[Demo](https://blog.naver.com/mym0404/223034929697)")
    expect(rendered.markdown).not.toContain("**Video:** Demo")
    expect(rendered.markdown).not.toContain("\nvisibility:")
    expect(rendered.markdown).not.toContain("\nvideo:")
    expect(rendered.markdown).not.toContain("preview text")
    expect(rendered.assetRecords).toHaveLength(2)
  })

  it("applies configured block templates during markdown rendering", async () => {
    const options = defaultExportOptions()

    options.blockOutputs.templates["naver-se4:image"] = "![${alt}](${url})\n_${caption}_"

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost(
        {
          blocks: [
            {
              type: "image",
              image: {
                sourceUrl: "https://example.com/captioned-image.png",
                originalSourceUrl: null,
                alt: "captioned",
                caption: "caption",
                mediaKind: "image",
              },
            },
          ],
        },
        options,
      ),
      markdownFilePath: testMarkdownFilePath,
      options,
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: publicImagePath,
        }),
    })

    expect(rendered.markdown).toContain(`![captioned](${publicImagePath})`)
    expect(rendered.markdown).toContain("_caption_")
  })

  it("preserves hard breaks inside paragraph markdown", async () => {
    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [{ type: "paragraph", text: "**파이썬 웹 프로그래밍**  \n작가  \n김석훈" }],
      }),
      markdownFilePath: testMarkdownFilePath,
      options: defaultExportOptions(),
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: publicImagePath,
        }),
    })

    expect(rendered.markdown).toContain("**파이썬 웹 프로그래밍**  \n작가  \n김석훈")
  })

  it("ignores stickers by default without adding diagnostics", async () => {
    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [
          {
            type: "image",
            image: {
              sourceUrl: "https://example.com/sticker-preview.png",
              originalSourceUrl: "https://example.com/sticker-original.gif",
              alt: "",
              caption: null,
              mediaKind: "sticker",
            },
          },
        ],
      }),
      markdownFilePath: testMarkdownFilePath,
      options: defaultExportOptions(),
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: publicImagePath,
        }),
    })

    expect(rendered.markdown).not.toContain("## Export Diagnostics")
    expect(rendered.markdown).not.toContain("sticker-original.gif")
    expect(rendered.markdown).not.toContain(
      "스티커 asset 옵션이 ignore라서 본문에서 스티커를 생략했습니다.",
    )
  })

  it("renders frontmatter keys with configured aliases", async () => {
    const options = defaultExportOptions()

    options.frontmatter.aliases.title = "postTitle"
    options.frontmatter.aliases.publishedAt = "published_on"
    options.frontmatter.fields.source = false

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost,
      markdownFilePath: testMarkdownFilePath,
      options,
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: publicImagePath,
        }),
    })

    expect(rendered.markdown).toContain("postTitle: 테스트 글")
    expect(rendered.markdown).toContain("published_on: 2023-03-04T13:00:00+09:00")
    expect(rendered.markdown).not.toContain("\nsource: https://blog.naver.com/mym0404/223034929697")
  })

  it("renders paragraph links and media links inline without frontmatter", async () => {
    const options = defaultExportOptions()

    options.frontmatter.enabled = false

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [
          { type: "quote", text: "인용문\n둘째 줄" },
          {
            type: "image",
            image: {
              sourceUrl: "https://example.com/source-only.png",
              originalSourceUrl: null,
              alt: "source only",
              caption: null,
              mediaKind: "image",
            },
          },
          {
            type: "paragraph",
            text: "[Reference Demo](https://example.com/watch)",
          },
        ],
      }),
      markdownFilePath: testMarkdownFilePath,
      options,
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: publicImagePath,
        }),
    })

    expect(rendered.markdown).toContain("> 인용문")
    expect(rendered.markdown).toContain("> 둘째 줄")
    expect(rendered.markdown).toContain(`![source only](${publicImagePath})`)
    expect(rendered.markdown).toContain("[Reference Demo](https://example.com/watch)")
    expect(rendered.markdown).not.toContain("[ref-1]: https://example.com/watch")
    expect(rendered.markdown).not.toContain("---\n")
  })

  it("renders fallback output for image-group and table edge cases while keeping videos as plain links", async () => {
    const options = defaultExportOptions()

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [
          {
            type: "divider",
          },
          {
            type: "code",
            language: "html",
            code: "<main></main>",
          },
          {
            type: "formula",
            formula: "x+y",
            display: true,
          },
          {
            type: "imageGroup",
            images: [
              {
                sourceUrl: "https://example.com/group.png",
                originalSourceUrl: null,
                alt: "group",
                caption: null,
                mediaKind: "image",
              },
            ],
          },
          {
            type: "video",
            video: {
              title: "HTML Demo",
              thumbnailUrl: "https://example.com/video-thumb.png",
              sourceUrl: "https://example.com/watch-html",
              vid: null,
              inkey: null,
              width: null,
              height: null,
            },
          },
          {
            type: "table",
            complex: true,
            html: "<table><tr><td>cell</td></tr></table>",
            rows: [],
          },
        ],
      }),
      markdownFilePath: testMarkdownFilePath,
      options,
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: publicImagePath,
        }),
    })

    expect(rendered.markdown).toContain("---")
    expect(rendered.markdown).toContain("```html\n<main></main>\n```")
    expect(rendered.markdown).not.toContain("***")
    expect(rendered.markdown).not.toContain("~~~")
    expect(rendered.markdown).toContain("$$\nx+y\n$$")
    expect(rendered.markdown).toContain("[HTML Demo](https://example.com/watch-html)")
    expect(rendered.markdown).not.toContain("![HTML Demo]")
    expect(rendered.markdown).not.toContain("Open Original Post")
    expect(rendered.markdown).toContain("cell")
  })

  it("keeps link descriptions without duplicating bare urls", async () => {
    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [
          {
            type: "paragraph",
            text: "[Docs](https://example.com/docs)",
          },
          {
            type: "paragraph",
            text: "Useful reference",
          },
        ],
      }),
      markdownFilePath: testMarkdownFilePath,
      options: defaultExportOptions(),
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: publicImagePath,
        }),
    })

    expect(rendered.markdown).toContain("[Docs](https://example.com/docs)")
    expect(rendered.markdown).toContain("Useful reference")
    expect(rendered.markdown).not.toContain("\nhttps://example.com/docs\n")
  })

  it("fails when asset download fails and the asset option requests failure", async () => {
    const options = defaultExportOptions()

    options.assets.thumbnailSource = "none"

    await expect(
      renderMarkdownPost({
        post,
        category,
        parsedPost: createParsedPost({
          blocks: [
            {
              type: "image",
              image: {
                sourceUrl: "https://example.com/failing-image.png",
                originalSourceUrl: null,
                alt: "broken",
                caption: "caption",
                mediaKind: "image",
              },
            },
          ],
        }),
        markdownFilePath: testMarkdownFilePath,
        options,
        resolveAsset: async () => {
          throw new Error("network timeout")
        },
      }),
    ).rejects.toThrow("자산 다운로드 실패: https://example.com/failing-image.png (network timeout)")
  })

  it("omits images when asset download fails and the asset option requests omission", async () => {
    const options = defaultExportOptions()

    options.assets.downloadFailureMode = "omit"

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [
          {
            type: "image",
            image: {
              sourceUrl: "https://example.com/failing-image.png",
              originalSourceUrl: null,
              alt: "broken",
              caption: "caption",
              mediaKind: "image",
            },
          },
        ],
      }),
      markdownFilePath: testMarkdownFilePath,
      options,
      resolveAsset: async () => {
        throw new Error("network timeout")
      },
    })

    expect(rendered.markdown).not.toContain("![broken](")
    expect(rendered.markdown).not.toContain("_caption_")
  })

  it("keeps source url when asset download fails and the asset option keeps source urls", async () => {
    const options = defaultExportOptions()

    options.assets.downloadFailureMode = "use-source"

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [
          {
            type: "image",
            image: {
              sourceUrl: "https://example.com/failing-image.png",
              originalSourceUrl: null,
              alt: "broken",
              caption: "caption",
              mediaKind: "image",
            },
          },
        ],
      }),
      markdownFilePath: testMarkdownFilePath,
      options,
      resolveAsset: async () => {
        throw new Error("network timeout")
      },
    })

    expect(rendered.markdown).toContain("![broken](https://example.com/failing-image.png)")
  })

  it("omits images when asset download fails and the asset option omits images", async () => {
    const options = defaultExportOptions()

    options.assets.downloadFailureMode = "omit"

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [
          {
            type: "image",
            image: {
              sourceUrl: "https://example.com/failing-image.png",
              originalSourceUrl: null,
              alt: "broken",
              caption: "caption",
              mediaKind: "image",
            },
          },
        ],
      }),
      markdownFilePath: testMarkdownFilePath,
      options,
      resolveAsset: async () => {
        throw new Error("network timeout")
      },
    })

    expect(rendered.markdown).not.toContain("![broken](")
  })
})
