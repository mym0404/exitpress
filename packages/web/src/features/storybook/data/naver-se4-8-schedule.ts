import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe48Schedule = {
  storyKey: "naver-se4-8-schedule",
  screenshotSrc: "naver-se4-8-schedule.png",
  editorType: "naver-se4",
  editorLabel: "SmartEditor 4",
  blockIndex: 8,
  blockId: "schedule",
  blockLabel: "일정",
  group: "output",
  sourceUrl: "https://blog.naver.com/mym0404/223034929697",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n\n      <div class="se-component se-schedule">\n        <script class="__se_module_data" data-module-v2=\'{"type":"v2_schedule","data":{"startAt":"2026-06-04"}}\'></script>\n        <strong class="se-schedule-title-text">Launch day</strong>\n        <a class="se-schedule-url" href="https://example.com/schedule">schedule</a>\n      </div>\n    \n</div>',
} satisfies StorybookDefinition
