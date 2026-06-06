import { UPLOAD_PROVIDER_KEYS } from "@exitpress/domain/upload/UploadProviderKeys.js"
import { toErrorMessage } from "@exitpress/engine/shared/error/util/toErrorMessage.js"

import type { UploadProviderFields } from "@exitpress/domain/upload/schema/UploadProvider.js"

export const normalizeUploaderConfig = ({
  uploaderKey,
  providerFields,
}: {
  uploaderKey: string
  providerFields: UploadProviderFields
}) =>
  Object.fromEntries(
    Object.entries(providerFields).flatMap(([key, value]) => {
      if (
        uploaderKey === UPLOAD_PROVIDER_KEYS.GITHUB &&
        key === "path" &&
        typeof value === "string"
      ) {
        const normalizedPath = value
          .split("/")
          .map((segment) => segment.trim())
          .filter(Boolean)
          .join("/")

        return normalizedPath ? [[key, normalizedPath]] : []
      }

      return [[key, value]]
    }),
  )

export const sanitizeUploadError = ({
  error,
  providerFields,
}: {
  error: unknown
  providerFields: UploadProviderFields
}) => {
  const rawMessage = toErrorMessage(error).replace(/\s+/g, " ").trim()

  if (!rawMessage) {
    return "Image upload failed."
  }

  return Object.values(providerFields)
    .flatMap((value) => (typeof value === "string" ? [value] : []))
    .filter((value) => value.length >= 3)
    .sort((left, right) => right.length - left.length)
    .reduce((message, secret) => message.replaceAll(secret, "[redacted]"), rawMessage)
    .slice(0, 240)
}
