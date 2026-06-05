import type { ParsedBlock } from "../../../domain/parser/Types.js"
import type { StorybookBlockDefinition } from "../../../parsing/naver-blog/core/BaseEditor.js"

import { renderBlockTemplates } from "../../../markdown/BlockTemplateRenderer.js"
import { parsePostHtml } from "../../../parsing/naver-blog/core/PostParser.js"
import { NaverBlog } from "../../../parsing/naver-blog/NaverBlog.js"
import { createNaverBlogDefaultBlockTemplateMap } from "../../../parsing/naver-blog/NaverBlog.js"

import { resolveStorybookCaptureSrc } from "./StorybookAssets.js"

export type StorybookStory = StorybookBlockDefinition & {
  markdown: string
}

type StorybookEditorGroup = {
  editorType: string
  editorLabel: string
  stories: StorybookStory[]
}

const emptyOutputMarkdown = "Markdown 출력 없음"
const storybookOptions = { blockOutputs: { templates: {} } }
const defaultBlockTemplates = createNaverBlogDefaultBlockTemplateMap()

const resolveStoryBlockProps = (block: ParsedBlock) => {
  const props = { ...block.props }

  Object.entries(block.assets ?? {}).forEach(([propName, asset]) => {
    props[propName] = asset.sourceUrl
  })

  return props
}

const renderStoryMarkdown = (definition: StorybookBlockDefinition) => {
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
  const definitions = new NaverBlog().getStorybookBlockDefinitions()
  const groups: StorybookEditorGroup[] = []

  definitions.forEach((definition) => {
    const story: StorybookStory = {
      ...definition,
      screenshotSrc: resolveStorybookCaptureSrc({
        storyKey: definition.storyKey,
        fallbackSrc: definition.screenshotSrc,
      }),
      markdown: renderStoryMarkdown(definition),
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
