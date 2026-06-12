// Raw category row returned by Naver Blog list APIs.
export type CategoryApiItem = {
  categoryName: string
  categoryNo: number
  parentCategoryNo: number | null
  postCnt: number
  divisionLine: boolean
  openYN: boolean
}

// Raw post row returned by Naver Blog list APIs.
export type PostApiItem = {
  logNo: number
  titleWithInspectMessage: string
  addDate: number
  categoryNo: number
  categoryName: string
  thumbnailUrl: string | null
  notOpen: boolean
  postBlocked: boolean
  buddyOpen: boolean
  bothBuddyOpen: boolean
}
