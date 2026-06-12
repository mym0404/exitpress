import type { NaverBlogFetcher } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"
import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"

export const loadScanAndPosts = async ({
  fetcher,
  sourceId,
  cachedScanResult,
}: {
  fetcher: NaverBlogFetcher
  sourceId: string
  cachedScanResult: ScanResult | null
}) => {
  const reusablePosts =
    cachedScanResult?.sourceId === sourceId && cachedScanResult.posts
      ? cachedScanResult.posts
      : null
  const reusableScanResult = reusablePosts ? cachedScanResult : null

  if (reusableScanResult && reusablePosts) {
    return {
      scan: {
        sourceId: reusableScanResult.sourceId,
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
