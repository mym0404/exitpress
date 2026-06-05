import { createDefaultBlockTemplateMap } from "../../domain/template/BlockTemplateMap.js"

import { BaseBlog } from "./core/BaseBlog.js"
import { NaverBlogSE2Editor } from "./se2/NaverBlogSe2Editor.js"
import { NaverBlogSE3Editor } from "./se3/NaverBlogSe3Editor.js"
import { NaverBlogSE4Editor } from "./se4/NaverBlogSe4Editor.js"

export class NaverBlog extends BaseBlog {
  override readonly editors = [
    new NaverBlogSE4Editor(),
    new NaverBlogSE3Editor(),
    new NaverBlogSE2Editor(),
  ]
}

export const createNaverBlogDefaultBlockTemplateMap = () =>
  createDefaultBlockTemplateMap(new NaverBlog().getBlockTemplateDefinitions())
