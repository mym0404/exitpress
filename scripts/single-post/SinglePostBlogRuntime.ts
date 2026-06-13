import {
  exportSinglePost as exportNaverSinglePost,
  type SinglePostFetcher,
} from "@exitpress/blog-naver/exporting/SinglePostExport.js"
import { inspectSinglePost as inspectNaverSinglePost } from "@exitpress/blog-naver/exporting/SinglePostInspect.js"
import { NaverBlogFetcher } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"

export type SinglePostBlogRuntime = {
  exportSinglePost: typeof exportNaverSinglePost
  inspectSinglePost: typeof inspectNaverSinglePost
  createFetcher: (input: { sourceId: string }) => SinglePostFetcher | Promise<SinglePostFetcher>
}

export const getSinglePostBlogRuntime = (blogKey: string): SinglePostBlogRuntime => {
  if (blogKey === "naver") {
    return {
      exportSinglePost: exportNaverSinglePost,
      inspectSinglePost: inspectNaverSinglePost,
      createFetcher: ({ sourceId }) =>
        new NaverBlogFetcher({
          sourceId,
        }),
    }
  }

  throw new Error(`Unsupported blogKey: ${blogKey}`)
}
