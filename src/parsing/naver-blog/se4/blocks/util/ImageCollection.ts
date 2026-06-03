import type { ImageData, OutputOption } from "../../../../../domain/ast/Types.js"
import type { LeafBlock } from "../../../core/BaseBlock.js"

import { parseImageLink, se4ImageLinkSelector } from "./ImageLink.js"

export const imageGroupOutputOptions = [
  {
    id: "split-images",
    label: "개별 이미지로 분해",
    description: "이미지 하나씩 순서대로 출력합니다.",
    preview: {
      type: "imageGroup",
      images: [
        {
          sourceUrl: "https://example.com/image.png",
          originalSourceUrl: "https://example.com/image.png",
          alt: "diagram",
          caption: "caption",
          mediaKind: "image",
        },
        {
          sourceUrl: "https://example.com/image-2.png",
          originalSourceUrl: "https://example.com/image-2.png",
          alt: "detail",
          caption: "caption",
          mediaKind: "image",
        },
      ],
    },
    isDefault: true,
  },
] satisfies OutputOption<"imageGroup">[]

export const parseSe4ImageGroup = ({
  $node,
  blockName,
}: {
  $node: Parameters<LeafBlock["convert"]>[0]["$node"]
  blockName: string
}) => {
  const images = $node
    .find(se4ImageLinkSelector)
    .toArray()
    .map((node): ImageData | null => parseImageLink($node.find(node)))
    .filter((image): image is ImageData => image !== null)

  if (images.length === 0) {
    throw new Error(`SE4 ${blockName} block parsing failed.`)
  }

  return [{ type: "imageGroup" as const, images }]
}
