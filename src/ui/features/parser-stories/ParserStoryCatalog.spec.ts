import { access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { load } from "cheerio"
import { describe, expect, it } from "vitest"

import type { ParserBlockInspection } from "../../../parsing/naver-blog/core/BaseEditorTypes.js"

import { NaverBlog } from "../../../parsing/naver-blog/NaverBlog.js"

import { parserStoryCatalog } from "./ParserStoryCatalog.js"

const rootDir = fileURLToPath(new URL("../../../../", import.meta.url))
const parserOptions = { blockOutputs: { defaults: {} } }

const flattenInspections = (inspections: ParserBlockInspection[]): ParserBlockInspection[] =>
  inspections.flatMap((inspection) => [
    inspection,
    ...flattenInspections(inspection.children ?? []),
  ])

describe("parser story catalog", () => {
  it("renders every parser block story with markdown variants and committed capture assets", async () => {
    const blog = new NaverBlog()
    const stories = parserStoryCatalog.flatMap((group) => group.stories)

    expect(parserStoryCatalog.map((group) => group.editorLabel)).toEqual([
      "SmartEditor 4",
      "SmartEditor 3",
      "SmartEditor 2",
    ])
    expect(stories).toHaveLength(52)
    expect(stories.every((story) => story.inputHtml.trim())).toBe(true)
    expect(stories.every((story) => story.markdownVariants.length > 0)).toBe(true)
    expect(new Set(stories.map((story) => story.screenshotSrc)).size).toBe(stories.length)
    expect(
      stories.every((story) => story.markdownVariants.every((variant) => variant.markdown.trim())),
    ).toBe(true)

    stories.forEach((story) => {
      const editor = blog.getEditorForHtml(story.inputHtml)
      const $ = load(story.inputHtml)
      const matchedInspection = editor
        ? flattenInspections(
            editor.inspect({
              $,
              sourceUrl: story.sourceUrl,
              tags: [],
              options: parserOptions,
            }),
          ).find((inspection) => inspection.path === story.inspectPath)
        : undefined

      expect(editor?.type).toBe(story.editorType)
      expect(matchedInspection).toMatchObject({
        matchedBlockId: story.blockId,
        matchedBlockLabel: story.blockLabel,
      })
    })

    await Promise.all(
      stories.map((story) =>
        access(path.join(rootDir, "public", story.screenshotSrc.replace(/^\//, ""))),
      ),
    )
  })
})
