import { describe, expect, it } from "vitest"

import { renderMarkdownPost } from "./MarkdownRenderer.js"
import { defaultExportOptions } from "../exporter/ExportOptions.js"
import type { AssetRecord } from "../exporter/Types.js"
import type { CategoryInfo, PostSummary } from "../blog/Types.js"
import type { ParsedPost } from "../blocks/Types.js"
import { createTestPath } from "../../../tests/helpers/test-paths.js"

const testMarkdownFilePath = createTestPath("markdown-renderer", "output", "posts", "Algorithm", "test.md")

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

const parsedPostBlocks: ParsedPost["blocks"] = [
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
    type: "linkCard",
    card: {
      title: "External article",
      description: "preview text",
      url: "https://example.com/article",
      imageUrl: "https://example.com/cover.png",
    },
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

const parsedPost: ParsedPost = {
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

const createParsedPost = (overrides: Partial<ParsedPost>): ParsedPost => {
  return {
    ...parsedPost,
    ...overrides,
  }
}

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
    expect(rendered.markdown).toContain("| col |")
    expect(rendered.markdown).toContain("[External article](https://example.com/article)")
    expect(rendered.markdown).toContain("[Demo](https://blog.naver.com/mym0404/223034929697)")
    expect(rendered.markdown).not.toContain("**Video:** Demo")
    expect(rendered.markdown).not.toContain("preview text")
    expect(rendered.assetRecords).toHaveLength(2)
  })

  it("renders custom formula wrappers and image asset references", async () => {
    const options = defaultExportOptions()
    const formulaSelection = {
      variant: "wrapper",
      params: {
        inlineWrapper: "\\(...\\)",
        blockWrapper: "\\[...\\]",
      },
    } satisfies ParsedPost["blocks"][number]["outputSelection"]

    options.blockOutputs.defaults["naver-se4:formula"] = formulaSelection

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: parsedPostBlocks.map((block) =>
          block.type === "formula"
            ? {
                ...block,
                outputSelectionKey: "naver-se4:formula",
                outputSelection: formulaSelection,
              }
            : block,
        ),
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

    expect(rendered.markdown).toContain("\\[\nf(n)=n+1\n\\]")
    expect(rendered.markdown).toContain("\\(g(n)=n-1\\)")
    expect(rendered.markdown).toContain(`![one](${publicImagePath})`)
    expect(rendered.assetRecords.every((asset) => asset.storageMode === "relative")).toBe(true)
  })

  it("renders same block types from editor-specific output selections independently", async () => {
    const options = defaultExportOptions()
    options.blockOutputs.defaults["naver-se4:code"] = {
      variant: "tilde-fence",
    }
    options.blockOutputs.defaults["naver-se3:code"] = {
      variant: "backtick-fence",
    }
    const se4CodeBlock = {
      type: "code",
      language: "ts",
      code: "const se4 = true",
      outputSelectionKey: "naver-se4:code",
      outputSelection: {
        variant: "tilde-fence",
      },
    } satisfies ParsedPost["blocks"][number]
    const se3CodeBlock = {
      type: "code",
      language: "ts",
      code: "const se3 = true",
      outputSelectionKey: "naver-se3:code",
      outputSelection: {
        variant: "backtick-fence",
      },
    } satisfies ParsedPost["blocks"][number]

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [se4CodeBlock, se3CodeBlock],
      }),
      markdownFilePath: testMarkdownFilePath,
      options,
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: null,
        }),
    })

    expect(rendered.markdown).toContain("~~~ts\nconst se4 = true\n~~~")
    expect(rendered.markdown).toContain("```ts\nconst se3 = true\n```")
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
      parsedPost: {
        ...parsedPost,
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
      },
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
    expect(rendered.markdown).not.toContain("스티커 asset 옵션이 ignore라서 본문에서 스티커를 생략했습니다.")
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

  it("renders per-block referenced link cards and inline media links without frontmatter", async () => {
    const options = defaultExportOptions()

    options.frontmatter.enabled = false
    options.blockOutputs.defaults["naver-se4:image"] = {
      variant: "source-only",
    }

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
            outputSelectionKey: "naver-se4:image",
            outputSelection: {
              variant: "source-only",
            },
          },
          {
            type: "linkCard",
            card: {
              title: "Reference Demo",
              description: "",
              url: "https://example.com/watch",
              imageUrl: null,
            },
            outputSelectionKey: "naver-se4:linkCard",
            outputSelection: {
              variant: "reference-link",
            },
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
    expect(rendered.markdown).toContain(`[source only](${publicImagePath})`)
    expect(rendered.markdown).toContain("[Reference Demo][ref-1]")
    expect(rendered.markdown).toContain("[ref-1]: https://example.com/watch")
    expect(rendered.markdown).not.toContain("---\n")
  })

  it("renders fallback output for image-group and table edge cases while keeping videos as plain links", async () => {
    const options = defaultExportOptions()

    options.blockOutputs.defaults["naver-se4:formula"] = {
      variant: "math-fence",
      params: {
        inlineWrapper: "$",
      },
    }
    options.blockOutputs.defaults["naver-se4:code"] = {
      variant: "tilde-fence",
    }
    options.blockOutputs.defaults["naver-se4:divider"] = {
      variant: "asterisk-rule",
    }
    options.blockOutputs.defaults["naver-se4:table"] = {
      variant: "html-only",
    }

    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: {
        ...parsedPost,
        blocks: [
          {
            type: "divider",
            outputSelectionKey: "naver-se4:divider",
            outputSelection: {
              variant: "asterisk-rule",
            },
          },
          {
            type: "code",
            language: "html",
            code: "<main></main>",
            outputSelectionKey: "naver-se4:code",
            outputSelection: {
              variant: "tilde-fence",
            },
          },
          {
            type: "formula",
            formula: "x+y",
            display: true,
            outputSelectionKey: "naver-se4:formula",
            outputSelection: {
              variant: "math-fence",
              params: {
                inlineWrapper: "$",
              },
            },
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
            outputSelectionKey: "naver-se4:table",
            outputSelection: {
              variant: "html-only",
            },
          },
        ],
      },
      markdownFilePath: testMarkdownFilePath,
      options,
      resolveAsset: async ({ kind, sourceUrl }) =>
        createAssetRecord({
          kind,
          sourceUrl,
          relativePath: publicImagePath,
        }),
    })

    expect(rendered.markdown).toContain("***")
    expect(rendered.markdown).toContain("~~~")
    expect(rendered.markdown).toContain("```math\nx+y\n```")
    expect(rendered.markdown).toContain("[HTML Demo](https://example.com/watch-html)")
    expect(rendered.markdown).not.toContain("![HTML Demo]")
    expect(rendered.markdown).not.toContain("Open Original Post")
    expect(rendered.markdown).toContain("<table><tr><td>cell</td></tr></table>")
  })

  it("keeps description only for non-preview link cards without duplicating bare urls", async () => {
    const rendered = await renderMarkdownPost({
      post,
      category,
      parsedPost: createParsedPost({
        blocks: [
          {
            type: "linkCard",
            card: {
              title: "Docs",
              description: "Useful reference\nhttps://example.com/docs",
              url: "https://example.com/docs",
              imageUrl: null,
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
