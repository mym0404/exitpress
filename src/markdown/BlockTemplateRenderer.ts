import type { BlockRenderInput } from "../domain/template/Types.js"

import { evaluateTemplateExpression } from "../domain/template/TemplateExpression.js"

const templateExpressionPattern = /\$\{([^{}]+)\}/g

const renderBlockTemplate = ({ template, props }: BlockRenderInput) =>
  template.replace(templateExpressionPattern, (_, expression: string) =>
    String(evaluateTemplateExpression(expression.trim(), props)),
  )

export const renderBlockTemplates = (inputs: BlockRenderInput[]) =>
  inputs
    .map((input) => renderBlockTemplate(input).trim())
    .filter(Boolean)
    .join("\n\n")
