import { describe, expect, it } from "vitest"
import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4ScheduleBlock", () => {
  it("parses schedule components into link paragraphs", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-schedule se-l-default">
        <div class="se-component-content">
          <div class="se-section se-section-schedule se-section-align-center se-l-default">
            <div class="se-module se-module-schedule __se_schedule_content se-module-schedule-expanded">
              <div class="se-schedule-header">
                <div class="se-schedule-summary __se_display_period">
                  <p class="se-schedule-title">
                    <strong class="se-schedule-title-text">근대5종 남자 개인 결승 - 레이저런</strong>
                  </p>
                </div>
              </div>
              <div class="se-schedule-content">
                <dl class="se-schedule-detail se-schedule-detail-url">
                  <dt class="se-schedule-info-title"></dt>
                  <dd class="se-schedule-info">
                    <a
                      href="https://m.sports.naver.com/game/2024MPNMINDIVIDFNL0001LR/video"
                      target="_blank"
                      class="se-schedule-url"
                    >
                      https://m.sports.naver.com/game/2024MPNMINDIVIDFNL0001LR/video
                    </a>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <script
          class="__se_module_data"
          data-module='{"type":"v2_schedule","data":{"startAt":"2024-08-11T02:10:15+09:00"}}'
        ></script>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[근대5종 남자 개인 결승 - 레이저런](https://m.sports.naver.com/game/2024MPNMINDIVIDFNL0001LR/video)",
      },
      {
        type: "paragraph",
        text: "2024-08-11T02:10:15+09:00",
      },
    ])
  })

  it("keeps title and time when the schedule has no url", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-schedule">
        <strong class="se-schedule-title-text">결승전</strong>
        <script
          class="__se_module_data"
          data-module='{"type":"v2_schedule","data":{"startAt":"2024-08-12T20:00:00+09:00"}}'
        ></script>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      { type: "paragraph", text: "결승전" },
      { type: "paragraph", text: "2024-08-12T20:00:00+09:00" },
    ])
  })
})
