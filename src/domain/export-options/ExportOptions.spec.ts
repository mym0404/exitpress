import { describe, expect, it } from "vitest"
import { NaverBlog } from "../../parsing/naver-blog/NaverBlog.js"
import { resolveBlockOutputSelection } from "./BlockOutputSelection.js"
import {
  cloneExportOptions as cloneExportOptionsRaw,
  frontmatterFieldMeta,
  getFrontmatterExportKey,
  optionDescriptions,
  sanitizePersistedExportOptions as sanitizePersistedExportOptionsRaw,
  validateFrontmatterAliases,
} from "./ExportOptions.js"

const blockOutputDefinitions = new NaverBlog().getBlockOutputDefinitions()
const cloneExportOptions = (options?: Parameters<typeof cloneExportOptionsRaw>[0]) =>
  cloneExportOptionsRaw(options, { blockOutputDefinitions })
const sanitizePersistedExportOptions = (
  options?: Parameters<typeof sanitizePersistedExportOptionsRaw>[0],
) => sanitizePersistedExportOptionsRaw(options, { blockOutputDefinitions })

describe("export options", () => {
  it("merges frontmatter aliases with defaults", () => {
    const options = cloneExportOptions({
      frontmatter: {
        aliases: {
          title: "postTitle",
        },
      },
    })

    expect(options.frontmatter.aliases.title).toBe("postTitle")
    expect(options.frontmatter.aliases.source).toBe("")
    expect(options.frontmatter.fields.title).toBe(true)
    expect(Object.hasOwn(options.frontmatter.fields, "visibility")).toBe(false)
    expect(Object.hasOwn(options.frontmatter.fields, "video")).toBe(false)
    expect(Object.hasOwn(options.frontmatter.aliases, "visibility")).toBe(false)
    expect(Object.hasOwn(options.frontmatter.aliases, "video")).toBe(false)
    expect(options.assets.stickerAssetMode).toBe("ignore")
    expect(options.assets.imageHandlingMode).toBe("download-and-upload")
    expect(options.assets.compressionEnabled).toBe(true)
    expect(options.assets.downloadFailureMode).toBe("fail")
    expect(options.assets.includeImageCaptions).toBe(false)
    expect(options.links.sameBlogPostMode).toBe("keep-source")
    expect(options.links.sameBlogPostCustomUrlTemplate).toBe("")
    expect(Object.hasOwn(options, "markdown")).toBe(false)
    expect(options.blockOutputs.defaults["naver-se4:formula"]?.params?.inlineWrapper).toBe("$")
    expect(options.blockOutputs.defaults["naver-se4:formula"]?.params?.blockWrapper).toBe("$$")
    expect(options.blockOutputs.defaults["naver-se4:image"]?.params?.includeCaption).toBe(false)
    expect(Object.hasOwn(options, "unsupportedBlockCases")).toBe(false)
    expect(options.structure.groupByCategory).toBe(true)
    expect(options.structure.includeDateInPostFolderName).toBe(true)
    expect(options.structure.includeLogNoInPostFolderName).toBe(false)
    expect(options.structure.slugStyle).toBe("snake")
    expect(options.structure.slugWhitespace).toBe("underscore")
    expect(options.structure.postFolderNameMode).toBe("preset")
    expect(options.structure.postFolderNameCustomTemplate).toBe("")
    expect(Object.hasOwn(options.structure, "postDirectoryName")).toBe(false)
    expect(Object.hasOwn(options.assets, "assetPathMode")).toBe(false)
    expect(Object.hasOwn(options.assets, "imageContentMode")).toBe(false)
  })

  it("drops removed legacy markdown option containers", () => {
    const legacyOptions = JSON.parse(`{
      "markdown": {
        "linkStyle": "referenced",
        "headingLevelOffset": 1,
        "linkCardStyle": "quote",
        "videoStyle": "link-only"
      }
    }`) as Parameters<typeof cloneExportOptions>[0]

    const options = cloneExportOptions(legacyOptions)

    expect(Object.hasOwn(options, "markdown")).toBe(false)
  })

  it("merges editor block output defaults", () => {
    const options = cloneExportOptions({
      blockOutputs: {
        defaults: {
          "naver-se4:code": {
            variant: "tilde-fence",
          },
          "naver-se4:image": {
            variant: "linked-image",
          },
          "naver-se4:formula": {
            variant: "wrapper",
            params: {
              inlineWrapper: "\\(...\\)",
              blockWrapper: "\\[...\\]",
            },
          },
        },
      },
    })

    expect(options.blockOutputs.defaults["naver-se4:code"]).toBeUndefined()
    expect(options.blockOutputs.defaults["naver-se4:image"]?.variant).toBe("linked-image")
    expect(options.blockOutputs.defaults["naver-se4:image"]?.params?.includeCaption).toBe(false)
    expect(options.blockOutputs.defaults["naver-se4:formula"]?.variant).toBe("wrapper")
    expect(options.blockOutputs.defaults["naver-se4:formula"]?.params?.inlineWrapper).toBe(
      "\\(...\\)",
    )
    expect(options.blockOutputs.defaults["naver-se4:formula"]?.params?.blockWrapper).toBe(
      "\\[...\\]",
    )
  })

  it("drops block-type-only and removed output defaults from persisted options", () => {
    const sanitized = sanitizePersistedExportOptions(
      JSON.parse(`{
        "blockOutputs": {
          "defaults": {
            "code": {
              "variant": "tilde-fence"
            },
            "naver-se4:code": {
              "variant": "tilde-fence"
            },
            "naver-se4:image": {
              "variant": "linked-image"
            }
          }
        }
      }`),
    )

    expect(sanitized.blockOutputs?.defaults).toEqual({
      "naver-se4:image": {
        variant: "linked-image",
      },
    })
  })

  it("drops unsupported frontmatter field keys from persisted options", () => {
    const sanitized = sanitizePersistedExportOptions(
      JSON.parse(`{
        "frontmatter": {
          "fields": {
            "title": false,
            "visibility": true,
            "video": true,
            "removedField": true
          },
          "aliases": {
            "title": "postTitle",
            "visibility": "visible",
            "video": "videos",
            "removedField": "removed"
          }
        }
      }`),
    )

    expect(sanitized.frontmatter?.fields).toEqual({
      title: false,
    })
    expect(sanitized.frontmatter?.aliases).toEqual({
      title: "postTitle",
    })
  })

  it("ignores legacy unsupported block representative-case selections", () => {
    const options = cloneExportOptions(
      JSON.parse(`{
        "unsupportedBlockCases": {
          "se2-inline-gif-video": {
            "candidateId": "poster-image-only",
            "confirmed": true
          },
          "se3-oglink-og_bSize": {
            "candidateId": "not-a-real-candidate",
            "confirmed": true
          }
        }
      }`),
    )

    expect(Object.hasOwn(options, "unsupportedBlockCases")).toBe(false)
  })

  it("merges formula params with parser block option defaults", () => {
    const options = cloneExportOptions({
      blockOutputs: {
        defaults: {
          "naver-se4:formula": {
            variant: "wrapper",
            params: {
              inlineWrapper: "\\(...\\)",
            },
          },
        },
      },
    })

    const selection = resolveBlockOutputSelection({
      blockType: "formula",
      blockOutputs: options.blockOutputs,
      selectionKey: "naver-se4:formula",
    })

    expect(selection.params?.inlineWrapper).toBe("\\(...\\)")
    expect(selection.params?.blockWrapper).toBe("$$")
  })

  it("returns field name when alias is blank", () => {
    expect(
      getFrontmatterExportKey({
        fieldName: "title",
        alias: "  ",
      }),
    ).toBe("title")
  })

  it("forces local downloads for download-and-upload mode", () => {
    const options = cloneExportOptions({
      assets: {
        imageHandlingMode: "download-and-upload",
        downloadImages: false,
        downloadThumbnails: false,
      },
    })

    expect(options.assets.imageHandlingMode).toBe("download-and-upload")
    expect(options.assets.downloadImages).toBe(true)
    expect(options.assets.downloadThumbnails).toBe(true)
  })

  it("drops removed legacy image content mode while keeping upload mode", () => {
    const legacyOptions = JSON.parse(`{
      "assets": {
        "imageHandlingMode": "download-and-upload",
        "downloadImages": false,
        "imageContentMode": "base64"
      }
    }`) as Parameters<typeof cloneExportOptions>[0]

    const options = cloneExportOptions(legacyOptions)

    expect(options.assets.imageHandlingMode).toBe("download-and-upload")
    expect(options.assets.downloadImages).toBe(true)
    expect(Object.hasOwn(options.assets, "imageContentMode")).toBe(false)
  })

  it("removes category ids from persisted options while keeping other scope fields", () => {
    const sanitized = sanitizePersistedExportOptions({
      scope: {
        categoryIds: [101, 202],
        categoryMode: "exact-selected",
        dateFrom: "2026-04-01",
        dateTo: null,
      },
      structure: {
        groupByCategory: false,
      },
    })

    expect(sanitized.scope).toEqual({
      categoryMode: "exact-selected",
      dateFrom: "2026-04-01",
      dateTo: null,
    })
    expect(sanitized.structure).toEqual({
      groupByCategory: false,
    })
  })

  it("keeps new slug structure fields in persisted options", () => {
    const sanitized = sanitizePersistedExportOptions({
      structure: {
        slugStyle: "kebab",
        slugWhitespace: "dash",
        postFolderNameMode: "custom-template",
        postFolderNameCustomTemplate: "{date}-{slug}",
      },
    })

    expect(sanitized.structure).toEqual({
      slugStyle: "kebab",
      slugWhitespace: "dash",
      postFolderNameMode: "custom-template",
      postFolderNameCustomTemplate: "{date}-{slug}",
    })
  })

  it("drops legacy unsupported block case selections from persisted options", () => {
    const sanitized = sanitizePersistedExportOptions(
      JSON.parse(`{
        "unsupportedBlockCases": {
          "se3-horizontal-line-default": {
            "candidateId": "html-default-hr",
            "confirmed": true
          }
        }
      }`),
    )

    expect(Object.hasOwn(sanitized, "unsupportedBlockCases")).toBe(false)
  })

  it("infers legacy slug whitespace from stored slug style", () => {
    expect(
      cloneExportOptions({
        structure: {
          slugStyle: "kebab",
        },
      }).structure.slugWhitespace,
    ).toBe("dash")

    expect(
      cloneExportOptions({
        structure: {
          slugStyle: "keep-title",
        },
      }).structure.slugWhitespace,
    ).toBe("keep-space")
  })

  it("detects invalid alias format and collisions only for enabled fields", () => {
    const errors = validateFrontmatterAliases({
      enabled: true,
      fields: {
        title: true,
        source: true,
        blogId: false,
        logNo: false,
        publishedAt: false,
        category: false,
        categoryPath: false,
        tags: false,
        thumbnail: false,
        exportedAt: false,
        assetPaths: false,
      },
      aliases: {
        title: "9bad",
        source: "dup",
        blogId: "",
        logNo: "",
        publishedAt: "",
        category: "",
        categoryPath: "",
        tags: "",
        thumbnail: "",
        exportedAt: "",
        assetPaths: "dup",
      },
    })

    expect(errors).toEqual([
      "title alias는 영문자 또는 _로 시작하고 영문자, 숫자, -, _만 사용할 수 있습니다.",
    ])
  })

  it("exposes label, description and default alias metadata for each field", () => {
    expect(frontmatterFieldMeta.title).toEqual({
      label: "title",
      description: "글 제목을 기록합니다.",
      defaultAlias: "title",
    })
    expect(frontmatterFieldMeta.assetPaths.defaultAlias).toBe("assetPaths")
  })

  it("exposes option descriptions for newly added export controls", () => {
    expect(optionDescriptions["structure-groupByCategory"]).toContain("카테고리 경로")
    expect(optionDescriptions["structure-slugStyle"]).toContain("snake_case")
    expect(optionDescriptions["structure-slugStyle"]).toContain("카테고리")
    expect(optionDescriptions["structure-slugWhitespace"]).toContain("공백")
    expect(optionDescriptions["structure-slugWhitespace"]).toContain("카테고리")
    expect(optionDescriptions["structure-postFolderNameMode"]).toContain("커스텀 템플릿")
    expect(optionDescriptions["structure-postFolderNameCustomTemplate"]).toContain("{slug}")
    expect(optionDescriptions["assets-imageHandlingMode"]).toContain("업로드")
    expect(optionDescriptions["assets-compressionEnabled"]).toContain("압축")
    expect(optionDescriptions["assets-downloadFailureMode"]).toContain("원본 URL")
    expect(optionDescriptions["assets-stickerAssetMode"]).toContain("네이버 스티커")
    expect(optionDescriptions["links-sameBlogPostMode"]).toContain("같은 블로그")
    expect(optionDescriptions["links-sameBlogPostCustomUrlTemplate"]).toContain("{slug}")
    expect(optionDescriptions["links-sameBlogPostCustomUrlTemplate"]).toContain("{category}")
    expect(optionDescriptions["links-sameBlogPostCustomUrlTemplate"]).toContain("{title}")
    expect(optionDescriptions["links-sameBlogPostCustomUrlTemplate"]).toContain("{date}")
    expect(optionDescriptions["links-sameBlogPostCustomUrlTemplate"]).toContain("{YYYY}")
    expect(optionDescriptions["structure-postFolderNameCustomTemplate"]).toContain("{MM}")
    expect(optionDescriptions["assets-imageContentMode"]).toBeUndefined()
    expect(optionDescriptions["markdown-linkStyle"]).toBeUndefined()
    expect(optionDescriptions["assets-assetPathMode"]).toBeUndefined()
  })
})
