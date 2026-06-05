import { load } from "cheerio"
import { expect } from "vitest"

import type { ExportOptions } from "../../src/domain/export-options/Types.js"
import type { ParsedPost } from "../../src/domain/parser/Types.js"
import type { BlockTemplateDefinition } from "../../src/domain/template/Types.js"

import { defaultExportOptions } from "../../src/domain/export-options/ExportOptions.js"
import { NaverBlogSE2Editor } from "../../src/parsing/naver-blog/se2/NaverBlogSe2Editor.js"
import { NaverBlogSE3Editor } from "../../src/parsing/naver-blog/se3/NaverBlogSe3Editor.js"
import { NaverBlogSE4Editor } from "../../src/parsing/naver-blog/se4/NaverBlogSe4Editor.js"

const testOptions = defaultExportOptions()

type EditorType = "naver-se2" | "naver-se3" | "naver-se4"

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

export const createSe4ModuleScript = (module: Record<string, unknown>) =>
  `<script class="__se_module_data" data-module-v2='${JSON.stringify(module)}'></script>`

export const parseSe2Blocks = (content: string, options?: ParserTestOptions) =>
  se2Editor.parse({
    $: load(`<div id="viewTypeSelector">${content}</div>`),
    tags: ["classic", "classic", "archive"],
    options: createParserOptions(options),
  })

const createSe3Html = (...components: string[]) =>
  `<div id="viewTypeSelector"><div class="se_component_wrap sect_dsc">${components.join("")}</div></div>`

export const parseSe3Blocks = (...components: string[]) =>
  se3Editor.parse({
    $: load(createSe3Html(...components)),
    tags: ["daily", "daily", "archive"],
    options: createParserOptions(),
  })

export const parseSe3BlocksWithOptions = ({
  blockOutputs,
  components,
}: {
  blockOutputs: ExportOptions["blockOutputs"]
  components: string[]
}) =>
  se3Editor.parse({
    $: load(createSe3Html(...components)),
    tags: ["daily", "daily", "archive"],
    options: createParserOptions({ blockOutputs }),
  })

export const parseSe4Blocks = (...components: string[]) =>
  se4Editor.parse({
    $: load(`<div id="viewTypeSelector">${components.join("")}</div>`),
    sourceUrl,
    tags: ["algo", "algo", "math"],
    options: createParserOptions(),
  })

export const parseSe4BlocksWithOptions = ({
  blockOutputs,
  components,
}: {
  blockOutputs: ExportOptions["blockOutputs"]
  components: string[]
}) =>
  se4Editor.parse({
    $: load(`<div id="viewTypeSelector">${components.join("")}</div>`),
    sourceUrl,
    tags: ["algo", "algo", "math"],
    options: createParserOptions({ blockOutputs }),
  })

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
  parse: (blockOutputs: ExportOptions["blockOutputs"]) => ParsedPost
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
