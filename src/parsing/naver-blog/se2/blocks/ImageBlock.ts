import type { CheerioAPI } from "cheerio"

import type { ImageData, OutputOption } from "../../../../domain/ast/Types.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

const standaloneImageSelector = "img, [thumburl]"
const standaloneRootImageSelector = "img.fx, img._postImage, [thumburl]"
const imageOutputParams = [
  {
    key: "includeCaption",
    label: "캡션 포함",
    description: "이미지 아래에 캡션 텍스트를 함께 남깁니다.",
    input: "boolean",
    defaultValue: false,
  },
] satisfies NonNullable<OutputOption<"image">["params"]>

const getStandaloneImages = ({
  $,
  element,
}: {
  $: CheerioAPI
  element: ReturnType<CheerioAPI>
}) => {
  const images = $(element)
    .filter(standaloneRootImageSelector)
    .add($(element).find(standaloneImageSelector))
    .toArray()
    .map((imageNode): ImageData | null => {
      const $image = $(imageNode)
      const sourceUrl = normalizeAssetUrl($image.attr("src") ?? $image.attr("thumburl") ?? "")

      if (!sourceUrl) {
        return null
      }

      return {
        sourceUrl,
        originalSourceUrl: null,
        alt: $image.attr("alt") ?? "",
        caption: null,
        mediaKind: "image",
      } satisfies ImageData
    })
    .filter((image): image is ImageData => image !== null)

  const textWithoutImages = compactText(
    $(element).clone().find(standaloneImageSelector).remove().end().text(),
  )

  return textWithoutImages ? [] : images
}

export class NaverSe2ImageBlock extends LeafBlock {
  override readonly id = "image"
  override readonly label = "이미지"
  override readonly outputOptions = [
    {
      id: "markdown-image",
      label: "일반 Markdown 이미지",
      description: "이미지를 `![alt](url)` 형식으로 출력합니다.",
      preview: {
        type: "image",
        image: {
          sourceUrl: "https://example.com/image.png",
          originalSourceUrl: "https://example.com/image.png",
          alt: "diagram",
          caption: "caption",
          mediaKind: "image",
        },
      },
      params: imageOutputParams,
      isDefault: true,
    },
    {
      id: "linked-image",
      label: "원본 링크 감싸기",
      description: "이미지를 원본 링크로 감싼 뒤 출력합니다.",
      preview: {
        type: "image",
        image: {
          sourceUrl: "https://example.com/image.png",
          originalSourceUrl: "https://example.com/image.png",
          alt: "diagram",
          caption: "caption",
          mediaKind: "image",
        },
      },
      params: imageOutputParams,
    },
    {
      id: "source-only",
      label: "링크만 남기기",
      description: "이미지 대신 링크 텍스트만 남깁니다.",
      preview: {
        type: "image",
        image: {
          sourceUrl: "https://example.com/image.png",
          originalSourceUrl: "https://example.com/image.png",
          alt: "diagram",
          caption: "caption",
          mediaKind: "image",
        },
      },
      params: imageOutputParams,
    },
  ] satisfies OutputOption<"image">[]

  override match({ node, $, $node }: ParserBlockContext) {
    return node.type === "tag" && getStandaloneImages({ $, element: $node }).length > 0
  }

  override convert({ $, $node }: Parameters<LeafBlock["convert"]>[0]) {
    const standaloneImages = getStandaloneImages({ $, element: $node })

    if (standaloneImages.length === 1) {
      return [{ type: "image" as const, image: standaloneImages[0]! }]
    }

    return [{ type: "imageGroup" as const, images: standaloneImages }]
  }
}
