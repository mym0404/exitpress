const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"

export const htmlHeaders = ({ blogId }: { blogId: string }) => ({
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  referer: `https://m.blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=0&listStyle=style1`,
  "user-agent": userAgent,
})

export const binaryHeaders = {
  referer: "https://blog.naver.com/",
  "user-agent": userAgent,
}

export const browserHeaders = ({
  blogId,
  refererPath = `/PostList.naver?blogId=${blogId}&categoryNo=0&listStyle=style1`,
}: {
  blogId: string
  refererPath?: string
}) => ({
  accept: "application/json, text/plain, */*",
  origin: "https://m.blog.naver.com",
  referer: `https://m.blog.naver.com${refererPath}`,
  "user-agent": userAgent,
  "x-requested-with": "XMLHttpRequest",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
})
