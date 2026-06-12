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

const naverBlogHosts = new Set(["blog.naver.com", "m.blog.naver.com"])
const postViewPathPattern = /\/PostView\.naver$/i
const postPathPattern = /^\/([^/]+)\/(\d+)(?:\/)?$/i

const isNonPostNaverPath = (pathname: string) =>
  /\/PostList\.naver$/i.test(pathname) || /\/PostSearchList\.naver$/i.test(pathname)

export const extractNaverBlogPostIdentity = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed || trimmed.startsWith("#")) {
    return null
  }

  let url: URL

  try {
    url = new URL(trimmed, "https://m.blog.naver.com")
  } catch {
    return null
  }

  if (!naverBlogHosts.has(url.hostname.toLowerCase()) || isNonPostNaverPath(url.pathname)) {
    return null
  }

  const directPathMatch = url.pathname.match(postPathPattern)

  if (directPathMatch) {
    return {
      sourceId: directPathMatch[1] ?? "",
      postId: directPathMatch[2] ?? "",
    }
  }

  if (!postViewPathPattern.test(url.pathname)) {
    return null
  }

  const blogId = url.searchParams.get("blogId")?.trim() ?? ""
  const logNo = url.searchParams.get("logNo")?.trim() ?? ""

  if (!blogId || !/^\d+$/.test(logNo)) {
    return null
  }

  return {
    sourceId: blogId,
    postId: logNo,
  }
}

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
