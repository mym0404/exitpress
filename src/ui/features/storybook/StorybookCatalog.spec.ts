import { load } from "cheerio"
import { describe, expect, it } from "vitest"

import type { ParserBlockInspection } from "../../../parsing/naver-blog/core/ParserBlockDiagnostics.js"

import { resolveParsedBlockAssetsForRender } from "../../../exporting/assets/ParsedBlockAssetResolver.js"
import { renderBlockTemplates } from "../../../markdown/utils/renderBlockTemplates.js"
import { parsePostHtml } from "../../../parsing/naver-blog/core/PostParser.js"
import { NaverBlog } from "../../../parsing/naver-blog/NaverBlog.js"
import { createNaverBlogDefaultBlockTemplateMap } from "../../../parsing/naver-blog/NaverBlog.js"

import { storybookCaptureAssets } from "./StorybookAssets.js"
import { storybookCatalog } from "./StorybookCatalog.js"

const storybookOptions = { blockOutputs: { templates: {} } }
const defaultBlockTemplates = createNaverBlogDefaultBlockTemplateMap()

const renderExpectedStoryMarkdown = async (story: { inputHtml: string; sourceUrl: string }) => {
  const parsedPost = parsePostHtml({
    html: story.inputHtml,
    sourceUrl: story.sourceUrl,
    options: storybookOptions,
  })
  const resolved = await resolveParsedBlockAssetsForRender({
    blocks: parsedPost.blocks,
    resolveAsset: async ({ role, sourceUrl }) => ({
      reference: sourceUrl,
      record: {
        kind: role,
        sourceUrl,
        reference: sourceUrl,
        relativePath: null,
        storageMode: "remote",
        uploadCandidate: null,
      },
    }),
  })
  const markdown = renderBlockTemplates(
    resolved.blocks.map((block) => ({
      template: defaultBlockTemplates[block.blockId] ?? "",
      props: block.props,
    })),
  )

  return markdown || "Markdown 출력 없음"
}

const flattenInspections = (inspections: ParserBlockInspection[]): ParserBlockInspection[] =>
  inspections.flatMap((inspection) => [
    inspection,
    ...flattenInspections(inspection.children ?? []),
  ])

describe("storybook catalog", () => {
  it("renders every storybook story with markdown and committed capture assets", async () => {
    const blog = new NaverBlog()
    const stories = storybookCatalog.flatMap((group) => group.stories)

    expect(storybookCatalog.map((group) => group.editorLabel)).toEqual([
      "SmartEditor 4",
      "SmartEditor 3",
      "SmartEditor 2",
    ])
    expect(stories).toHaveLength(52)
    expect(stories.every((story) => story.inputHtml.trim())).toBe(true)
    expect(stories.every((story) => story.markdown.trim())).toBe(true)
    expect(new Set(stories.map((story) => story.storyKey)).size).toBe(stories.length)
    expect(new Set(stories.map((story) => story.screenshotSrc)).size).toBe(stories.length)
    expect(Object.keys(storybookCaptureAssets).sort()).toEqual(
      stories.map((story) => story.storyKey).sort(),
    )
    expect(stories.every((story) => !Object.hasOwn(story, "markdownVariants"))).toBe(true)

    stories.forEach((story) => {
      const editor = blog.getEditorForHtml(story.inputHtml)
      const $ = load(story.inputHtml)
      const matchedInspection = editor
        ? flattenInspections(
            editor.inspect({
              $,
              sourceUrl: story.sourceUrl,
              tags: [],
              options: storybookOptions,
            }),
          ).find((inspection) => inspection.path === story.inspectPath)
        : undefined

      expect(editor?.type).toBe(story.editorType)
      expect(matchedInspection).toMatchObject({
        matchedBlockId: story.blockId,
        matchedBlockLabel: story.blockLabel,
      })
    })

    stories.forEach((story) => {
      expect(storybookCaptureAssets[story.storyKey]).toBe(story.screenshotSrc)
    })

    const imageStory = stories.find((story) => story.blockId === "image")

    if (!imageStory) {
      throw new Error("missing image story")
    }

    expect(imageStory.markdown).toBe(await renderExpectedStoryMarkdown(imageStory))
  })
})
