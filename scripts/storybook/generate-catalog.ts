import { execFileSync } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { renderBlockTemplates } from "@exitpress/engine/markdown/utils/renderBlockTemplates.js"
import { parsePostHtml } from "@exitpress/engine/parsing/naver-blog/core/PostParser.js"
import {
  createNaverBlogDefaultBlockTemplateMap,
  NaverBlog,
} from "@exitpress/engine/parsing/naver-blog/NaverBlog.js"
import { storybookDefinitions } from "@exitpress/web/features/storybook/data/StorybookDefinitions.js"

import type { ParsedBlock } from "@exitpress/domain/parser/Types.js"
import type { StorybookDefinition } from "@exitpress/web/features/storybook/data/StorybookDefinition.js"
import type { StorybookEditorGroup } from "@exitpress/web/features/storybook/StorybookTypes.js"

const repoRoot = fileURLToPath(new URL("../..", import.meta.url))
const outputPath = path.join(
  repoRoot,
  "packages/web/src/features/storybook/generated/StorybookCatalog.generated.ts",
)
const emptyOutputMarkdown = "Markdown 출력 없음"
const storybookOptions = { blockOutputs: { templates: {} } }
const defaultBlockTemplates = createNaverBlogDefaultBlockTemplateMap()
const blockTemplateDefinitions = new NaverBlog().getBlockTemplateDefinitions()
const blockTemplateDefinitionByKey = Object.fromEntries(
  blockTemplateDefinitions.map((definition) => [definition.key, definition]),
)

const resolveStoryBlockProps = (block: ParsedBlock) => {
  const props = { ...block.props }

  Object.entries(block.assets ?? {}).forEach(([propName, asset]) => {
    props[propName] = asset.sourceUrl
  })

  return props
}

const renderStoryMarkdown = (definition: StorybookDefinition) => {
  const parsedPost = parsePostHtml({
    html: definition.inputHtml,
    sourceUrl: definition.sourceUrl,
    options: storybookOptions,
  })
  const markdown = renderBlockTemplates(
    parsedPost.blocks.map((block) => {
      const template = defaultBlockTemplates[block.blockId]

      if (!template) {
        throw new Error(`Storybook block template is missing: ${block.blockId}`)
      }

      return {
        template,
        props: resolveStoryBlockProps(block),
      }
    }),
  )

  return markdown || emptyOutputMarkdown
}

const buildStorybookCatalog = (): StorybookEditorGroup[] => {
  const groups: StorybookEditorGroup[] = []

  storybookDefinitions.forEach((definition) => {
    const story = {
      ...definition,
      markdown: renderStoryMarkdown(definition),
      templateDefinition:
        blockTemplateDefinitionByKey[`${definition.editorType}:${definition.blockId}`],
    }
    const existingGroup = groups.find((group) => group.editorType === definition.editorType)

    if (existingGroup) {
      existingGroup.stories.push(story)
      return
    }

    groups.push({
      editorType: definition.editorType,
      editorLabel: definition.editorLabel,
      stories: [story],
    })
  })

  return groups
}

const serializeCatalog = (catalog: StorybookEditorGroup[]) =>
  `import type { StorybookEditorGroup } from "../StorybookTypes.js"

export const generatedStorybookCatalog: StorybookEditorGroup[] = ${JSON.stringify(catalog, null, 2)}
`

const formatCatalog = (source: string) =>
  execFileSync(path.join(repoRoot, "node_modules/.bin/oxfmt"), ["--stdin-filepath", outputPath], {
    input: source,
    encoding: "utf8",
  })

const run = async () => {
  const expected = formatCatalog(serializeCatalog(buildStorybookCatalog()))

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
