import type { StorybookDefinition } from "./StorybookDefinition.js"

export const naverSe211InlineGifVideo = {
  storyKey: "naver-se2-11-inlineGifVideo",
  screenshotSrc: "naver-se2-11-inlineGifVideo.png",
  editorType: "naver-se2",
  editorLabel: "SmartEditor 2",
  blockIndex: 11,
  blockId: "inlineGifVideo",
  blockLabel: "인라인 GIF 비디오",
  group: "output",
  sourceUrl: "https://blog.naver.com/anglekim3708/70170491705",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector"><p align="center" style="text-align: center;" _foo="text-align: center;">&nbsp;<a _foo="con_link" href="http://jangmars.blog.me/" target="_blank"><video onerror="this.setAttribute(\'poster\', this.getAttribute(\'data-gif-url\'))" onloadedmetadata="var z=this;this.play().catch(function(){z.poster=z.getAttribute(\'data-gif-url\')});" src="https://mblogvideo-phinf.pstatic.net/20130627_145/anglekim3708_1372317926664lwMSs_GIF/%C8%D6%BC%BA%B8%BE-%C0%A7%C1%AC-15.gif?type=mp4w800" loop="loop" muted="muted" playsinline="" class="fx _postImage _gifmp4" data-gif-url="https://mblogthumb-phinf.pstatic.net/20130627_145/anglekim3708_1372317926664lwMSs_GIF/%C8%D6%BC%BA%B8%BE-%C0%A7%C1%AC-15.gif?type=w210"></video></a></p></div>',
} satisfies StorybookDefinition
