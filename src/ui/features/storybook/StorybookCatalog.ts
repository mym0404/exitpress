import type { ParsedBlock } from "../../../domain/parser/Types.js"
import type { BlockTemplateDefinition } from "../../../domain/template/Types.js"

import type { StorybookDefinition } from "./data/StorybookDefinition.js"

import { renderBlockTemplates } from "../../../markdown/utils/renderBlockTemplates.js"
import { parsePostHtml } from "../../../parsing/naver-blog/core/PostParser.js"
import {
  createNaverBlogDefaultBlockTemplateMap,
  NaverBlog,
} from "../../../parsing/naver-blog/NaverBlog.js"

import { storybookDefinitions } from "./data/StorybookDefinitions.js"
import { resolveStorybookCaptureSrc } from "./StorybookAssets.js"

export type StorybookStory = StorybookDefinition & {
  markdown: string
  templateDefinition?: BlockTemplateDefinition
}

type StorybookEditorGroup = {
  editorType: string
  editorLabel: string
  stories: StorybookStory[]
}

const emptyOutputMarkdown = "Markdown 출력 없음"
const storybookOptions = { blockOutputs: { templates: {} } }
const defaultBlockTemplates = createNaverBlogDefaultBlockTemplateMap()
const blockTemplateDefinitions = new NaverBlog().getBlockTemplateDefinitions()
const blockTemplateDefinitionByKey = Object.fromEntries(
  blockTemplateDefinitions.map((definition) => [definition.key, definition]),
)

const resolveStoryBlockProps = (block: ParsedBlock) => {
  const props = { ...block.props }

  Object.entries(block.assets ?? {}).forEach(([propName, asset]) => {
    props[propName] = asset.sourceUrl
  })

  return props
}

const renderStoryMarkdown = (definition: StorybookDefinition) => {
  const parsedPost = parsePostHtml({
    html: definition.inputHtml,
    sourceUrl: definition.sourceUrl,
    options: storybookOptions,
  })
  const markdown = renderBlockTemplates(
    parsedPost.blocks.map((block) => {
      const template = defaultBlockTemplates[block.blockId]

      if (!template) {
        throw new Error(`Storybook block template is missing: ${block.blockId}`)
      }

      return {
        template,
        props: resolveStoryBlockProps(block),
      }
    }),
  )

  return markdown || emptyOutputMarkdown
}

const buildStorybookCatalog = (): StorybookEditorGroup[] => {
  const groups: StorybookEditorGroup[] = []

  storybookDefinitions.forEach((definition) => {
    const story: StorybookStory = {
      ...definition,
      screenshotSrc: resolveStorybookCaptureSrc({
        storyKey: definition.storyKey,
        fallbackSrc: definition.screenshotSrc,
      }),
      markdown: renderStoryMarkdown(definition),
      templateDefinition:
        blockTemplateDefinitionByKey[`${definition.editorType}:${definition.blockId}`],
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

export const storybookCatalog = buildStorybookCatalog()
