import type { OutputOption } from "../../../../domain/ast/Types.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseImageLink, se4ImageLinkSelector } from "./util/ImageLink.js"

const imageOutputParams = [
  {
    key: "includeCaption",
    label: "캡션 포함",
    description: "이미지 아래에 캡션 텍스트를 함께 남깁니다.",
    input: "boolean",
    defaultValue: false,
  },
] satisfies NonNullable<OutputOption<"image">["params"]>

const getBackgroundImageUrl = (style: string | undefined) => {
  const match = style?.match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/i)
  const sourceUrl = match?.[2]?.trim()

  return sourceUrl || null
}

export class NaverSe4ImageBlock extends LeafBlock {
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

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-image")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const image =
      parseImageLink($node.find(se4ImageLinkSelector).first()) ??
      (() => {
        const sourceUrl = getBackgroundImageUrl(
          $node.find(".se-360vr-preview").first().attr("style"),
        )

        if (!sourceUrl) {
          return null
        }

        return {
          sourceUrl: normalizeAssetUrl(sourceUrl),
          originalSourceUrl: null,
          alt: "",
          caption: compactText($node.find(".se-image-caption").text()) || null,
          mediaKind: "image" as const,
        }
      })()

    if (!image) {
      throw new Error("SE4 image block parsing failed.")
    }

    return [{ type: "image" as const, image }]
  }
}
