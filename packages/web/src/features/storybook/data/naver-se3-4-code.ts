import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe34Code = {
  storyKey: "naver-se3-4-code",
  screenshotSrc: "naver-se3-4-code.png",
  editorType: "naver-se3",
  editorLabel: "SmartEditor 3",
  blockIndex: 4,
  blockId: "code",
  blockLabel: "코드",
  group: "output",
  sourceUrl: "https://blog.naver.com/yuyyulee/221079465686",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n  <div class="se_component_wrap sect_dsc">\n<div class="se_component se_code default" id="SEDOC-1515717310544-1597310336_code_0">\n    <div class="se_sectionArea">\n        <div class="se_editArea">\n            <div class="se_viewArea se_fs_T3 ">\n                <div class="se_editView">\n                    <div class="se_textView">\n                        <div class="__se_code_view se_textarea language-javascript">TCCR1A |= ((1 &lt;&lt; COM1A1) | (1 &lt;&lt; WGM10));\nTCCR1B |= ((1 &lt;&lt; WGM12) | (1 &lt;&lt; CS11));\nOCR1AH = 0x00;\nOCR1AL = 0xFF;\nTIMSK |= (1 &lt;&lt; OCIE1A);</div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n  </div>\n</div>',
} satisfies StorybookDefinition
