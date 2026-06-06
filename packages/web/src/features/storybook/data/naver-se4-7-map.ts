import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe47Map = {
  storyKey: "naver-se4-7-map",
  screenshotSrc: "naver-se4-7-map.png",
  editorType: "naver-se4",
  editorLabel: "SmartEditor 4",
  blockIndex: 7,
  blockId: "map",
  blockLabel: "지도",
  sourceUrl: "https://blog.naver.com/mym0404/223034929697",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n\n      <div class="se-component se-placesMap">\n        <script class="__se_module_data" data-module-v2=\'{"type":"v2_map","data":{"places":[{"name":"MJ Studio","address":"Seoul"}]}}\'></script>\n      </div>\n    \n</div>',
} satisfies StorybookDefinition
