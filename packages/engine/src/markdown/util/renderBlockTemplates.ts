import { renderTemplateExpressions } from "@exitpress/domain/template/util/renderTemplateExpressions.js"

import type { TemplateValue } from "@exitpress/domain/template/schema/TemplateValue.js"

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

type TemplateBlock = {
  template: string
  props: Record<string, TemplateValue>
}

const renderBlockTemplate = ({ template, props }: TemplateBlock) =>
  renderTemplateExpressions({
    template,
    props,
    formatValue: ({ value, template, offset }) =>
      formatExpressionValue({
        value,
        template,
        offset,
      }),
  })

// Renders parsed blocks through their selected markdown templates.
export const renderBlockTemplates = (blocks: TemplateBlock[]) =>
  blocks
    .map((block) => renderBlockTemplate(block).trim())
    .filter(Boolean)
    .join("\n\n")
