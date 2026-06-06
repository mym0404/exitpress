import type { BlockTemplateDefinition } from "@exitpress/domain/template/Types.js"

import type { StorybookDefinition } from "./data/StorybookDefinition.js"

export type StorybookStory = StorybookDefinition & {
  markdown: string
  templateDefinition?: BlockTemplateDefinition
}

export type StorybookEditorGroup = {
  editorType: string
  editorLabel: string
  stories: StorybookStory[]
}
