import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"

import { getCustomTemplatePresetValue, TemplateEditorCard } from "./TemplateEditorCard.js"

const toBlockTemplateControlId = (key: string) => key.replace(/[^A-Za-z0-9_-]/g, "-")

const getDefaultTemplate = (definition: BlockTemplateDefinition) =>
  definition.presets[0]?.template ?? ""

const getSelectedPresetId = ({
  definition,
  template,
}: {
  definition: BlockTemplateDefinition
  template: string
}) => definition.presets.find((preset) => preset.template === template)?.id

export const getEffectiveBlockTemplate = ({
  definition,
  template,
}: {
  definition: BlockTemplateDefinition
  template?: string
}) => template || getDefaultTemplate(definition)

export const BlockTemplateCard = ({
  definition,
  template,
  readOnly = false,
  onTemplateChange,
}: {
  definition: BlockTemplateDefinition
  template?: string
  readOnly?: boolean
  onTemplateChange?: (template: string) => void
}) => {
  const controlId = toBlockTemplateControlId(definition.key)
  const effectiveTemplate = getEffectiveBlockTemplate({ definition, template })
  const selectedPresetId =
    getSelectedPresetId({ definition, template: effectiveTemplate }) ??
    getCustomTemplatePresetValue()

  if (!definition.presets[0]) {
    return null
  }

  const selectPreset = (presetId: string) => {
    const preset = definition.presets.find((candidate) => candidate.id === presetId)

    if (preset) {
      onTemplateChange?.(preset.template)
    }
  }

  return (
    <TemplateEditorCard
      title={definition.label}
      badge={definition.key}
      editorId={`block-template-editor-${controlId}`}
      presetId={selectedPresetId}
      presetSelectId={`block-template-preset-${controlId}`}
      presets={definition.presets}
      props={definition.props}
      value={effectiveTemplate}
      readOnly={readOnly}
      data-block-template-card={definition.key}
      onPresetChange={selectPreset}
      onTemplateChange={onTemplateChange}
    />
  )
}
