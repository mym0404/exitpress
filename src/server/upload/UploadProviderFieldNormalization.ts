import type {
  UploadProviderCatalogResponse,
  UploadProviderFieldDefinition,
  UploadProviderValue,
} from "../../domain/upload/UploadProviderTypes.js"
import type { UnknownRecord } from "../../shared/object/UnknownRecord.js"

const coerceCheckboxValue = (rawValue: unknown) => {
  if (typeof rawValue === "boolean") {
    return rawValue
  }

  if (typeof rawValue !== "string") {
    return null
  }

  const normalized = rawValue.trim().toLowerCase()

  if (normalized === "true" || normalized === "1" || normalized === "on") {
    return true
  }

  if (normalized === "false" || normalized === "0" || normalized === "off") {
    return false
  }

  return null
}

const coerceNumberValue = (rawValue: unknown) => {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue
  }

  if (typeof rawValue !== "string") {
    return null
  }

  const trimmed = rawValue.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) ? parsed : null
}

const coerceSelectValue = ({
  rawValue,
  field,
}: {
  rawValue: unknown
  field: UploadProviderFieldDefinition
}) => {
  if (!field.options || field.options.length === 0) {
    return typeof rawValue === "string" && rawValue.trim() ? rawValue.trim() : null
  }

  const matched = field.options.find((option) => String(option.value) === String(rawValue))

  return matched?.value ?? null
}

const coerceTextValue = (rawValue: unknown) => {
  if (typeof rawValue !== "string") {
    return null
  }

  const trimmed = rawValue.trim()

  return trimmed ? trimmed : null
}

export const normalizeProviderFieldsFromCatalog = ({
  catalog,
  providerKey,
  value,
}: {
  catalog: UploadProviderCatalogResponse
  providerKey: string
  value: unknown
}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const provider = catalog.providers.find((item) => item.key === providerKey)

  if (!provider) {
    return null
  }

  const entries: Array<readonly [string, UploadProviderValue]> = []

  for (const field of provider.fields) {
    const rawValue = (value as UnknownRecord)[field.key]

    if (rawValue === undefined || rawValue === null) {
      continue
    }

    if (field.inputType === "checkbox") {
      const coerced = coerceCheckboxValue(rawValue)

      if (coerced !== null) {
        entries.push([field.key, coerced] as const)
      }

      continue
    }

    if (field.inputType === "number") {
      const coerced = coerceNumberValue(rawValue)

      if (coerced !== null) {
        entries.push([field.key, coerced] as const)
      }

      continue
    }

    if (field.inputType === "select") {
      const coerced = coerceSelectValue({ rawValue, field })

      if (coerced !== null) {
        entries.push([field.key, coerced] as const)
      }

      continue
    }

    const coerced = coerceTextValue(rawValue)

    if (coerced !== null) {
      entries.push([field.key, coerced] as const)
    }
  }

  return entries.length > 0 ? Object.fromEntries(entries) : null
}
