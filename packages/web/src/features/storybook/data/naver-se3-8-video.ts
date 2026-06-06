import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe38Video = {
  storyKey: "naver-se3-8-video",
  screenshotSrc: "naver-se3-8-video.png",
  editorType: "naver-se3",
  editorLabel: "SmartEditor 3",
  blockIndex: 8,
  blockId: "video",
  blockLabel: "비디오",
  group: "output",
  sourceUrl: "https://blog.naver.com/blogpeople/220957996267",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n  <div class="se_component_wrap sect_dsc">\n<div class="se_component se_video default">\n        <div class="se_sectionArea se_align-center">\n\t        <div class="se_editArea">\n\t            \n\t            <div class="se_viewArea">\n\t                <div id="SEDOC-1489485550477--1500887222_video_0" data-attachment-id="VEmo40Ge5ExnqxE1ue4I5X3AF82Q" class="se_mediaArea">\n\t                </div>\n\t                <div class="se_editView se_mediaCaption">\n\t                    \t<span class="se_textarea">&lt;네이버 라이브러리&gt; </span>\n\t                </div>\n\t            </div>\n\t        </div>\n\t    </div>\n    </div>\n  </div>\n</div>',
} satisfies StorybookDefinition
