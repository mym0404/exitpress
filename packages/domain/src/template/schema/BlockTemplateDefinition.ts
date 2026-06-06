export const allTemplatePropTypes = [
  "string",
  "number",
  "boolean",
  "object",
  "array",
  "string?",
  "number?",
  "boolean?",
  "object?",
  "array?",
] as const
// Template prop shape exposed to autocomplete and documentation.
export type TemplatePropType = (typeof allTemplatePropTypes)[number]

// Label and value type for one template interpolation prop.
export type TemplatePropDefinition = {
  label: string
  type: TemplatePropType
}

export type BlockTemplatePreset = {
  id: string
  label: string
  template: string
}

// A block template describes renderer presets and available interpolation props.
export type BlockTemplateDefinition = {
  key: string
  label: string
  presets: [BlockTemplatePreset, ...BlockTemplatePreset[]]
  props: Record<string, TemplatePropDefinition>
}
