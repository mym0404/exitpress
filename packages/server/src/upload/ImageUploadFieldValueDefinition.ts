import type {
  UploadProviderFieldDefinition,
  UploadProviderOptionValue,
  UploadProviderValue,
} from "@exitpress/domain/upload/UploadProviderTypes.js"

const containsCjk = (value: string) => /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(value)

export const inferInputType = ({
  key,
  type,
  defaultValue,
}: {
  key: string
  type: string | undefined
  defaultValue: unknown
}): UploadProviderFieldDefinition["inputType"] => {
  if (type === "list") {
    return "select"
  }

  if (type === "confirm") {
    return "checkbox"
  }

  if (typeof defaultValue === "number" || /(?:^|[^a-z])(port|expireTime)(?:$|[^a-z])/i.test(key)) {
    return "number"
  }

  if (/(token|password|secret|passphrase|privateKey|accessKeySecret|secretAccessKey)/i.test(key)) {
    return "password"
  }

  return "text"
}

const normalizeOptionLabel = (value: unknown, rawLabel: unknown) => {
  if (typeof rawLabel === "string" && rawLabel.trim() && !containsCjk(rawLabel)) {
    return rawLabel.trim()
  }

  if (typeof value === "string") {
    return containsCjk(value) ? String(value) : value
  }

  return String(value)
}

export const normalizeFieldOptions = (
  choices: unknown,
): UploadProviderFieldDefinition["options"] => {
  if (!Array.isArray(choices)) {
    return undefined
  }

  const options = choices.flatMap((choice) => {
    if (typeof choice === "string" || typeof choice === "number") {
      return [
        {
          label: normalizeOptionLabel(choice, choice),
          value: choice,
        },
      ]
    }

    if (
      choice &&
      typeof choice === "object" &&
      "name" in choice &&
      "value" in choice &&
      (typeof choice.value === "string" || typeof choice.value === "number")
    ) {
      return [
        {
          label: normalizeOptionLabel(choice.value, choice.name),
          value: choice.value as UploadProviderOptionValue,
        },
      ]
    }

    return []
  })

  return options.length > 0 ? options : undefined
}

export const normalizeDefaultValue = ({
  inputType,
  defaultValue,
}: {
  inputType: UploadProviderFieldDefinition["inputType"]
  defaultValue: unknown
}): UploadProviderValue | null => {
  if (defaultValue === undefined || defaultValue === null || defaultValue === "") {
    return inputType === "checkbox" ? false : null
  }

  if (inputType === "checkbox") {
    return Boolean(defaultValue)
  }

  if (inputType === "number") {
    if (typeof defaultValue === "number" && Number.isFinite(defaultValue)) {
      return defaultValue
    }

    if (typeof defaultValue === "string" && defaultValue.trim()) {
      const parsed = Number(defaultValue)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  if (typeof defaultValue === "string" || typeof defaultValue === "number") {
    return defaultValue
  }

  return null
}
