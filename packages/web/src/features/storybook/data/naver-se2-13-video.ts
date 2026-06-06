import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe213Video = {
  storyKey: "naver-se2-13-video",
  screenshotSrc: "naver-se2-13-video.png",
  editorType: "naver-se2",
  editorLabel: "SmartEditor 2",
  blockIndex: 13,
  blockId: "video",
  blockLabel: "비디오",
  sourceUrl: "https://blog.naver.com/blogpeople/150173619413",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector"><p><iframe src="https://photocast.cloud.naver.com/inlineplayer/2;7C905E4C54EA4AFDC392C54901D1D68A;83295?blog&amp;__authenticIframe=true" width="260" height="190" frameborder="0" allowfullscreen=""></iframe>&nbsp;</p></div>',
} satisfies StorybookDefinition
