export const extractBlogId = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new Error("blogId 또는 blog URL을 입력해야 합니다.")
  }

  const urlMatch = trimmed.match(/blog\.naver\.com\/([^/?#]+)/i)

  if (urlMatch?.[1]) {
    return urlMatch[1]
  }

  const mobileQueryMatch = trimmed.match(/blogId=([^&#]+)/i)

  if (mobileQueryMatch?.[1]) {
    return mobileQueryMatch[1]
  }

  return trimmed
}

export const getSourceUrl = ({ blogId, logNo }: { blogId: string; logNo: string }) =>
  `https://blog.naver.com/${blogId}/${logNo}`

export const normalizeAssetUrl = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return ""
  }

  try {
    const url = new URL(trimmed)

    if (
      url.hostname === "mblogthumb-phinf.pstatic.net" &&
      (!url.searchParams.has("type") || url.searchParams.get("type") === "")
    ) {
      url.searchParams.set("type", "w800")
    }

    return url.toString()
  } catch {
    return trimmed
  }
}
