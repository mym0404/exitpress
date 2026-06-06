import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe46Oembed = {
  storyKey: "naver-se4-6-oembed",
  screenshotSrc: "naver-se4-6-oembed.png",
  editorType: "naver-se4",
  editorLabel: "SmartEditor 4",
  blockIndex: 6,
  blockId: "oembed",
  blockLabel: "임베드",
  group: "output",
  sourceUrl: "https://blog.naver.com/mym0404/223034929697",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n\n      <div class="se-component se-oembed">\n        <script class="__se_module_data" data-module-v2=\'{"type":"v2_oembed","data":{"inputUrl":"https://example.com/embed","title":"Embedded content","description":"Embed summary","thumbnailUrl":"https://example.com/embed-thumb.png"}}\'></script>\n      </div>\n    \n</div>',
} satisfies StorybookDefinition
