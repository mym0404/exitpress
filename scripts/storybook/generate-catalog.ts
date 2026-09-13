import { execFileSync } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { parsePostHtml } from "@exitpress/blog-naver/parsing/naver-blog/core/PostParser.js"
import { NaverBlog } from "@exitpress/blog-naver/parsing/naver-blog/NaverBlog.js"
import {
  getTistoryBlockTemplateDefinitions,
  parseTistoryPostHtml,
} from "@exitpress/blog-tistory/parsing/TistoryPostParser.js"
import { resolveParsedBlockAssetsForRender } from "@exitpress/engine/exporting/assets/ParsedBlockAssetResolver.js"
import { renderBlockTemplates } from "@exitpress/engine/markdown/util/renderBlockTemplates.js"
import { storybookDefinitions } from "@exitpress/web/features/storybook/data/StorybookDefinitions.js"

import type { StorybookEditorGroup } from "@exitpress/web/features/storybook/schema/Storybook.js"
import type { StorybookDefinition } from "@exitpress/web/features/storybook/schema/StorybookDefinition.js"

const repoRoot = fileURLToPath(new URL("../..", import.meta.url))
const outputPath = path.join(
  repoRoot,
  "packages/web/src/features/storybook/generated/StorybookCatalog.generated.ts",
)
const emptyOutputMarkdown = "Markdown 출력 없음"
const storybookOptions = { blockOutputs: { templates: {} } }
const blockTemplateDefinitions = [
  ...new NaverBlog().getBlockTemplateDefinitions(),
  ...getTistoryBlockTemplateDefinitions(),
]
const defaultBlockTemplates = Object.fromEntries(
  blockTemplateDefinitions.map((definition) => [definition.key, definition.presets[0].template]),
)
const blockTemplateDefinitionByKey = Object.fromEntries(
  blockTemplateDefinitions.map((definition) => [definition.key, definition]),
)

const renderStoryMarkdown = async (definition: StorybookDefinition) => {
  const parsedPost =
    definition.editorType === "tistory"
      ? parseTistoryPostHtml({ html: definition.inputHtml, options: storybookOptions })
      : parsePostHtml({
          html: definition.inputHtml,
          sourceUrl: definition.sourceUrl,
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
    resolved.blocks.map((block) => {
      const template = defaultBlockTemplates[block.blockId]

      if (!template) {
        throw new Error(`Storybook block template is missing: ${block.blockId}`)
      }

      return {
        template,
        props: block.props,
      }
    }),
  )

  return markdown || emptyOutputMarkdown
}

const buildStorybookCatalog = async (): Promise<StorybookEditorGroup[]> => {
  const groups: StorybookEditorGroup[] = []

  for (const definition of storybookDefinitions) {
    const templateDefinition =
      blockTemplateDefinitionByKey[`${definition.editorType}:${definition.blockId}`]

    if (!templateDefinition) {
      throw new Error(
        `Storybook block template definition is missing: ${definition.editorType}:${definition.blockId}`,
      )
    }

    const story = {
      ...definition,
      markdown: await renderStoryMarkdown(definition),
      templateDefinition,
    }
    const existingGroup = groups.find((group) => group.editorType === definition.editorType)

    if (existingGroup) {
      existingGroup.stories.push(story)
      continue
    }

    groups.push({
      editorType: definition.editorType,
      editorLabel: definition.editorLabel,
      stories: [story],
    })
  }

  return groups
}

const serializeCatalog = (catalog: StorybookEditorGroup[]) =>
  `import type { StorybookEditorGroup } from "../schema/Storybook.js"

export const generatedStorybookCatalog: StorybookEditorGroup[] = ${JSON.stringify(catalog, null, 2)}
`

const formatCatalog = (source: string) =>
  execFileSync(path.join(repoRoot, "node_modules/.bin/oxfmt"), ["--stdin-filepath", outputPath], {
    input: source,
    encoding: "utf8",
  })

const run = async () => {
  const expected = formatCatalog(serializeCatalog(await buildStorybookCatalog()))

  if (process.argv.includes("--check")) {
    const current = await readFile(outputPath, "utf8")

    if (current !== expected) {
      console.error("Storybook generated catalog is stale. Run `pnpm storybook:generate`.")
      process.exitCode = 1
    }

    return
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, expected)
}

await run()
