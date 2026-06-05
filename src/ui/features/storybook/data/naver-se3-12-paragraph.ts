import type { StorybookDefinition } from "./StorybookDefinition.js"

export const naverSe312Paragraph = {
  storyKey: "naver-se3-12-paragraph",
  screenshotSrc: "naver-se3-12-paragraph.png",
  editorType: "naver-se3",
  editorLabel: "SmartEditor 3",
  blockIndex: 12,
  blockId: "paragraph",
  blockLabel: "문단",
  group: "output",
  sourceUrl: "https://blog.naver.com/blogpeople/220957996267",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n  <div class="se_component_wrap sect_dsc">\n<div class="se_component se_paragraph default">\n    <div class="se_sectionArea">\n        <div class="se_editArea">\n            <div class="se_viewArea se_ff_nanumgothic se_fs_T3 se_align-center">\n                <div class="se_editView">\n                    <div class="se_textView">\n                        <p class="se_textarea"><!-- SE3-TEXT { --><span></span></p><p class="p1">안녕하세요<span class="s1">. </span>네이버<span class="s1"> </span>블로그<span class="s1"> </span>팀입니다<span class="s1">.&nbsp;</span></p><span><p class="p1"></p>여러분이 그동안 많이 요청해주셨던 또 한가지 기능을 오늘 소개해드리려 합니다.<br></span><span><p class="p1"></p><br></span><span><p class="p1">스마트에디터<span class="s1"> 3.0</span>에<span class="s1"> </span>적용된<span class="s1">&nbsp;</span>새<span class="s1"> </span>기능은...</p><br></span><span><p class="p1">두둥!!!!</p></span> <p class="p2"></p><!-- } SE3-TEXT --><p></p>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n  </div>\n</div>',
} satisfies StorybookDefinition
