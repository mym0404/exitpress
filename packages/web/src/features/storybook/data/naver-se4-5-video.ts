import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe45Video = {
  storyKey: "naver-se4-5-video",
  screenshotSrc: "naver-se4-5-video.png",
  editorType: "naver-se4",
  editorLabel: "SmartEditor 4",
  blockIndex: 5,
  blockId: "video",
  blockLabel: "비디오",
  group: "output",
  sourceUrl: "https://blog.naver.com/anglekim3708/221958395128",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n<div class="se-component se-video se-l-default">\n                    <div class="se-component-content se-component-content-fit">\n                        <div class="se-section se-section-video se-section-align-center se-l-default">\n                            <div class="se-module se-module-video" id="SE-ecd696fa-add9-4a7e-8c73-f9397a823f87">\n                            </div>\n                        </div>\n                    </div>\n                    <script type="text/data" class="__se_module_data" data-module="{&quot;type&quot;:&quot;v2_video&quot;, &quot;id&quot; :&quot;SE-ecd696fa-add9-4a7e-8c73-f9397a823f87&quot;, &quot;data&quot; : { &quot;videoType&quot; : &quot;player&quot;, &quot;vid&quot; : &quot;4CFBC072D3A57332A4660DFA6DEBDBCA80B1&quot;, &quot;inkey&quot; : &quot;V1234a103d8561d428426b1ec8ea68224f55e8c96f0dd2305ae3c7b3dc47e2976e27eb1ec8ea68224f55e&quot;, &quot;originalWidth&quot;: &quot;3840&quot;, &quot;originalHeight&quot;: &quot;2160&quot;, &quot;width&quot;: &quot;886&quot;, &quot;height&quot;: &quot;498&quot;, &quot;contentMode&quot;: &quot;fit&quot;, &quot;format&quot;: &quot;uhd&quot;, &quot;mediaMeta&quot;: {&quot;@ctype&quot;:&quot;mediaMeta&quot;,&quot;title&quot;:&quot;서울로 기찻길&quot;,&quot;tags&quot;:[&quot;기찻길&quot;],&quot;description&quot;:null} }}"></script>\n                </div>\n</div>',
} satisfies StorybookDefinition
