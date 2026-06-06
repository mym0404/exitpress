// Primitive values accepted by runtime upload provider fields.
export type UploadProviderValue = string | number | boolean

// Provider field values keyed by provider-defined field names.
export type UploadProviderFields = Record<string, UploadProviderValue>

export const allUploadProviderInputTypes = [
  "text",
  "password",
  "number",
  "select",
  "checkbox",
] as const
// Input control kind rendered for an upload provider field.
export type UploadProviderInputType = (typeof allUploadProviderInputTypes)[number]

// Primitive option value for select-like provider fields.
export type UploadProviderOptionValue = string | number

// One selectable option in an upload provider field.
export type UploadProviderFieldOption = {
  label: string
  value: UploadProviderOptionValue
}

// Runtime field metadata rendered by the upload provider form.
export type UploadProviderFieldDefinition = {
  key: string
  label: string
  description: string
  inputType: UploadProviderInputType
  required: boolean
  defaultValue: UploadProviderValue | null
  placeholder: string
  options?: UploadProviderFieldOption[]
}

// Runtime upload provider metadata sent by the server.
export type UploadProviderDefinition = {
  key: string
  label: string
  description: string
  fields: UploadProviderFieldDefinition[]
}

// Upload provider catalog sent from server runtime metadata to the web UI.
export type UploadProviderCatalogResponse = {
  defaultProviderKey: string | null
  providers: UploadProviderDefinition[]
}
