import type { EditorBlockOutputDefinition } from "../../../domain/ast/Types.js"
import type { ExportOptions } from "../../../domain/export-options/Types.js"
import { resolveBlockOutputSelection } from "../../../domain/export-options/BlockOutputSelection.js"
import { Input } from "../../components/ui/Input.js"
import { renderBlockOutputPreview } from "./BlockOutputPreview.js"
import {
  CheckField,
  editorOutputCardClass,
  OptionField,
  OptionSelectField,
} from "./OptionControls.js"

const blockOutputCardClass =
  "grid content-start gap-4 rounded-none border-0 bg-transparent p-0 shadow-none"

const groupBlockOutputDefinitionsByEditor = (definitions: EditorBlockOutputDefinition[]) =>
  definitions.reduce(
    (groups, definition) => {
      const existingGroup = groups.find((group) => group.editorType === definition.editorType)

      if (existingGroup) {
        existingGroup.definitions.push(definition)
        return groups
      }

      groups.push({
        editorType: definition.editorType,
        editorLabel: definition.editorLabel,
        definitions: [definition],
      })

      return groups
    },
    [] as {
      editorType: EditorBlockOutputDefinition["editorType"]
      editorLabel: string
      definitions: EditorBlockOutputDefinition[]
    }[],
  )

const BlockOutputCard = ({
  options,
  family,
  onOptionsChange,
}: {
  options: ExportOptions
  family: EditorBlockOutputDefinition
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const defaultOption = family.options.find((option) => option.isDefault) ?? family.options[0]

  if (!defaultOption) {
    return null
  }

  const selection = resolveBlockOutputSelection({
    blockType: defaultOption.preview.type,
    outputOptions: family.options,
    blockOutputs: options.blockOutputs,
    selectionKey: family.key,
  })
  const selectedOption =
    family.options.find((option) => option.id === selection.variant) ?? defaultOption
  const previewSnippet = renderBlockOutputPreview({
    block: selectedOption.preview,
    selection,
    imageHandlingMode: options.assets.imageHandlingMode,
  })
  const optionKeyPrefix = `blockOutputs-defaults-${family.key.replace(/[^A-Za-z0-9_-]/g, "-")}`
  const updateSelection = (
    updater: (current: NonNullable<typeof selection>) => NonNullable<typeof selection>,
  ) => {
    onOptionsChange((current) => {
      const currentSelection = resolveBlockOutputSelection({
        blockType: selectedOption.preview.type,
        outputOptions: family.options,
        blockOutputs: current.blockOutputs,
        selectionKey: family.key,
      })
      const nextSelection = updater(currentSelection)

      return {
        ...current,
        blockOutputs: {
          ...current.blockOutputs,
          defaults: {
            ...current.blockOutputs.defaults,
            [family.key]: nextSelection,
          },
        },
      }
    })
  }

  return (
    <section
      className={blockOutputCardClass}
      data-block-output-card={family.key}
      data-block-output-block={selectedOption.preview.type}
      data-block-output-editor={family.editorType}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-semibold tracking-[-0.03em] text-foreground">
          {family.blockLabel}
        </h4>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4 self-start">
          {family.options.length > 1 ? (
            <OptionField
              optionKey={`${optionKeyPrefix}-variant`}
              labelFor={`${optionKeyPrefix}-variant`}
              label="출력 방식"
              surface="plain"
            >
              <OptionSelectField
                inputId={`${optionKeyPrefix}-variant`}
                value={selection.variant}
                options={family.options.map((option) => ({
                  value: option.id,
                  label: option.label,
                  description: option.description,
                }))}
                onValueChange={(variant) =>
                  updateSelection((current) => ({
                    ...current,
                    variant,
                  }))
                }
              />
            </OptionField>
          ) : null}

          {selectedOption.params?.map((param) =>
            param.input === "boolean" ? (
              <CheckField
                key={`${optionKeyPrefix}-${param.key}`}
                inputId={`${optionKeyPrefix}-${param.key}`}
                optionKey={`${optionKeyPrefix}-${param.key}`}
                label={param.label}
                description={param.description}
                compact
                checked={selection.params?.[param.key] === true}
                onChange={(checked) =>
                  updateSelection((current) => ({
                    ...current,
                    params: {
                      ...(current.params ?? {}),
                      [param.key]: checked,
                    },
                  }))
                }
              />
            ) : (
              <OptionField
                key={`${optionKeyPrefix}-${param.key}`}
                optionKey={`${optionKeyPrefix}-${param.key}`}
                label={param.label}
                description={param.description}
                surface="plain"
              >
                <Input
                  id={`${optionKeyPrefix}-${param.key}`}
                  type={param.input === "number" ? "number" : "text"}
                  value={String(selection.params?.[param.key] ?? "")}
                  onChange={(event) =>
                    updateSelection((current) => ({
                      ...current,
                      params: {
                        ...(current.params ?? {}),
                        [param.key]:
                          param.input === "number"
                            ? Number(event.target.value || "0")
                            : event.target.value,
                      },
                    }))
                  }
                />
              </OptionField>
            ),
          )}
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
  blockOutputDefinitions,
  onOptionsChange,
}: {
  options: ExportOptions
  blockOutputDefinitions: EditorBlockOutputDefinition[]
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const blockOutputGroups = groupBlockOutputDefinitionsByEditor(blockOutputDefinitions)

  return (
    <section className="option-section grid gap-4">
      {blockOutputGroups.map((group) => (
        <div
          key={group.editorType}
          className={editorOutputCardClass}
          data-block-output-editor-group={group.editorType}
        >
          <h3 className="text-base font-semibold tracking-[-0.03em] text-foreground">
            {group.editorLabel}
          </h3>
          <div className="grid gap-4 xl:grid-cols-2">
            {group.definitions.map((family) => (
              <BlockOutputCard
                key={family.key}
                options={options}
                family={family}
                onOptionsChange={onOptionsChange}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
