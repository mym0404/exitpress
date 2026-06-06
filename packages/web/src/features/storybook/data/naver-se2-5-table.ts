import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe25Table = {
  storyKey: "naver-se2-5-table",
  screenshotSrc: "naver-se2-5-table.png",
  editorType: "naver-se2",
  editorLabel: "SmartEditor 2",
  blockIndex: 5,
  blockId: "table",
  blockLabel: "표",
  sourceUrl: "https://blog.naver.com/mym0404/223034929697",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector"><table><tr><th>col</th></tr><tr><td>value</td></tr></table></div>',
} satisfies StorybookDefinition
