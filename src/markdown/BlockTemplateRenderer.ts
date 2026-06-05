import type { BlockRenderInput } from "../domain/template/Types.js"

import { evaluateTemplateExpression } from "../domain/template/TemplateExpression.js"

const templateExpressionPattern = /\$\{([^{}]+)\}/g

const getLinePrefix = ({ template, offset }: { template: string; offset: number }) => {
  const lineStart = template.lastIndexOf("\n", offset - 1) + 1

  return template.slice(lineStart, offset)
}

const formatExpressionValue = ({
  value,
  template,
  offset,
}: {
  value: string | number | boolean
  template: string
  offset: number
}) => {
  const text = String(value)

  if (!text.includes("\n")) {
    return text
  }

  const linePrefix = getLinePrefix({ template, offset })

  return text
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${linePrefix}${line}`))
    .join("\n")
}

const renderBlockTemplate = ({ template, props }: BlockRenderInput) =>
  template.replace(templateExpressionPattern, (_match, expression: string, offset: number) =>
    formatExpressionValue({
      value: evaluateTemplateExpression(expression.trim(), props),
      template,
      offset,
    }),
  )

export const renderBlockTemplates = (inputs: BlockRenderInput[]) =>
  inputs
    .map((input) => renderBlockTemplate(input).trim())
    .filter(Boolean)
    .join("\n\n")
