import { load } from "cheerio"
import type { OutputOption } from "../../../../domain/ast/Types.js"
import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe4FormulaBlock extends LeafBlock {
  override readonly id = "formula"
  override readonly label = "수식"
  override readonly outputOptions = [
    {
      id: "wrapper",
      label: "custom wrapper",
      description: "인라인과 블록 수식을 wrapper 문자열로 감쌉니다.",
      preview: {
        type: "formula",
        formula: "x^2 + y^2 = z^2",
        display: true,
      },
      isDefault: true,
      params: [
        {
          key: "inlineWrapper",
          label: "인라인 wrapper",
          description: "예: `$`, `\\(...\\)`",
          input: "text",
          defaultValue: "$",
        },
        {
          key: "blockWrapper",
          label: "블록 wrapper",
          description: "예: `$$`, `\\[...\\]`",
          input: "text",
          defaultValue: "$$",
        },
      ],
    },
    {
      id: "math-fence",
      label: "```math fence",
      description: "블록 수식은 `math` fence, 인라인 수식은 wrapper로 출력합니다.",
      preview: {
        type: "formula",
        formula: "x^2 + y^2 = z^2",
        display: true,
      },
      params: [
        {
          key: "inlineWrapper",
          label: "인라인 wrapper",
          description: "예: `$`, `\\(...\\)`",
          input: "text",
          defaultValue: "$",
        },
      ],
    },
  ] satisfies OutputOption<"formula">[]

  override match({ moduleData, moduleType }: ParserBlockContext) {
    return moduleType === "v2_formula" && Boolean(moduleData)
  }

  override convert({ $node, moduleData }: Parameters<LeafBlock["convert"]>[0]) {
    /* v8 ignore next 3 */
    if (!moduleData) {
      throw new Error("SE4 formula block metadata is missing.")
    }

    /* v8 ignore next */
    const data = (moduleData.data ?? {}) as UnknownRecord & {
      html?: string
      latex?: string
      text?: string
      display?: boolean
      inline?: boolean
      isInline?: boolean
    }
    const candidates: string[] = []

    if (data.html) {
      const formulaDocument = load(data.html)

      candidates.push(
        ...formulaDocument(".mq-selectable")
          .toArray()
          .map((node) => compactText(formulaDocument(node).text()))
          .filter(Boolean),
      )
    }

    if (typeof data.latex === "string") {
      candidates.push(compactText(data.latex))
    }

    if (typeof data.text === "string") {
      candidates.push(compactText(data.text))
    }

    candidates.push(compactText($node.text()))

    const formula = candidates
      .map((candidate) =>
        candidate
          .replace(/^\${1,2}/, "")
          .replace(/\${1,2}$/, "")
          .trim(),
      )
      .filter(Boolean)
      .sort((left, right) => right.length - left.length)[0]

    if (!formula) {
      throw new Error("SE4 formula block parsing failed.")
    }

    return [
      {
        type: "formula" as const,
        formula,
        display:
          !(data.display === false) &&
          data.inline !== true &&
          data.isInline !== true &&
          !$node.hasClass("se-inline-math") &&
          !$node.hasClass("se-math-inline"),
      },
    ]
  }
}
