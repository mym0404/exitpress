import { Box } from "@primer/react"

import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"

import { BlockTemplateCard } from "./BlockTemplateCard.js"

const editorLabelByKey: Record<string, string> = {
  "naver-se2": "SmartEditor 2",
  "naver-se3": "SmartEditor 3",
  "naver-se4": "SmartEditor 4",
}

const getEditorKey = (definition: BlockTemplateDefinition) => definition.key.split(":")[0] ?? ""

const groupBlockTemplateDefinitionsByEditor = (definitions: BlockTemplateDefinition[]) =>
  definitions.reduce(
    (groups, definition) => {
      const editorKey = getEditorKey(definition)
      const existingGroup = groups.find((group) => group.editorKey === editorKey)

      if (existingGroup) {
        existingGroup.definitions.push(definition)
        return groups
      }

      groups.push({
        editorKey,
        editorLabel: editorLabelByKey[editorKey] ?? editorKey,
        definitions: [definition],
      })

      return groups
    },
    [] as {
      editorKey: string
      editorLabel: string
      definitions: BlockTemplateDefinition[]
    }[],
  )

const EditableBlockTemplateCard = ({
  options,
  definition,
  themePreference,
  onOptionsChange,
}: {
  options: ExportOptions
  definition: BlockTemplateDefinition
  themePreference: ThemePreference
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const selectedTemplate = Object.hasOwn(options.blockOutputs.templates, definition.key)
    ? options.blockOutputs.templates[definition.key]
    : undefined
  const updateTemplate = (template: string) => {
    onOptionsChange((current) => {
      return {
        ...current,
        blockOutputs: {
          ...current.blockOutputs,
          templates: {
            ...current.blockOutputs.templates,
            [definition.key]: template,
          },
        },
      }
    })
  }

  return (
    <div data-block-template-editor={getEditorKey(definition)}>
      <BlockTemplateCard
        definition={definition}
        template={selectedTemplate}
        themePreference={themePreference}
        onTemplateChange={updateTemplate}
      />
    </div>
  )
}

export const MarkdownOptionsStep = ({
  options,
  blockTemplateDefinitions,
  themePreference,
  onOptionsChange,
}: {
  options: ExportOptions
  blockTemplateDefinitions: BlockTemplateDefinition[]
  themePreference: ThemePreference
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const blockTemplateGroups = groupBlockTemplateDefinitionsByEditor(blockTemplateDefinitions)

  return (
    <Box as="section" sx={{ display: "grid", gap: 3 }}>
      {blockTemplateGroups.map((group) => (
        <Box
          key={group.editorKey}
          data-block-template-editor-group={group.editorKey}
          sx={{
            bg: "canvas.default",
            border: "1px solid",
            borderColor: "border.default",
            borderRadius: 2,
            display: "grid",
            gap: 3,
            p: 3,
          }}
        >
          <Box as="h3" sx={{ fontSize: 2, fontWeight: "semibold", m: 0 }}>
            {group.editorLabel}
          </Box>
          <Box
            sx={{ display: "grid", gap: 3, gridTemplateColumns: ["1fr", null, null, "1fr 1fr"] }}
          >
            {group.definitions.map((definition) => (
              <EditableBlockTemplateCard
                key={definition.key}
                options={options}
                definition={definition}
                themePreference={themePreference}
                onOptionsChange={onOptionsChange}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
