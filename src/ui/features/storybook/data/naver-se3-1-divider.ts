import type { StorybookDefinition } from "./StorybookDefinition.js"

export const naverSe31Divider = {
  storyKey: "naver-se3-1-divider",
  screenshotSrc: "naver-se3-1-divider.png",
  editorType: "naver-se3",
  editorLabel: "SmartEditor 3",
  blockIndex: 1,
  blockId: "divider",
  blockLabel: "구분선",
  group: "output",
  sourceUrl: "https://blog.naver.com/blogpeople/220957996267",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n  <div class="se_component_wrap sect_dsc">\n<div class="se_component se_horizontalLine line5">\n    <div class="se_sectionArea">\n        <div class="se_editArea">\n            <div class="viewArea">\n                <div class="se_horizontalLineView">\n                    <div class="se_hr"><hr></div>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n  </div>\n</div>',
} satisfies StorybookDefinition
