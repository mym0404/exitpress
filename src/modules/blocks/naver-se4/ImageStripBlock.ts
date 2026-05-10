import type { ImageData, OutputOption } from "../Types.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"
import { parseImageLink, se4ImageLinkSelector } from "./ImageLink.js"

export class NaverSe4ImageStripBlock extends LeafBlock {
  override readonly id = "imageGroup"
  override readonly label = "이미지 스트립"
  override readonly outputOptions = [
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

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se-imageStrip")
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const images = $node
      .find(se4ImageLinkSelector)
      .toArray()
      .map((node): ImageData | null => parseImageLink($node.find(node)))
      .filter((image): image is ImageData => image !== null)

    if (images.length === 0) {
      throw new Error("SE4 image strip block parsing failed.")
    }

    return [{ type: "imageGroup" as const, images }]
  }
}
