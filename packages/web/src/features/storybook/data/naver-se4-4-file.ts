import type { StorybookDefinition } from "./StorybookDefinition.js"

export const naverSe44File = {
  storyKey: "naver-se4-4-file",
  screenshotSrc: "naver-se4-4-file.png",
  editorType: "naver-se4",
  editorLabel: "SmartEditor 4",
  blockIndex: 4,
  blockId: "file",
  blockLabel: "첨부파일",
  group: "output",
  sourceUrl: "https://blog.naver.com/mym0404/223034929697",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n\n      <div class="se-component se-file se-l-default">\n        <script class="__se_module_data" data-module-v2=\'{"type":"v2_file","data":{"link":"https://example.com/file.pdf"}}\'></script>\n        <span class="se-file-name">file</span><span class="se-file-extension">.pdf</span>\n        <a class="se-file-save-button __se_link" href="https://example.com/file.pdf">download</a>\n      </div>\n    \n</div>',
} satisfies StorybookDefinition
