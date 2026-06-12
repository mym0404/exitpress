import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { describe, expect, it } from "vitest"

import {
  applyPostTemplate,
  buildPostFolderName,
  buildPostTemplateValues,
} from "./PostPathTemplate.js"

const samplePost = {
  sourceId: "mym0404",
  postId: "223034929697",
  title: "첫 글",
  publishedAt: "2026-04-11T04:00:00.000Z",
  categoryName: "React",
}

describe("post-path-template", () => {
  it("builds template values from the current structure slug rules", () => {
    const options = defaultExportOptions()

    expect(
      buildPostTemplateValues({
        post: samplePost,
        options,
      }),
    ).toEqual({
      slug: "첫_글",
      category: "react",
      title: "첫-글",
      postId: "223034929697",
      sourceId: "mym0404",
      date: "2026-04-11",
      year: "2026",
      YYYY: "2026",
      YY: "26",
      month: "04",
      MM: "04",
      M: "4",
      day: "11",
      DD: "11",
      D: "11",
    })
  })

  it("builds folder names from the default template", () => {
    const options = defaultExportOptions()

    expect(
      buildPostFolderName({
        post: samplePost,
        options,
      }),
    ).toBe("2026-04-11-첫_글")
  })

  it("builds folder names from custom templates", () => {
    const options = defaultExportOptions()

    options.structure.postFolderNameTemplate = "{{ year }}_{{ month }}_{{ postId }}_{{ slug }}"

    expect(
      buildPostFolderName({
        post: samplePost,
        options,
      }),
    ).toBe("2026_04_223034929697_첫_글")
  })

  it("sanitizes custom template results into a safe single folder name", () => {
    expect(
      buildPostFolderName({
        post: samplePost,
        options: {
          structure: {
            ...defaultExportOptions().structure,
            postFolderNameTemplate: "{{ date }}/{{ slug }}",
          },
        },
      }),
    ).toBe("2026-04-11 첫_글")
  })

  it("replaces variables in post templates", () => {
    expect(
      applyPostTemplate({
        template: "{{ category }}/{{ YYYY }}/{{ MM }}/{{ DD }}/{{ YY }}/{{ M }}/{{ D }}/{{ slug }}",
        values: buildPostTemplateValues({
          post: samplePost,
          options: defaultExportOptions(),
        }),
      }),
    ).toBe("react/2026/04/11/26/4/11/첫_글")
  })
})
