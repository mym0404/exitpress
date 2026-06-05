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

  it("derives storybook definitions for every supported block in editor and block order", () => {
    const blog = new NaverBlog()
    const storyDefinitions = blog.getStorybookBlockDefinitions()

    expect(
      storyDefinitions.map(
        (definition) =>
          `${definition.editorType}:${definition.blockIndex}:${definition.blockId}:${definition.blockLabel}`,
      ),
    ).toEqual([
      "naver-se4:0:documentTitle:문서 제목",
      "naver-se4:1:formula:수식",
      "naver-se4:2:code:코드",
      "naver-se4:3:linkCard:링크 카드",
      "naver-se4:4:file:첨부파일",
      "naver-se4:5:video:비디오",
      "naver-se4:6:oembed:임베드",
      "naver-se4:7:map:지도",
      "naver-se4:8:schedule:일정",
      "naver-se4:9:talkTalk:톡톡 링크",
      "naver-se4:10:table:표",
      "naver-se4:11:imageGroup:이미지 스트립",
      "naver-se4:12:imageGroup:이미지 그룹",
      "naver-se4:13:sticker:스티커",
      "naver-se4:14:image:이미지",
      "naver-se4:15:wrappingParagraph:감싸는 문단",
      "naver-se4:16:heading:제목",
      "naver-se4:17:divider:구분선",
      "naver-se4:18:quote:인용문",
      "naver-se4:19:mrBlog:블로그씨 질문",
      "naver-se4:20:paragraph:문단",
      "naver-se4:21:material:자료 링크",
      "naver-se3:0:documentTitle:문서 제목",
      "naver-se3:1:divider:구분선",
      "naver-se3:2:table:표",
      "naver-se3:3:quote:인용문",
      "naver-se3:4:code:코드",
      "naver-se3:5:linkCard:링크 카드",
      "naver-se3:6:map:지도",
      "naver-se3:7:mapText:텍스트 지도",
      "naver-se3:8:video:비디오",
      "naver-se3:9:file:첨부파일",
      "naver-se3:10:subjectMatter:소재 카드",
      "naver-se3:11:image:이미지",
      "naver-se3:12:paragraph:문단",
      "naver-se2:0:style:HTML 스타일",
      "naver-se2:1:comment:HTML 주석",
      "naver-se2:2:paragraph:문단",
      "naver-se2:3:bookWidget:책 위젯",
      "naver-se2:4:code:코드",
      "naver-se2:5:table:표",
      "naver-se2:6:container:중첩 컨테이너",
      "naver-se2:7:divider:구분선",
      "naver-se2:8:lineBreak:줄바꿈",
      "naver-se2:9:quote:인용문",
      "naver-se2:10:heading:제목",
      "naver-se2:11:inlineGifVideo:인라인 GIF 비디오",
      "naver-se2:12:poll:투표",
      "naver-se2:13:video:비디오",
      "naver-se2:14:image:이미지",
      "naver-se2:15:spacer:빈 줄",
      "naver-se2:16:paragraph:문단",
    ])
    expect(storyDefinitions.every((definition) => definition.storyKey)).toBe(true)
    expect(storyDefinitions.every((definition) => definition.inputHtml.trim())).toBe(true)
    expect(storyDefinitions.every((definition) => definition.screenshotSrc)).toBe(true)
    expect(storyDefinitions.some((definition) => definition.group === "auxiliary")).toBe(true)
  })
})
