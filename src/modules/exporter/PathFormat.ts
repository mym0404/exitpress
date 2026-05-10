import type { SlugStyle, SlugWhitespace } from "./Types.js"

const invalidPathCharacterPattern = /[<>:"/\\|?*\u0000-\u001f]/g
const leadingDashPattern = /^-\s*/
const multipleDashPattern = /-+/g
const multipleUnderscorePattern = /_+/g
const multipleWhitespacePattern = /\s+/g

export const sanitizeCategoryName = (value: string) =>
  value.replace(leadingDashPattern, "").trim()

export const sanitizePathSegment = (value: string) => {
  const cleaned = sanitizeCategoryName(value)
    .replace(invalidPathCharacterPattern, " ")
    .replace(multipleWhitespacePattern, " ")
    .trim()

  return cleaned || "untitled"
}

export const slugifyTitle = (value: string) => {
  const slug = sanitizePathSegment(value)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(multipleDashPattern, "-")
    .replace(/^-|-$/g, "")

  return slug || "post"
}

export const formatTitleSegment = ({
  value,
  slugStyle,
  slugWhitespace,
}: {
  value: string
  slugStyle: SlugStyle
  slugWhitespace: SlugWhitespace
}) => {
  const sanitized = sanitizePathSegment(value)
  const normalized = slugStyle === "keep-title" ? sanitized : sanitized.toLowerCase()
  const formatted = (() => {
    switch (slugWhitespace) {
      case "dash":
        return normalized
          .replace(multipleWhitespacePattern, "-")
          .replace(multipleDashPattern, "-")
          .replace(/^-|-$/g, "")
      case "underscore":
        return normalized
          .replace(multipleWhitespacePattern, "_")
          .replace(multipleUnderscorePattern, "_")
          .replace(/^_+|_+$/g, "")
      case "keep-space":
        return normalized.replace(multipleWhitespacePattern, " ").trim()
    }
  })()

  return formatted || (slugStyle === "keep-title" ? "untitled" : "post")
}

export const formatCategorySegment = ({
  value,
  slugStyle,
  slugWhitespace,
}: {
  value: string
  slugStyle: SlugStyle
  slugWhitespace: SlugWhitespace
}) =>
  formatTitleSegment({
    value: value.trim() || "uncategorized",
    slugStyle,
    slugWhitespace,
  })

export const getDateSlug = (isoDateTime: string) => isoDateTime.slice(0, 10)
