export type StorybookDefinition = {
  storyKey: string
  editorType: string
  editorLabel: string
  blockIndex: number
  blockId: string
  blockLabel: string
  group: "output" | "auxiliary"
  sourceUrl: string
  inspectPath: string
  inputHtml: string
  screenshotSrc: string
}
