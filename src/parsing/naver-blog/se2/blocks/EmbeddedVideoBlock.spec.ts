import { describe, expect, it } from "vitest"
import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2EmbeddedVideoBlock", () => {
  it("parses standalone outer video iframes into video blocks", () => {
    const parsed = parseSe2Blocks(`
      <p style="text-align: center;" align="center">
        <style>@media all and (min-width:679px){#_video1 iframe{width:639px !important;height:360px !important}}</style>
        <span id="_video1" class="_outerVideo">
          <iframe
            src="http://videofarm.daum.net/controller/video/viewer/Video.html?vid=v855c4MLyyLL5LLBiB5MB4L&amp;play_loc=undefined&amp;__authenticIframe=true"
            width="260"
            height="190"
            frameborder="0"
            allowfullscreen=""
          ></iframe>
        </span>&nbsp;
      </p>
    `)

    const video = {
      title: "Video",
      thumbnailUrl: null,
      sourceUrl:
        "http://videofarm.daum.net/controller/video/viewer/Video.html?vid=v855c4MLyyLL5LLBiB5MB4L&play_loc=undefined&__authenticIframe=true",
      vid: "v855c4MLyyLL5LLBiB5MB4L",
      inkey: null,
      width: 260,
      height: 190,
    }

    expect(parsed.blocks).toEqual([{ type: "video", video }])
    expect(parsed.videos).toEqual([video])
  })

  it("parses multiple outer video iframes from one legacy paragraph", () => {
    const parsed = parseSe2Blocks(`
      <p style="text-align: center;" align="center">
        <style>@media all and (min-width:116px){#_video1 iframe{width:76px !important;height:90px !important}}</style>
        <span id="_video1" class="_outerVideo">
          <iframe src="https://example.com/embed-a" width="76" height="90"></iframe>
        </span>
        &nbsp;&nbsp;
        <style>@media all and (min-width:116px){#_video2 iframe{width:76px !important;height:90px !important}}</style>
        <span id="_video2" class="_outerVideo">
          <iframe src="https://example.com/embed-b" width="76" height="90"></iframe>
        </span>
      </p>
    `)

    const firstVideo = {
      title: "Video",
      thumbnailUrl: null,
      sourceUrl: "https://example.com/embed-a",
      vid: null,
      inkey: null,
      width: 76,
      height: 90,
    }
    const secondVideo = {
      title: "Video",
      thumbnailUrl: null,
      sourceUrl: "https://example.com/embed-b",
      vid: null,
      inkey: null,
      width: 76,
      height: 90,
    }

    expect(parsed.blocks).toEqual([
      { type: "video", video: firstVideo },
      { type: "video", video: secondVideo },
    ])
    expect(parsed.videos).toEqual([firstVideo, secondVideo])
  })

  it("does not parse outer video iframes mixed with text", () => {
    const parsed = parseSe2Blocks(`
      <p>
        caption
        <span class="_outerVideo">
          <iframe src="https://example.com/embed" width="260" height="190"></iframe>
        </span>
      </p>
    `)

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "caption" }])
  })

  it("uses null metadata when iframe omits optional values", () => {
    const parsed = parseSe2Blocks(`
      <p>
        <span class="_outerVideo">
          <iframe src="https://example.com/embed" frameborder="0"></iframe>
        </span>
      </p>
    `)

    const video = {
      title: "Video",
      thumbnailUrl: null,
      sourceUrl: "https://example.com/embed",
      vid: null,
      inkey: null,
      width: null,
      height: null,
    }

    expect(parsed.blocks).toEqual([{ type: "video", video }])
    expect(parsed.videos).toEqual([video])
  })

  it("parses unwrapped outer video spans into video blocks", () => {
    const parsed = parseSe2Blocks(`
      <span class="_outerVideo">
        <iframe src="https://example.com/embed" width="260" height="190"></iframe>
      </span>
    `)

    const video = {
      title: "Video",
      thumbnailUrl: null,
      sourceUrl: "https://example.com/embed",
      vid: null,
      inkey: null,
      width: 260,
      height: 190,
    }

    expect(parsed.blocks).toEqual([{ type: "video", video }])
    expect(parsed.videos).toEqual([video])
  })

  it("keeps invalid iframe source strings without video metadata", () => {
    const parsed = parseSe2Blocks(`
      <p>
        <span class="_outerVideo">
          <iframe src="https://%" frameborder="0"></iframe>
        </span>
      </p>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "video",
        video: {
          title: "Video",
          thumbnailUrl: null,
          sourceUrl: "https://%",
          vid: null,
          inkey: null,
          width: null,
          height: null,
        },
      },
    ])
  })

  it("does not parse outer video iframes mixed with other media", () => {
    expect(() =>
      parseSe2Blocks(`
        <p>
          <span class="_outerVideo">
            <iframe src="https://example.com/embed"></iframe>
          </span>
          <iframe src="https://example.com/other"></iframe>
        </p>
      `),
    ).toThrow("파싱 가능한 naver-se2 block이 없습니다: p")
  })

  it("does not parse outer video iframes without a source", () => {
    expect(() =>
      parseSe2Blocks(`
        <p>
          <span class="_outerVideo">
            <iframe src=""></iframe>
          </span>
        </p>
      `),
    ).toThrow("파싱 가능한 naver-se2 block이 없습니다: p")
  })

  it("does not parse outer video containers without a source iframe", () => {
    expect(() =>
      parseSe2Blocks(`
        <p>
          <span class="_outerVideo">
            <iframe></iframe>
          </span>
        </p>
      `),
    ).toThrow("파싱 가능한 naver-se2 block이 없습니다: p")
  })
})
