import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe49TalkTalk = {
  storyKey: "naver-se4-9-talkTalk",
  screenshotSrc: "naver-se4-9-talkTalk.png",
  editorType: "naver-se4",
  editorLabel: "SmartEditor 4",
  blockIndex: 9,
  blockId: "talkTalk",
  blockLabel: "톡톡 링크",
  group: "output",
  sourceUrl: "https://blog.naver.com/mym0404/223034929697",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n\n      <div class="se-component se-talktalk">\n        <a class="se-module-talktalk" href="https://talk.naver.com/example">\n          <span class="se-talktalk-banner-text">TalkTalk chat</span>\n        </a>\n      </div>\n    \n</div>',
} satisfies StorybookDefinition
