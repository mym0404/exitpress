import { createSe4ModuleScript, parseSe4Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

const paragraphBlock = (text: string) => ({
  blockId: "naver-se4:paragraph",
  props: { text },
})

describe("NaverSe4TextBlock", () => {
  it("parses text components into paragraph blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <p class="se-text-paragraph">First <strong>block</strong></p>
        <p class="se-text-paragraph">Second <a href="https://example.com">link</a></p>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      paragraphBlock("First **block**"),
      paragraphBlock("Second [link](https://example.com)"),
    ])
    expect(parsed.tags).toEqual(["algo", "math"])
  })

  it("preserves hard breaks inside text paragraphs", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <p class="se-text-paragraph">첫 줄<br>둘째 줄</p>
      </div>
    `)

    expect(parsed.blocks).toEqual([paragraphBlock("첫 줄  \n둘째 줄")])
  })

  it("preserves unordered and ordered text lists", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <div class="se-module-text">
          <p class="se-text-paragraph">Intro</p>
          <ul class="se-text-list se-text-list-type-bullet-disc">
            <li class="se-text-list-item"><p class="se-text-paragraph">unordered list 1</p></li>
            <li class="se-text-list-item"><p class="se-text-paragraph">2</p></li>
          </ul>
          <ol class="se-text-list se-text-list-type-decimal">
            <li class="se-text-list-item"><p class="se-text-paragraph">orderedlist 1</p></li>
            <li class="se-text-list-item"><p class="se-text-paragraph">2</p></li>
          </ol>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      paragraphBlock("Intro"),
      paragraphBlock("- unordered list 1\n- 2"),
      paragraphBlock("1. orderedlist 1\n2. 2"),
    ])
  })

  it("groups recommendation panel text dumps into a compact markdown list", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <p class="se-text-paragraph"><span class="__se-hash-tag">#오늘의트렌드</span> <span class="__se-hash-tag">#케이크토퍼</span></p>
        <p class="se-text-paragraph">추천트렌드 새로보기현재 추천아이템 판1추천아이템 판 총 갯수8</p>
        <p class="se-text-paragraph">이런 상품 어때요2단형3단형</p>
        <p class="se-text-paragraph">케이크토퍼 영어 한글 자유문구나무픽</p>
        <p class="se-text-paragraph"><span class="__se-hash-tag">#파티용품</span></p>
        <p class="se-text-paragraph">여름잠옷 원피스 여성잠옷 반팔 면 파자마 나시 홈웨어 세트</p>
        <p class="se-text-paragraph"><span class="__se-hash-tag">#엘제이룸홈웨어</span> <span class="__se-hash-tag">#공주잠옷</span></p>
        <p class="se-text-paragraph">CGS 캘리포니아 제너럴 스토어 스트라이프 티셔츠</p>
        <p class="se-text-paragraph"><span class="__se-hash-tag">#티셔츠</span> <span class="__se-hash-tag">#스트라이프티셔츠</span></p>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      paragraphBlock("#오늘의트렌드 #케이크토퍼"),
      paragraphBlock(
        [
          "- 케이크토퍼 영어 한글 자유문구나무픽 #파티용품",
          "- 여름잠옷 원피스 여성잠옷 반팔 면 파자마 나시 홈웨어 세트 #엘제이룸홈웨어 #공주잠옷",
          "- CGS 캘리포니아 제너럴 스토어 스트라이프 티셔츠 #티셔츠 #스트라이프티셔츠",
        ].join("\n"),
      ),
    ])
  })

  it("preserves loose text-like children in text modules", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <div class="se-module-text">
          text
          <span>loose child</span>
          <p class="se-text-paragraph">추천트렌드</p>
          <p class="se-text-paragraph">상품 하나</p>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      paragraphBlock("text"),
      paragraphBlock("loose child"),
      paragraphBlock("추천트렌드"),
      paragraphBlock("상품 하나"),
    ])
  })

  it("preserves loose link children in text modules", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <div class="se-module-text">
          <a href="https://example.com">loose link</a>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([paragraphBlock("[loose link](https://example.com)")])
  })

  it("keeps short recommendation-like text as paragraphs", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <p class="se-text-paragraph">추천트렌드</p>
        <p class="se-text-paragraph">상품 하나</p>
      </div>
    `)

    expect(parsed.blocks).toEqual([paragraphBlock("추천트렌드"), paragraphBlock("상품 하나")])
  })

  it("lets earlier link-like blocks win over text class fallback", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text se-oglink">
        ${createSe4ModuleScript({ type: "v2_oglink" })}
        <a class="se-oglink-info" href="https://example.com/article"></a>
        <strong class="se-oglink-title">External article</strong>
        <p class="se-text-paragraph">fallback text</p>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:linkCard",
        props: {
          title: "External article",
          description: "",
          url: "https://example.com/article",
          thumbnailUrl: null,
        },
      },
    ])
  })

  it("keeps recommendation-like dumps with too few items as paragraphs", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <p class="se-text-paragraph">추천트렌드</p>
        <p class="se-text-paragraph">이런 상품 어때요</p>
        <p class="se-text-paragraph">첫 상품</p>
        <p class="se-text-paragraph">#태그</p>
        <p class="se-text-paragraph">둘째 상품</p>
        <p class="se-text-paragraph">#태그2</p>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      paragraphBlock("추천트렌드"),
      paragraphBlock("이런 상품 어때요"),
      paragraphBlock("첫 상품"),
      paragraphBlock("#태그"),
      paragraphBlock("둘째 상품"),
      paragraphBlock("#태그2"),
    ])
  })

  it("renders links inline", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-text">
        ${createSe4ModuleScript({ type: "v2_text" })}
        <p class="se-text-paragraph">Alpha <a href="https://example.com">link</a></p>
      </div>
    `)

    expect(parsed.blocks).toEqual([paragraphBlock("Alpha [link](https://example.com)")])
  })
})
