import type { UploadProviderFieldDefinition } from "@exitpress/domain/upload/UploadProviderTypes.js"

import {
  inferInputType,
  normalizeDefaultValue,
  normalizeFieldOptions,
} from "./ImageUploadFieldValueDefinition.js"
import {
  commonFieldMetadata,
  providerDescriptionMap,
  providerFieldMetadataMap,
  providerLabelMap,
} from "./ImageUploadProviderMetadata.js"

export type RuntimePluginField = {
  name?: string
  type?: string
  alias?: unknown
  required?: boolean
  default?: unknown
  message?: unknown
  prefix?: unknown
  choices?: unknown
}

const hasAscii = (value: string) => /[A-Za-z]/.test(value)
const containsCjk = (value: string) => /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(value)

const toTitleCaseLabel = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      const upper = part.toUpperCase()

      if (["ACL", "API", "COS", "ID", "OSS", "S3", "SMMS", "URL"].includes(upper)) {
        return upper
      }

      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(" ")

export const getProviderDescription = ({ key, label }: { key: string; label: string }) =>
  providerDescriptionMap[key] ?? `${label}로 이미지를 업로드합니다.`

const getCommonFieldMetadata = (key: string) => commonFieldMetadata[key] ?? null

const getProviderFieldMetadata = ({
  providerKey,
  fieldKey,
}: {
  providerKey: string
  fieldKey: string
}) => providerFieldMetadataMap[providerKey]?.[fieldKey] ?? null

const normalizeFieldLabel = ({
  providerKey,
  key,
  alias,
}: {
  providerKey: string
  key: string
  alias: unknown
}) => {
  const curatedLabel =
    getProviderFieldMetadata({
      providerKey,
      fieldKey: key,
    })?.label ?? getCommonFieldMetadata(key)?.label

  if (curatedLabel) {
    return curatedLabel
  }

  if (typeof alias === "string" && hasAscii(alias) && !containsCjk(alias)) {
    return alias.trim()
  }

  return toTitleCaseLabel(key)
}

export const normalizeProviderLabel = (key: string, label: unknown) => {
  if (providerLabelMap[key]) {
    return providerLabelMap[key]
  }

  if (typeof label === "string" && hasAscii(label)) {
    return label.trim()
  }

  return toTitleCaseLabel(key)
}

const normalizeFieldDescription = ({
  providerKey,
  key,
  label,
  inputType,
}: {
  providerKey: string
  key: string
  label: string
  inputType: UploadProviderFieldDefinition["inputType"]
}) =>
  getProviderFieldMetadata({
    providerKey,
    fieldKey: key,
  })?.description ??
  getCommonFieldMetadata(key)?.description ??
  (inputType === "checkbox" ? `${label} 옵션입니다.` : `${label} 값을 입력합니다.`)

const normalizeFieldPlaceholder = ({
  providerKey,
  key,
  rawPlaceholder,
}: {
  providerKey: string
  key: string
  rawPlaceholder: unknown
}) => {
  const curatedPlaceholder =
    getProviderFieldMetadata({
      providerKey,
      fieldKey: key,
    })?.placeholder ?? getCommonFieldMetadata(key)?.placeholder

  if (curatedPlaceholder) {
    return curatedPlaceholder
  }

  if (typeof rawPlaceholder !== "string") {
    return ""
  }

  const trimmed = rawPlaceholder.trim()

  if (!trimmed || containsCjk(trimmed)) {
    return ""
  }

  return trimmed
}

export const normalizeFieldDefinition = ({
  providerKey,
  field,
}: {
  providerKey: string
  field: RuntimePluginField
}): UploadProviderFieldDefinition | null => {
  const key = field.name?.trim()

  if (!key) {
    return null
  }

  const inputType = inferInputType({
    key,
    type: field.type,
    defaultValue: field.default,
  })
  const label = normalizeFieldLabel({
    providerKey,
    key,
    alias: field.alias,
  })

  return {
    key,
    label,
    description: normalizeFieldDescription({
      providerKey,
      key,
      label,
      inputType,
    }),
    inputType,
    required: field.required === true,
    defaultValue: normalizeDefaultValue({
      inputType,
      defaultValue: field.default,
    }),
    placeholder: normalizeFieldPlaceholder({
      providerKey,
      key,
      rawPlaceholder:
        typeof field.message === "string"
          ? field.message
          : typeof field.prefix === "string"
            ? field.prefix
            : "",
    }),
    options: normalizeFieldOptions(field.choices),
  }
}
