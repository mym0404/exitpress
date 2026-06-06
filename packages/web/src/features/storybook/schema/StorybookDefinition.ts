export const allStorybookDefinitionGroups = ["output", "auxiliary"] as const
// Groups separate exported Markdown cases from auxiliary parser cases.
export type StorybookDefinitionGroup = (typeof allStorybookDefinitionGroups)[number]

// Static Storybook fixture metadata used before Markdown generation.
export type StorybookDefinition = {
  storyKey: string
  editorType: string
  editorLabel: string
  blockIndex: number
  blockId: string
  blockLabel: string
  group: StorybookDefinitionGroup
  sourceUrl: string
  inspectPath: string
  inputHtml: string
  screenshotSrc: string
}
