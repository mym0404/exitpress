import type { ExportOptions } from "../../../domain/export-options/Types.js"
import type { BlockTemplateDefinition } from "../../../domain/template/Types.js"

import { renderBlockTemplatePreview } from "./BlockTemplatePreview.js"
import { editorOutputCardClass, OptionField } from "./OptionControls.js"

const blockTemplateCardClass =
  "grid content-start gap-4 rounded-none border-0 bg-transparent p-0 shadow-none"

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

const BlockTemplateCard = ({
  options,
  definition,
  onOptionsChange,
}: {
  options: ExportOptions
  definition: BlockTemplateDefinition
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const defaultPreset = definition.presets[0]

  if (!defaultPreset) {
    return null
  }

  const optionKeyPrefix = `block-templates-${definition.key.replace(/[^A-Za-z0-9_-]/g, "-")}`
  const selectedTemplate = options.blockOutputs.templates[definition.key] ?? ""
  const template = selectedTemplate || defaultPreset.template
  const previewSnippet = renderBlockTemplatePreview({
    definition,
    template,
    imageHandlingMode: options.assets.imageHandlingMode,
  })
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
    <section
      className={blockTemplateCardClass}
      data-block-template-card={definition.key}
      data-block-template-editor={getEditorKey(definition)}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-semibold tracking-[-0.03em] text-foreground">
          {definition.label}
        </h4>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4 self-start">
          <OptionField
            optionKey={optionKeyPrefix}
            labelFor={optionKeyPrefix}
            label="Block template"
            surface="plain"
          >
            <textarea
              id={optionKeyPrefix}
              aria-label="Block template"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground shadow-sm transition-colors outline-none focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedTemplate}
              onChange={(event) => updateTemplate(event.target.value)}
            />
          </OptionField>
        </div>

        <div className="grid content-start gap-2 self-start">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Preview
          </span>
          <pre className="block-output-preview-surface code-surface overflow-x-auto whitespace-pre-wrap rounded-2xl px-3 py-3 font-mono text-[0.8125rem] leading-6 text-foreground">
            {previewSnippet}
          </pre>
        </div>
      </div>
    </section>
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
              <BlockTemplateCard
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
