import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe39File = {
  storyKey: "naver-se3-9-file",
  screenshotSrc: "naver-se3-9-file.png",
  editorType: "naver-se3",
  editorLabel: "SmartEditor 3",
  blockIndex: 9,
  blockId: "file",
  blockLabel: "첨부파일",
  sourceUrl: "https://blog.naver.com/mym0404/223034929697",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n  <div class="se_component_wrap sect_dsc">\n    <div class="se_component se_file default"><a class="se_name_area" href="https://example.com/file.pdf"><span class="se_name">file.pdf</span></a></div>\n  </div>\n</div>',
} satisfies StorybookDefinition
