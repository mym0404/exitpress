import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { NaverBlogSE2Editor } from "@exitpress/engine/parsing/naver-blog/se2/NaverBlogSe2Editor.js"
import { NaverBlogSE3Editor } from "@exitpress/engine/parsing/naver-blog/se3/NaverBlogSe3Editor.js"
import { NaverBlogSE4Editor } from "@exitpress/engine/parsing/naver-blog/se4/NaverBlogSe4Editor.js"
import { load } from "cheerio"
import { expect } from "vitest"

import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { ParsedBlock, ParsedPost } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"

const testOptions = defaultExportOptions()

const allEditorTypes = ["naver-se2", "naver-se3", "naver-se4"] as const
type EditorType = (typeof allEditorTypes)[number]

type ParserTestOptions = {
  blockOutputs?: ExportOptions["blockOutputs"]
}

const createParserOptions = ({ blockOutputs }: ParserTestOptions = {}) => ({
  blockOutputs: blockOutputs ?? testOptions.blockOutputs,
})

const se2Editor = new NaverBlogSE2Editor()
const se3Editor = new NaverBlogSE3Editor()
const se4Editor = new NaverBlogSE4Editor()

const sourceUrl = "https://blog.naver.com/mym0404/123456789"

const toLegacyOriginalSourceUrl = (block: ParsedBlock) => {
  const sourceUrl = block.props.url

  if (typeof sourceUrl !== "string") {
    return null
  }

  if (sourceUrl.includes("mblogthumb-phinf.pstatic.net")) {
    if (sourceUrl.includes("source-only") || block.props.alt === "sample gif") {
      return null
    }

    if (!sourceUrl.includes(".gif?type=w")) {
      return null
    }

    return sourceUrl
      .replace("mblogthumb-phinf.pstatic.net", "mblogvideo-phinf.pstatic.net")
      .replace(/\?type=w\d+/, "?type=mp4w800")
  }

  if (sourceUrl.includes("fallback.png") || sourceUrl.includes("preview966_544")) {
    return null
  }

  return block.blockId.startsWith("naver-se4:") ? sourceUrl : null
}

const formatLegacyLink = ({ title, url }: { title: unknown; url: unknown }) =>
  `[${String(title || url)}](${String(url)})`

const toLegacyDescriptionParagraphs = (description: unknown, url: unknown) =>
  String(description ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== url && !/^[()]+$/.test(line))
    .map((text) => ({ type: "paragraph", text }))

const toLegacyBlock = (block: ParsedBlock) => {
  const blockType = block.blockId.split(":").at(-1) ?? block.blockId

  if ("code" in block.props) {
    return {
      type: "code",
      language: block.props.language ?? null,
      code: block.props.code,
    }
  }

  if ("formula" in block.props) {
    return {
      type: "formula",
      formula: block.props.formula,
      display: block.props.display,
    }
  }

  if ("rows" in block.props) {
    const rows = Array.isArray(block.props.rows)
      ? block.props.rows.map((row) =>
          Array.isArray(row)
            ? row
                .map((cell) =>
                  cell && typeof cell === "object" && "text" in cell && cell.text === " "
                    ? { ...cell, text: "" }
                    : cell,
                )
                .filter(
                  (cell, index, cells) =>
                    index < cells.length - 1 ||
                    !(
                      cell &&
                      typeof cell === "object" &&
                      "html" in cell &&
                      cell.html === "" &&
                      "text" in cell &&
                      cell.text === ""
                    ),
                )
            : row,
        )
      : block.props.rows

    return {
      type: "table",
      rows,
      html: block.props.html,
      complex: block.props.complex,
    }
  }

  if ("level" in block.props) {
    return {
      type: "heading",
      level: block.props.level,
      text: block.props.text,
    }
  }

  if ("fileName" in block.props && "fileUrl" in block.props) {
    return {
      type: "paragraph",
      text: formatLegacyLink({
        title: `${String(block.props.fileName)}${String(block.props.fileExtension ?? "")}`,
        url: block.props.fileUrl,
      }),
    }
  }

  if ("places" in block.props) {
    const places = Array.isArray(block.props.places) ? block.props.places : []

    return places.flatMap((place) => {
      if (!place || typeof place !== "object") {
        return []
      }

      const name = "name" in place ? place.name : ""
      const url = "url" in place ? place.url : ""
      const address = "address" in place ? place.address : ""

      return [
        {
          type: "paragraph",
          text: formatLegacyLink({ title: name, url }),
        },
        ...(address ? [{ type: "paragraph", text: String(address) }] : []),
      ]
    })
  }

  if (blockType === "schedule") {
    return [
      {
        type: "paragraph",
        text: block.props.url
          ? formatLegacyLink({ title: block.props.title, url: block.props.url })
          : String(block.props.title),
      },
      ...(block.props.startAt ? [{ type: "paragraph", text: String(block.props.startAt) }] : []),
    ]
  }

  if (
    ["linkCard", "material", "oembed", "talkTalk"].includes(blockType) &&
    "title" in block.props &&
    "url" in block.props
  ) {
    return [
      {
        type: "paragraph",
        text: formatLegacyLink({ title: block.props.title, url: block.props.url }),
      },
      ...(block.props.thumbnailUrl
        ? []
        : toLegacyDescriptionParagraphs(block.props.description, block.props.url)),
    ]
  }

  if ("images" in block.props) {
    return {
      type: blockType,
      images: block.props.images,
    }
  }

  if (blockType === "video" && "title" in block.props && "url" in block.props) {
    return {
      type: "video",
      video: {
        title: block.props.title,
        thumbnailUrl: block.props.thumbnailUrl,
        sourceUrl: block.props.url,
        vid: null,
        inkey: null,
        width: block.props.width,
        height: block.props.height,
      },
    }
  }

  if ("url" in block.props && block.assets?.url?.role === "image") {
    return {
      type: "image",
      image: {
        sourceUrl: block.props.url,
        originalSourceUrl: toLegacyOriginalSourceUrl(block),
        alt: block.props.alt,
        caption: block.props.caption ?? null,
        mediaKind: block.blockId.endsWith(":sticker") ? "sticker" : "image",
      },
    }
  }

  if (block.blockId.endsWith(":divider")) {
    return { type: "divider" }
  }

  if (block.blockId.endsWith(":quote") || block.blockId.endsWith(":mrBlog")) {
    return {
      type: "quote",
      text: block.props.text,
    }
  }

  return {
    type: "paragraph",
    text: block.props.text,
  }
}

export const toLegacyBlocks = (blocks: ParsedBlock[]) => {
  const legacyEntries = blocks.flatMap((block) => {
    const legacy = toLegacyBlock(block)
    const values = Array.isArray(legacy) ? legacy : [legacy]

    return values.map((value) => ({
      block,
      value,
    }))
  })
  const legacyBlocks = legacyEntries.map((entry) => entry.value)

  return legacyBlocks.flatMap((block, index) => {
    if (block.type !== "image") {
      return [block]
    }

    const originalBlock = legacyEntries[index]?.block

    if (
      originalBlock &&
      index > 0 &&
      legacyEntries[index - 1]?.block.blockId === originalBlock.blockId
    ) {
      return []
    }

    let consecutiveImageBlockCount = 0

    while (
      legacyEntries[index + consecutiveImageBlockCount]?.block.blockId === originalBlock?.blockId &&
      legacyBlocks[index + consecutiveImageBlockCount]?.type === "image"
    ) {
      consecutiveImageBlockCount += 1
    }

    if (!originalBlock) {
      return [block]
    }

    if (!originalBlock.blockId.endsWith(":imageGroup") && consecutiveImageBlockCount < 2) {
      return [block]
    }

    const imageBlockCount = Math.max(1, consecutiveImageBlockCount)

    return [
      {
        type: "imageGroup",
        images: legacyBlocks
          .slice(index, index + imageBlockCount)
          .flatMap((candidate) =>
            candidate.type === "image" && "image" in candidate ? [candidate.image] : [],
          ),
      },
    ]
  })
}

const toLegacyParsedPost = (parsedPost: ParsedPost) => ({
  ...parsedPost,
  blocks: toLegacyBlocks(parsedPost.blocks),
})

export const createSe4ModuleScript = (module: Record<string, unknown>) =>
  `<script class="__se_module_data" data-module-v2='${JSON.stringify(module)}'></script>`

export const parseSe2Blocks = (content: string, options?: ParserTestOptions) =>
  toLegacyParsedPost(
    se2Editor.parse({
      $: load(`<div id="viewTypeSelector">${content}</div>`),
      tags: ["classic", "classic", "archive"],
      options: createParserOptions(options),
    }),
  )

const createSe3Html = (...components: string[]) =>
  `<div id="viewTypeSelector"><div class="se_component_wrap sect_dsc">${components.join("")}</div></div>`

export const parseSe3Blocks = (...components: string[]) =>
  toLegacyParsedPost(
    se3Editor.parse({
      $: load(createSe3Html(...components)),
      tags: ["daily", "daily", "archive"],
      options: createParserOptions(),
    }),
  )

export const parseSe3BlocksWithOptions = ({
  blockOutputs,
  components,
}: {
  blockOutputs: ExportOptions["blockOutputs"]
  components: string[]
}) =>
  toLegacyParsedPost(
    se3Editor.parse({
      $: load(createSe3Html(...components)),
      tags: ["daily", "daily", "archive"],
      options: createParserOptions({ blockOutputs }),
    }),
  )

export const parseSe4Blocks = (...components: string[]) =>
  toLegacyParsedPost(
    se4Editor.parse({
      $: load(`<div id="viewTypeSelector">${components.join("")}</div>`),
      sourceUrl,
      tags: ["algo", "algo", "math"],
      options: createParserOptions(),
    }),
  )

export const parseSe4BlocksWithOptions = ({
  blockOutputs,
  components,
}: {
  blockOutputs: ExportOptions["blockOutputs"]
  components: string[]
}) =>
  toLegacyParsedPost(
    se4Editor.parse({
      $: load(`<div id="viewTypeSelector">${components.join("")}</div>`),
      sourceUrl,
      tags: ["algo", "algo", "math"],
      options: createParserOptions({ blockOutputs }),
    }),
  )

const editorDefinitions: Record<EditorType, () => BlockTemplateDefinition[]> = {
  "naver-se2": () => se2Editor.getBlockTemplateDefinitions(),
  "naver-se3": () => se3Editor.getBlockTemplateDefinitions(),
  "naver-se4": () => se4Editor.getBlockTemplateDefinitions(),
}

const getBlockTemplateDefinition = ({
  editorType,
  blockId,
}: {
  editorType: EditorType
  blockId: string
}) => {
  const selectionKey = `${editorType}:${blockId}`
  const definition = editorDefinitions[editorType]().find(
    (candidate) => candidate.key === selectionKey,
  )

  if (!definition) {
    throw new Error(`Missing parser block template definition: ${selectionKey}`)
  }

  return definition
}

export const expectBlockTemplateDefinition = ({
  editorType,
  blockId,
  parse,
  blockIndex = 0,
}: {
  editorType: EditorType
  blockId: string
  parse: (blockOutputs: ExportOptions["blockOutputs"]) => { blocks: unknown[] }
  blockIndex?: number
}) => {
  const definition = getBlockTemplateDefinition({ editorType, blockId })

  expect(definition.presets.length).toBeGreaterThanOrEqual(1)
  expect(definition.props).toEqual(expect.any(Object))

  const parsed = parse({
    templates: {},
  })

  expect(parsed.blocks[blockIndex]).toEqual(expect.any(Object))
}
