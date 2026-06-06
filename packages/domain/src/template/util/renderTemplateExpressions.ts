import type { TemplateValue } from "../schema/TemplateValue.js"

import { evaluateTemplateExpression } from "./evaluateTemplateExpression.js"

type TemplateExpressionValue = string | number | boolean
type TemplateExpression = {
  expression: string
  offset: number
  endOffset: number
}

const expressionOpen = "{{"
const expressionClose = "}}"

const findExpressionEnd = ({ template, start }: { template: string; start: number }) => {
  let quote: "'" | '"' | "`" | undefined
  let index = start

  while (index < template.length) {
    const char = template[index]

    if (quote) {
      if (char === "\\") {
        index += 2
        continue
      }

      if (char === quote) {
        quote = undefined
      }

      index += 1
      continue
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char
      index += 1
      continue
    }

    if (template.startsWith(expressionClose, index)) {
      return index
    }

    index += 1
  }

  return undefined
}

const defaultFormatValue = ({ value }: { value: TemplateExpressionValue }) => String(value)

export const getTemplateExpressions = (template: string) => {
  const expressions: TemplateExpression[] = []
  let index = 0

  while (index < template.length) {
    const openIndex = template.indexOf(expressionOpen, index)

    if (openIndex === -1) {
      break
    }

    const expressionStart = openIndex + expressionOpen.length
    const closeIndex = findExpressionEnd({ template, start: expressionStart })

    if (closeIndex === undefined) {
      throw new Error("unterminated template expression")
    }

    expressions.push({
      expression: template.slice(expressionStart, closeIndex).trim(),
      offset: openIndex,
      endOffset: closeIndex + expressionClose.length,
    })

    index = closeIndex + expressionClose.length
  }

  return expressions
}

// Renders user template expressions delimited by {{ and }}.
export const renderTemplateExpressions = ({
  template,
  props,
  formatValue = defaultFormatValue,
}: {
  template: string
  props: Record<string, TemplateValue>
  formatValue?: (input: {
    value: TemplateExpressionValue
    template: string
    offset: number
    expression: string
  }) => string
}) => {
  let rendered = ""
  let index = 0

  for (const { expression, offset, endOffset } of getTemplateExpressions(template)) {
    rendered += template.slice(index, offset)
    rendered += formatValue({
      value: evaluateTemplateExpression(expression, props),
      template,
      offset,
      expression,
    })

    index = endOffset
  }

  rendered += template.slice(index)

  return rendered
}
