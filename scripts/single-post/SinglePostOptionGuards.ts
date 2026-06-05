const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const formatContext = (context: string, key: string) => `${context}.${key}`

export const failOptions = (optionsPath: string, message: string): never => {
  throw new Error(`Invalid --options JSON in ${optionsPath}: ${message}`)
}

export function assertPlainObject(
  value: unknown,
  context: string,
  optionsPath: string,
): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    failOptions(optionsPath, `${context} must be an object`)
  }
}

export const assertAllowedKeys = (
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  context: string,
  optionsPath: string,
) => {
  const unexpectedKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key))

  if (unexpectedKeys.length > 0) {
    failOptions(optionsPath, `${context} contains unsupported keys: ${unexpectedKeys.join(", ")}`)
  }
}

export function assertBoolean(
  value: unknown,
  context: string,
  optionsPath: string,
): asserts value is boolean {
  if (typeof value !== "boolean") {
    failOptions(optionsPath, `${context} must be a boolean`)
  }
}

export function assertString(
  value: unknown,
  context: string,
  optionsPath: string,
): asserts value is string {
  if (typeof value !== "string") {
    failOptions(optionsPath, `${context} must be a string`)
  }
}

export function assertNullableString(
  value: unknown,
  context: string,
  optionsPath: string,
): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    failOptions(optionsPath, `${context} must be a string or null`)
  }
}

export function assertNumberArray(
  value: unknown,
  context: string,
  optionsPath: string,
): asserts value is number[] {
  const items: unknown[] | null = Array.isArray(value) ? value : null

  if (items === null) {
    failOptions(optionsPath, `${context} must be an array of numbers`)
    return
  }

  items.forEach((item, index) => {
    if (typeof item !== "number" || !Number.isFinite(item)) {
      failOptions(optionsPath, `${formatContext(context, String(index))} must be a finite number`)
    }
  })
}

export function assertEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  context: string,
  optionsPath: string,
): asserts value is T {
  if (typeof value !== "string" || !allowedValues.some((allowedValue) => allowedValue === value)) {
    failOptions(optionsPath, `${context} must be one of: ${allowedValues.join(", ")}`)
  }
}
