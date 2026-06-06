export type UploadProviderValue = string | number | boolean

export type UploadProviderFields = Record<string, UploadProviderValue>

type UploadProviderInputType = "text" | "password" | "number" | "select" | "checkbox"

export type UploadProviderOptionValue = string | number

type UploadProviderFieldOption = {
  label: string
  value: UploadProviderOptionValue
}

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

export type UploadProviderDefinition = {
  key: string
  label: string
  description: string
  fields: UploadProviderFieldDefinition[]
}

export type UploadProviderCatalogResponse = {
  defaultProviderKey: string | null
  providers: UploadProviderDefinition[]
}
