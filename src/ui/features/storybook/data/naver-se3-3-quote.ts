import type { StorybookDefinition } from "./StorybookDefinition.js"

export const naverSe33Quote = {
  storyKey: "naver-se3-3-quote",
  screenshotSrc: "naver-se3-3-quote.png",
  editorType: "naver-se3",
  editorLabel: "SmartEditor 3",
  blockIndex: 3,
  blockId: "quote",
  blockLabel: "인용문",
  group: "output",
  sourceUrl: "https://blog.naver.com/blogpeople/220957996267",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n  <div class="se_component_wrap sect_dsc">\n<div class="se_component se_quotation quotation_bubble">\n    <div class="se_sectionArea">\n        <div class="se_editArea">\n            <div class="se_viewArea se_fs_T2">\n                <div class="se_editView">\n                    <div class="se_textView">\n                        <blockquote class="se_textarea"><!-- SE3-TEXT { -->360VR 이미지/동영상 기능입니다<!-- } SE3-TEXT --></blockquote>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n  </div>\n</div>',
} satisfies StorybookDefinition
