import type { ScanResult } from "../../domain/blog/Types.js"
import type { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"

export const loadScanAndPosts = async ({
  fetcher,
  blogId,
  cachedScanResult,
}: {
  fetcher: NaverBlogFetcher
  blogId: string
  cachedScanResult: ScanResult | null
}) => {
  const reusablePosts =
    cachedScanResult?.blogId === blogId && cachedScanResult.posts ? cachedScanResult.posts : null
  const reusableScanResult = reusablePosts ? cachedScanResult : null

  if (reusableScanResult && reusablePosts) {
    return {
      scan: {
        blogId: reusableScanResult.blogId,
        totalPostCount: reusableScanResult.totalPostCount,
        categories: reusableScanResult.categories,
      } satisfies ScanResult,
      posts: reusablePosts,
      reused: true,
    }
  }

  const [scan, posts] = await Promise.all([fetcher.scanBlog(), fetcher.getAllPosts()])

  return {
    scan,
    posts,
    reused: false,
  }
}
