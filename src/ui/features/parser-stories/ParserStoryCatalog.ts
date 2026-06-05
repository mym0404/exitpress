import type { ParserBlockStoryDefinition } from "../../../parsing/naver-blog/core/BaseEditor.js"

import { NaverBlog } from "../../../parsing/naver-blog/NaverBlog.js"
import { renderBlockTemplatePreview } from "../options/BlockTemplatePreview.js"

import { resolveParserStoryCaptureSrc } from "./ParserStoryAssets.js"

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

const renderDefaultVariant = (definition: ParserBlockStoryDefinition) => {
  const preset = definition.templateDefinition?.presets[0]

  return definition.templateDefinition && preset
    ? renderBlockTemplatePreview({
        definition: definition.templateDefinition,
        template: preset.template,
        imageHandlingMode: "remote",
      })
    : emptyOutputMarkdown
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
      screenshotSrc: resolveParserStoryCaptureSrc({
        storyKey: definition.storyKey,
        fallbackSrc: definition.screenshotSrc,
      }),
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
