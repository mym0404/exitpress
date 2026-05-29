import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3VideoBlock", () => {
  it("parses default video components from adjacent module data", () => {
    const parsed = parseSe3Blocks(
      `
        <div class="se_component se_video default">
          <div class="se_viewArea">
            <div id="video-0" data-attachment-id="attachment-id" class="se_mediaArea"></div>
            <div class="se_editView se_mediaCaption">
              <span class="se_textarea">Demo video</span>
            </div>
          </div>
        </div>
      `,
      `
        <script
          type="text/data"
          class="__se_module_data"
          data-module='{"type":"v1_video","id":"video-0","data":{"baseElId":"video-0","videoType":"player","vid":"vid-1","inkey":"inkey-1","width":"1920","height":"1080"}}'
        ></script>
      `,
    )

    const video = {
      title: "Demo video",
      thumbnailUrl: null,
      sourceUrl: "",
      vid: "vid-1",
      inkey: "inkey-1",
      width: 1920,
      height: 1080,
    }

    expect(parsed.blocks).toEqual([{ type: "video", video }])
    expect(parsed.videos).toEqual([video])
  })

  it("uses defaults when module data is missing", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_video default">
        <div class="se_viewArea">
          <div class="se_mediaArea"></div>
        </div>
      </div>
    `)

    expect(parsed.blocks[0]).toEqual({
      type: "video",
      video: {
        title: "Video",
        thumbnailUrl: null,
        sourceUrl: "",
        vid: null,
        inkey: null,
        width: null,
        height: null,
      },
    })
  })

  it("parses legacy og_bSize video components", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_video og_bSize">
        <div class="se_sectionArea se_align-left">
          <div class="se_editArea">
            <div class="se_viewArea">
              <div id="legacy-video" data-attachment-id="attachment-id" class="se_mediaArea">
                <div class="__se_video_frame is_invisible"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks[0]).toEqual({
      type: "video",
      video: {
        title: "Video",
        thumbnailUrl: null,
        sourceUrl: "",
        vid: null,
        inkey: null,
        width: null,
        height: null,
      },
    })
  })

  it("uses module data matching the video element id", () => {
    const parsed = parseSe3Blocks(
      `
        <div class="se_component se_video default">
          <div class="se_viewArea">
            <div id="video-target" class="se_mediaArea"></div>
          </div>
        </div>
      `,
      `
        <script
          type="text/data"
          class="__se_module_data"
          data-module='{"type":"v1_video","id":"other-video","data":{"baseElId":"other-video","vid":"wrong","inkey":"wrong","width":"1280","height":"720"}}'
        ></script>
        <script
          type="text/data"
          class="__se_module_data"
          data-module='{"type":"v1_video","id":"video-target","data":{"baseElId":"video-target","vid":"right","inkey":"matched","width":"","height":"1080"}}'
        ></script>
      `,
    )

    expect(parsed.blocks[0]).toEqual({
      type: "video",
      video: {
        title: "Video",
        thumbnailUrl: null,
        sourceUrl: "",
        vid: "right",
        inkey: "matched",
        width: null,
        height: 1080,
      },
    })
  })

  it("uses defaults when no module data matches the video element id", () => {
    const parsed = parseSe3Blocks(
      `
        <div class="se_component se_video default">
          <div class="se_viewArea">
            <div id="video-target" class="se_mediaArea"></div>
          </div>
        </div>
      `,
      `
        <script
          type="text/data"
          class="__se_module_data"
          data-module='{"type":"v1_video","id":"other-video","data":{"baseElId":"other-video","vid":"wrong"}}'
        ></script>
      `,
    )

    expect(parsed.blocks[0]).toMatchObject({
      type: "video",
      video: {
        vid: null,
        inkey: null,
      },
    })
  })

  it("does not use module data past the next component boundary", () => {
    const parsed = parseSe3Blocks(
      `
        <div class="se_component se_video default">
          <div class="se_viewArea">
            <div id="video-target" class="se_mediaArea"></div>
          </div>
        </div>
      `,
      `
        <div class="se_component se_text">
          <div class="se_textarea">After video</div>
        </div>
        <script
          type="text/data"
          class="__se_module_data"
          data-module='{"type":"v1_video","id":"video-target","data":{"baseElId":"video-target","vid":"leaked","inkey":"leaked"}}'
        ></script>
      `,
    )

    expect(parsed.blocks[0]).toMatchObject({
      type: "video",
      video: {
        vid: null,
        inkey: null,
      },
    })
  })
})
