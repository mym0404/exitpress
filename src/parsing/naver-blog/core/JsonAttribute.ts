import type { UnknownRecord } from "../../../shared/object/UnknownRecord.js"

export const parseJsonAttribute = (value: string | undefined) => {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as UnknownRecord
  } catch {
    return null
  }
}
