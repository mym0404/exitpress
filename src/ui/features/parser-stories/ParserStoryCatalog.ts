import type {
  AstBlock,
  BlockOutputParamValue,
  BlockOutputSelection,
  OutputOption,
} from "../../../domain/ast/Types.js"
import type { ExportOptions } from "../../../domain/export-options/Types.js"
import type { ParserBlockStoryDefinition } from "../../../parsing/naver-blog/core/BaseEditor.js"

import { resolveBlockOutputSelection } from "../../../domain/export-options/BlockOutputSelection.js"
import { createBlockOutputSelectionKey } from "../../../parsing/naver-blog/core/BaseEditorOutputSelection.js"
import { parsePostHtmlWithBlockEvidence } from "../../../parsing/naver-blog/core/PostParser.js"
import { NaverBlog } from "../../../parsing/naver-blog/NaverBlog.js"
import { renderBlockOutputPreview } from "../options/BlockOutputPreview.js"

type ParserStoryMarkdownVariant = {
  label: string
  markdown: string
  isDefault: boolean
}

export type ParserStory = ParserBlockStoryDefinition & {
  markdownVariants: ParserStoryMarkdownVariant[]
}

type ParserStoryEditorGroup = {
  editorType: string
  editorLabel: string
  stories: ParserStory[]
}

const emptyOutputMarkdown = "Markdown 출력 없음"
const defaultStoryBlockOutputs = { defaults: {} } satisfies ExportOptions["blockOutputs"]

const createSelectionFromOutputOption = (option: OutputOption): BlockOutputSelection => {
  const params = (option.params ?? []).reduce<Record<string, BlockOutputParamValue>>(
    (nextParams, param) => {
      if (param.defaultValue !== undefined) {
        nextParams[param.key] = param.defaultValue
      }

      return nextParams
    },
    {},
  )

  return {
    variant: option.id,
    ...(Object.keys(params).length > 0 ? { params } : {}),
  }
}

const createStoryBlockOutputs = ({
  definition,
  selection,
}: {
  definition: ParserBlockStoryDefinition
  selection: BlockOutputSelection
}): ExportOptions["blockOutputs"] => ({
  defaults: {
    [createBlockOutputSelectionKey({
      editorType: definition.editorType,
      blockId: definition.blockId,
    })]: selection,
  },
})

const parseStoryBlocks = ({
  definition,
  blockOutputs,
}: {
  definition: ParserBlockStoryDefinition
  blockOutputs: ExportOptions["blockOutputs"]
}) =>
  parsePostHtmlWithBlockEvidence({
    html: definition.inputHtml,
    sourceUrl: definition.sourceUrl,
    options: {
      blockOutputs,
    },
  }).blocks

const getRenderSelection = ({
  block,
  blockOutputs,
}: {
  block: AstBlock
  blockOutputs: ExportOptions["blockOutputs"]
}) => {
  const selection =
    "outputSelection" in block && block.outputSelection
      ? block.outputSelection
      : block.type === "paragraph" || block.type === "code" || block.type === "divider"
        ? { variant: "default" }
        : resolveBlockOutputSelection({
            blockType: block.type,
            blockOutputs,
          })

  return selection
}

const renderStoryBlocksMarkdown = ({
  blocks,
  blockOutputs,
}: {
  blocks: AstBlock[]
  blockOutputs: ExportOptions["blockOutputs"]
}) =>
  blocks
    .map((block) =>
      renderBlockOutputPreview({
        block,
        selection: getRenderSelection({ block, blockOutputs }),
        imageHandlingMode: "remote",
      }),
    )
    .filter(Boolean)
    .join("\n\n")
    .trim()

const renderDefaultVariant = (definition: ParserBlockStoryDefinition) => {
  const blocks = parseStoryBlocks({
    definition,
    blockOutputs: defaultStoryBlockOutputs,
  })

  return renderStoryBlocksMarkdown({
    blocks,
    blockOutputs: defaultStoryBlockOutputs,
  })
}

const renderOutputOptionVariant = ({
  definition,
  option,
}: {
  definition: ParserBlockStoryDefinition
  option: OutputOption
}) => {
  const selection = createSelectionFromOutputOption(option)
  const blockOutputs = createStoryBlockOutputs({
    definition,
    selection,
  })
  const blocks = parseStoryBlocks({
    definition,
    blockOutputs,
  })

  return renderStoryBlocksMarkdown({
    blocks,
    blockOutputs,
  })
}

const createMarkdownVariants = (
  definition: ParserBlockStoryDefinition,
): ParserStoryMarkdownVariant[] => {
  if (definition.group === "auxiliary") {
    return [
      {
        label: "결과 없음",
        markdown: emptyOutputMarkdown,
        isDefault: true,
      },
    ]
  }

  if (definition.outputOptions.length > 0) {
    return definition.outputOptions.map((option) => ({
      label: option.label,
      markdown: renderOutputOptionVariant({
        definition,
        option,
      }),
      isDefault: option.isDefault === true || option === definition.outputOptions[0],
    }))
  }

  return [
    {
      label: "기본",
      markdown: renderDefaultVariant(definition),
      isDefault: true,
    },
  ]
}

const buildParserStoryCatalog = (): ParserStoryEditorGroup[] => {
  const definitions = new NaverBlog().getParserBlockStoryDefinitions()
  const groups: ParserStoryEditorGroup[] = []

  definitions.forEach((definition) => {
    const story: ParserStory = {
      ...definition,
      markdownVariants: createMarkdownVariants(definition),
    }
    const existingGroup = groups.find((group) => group.editorType === definition.editorType)

    if (existingGroup) {
      existingGroup.stories.push(story)
      return
    }

    groups.push({
      editorType: definition.editorType,
      editorLabel: definition.editorLabel,
      stories: [story],
    })
  })

  return groups
}

export const parserStoryCatalog = buildParserStoryCatalog()
