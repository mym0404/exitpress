import { describe, expect, it } from "vitest"

import { NaverBlog } from "./NaverBlog.js"

describe("parser block catalog", () => {
  it("keeps Naver editor instances and derives block templates by editor and block order", () => {
    const blog = new NaverBlog()
    const templateDefinitions = blog.getBlockTemplateDefinitions()

    expect(blog.editors).toHaveLength(3)
    expect(blog.editors.map((editor) => editor.type)).toEqual([
      "naver-se4",
      "naver-se3",
      "naver-se2",
    ])
    expect(templateDefinitions.map((definition) => definition.key)).toEqual([
      "naver-se4:formula",
      "naver-se4:code",
      "naver-se4:linkCard",
      "naver-se4:file",
      "naver-se4:video",
      "naver-se4:oembed",
      "naver-se4:map",
      "naver-se4:schedule",
      "naver-se4:talkTalk",
      "naver-se4:table",
      "naver-se4:imageGroup",
      "naver-se4:sticker",
      "naver-se4:image",
      "naver-se4:wrappingParagraph",
      "naver-se4:heading",
      "naver-se4:divider",
      "naver-se4:quote",
      "naver-se4:mrBlog",
      "naver-se4:paragraph",
      "naver-se4:material",
      "naver-se3:divider",
      "naver-se3:table",
      "naver-se3:quote",
      "naver-se3:code",
      "naver-se3:linkCard",
      "naver-se3:map",
      "naver-se3:mapText",
      "naver-se3:video",
      "naver-se3:file",
      "naver-se3:subjectMatter",
      "naver-se3:image",
      "naver-se3:paragraph",
      "naver-se2:paragraph",
      "naver-se2:bookWidget",
      "naver-se2:code",
      "naver-se2:table",
      "naver-se2:divider",
      "naver-se2:quote",
      "naver-se2:heading",
      "naver-se2:inlineGifVideo",
      "naver-se2:poll",
      "naver-se2:video",
      "naver-se2:image",
    ])
    expect(templateDefinitions.every((definition) => definition.presets.length >= 1)).toBe(true)
    expect(
      templateDefinitions.every((definition) => Object.keys(definition.props).length >= 0),
    ).toBe(true)
  })
})
