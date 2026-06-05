export type TemplateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | TemplateValue[]
  | { [key: string]: TemplateValue }

export type TemplatePropDefinition = {
  label: string
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "string?"
    | "number?"
    | "boolean?"
    | "object?"
    | "array?"
}

export type BlockTemplateDefinition = {
  key: string
  label: string
  presets: {
    id: string
    label: string
    template: string
  }[]
  props: Record<string, TemplatePropDefinition>
}

export type UploadRegistryEntry = {
  uploadKey: string
  status: "pending" | "uploading" | "uploaded" | "failed"
  localPath: string
  uploadedUrl?: string
  message?: string
}

export type UploadRegistrySnapshot = Record<string, UploadRegistryEntry>
