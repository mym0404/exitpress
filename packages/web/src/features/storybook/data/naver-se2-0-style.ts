import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe20Style = {
  storyKey: "naver-se2-0-style",
  screenshotSrc: "naver-se2-0-style.png",
  editorType: "naver-se2",
  editorLabel: "SmartEditor 2",
  blockIndex: 0,
  blockId: "style",
  blockLabel: "HTML 스타일",
  sourceUrl: "https://blog.naver.com/anglekim3708/70180618808",
  inspectPath: "0.0",
  inputHtml:
    '<div id="viewTypeSelector"><div align="center"><style>@media all and (min-width:116px){#_video1 iframe{width:76px !important;height:90px !important}}</style><span id="_video1" class="_outerVideo"><iframe src="http://api.v.daum.net/widget2?nid=51574241&amp;__authenticIframe=true" width="76" height="90" frameborder="0" allowfullscreen=""></iframe></span>&nbsp;&nbsp; <style>@media all and (min-width:116px){#_video2 iframe{width:76px !important;height:90px !important}}</style><span id="_video2" class="_outerVideo"><iframe src="http://api.v.daum.net/widget2?nid=51574241&amp;__authenticIframe=true" width="76" height="90" frameborder="0" allowfullscreen=""></iframe></span>&nbsp;<br style="" _foo="CLEAR: both">&nbsp;</div></div>',
} satisfies StorybookDefinition
