import type { StorybookDefinition } from "./StorybookDefinition.js"

export const naverSe421Material = {
  storyKey: "naver-se4-21-material",
  screenshotSrc: "naver-se4-21-material.png",
  editorType: "naver-se4",
  editorLabel: "SmartEditor 4",
  blockIndex: 21,
  blockId: "material",
  blockLabel: "자료 링크",
  group: "output",
  sourceUrl: "https://blog.naver.com/mym0404/223034929697",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n\n    <div class="se-component se-material">\n      <a class="se-module-material" href="https://example.com/material" data-linkdata=\'{"link":"https://example.com/material"}\'>\n        <span class="se-material-title">자료 링크</span>\n        <span class="se-material-detail">\n          <span class="se-material-detail-title">type</span>\n          <span class="se-material-detail-description">reference</span>\n        </span>\n      </a>\n    </div>\n  \n</div>',
} satisfies StorybookDefinition
