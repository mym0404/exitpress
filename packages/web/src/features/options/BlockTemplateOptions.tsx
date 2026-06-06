import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"

import { BlockTemplateCard } from "./BlockTemplateCard.js"
import { editorOutputCardClass } from "./OptionControls.js"

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
  onOptionsChange,
}: {
  options: ExportOptions
  definition: BlockTemplateDefinition
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const selectedTemplate = options.blockOutputs.templates[definition.key] ?? ""
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
        onTemplateChange={updateTemplate}
      />
    </div>
  )
}

export const MarkdownOptionsStep = ({
  options,
  blockTemplateDefinitions,
  onOptionsChange,
}: {
  options: ExportOptions
  blockTemplateDefinitions: BlockTemplateDefinition[]
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const blockTemplateGroups = groupBlockTemplateDefinitionsByEditor(blockTemplateDefinitions)

  return (
    <section className="option-section grid gap-4">
      {blockTemplateGroups.map((group) => (
        <div
          key={group.editorKey}
          className={editorOutputCardClass}
          data-block-template-editor-group={group.editorKey}
        >
          <h3 className="text-base font-semibold tracking-[-0.03em] text-foreground">
            {group.editorLabel}
          </h3>
          <div className="grid gap-4 xl:grid-cols-2">
            {group.definitions.map((definition) => (
              <EditableBlockTemplateCard
                key={definition.key}
                options={options}
                definition={definition}
                onOptionsChange={onOptionsChange}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
