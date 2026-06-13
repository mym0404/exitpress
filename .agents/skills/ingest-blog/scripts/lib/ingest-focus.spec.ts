import { describe, expect, it } from "vitest"

import { mergeSupportUnitFailureGroups, selectFocusedSupportUnit } from "./ingest-focus.js"

describe("selectFocusedSupportUnit", () => {
  it("limits report failures to the focused support unit", () => {
    const result = selectFocusedSupportUnit({
      focusSupportUnit: "naver-se4:v2_poll",
      previousFailureGroups: [],
      failureGroups: [
        { supportUnitKey: "naver-se4:v2_poll", failureBlockHash: "pollhash", postIds: ["1"] },
        { supportUnitKey: "naver-se4:v2_map", failureBlockHash: "maphash", postIds: ["2"] },
      ],
    })

    expect(result.reportFailureGroups).toEqual([
      { supportUnitKey: "naver-se4:v2_poll", failureBlockHash: "pollhash", postIds: ["1"] },
    ])
    expect(result.remainingBacklogGroups).toEqual([
      { supportUnitKey: "naver-se4:v2_map", failureBlockHash: "maphash", postIds: ["2"] },
    ])
    expect(result.focusedFailureBlockHash).toBe("pollhash")
    expect(result.focusedSupportUnitResolved).toBe(false)
  })

  it("treats a known focused unit as resolved when it disappears from current failures", () => {
    const result = selectFocusedSupportUnit({
      focusSupportUnit: "naver-se4:v2_poll",
      previousFailureGroups: [
        {
          supportUnitKey: "naver-se4:v2_poll",
          failureBlockHash: "pollhash",
          firstUnsupportedPath: "3",
          representative: {
            postId: "1",
            title: "poll post",
          },
          postIds: ["1"],
        },
      ],
      failureGroups: [
        { supportUnitKey: "naver-se4:v2_map", failureBlockHash: "maphash", postIds: ["2"] },
      ],
    })

    expect(result.reportFailureGroups).toEqual([])
    expect(result.previousFocusedGroups).toEqual([
      {
        supportUnitKey: "naver-se4:v2_poll",
        failureBlockHash: "pollhash",
        firstUnsupportedPath: "3",
        representative: {
          postId: "1",
          title: "poll post",
        },
        postIds: ["1"],
      },
    ])
    expect(result.previousFocusedPostIds).toEqual(["1"])
    expect(result.focusedFailureBlockHash).toBe("pollhash")
    expect(result.focusedSupportUnitKnown).toBe(true)
    expect(result.focusedSupportUnitResolved).toBe(true)
  })
})

describe("mergeSupportUnitFailureGroups", () => {
  it("preserves previously discovered support units and their hash", () => {
    expect(
      mergeSupportUnitFailureGroups([
        { supportUnitKey: "naver-se4:v2_poll", failureBlockHash: "pollhash", postIds: ["1"] },
        { supportUnitKey: "naver-se4:v2_map", failureBlockHash: "maphash", postIds: ["2"] },
        { supportUnitKey: "naver-se4:v2_poll", postIds: ["1", "3"] },
      ]),
    ).toEqual([
      { supportUnitKey: "naver-se4:v2_poll", failureBlockHash: "pollhash", postIds: ["1", "3"] },
      { supportUnitKey: "naver-se4:v2_map", failureBlockHash: "maphash", postIds: ["2"] },
    ])
  })

  it("preserves inspect-path evidence metadata from discovered support units", () => {
    expect(
      mergeSupportUnitFailureGroups([
        {
          supportUnitKey: "naver-se4:v2_poll",
          failureBlockHash: "pollhash",
          editorType: "naver-se4",
          firstUnsupportedPath: "12",
          firstUnsupportedTag: "div",
          representative: {
            postId: "1",
            title: "poll post",
            source: "https://blog.naver.com/a/1",
          },
          postIds: ["1"],
        },
        { supportUnitKey: "naver-se4:v2_poll", postIds: ["2"] },
      ]),
    ).toEqual([
      {
        supportUnitKey: "naver-se4:v2_poll",
        failureBlockHash: "pollhash",
        editorType: "naver-se4",
        firstUnsupportedPath: "12",
        firstUnsupportedTag: "div",
        representative: {
          postId: "1",
          title: "poll post",
          source: "https://blog.naver.com/a/1",
        },
        postIds: ["1", "2"],
      },
    ])
  })
})
