import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe212Poll = {
  storyKey: "naver-se2-12-poll",
  screenshotSrc: "naver-se2-12-poll.png",
  editorType: "naver-se2",
  editorLabel: "SmartEditor 2",
  blockIndex: 12,
  blockId: "poll",
  blockLabel: "투표",
  sourceUrl: "https://blog.naver.com/anglekim3708/70170491705",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector"><div align="center" style="text-align: center;" _foo="text-align: center;"><iframe class="poll_iframe" scrolling="no" height="500" frameborder="no" width="device-width" allowtransparency="true" style="height: 325px; width: 100%;" src="https://m.blog.naver.com/Poll.naver?pollKey=3858be6b014d32d6b60f5c23f066dd7e0&amp;blogId=anglekim3708" name="frameElement" title="포스트에 첨부된 투표"></iframe></div></div>',
} satisfies StorybookDefinition
