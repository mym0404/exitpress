import { BlogParser } from "./core/BlogParser.js"
import { NaverBlogSE2Editor } from "./se2/NaverBlogSe2Editor.js"
import { NaverBlogSE3Editor } from "./se3/NaverBlogSe3Editor.js"
import { NaverBlogSE4Editor } from "./se4/NaverBlogSe4Editor.js"

export class NaverBlog extends BlogParser {
  override readonly editors = [
    new NaverBlogSE4Editor(),
    new NaverBlogSE3Editor(),
    new NaverBlogSE2Editor(),
  ]
}

export const createNaverBlogDefaultBlockTemplateMap = () =>
  Object.fromEntries(
    new NaverBlog().getBlockTemplateDefinitions().flatMap((definition) => {
      const template = definition.presets[0]?.template

      return template === undefined ? [] : [[definition.key, template]]
    }),
  )
