import path from "node:path"

export type AssetCompressor = (input: {
  bytes: Buffer
  contentType: string | null
  sourceUrl: string
}) => Promise<Buffer>

export const extensionFromUrl = (value: string) => {
  try {
    const url = new URL(value)
    const extension = path.extname(url.pathname)

    return extension || ".jpg"
  } catch {
    return ".jpg"
  }
}

export const extensionFromContentType = (value: string | null) => {
  const normalized = value?.split(";")[0]?.trim().toLowerCase() ?? ""

  if (normalized === "image/png") {
    return ".png"
  }

  if (normalized === "image/gif") {
    return ".gif"
  }

  if (normalized === "image/webp") {
    return ".webp"
  }

  if (normalized === "image/svg+xml") {
    return ".svg"
  }

  if (normalized === "image/jpeg") {
    return ".jpg"
  }

  return null
}

const inferMimeType = (value: string) => {
  const extension = extensionFromUrl(value).toLowerCase()

  if (extension === ".png") {
    return "image/png"
  }

  if (extension === ".gif") {
    return "image/gif"
  }

  if (extension === ".webp") {
    return "image/webp"
  }

  if (extension === ".svg") {
    return "image/svg+xml"
  }

  return "image/jpeg"
}

export const isCompressionSafeMimeType = (contentType: string | null, sourceUrl: string) => {
  const resolvedContentType = (contentType || inferMimeType(sourceUrl)).toLowerCase()

  return (
    resolvedContentType === "image/jpeg" ||
    resolvedContentType === "image/png" ||
    resolvedContentType === "image/webp"
  )
}

export const compressWithSharp: AssetCompressor = async ({ bytes, contentType, sourceUrl }) => {
  const sharpModule = await import("sharp")
  const sharp = sharpModule.default
  const resolvedContentType = (contentType || inferMimeType(sourceUrl)).toLowerCase()
  const image = sharp(bytes, {
    failOn: "none",
  }).rotate()

  if (resolvedContentType === "image/png") {
    return image.png({ compressionLevel: 9 }).toBuffer()
  }

  if (resolvedContentType === "image/webp") {
    return image.webp({ quality: 80 }).toBuffer()
  }

  return image.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
}
