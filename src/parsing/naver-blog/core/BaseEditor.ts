import type { CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type {
  AstBlock,
  EditorBlockOutputDefinition,
  OutputOption,
  ParsedPost,
  ParserBlockOptions,
} from "../../../domain/ast/Types.js"
import type { ExportOptions } from "../../../domain/export-options/Types.js"
import type { UnknownRecord } from "../../../shared/object/UnknownRecord.js"

import type {
  BaseBlock,
  ParserBlockContext,
  ParserBlockConvertContext,
  ParserBlockStoryGroup,
} from "./BaseBlock.js"
import type { ParserBlockInspection, ParserBlockSourceEvidence } from "./BaseEditorTypes.js"

import { resolveBlockOutputSelection } from "../../../domain/export-options/BlockOutputSelection.js"

import { LeafBlock } from "./BaseBlock.js"
import { inspectEditorBlocks } from "./BaseEditorInspection.js"
import {
  applyBlockOutputSelection,
  createBlockOutputSelectionKey,
} from "./BaseEditorOutputSelection.js"
import { parserStoryFixtures } from "./ParserStoryFixtures.js"

const describeParserNode = ({ $node, node, moduleType }: ParserBlockContext) => {
  const tagName = node.type === "tag" ? node.tagName.toLowerCase() : node.type
  const className = $node.attr("class")
  const parts = [tagName]

  if (className) {
    parts.push(`class="${className}"`)
  }

  if (moduleType) {
    parts.push(`moduleType="${moduleType}"`)
  }

  return parts.join(" ")
}

export type BaseEditorParseInput = {
  $: CheerioAPI
  sourceUrl?: string
  tags: string[]
  options: Pick<ExportOptions, "blockOutputs"> & {
    resolveLinkUrl?: (url: string) => string
  }
  captureBlockEvidence?: (evidence: ParserBlockSourceEvidence) => void
}

export type ParserBlockStoryDefinition = {
  storyKey: string
  editorType: string
  editorLabel: string
  blockIndex: number
  blockId: string
  blockLabel: string
  group: ParserBlockStoryGroup
  sourceUrl: string
  inspectPath: string
  inputHtml: string
  screenshotSrc: string
  outputOptions: OutputOption[]
}

const auxiliaryParserBlockIds = new Set([
  "comment",
  "container",
  "documentTitle",
  "lineBreak",
  "spacer",
  "style",
])

const defaultParserStorySourceUrl = "https://blog.naver.com/mym0404/223034929697"
const toParserStoryKey = ({
  editorType,
  blockIndex,
  blockId,
}: {
  editorType: string
  blockIndex: number
  blockId: string
}) => `${editorType}-${blockIndex}-${blockId}`.replace(/[^A-Za-z0-9_-]/g, "-")

const toParserStoryScreenshotSrc = ({
  editorType,
  blockIndex,
  blockId,
}: {
  editorType: string
  blockIndex: number
  blockId: string
}) => `${toParserStoryKey({ editorType, blockIndex, blockId })}.png`

const escapeJsonAttribute = (value: UnknownRecord) => JSON.stringify(value).replaceAll("'", "&#39;")

const createSe4ModuleScript = (module: UnknownRecord) =>
  `<script class="__se_module_data" data-module-v2='${escapeJsonAttribute(module)}'></script>`

const wrapSe4StoryHtml = (componentHtml: string) =>
  `<div id="viewTypeSelector">\n${componentHtml}\n</div>`

const wrapSe3StoryHtml = (componentHtml: string) =>
  `<div id="viewTypeSelector">\n  <div class="se_component_wrap sect_dsc">\n${componentHtml}\n  </div>\n</div>`

const wrapSe2StoryHtml = (contentHtml: string) =>
  `<div id="viewTypeSelector">${contentHtml.trim()}</div>`

const se4ImageLinkHtml = ({
  sourceUrl = "https://example.com/image.png",
  alt = "diagram",
}: {
  sourceUrl?: string
  alt?: string
} = {}) =>
  `<a class="se-module-image-link" data-linkdata='{"src":"${sourceUrl}"}'><img src="${sourceUrl}" alt="${alt}" /></a>`

const createSe4StoryHtml = ({
  blockIndex,
  blockLabel,
}: {
  blockIndex: number
  blockLabel: string
}) => {
  if (blockIndex === 0) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-documentTitle">
        <div class="se-module-text">Document title</div>
      </div>
    `)
  }

  if (blockIndex === 1) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-math">
        ${createSe4ModuleScript({ type: "v2_formula", data: { latex: "$x^2 + y^2 = z^2$" } })}
      </div>
    `)
  }

  if (blockIndex === 2) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-code">
        ${createSe4ModuleScript({ type: "v2_code" })}
        <pre class="__se_code_view language-typescript">const value = 1</pre>
      </div>
    `)
  }

  if (blockIndex === 3) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-oglink">
        ${createSe4ModuleScript({ type: "v2_oglink" })}
        <a class="se-oglink-info" href="https://example.com/article">
          <strong class="se-oglink-title">Example article</strong>
          <p class="se-oglink-summary">Article summary</p>
        </a>
        <a class="se-oglink-thumbnail" href="https://example.com/article">
          <img class="se-oglink-thumbnail-resource" src="https://example.com/thumb.png" alt="" />
        </a>
      </div>
    `)
  }

  if (blockIndex === 4) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-file se-l-default">
        ${createSe4ModuleScript({ type: "v2_file", data: { link: "https://example.com/file.pdf" } })}
        <span class="se-file-name">file</span><span class="se-file-extension">.pdf</span>
        <a class="se-file-save-button __se_link" href="https://example.com/file.pdf">download</a>
      </div>
    `)
  }

  if (blockIndex === 5) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-video">
        ${createSe4ModuleScript({
          type: "v2_video",
          data: {
            mediaMeta: { title: "Demo video" },
            thumbnail: "https://example.com/video-thumb.png",
            vid: "vid",
            inkey: "inkey",
            width: "640",
            height: "360",
          },
        })}
      </div>
    `)
  }

  if (blockIndex === 6) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-oembed">
        ${createSe4ModuleScript({
          type: "v2_oembed",
          data: {
            inputUrl: "https://example.com/embed",
            title: "Embedded content",
            description: "Embed summary",
            thumbnailUrl: "https://example.com/embed-thumb.png",
          },
        })}
      </div>
    `)
  }

  if (blockIndex === 7) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-placesMap">
        ${createSe4ModuleScript({
          type: "v2_map",
          data: { places: [{ name: "MJ Studio", address: "Seoul" }] },
        })}
      </div>
    `)
  }

  if (blockIndex === 8) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-schedule">
        ${createSe4ModuleScript({ type: "v2_schedule", data: { startAt: "2026-06-04" } })}
        <strong class="se-schedule-title-text">Launch day</strong>
        <a class="se-schedule-url" href="https://example.com/schedule">schedule</a>
      </div>
    `)
  }

  if (blockIndex === 9) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-talktalk">
        <a class="se-module-talktalk" href="https://talk.naver.com/example">
          <span class="se-talktalk-banner-text">TalkTalk chat</span>
        </a>
      </div>
    `)
  }

  if (blockIndex === 10) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-table">
        ${createSe4ModuleScript({ type: "v2_table" })}
        <table><tr><th>col</th></tr><tr><td>value</td></tr></table>
      </div>
    `)
  }

  if (blockIndex === 11 || blockIndex === 12) {
    return wrapSe4StoryHtml(`
      <div class="se-component ${blockIndex === 11 ? "se-imageStrip" : "se-imageGroup"}">
        ${blockIndex === 12 ? createSe4ModuleScript({ type: "v2_imageGroup" }) : ""}
        ${se4ImageLinkHtml({ sourceUrl: "https://example.com/image-1.png", alt: "first" })}
        ${se4ImageLinkHtml({ sourceUrl: "https://example.com/image-2.png", alt: "second" })}
      </div>
    `)
  }

  if (blockIndex === 13) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-sticker">
        <a class="__se_sticker_link" data-linkdata='{"src":"https://example.com/sticker.png"}'>
          <img class="se-sticker-image" src="https://example.com/sticker-preview.png" alt="" />
        </a>
      </div>
    `)
  }

  if (blockIndex === 14) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-image">
        ${se4ImageLinkHtml()}
        <p class="se-image-caption">caption</p>
      </div>
    `)
  }

  if (blockIndex === 15) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-wrappingParagraph se-l-inner-left">
        <div class="se-component-slot-float">${se4ImageLinkHtml()}</div>
        <div class="se-component-slot">
          <div class="se-module-text"><p class="se-text-paragraph">Wrapped paragraph</p></div>
        </div>
      </div>
    `)
  }

  if (blockIndex === 16) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-sectionTitle">
        <div class="se-module-text"><span>Section title</span></div>
      </div>
    `)
  }

  if (blockIndex === 17) {
    return wrapSe4StoryHtml(`<div class="se-component se-horizontalLine"></div>`)
  }

  if (blockIndex === 18) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-quotation">
        <blockquote class="se-quotation-container"><p>Quoted line</p></blockquote>
      </div>
    `)
  }

  if (blockIndex === 19) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-mrBlog">
        <p class="se-mrBlog-from">블로그씨</p>
        <p class="se-mrBlog-question">오늘의 질문</p>
      </div>
    `)
  }

  if (blockIndex === 20) {
    return wrapSe4StoryHtml(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <div class="se-module-text"><p class="se-text-paragraph">Paragraph example</p></div>
      </div>
    `)
  }

  return wrapSe4StoryHtml(`
    <div class="se-component se-material">
      <a class="se-module-material" href="https://example.com/material" data-linkdata='{"link":"https://example.com/material"}'>
        <span class="se-material-title">${blockLabel}</span>
        <span class="se-material-detail">
          <span class="se-material-detail-title">type</span>
          <span class="se-material-detail-description">reference</span>
        </span>
      </a>
    </div>
  `)
}

const createSe3StoryHtml = ({ blockIndex }: { blockIndex: number }) => {
  const component = (className: string, body: string, after = "") =>
    wrapSe3StoryHtml(`    <div class="se_component ${className}">${body}</div>${after}`)

  if (blockIndex === 0) {
    return component("se_documentTitle", `<div class="se_textarea">Document title</div>`)
  }

  if (blockIndex === 1) {
    return component("se_horizontalLine", "")
  }

  if (blockIndex === 2) {
    return component("se_table", `<table><tr><th>col</th></tr><tr><td>value</td></tr></table>`)
  }

  if (blockIndex === 3) {
    return component("se_quote", `<blockquote><p>Quoted line</p></blockquote>`)
  }

  if (blockIndex === 4) {
    return component("se_code", `<pre>const value = 1</pre>`)
  }

  if (blockIndex === 5) {
    return component(
      "se_oglink",
      `
        <a class="se_og_box" href="https://example.com/article" data-linkdata='{"link":"https://example.com/article"}'>
          <span class="se_og_tit">Example article</span>
          <span class="se_og_desc">Article summary</span>
          <span class="se_og_thumb"><img src="https://example.com/thumb.png" alt="" /></span>
        </a>
      `,
    )
  }

  if (blockIndex === 6 || blockIndex === 7) {
    return component(
      `se_map ${blockIndex === 6 ? "default" : "map_text"}`,
      `
        <div class="se_title"><span>MJ Studio</span></div>
        <div class="se_address">Seoul</div>
      `,
    )
  }

  if (blockIndex === 8) {
    return component(
      "se_video default",
      `
        <div class="se_mediaArea" id="video1"></div>
        <div class="se_mediaCaption"><div class="se_textarea">Demo video</div></div>
      `,
      `<script class="__se_module_data" data-module='{"id":"video1","data":{"vid":"vid","inkey":"inkey","width":640,"height":360}}'></script>`,
    )
  }

  if (blockIndex === 9) {
    return component(
      "se_file default",
      `<a class="se_name_area" href="https://example.com/file.pdf"><span class="se_name">file.pdf</span></a>`,
    )
  }

  if (blockIndex === 10) {
    return component(
      "se_subjectMatter subjectMatter_book",
      `
        <img class="subjectMatter_thumb" src="https://example.com/book.png" alt="book" />
        <span class="subjectMatter_title_text">Book title</span>
        <span class="subjectMatter_info_item">
          <span class="subjectMatter_info_title">author</span>
          <span class="subjectMatter_info_text">MJ</span>
        </span>
        <a class="subjectMatter_item_link" href="https://example.com/book">상세보기</a>
      `,
    )
  }

  if (blockIndex === 11) {
    return component(
      "se_image",
      `<img class="se_mediaImage" data-lazy-src="https://example.com/image.png" alt="diagram" />`,
    )
  }

  return component("se_text", `<div class="se_textarea">Paragraph example</div>`)
}

const createSe2StoryHtml = ({ blockIndex }: { blockIndex: number }) => {
  const storyHtmlByIndex: Record<number, string> = {
    0: "<style>.post{color:red}</style>",
    1: "<!-- naver comment -->",
    2: "plain legacy text",
    3: `
      <div s_type="db" s_subtype="book">
        <img src="https://example.com/book.png" alt="book" />
        <strong class="tit">Book title</strong>
        <dl><dt>author</dt><dd>MJ</dd></dl>
        <a class="link" href="https://example.com/book">리뷰보기</a>
      </div>
    `,
    4: "<table><tr><th>col</th></tr><tr><td>value</td></tr></table>",
    5: "<div><hr /></div>",
    6: "<hr />",
    7: "<br />",
    8: "<blockquote><p>Quoted line</p></blockquote>",
    9: "<h2>Section title</h2>",
    10: "<pre>const value = 1</pre>",
    11: `<video class="fx _postImage _gifmp4" src="https://example.com/gif-preview.mp4" data-gif-url="https://example.com/gif.gif" alt="gif"></video>`,
    12: `
      <div>
        <iframe class="poll_iframe" src="https://m.blog.naver.com/Poll.naver?pollKey=sample" title="투표"></iframe>
      </div>
    `,
    13: `<iframe src="https://serviceapi.nmv.naver.com/flash/convertIframeTag.nhn?vid=vid" title="Demo video" width="640" height="360"></iframe>`,
    14: `<img class="fx _postImage" src="https://example.com/image.png" alt="diagram" />`,
    15: "<p><br /></p>",
    16: "<div><strong>Fallback</strong> html</div>",
  }

  return wrapSe2StoryHtml(storyHtmlByIndex[blockIndex] ?? "<p>Paragraph example</p>")
}

const createDefaultStoryHtml = ({
  editorType,
  blockLabel,
  blockIndex,
}: {
  editorType: string
  blockLabel: string
  blockIndex: number
}) =>
  editorType === "naver-se4"
    ? createSe4StoryHtml({ blockIndex, blockLabel })
    : editorType === "naver-se3"
      ? createSe3StoryHtml({ blockIndex })
      : createSe2StoryHtml({ blockIndex })

export abstract class BaseEditor {
  abstract readonly type: string
  abstract readonly label: string

  protected readonly supportedBlocks: readonly BaseBlock[] = []

  abstract canParse(html: string): boolean

  abstract parse(input: BaseEditorParseInput): ParsedPost

  inspect(_input: BaseEditorParseInput): ParserBlockInspection[] {
    return []
  }

  getBlockOutputDefinitions(): EditorBlockOutputDefinition[] {
    const definitions: EditorBlockOutputDefinition[] = []
    const seenKeys = new Set<string>()

    this.supportedBlocks.forEach((block) => {
      const outputOptions = block.outputOptions

      if (!block.id || !outputOptions || outputOptions.length < 2) {
        return
      }

      const key = this.createBlockOutputSelectionKey(block.id)

      if (seenKeys.has(key)) {
        return
      }

      seenKeys.add(key)
      definitions.push({
        key,
        editorType: this.type,
        editorLabel: this.label,
        blockId: block.id,
        blockLabel: block.label,
        options: [...outputOptions],
      })
    })

    return definitions
  }

  getParserBlockStoryDefinitions(): ParserBlockStoryDefinition[] {
    return this.supportedBlocks.map((block, blockIndex) => {
      const group =
        block.story?.group ??
        (auxiliaryParserBlockIds.has(block.id) ? "auxiliary" : ("output" as const))

      const storyKey = toParserStoryKey({
        editorType: this.type,
        blockIndex,
        blockId: block.id,
      })
      const fixture = parserStoryFixtures[storyKey]

      return {
        storyKey,
        screenshotSrc:
          block.story?.screenshotSrc ??
          toParserStoryScreenshotSrc({
            editorType: this.type,
            blockIndex,
            blockId: block.id,
          }),
        editorType: this.type,
        editorLabel: this.label,
        blockIndex,
        blockId: block.id,
        blockLabel: block.label,
        group,
        sourceUrl: block.story?.sourceUrl ?? fixture?.sourceUrl ?? defaultParserStorySourceUrl,
        inspectPath: block.story?.inspectPath ?? fixture?.inspectPath ?? "0",
        inputHtml:
          block.story?.inputHtml ??
          fixture?.inputHtml ??
          createDefaultStoryHtml({
            editorType: this.type,
            blockLabel: block.label,
            blockIndex,
          }),
        outputOptions: [...(block.outputOptions ?? [])],
      }
    })
  }

  private createBlockOutputSelectionKey(blockId: string) {
    return createBlockOutputSelectionKey({
      editorType: this.type,
      blockId,
    })
  }

  protected inspectBlocks({
    $,
    nodes,
    tags,
    options,
    sourceUrl,
    moduleContext,
  }: {
    $: CheerioAPI
    nodes: AnyNode[]
    tags: string[]
    options: ParserBlockOptions
    sourceUrl?: string
    moduleContext?: (node: AnyNode) => {
      moduleData?: UnknownRecord | null
      moduleType?: string | null
      hasQuote?: boolean
    }
  }) {
    return inspectEditorBlocks({
      $,
      nodes,
      tags,
      options,
      sourceUrl,
      supportedBlocks: this.supportedBlocks,
      moduleContext,
    })
  }

  protected runBlocks({
    $,
    nodes,
    tags,
    options,
    sourceUrl,
    moduleContext,
    captureBlockEvidence,
  }: {
    $: CheerioAPI
    nodes: AnyNode[]
    tags: string[]
    options: ParserBlockOptions
    sourceUrl?: string
    moduleContext?: (node: AnyNode) => {
      moduleData?: UnknownRecord | null
      moduleType?: string | null
      hasQuote?: boolean
    }
    captureBlockEvidence?: (evidence: ParserBlockSourceEvidence) => void
  }) {
    const createBlockContext = (node: AnyNode): ParserBlockContext => ({
      $,
      $node: $(node),
      node,
      sourceUrl,
      tags,
      options,
      matchLeafNode,
      ...moduleContext?.(node),
    })

    const matchLeafNode = (node: AnyNode) => {
      const context = createBlockContext(node)

      return this.supportedBlocks.some(
        (supportedBlock) => supportedBlock instanceof LeafBlock && supportedBlock.match(context),
      )
    }

    const matchNode = (node: AnyNode, path: string): AstBlock[] => {
      const context = createBlockContext(node)
      const block = this.supportedBlocks.find((supportedBlock) => supportedBlock.match(context))

      if (!block) {
        throw new Error(`파싱 가능한 ${this.type} block이 없습니다: ${describeParserNode(context)}`)
      }

      const outputOptions = block.outputOptions
      const firstOutputOption = outputOptions?.[0]
      const outputSelection =
        block.id && outputOptions && outputOptions.length >= 2 && firstOutputOption
          ? resolveBlockOutputSelection({
              blockType: firstOutputOption.preview.type,
              outputOptions,
              blockOutputs: options.blockOutputs,
              selectionKey: this.createBlockOutputSelectionKey(block.id),
            })
          : undefined
      const convertContext = {
        ...context,
        path,
        outputSelection,
        matchNode,
      } satisfies ParserBlockConvertContext

      return block.convert(convertContext).map((parsedBlock) => {
        const blockWithSelection = applyBlockOutputSelection({
          editorType: this.type,
          parsedBlock,
          parserBlock: block,
          options,
        })

        captureBlockEvidence?.({
          path,
          block: blockWithSelection,
          blockType: blockWithSelection.type,
          parserBlockId: block.id,
          parserBlockLabel: block.label,
        })

        return blockWithSelection
      })
    }

    return nodes.flatMap((node, index) => matchNode(node, String(index)))
  }
}
