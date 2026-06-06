import type { TemplatePropDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"

type TemplatePropCompletionContext = {
  explicit: boolean
  pos: number
  state: {
    doc: {
      sliceString: (from: number, to: number) => string
    }
  }
}

type TemplatePropCompletion = {
  label: string
  type: string
  detail: string
}

const expressionOpen = "${"
const propKeyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/

const findExpressionStart = ({ source, cursor }: { source: string; cursor: number }) => {
  const openIndex = source.lastIndexOf(expressionOpen, cursor)

  if (openIndex === -1) {
    return undefined
  }

  if (source.slice(openIndex + expressionOpen.length, cursor).includes("}")) {
    return undefined
  }

  return openIndex + expressionOpen.length
}

export const createTemplatePropCompletionSource = (
  props: Record<string, TemplatePropDefinition>,
) => {
  const options: TemplatePropCompletion[] = Object.entries(props).map(([key, prop]) => ({
    label: key,
    type: "variable",
    detail: `${prop.label} · ${prop.type}`,
  }))

  return (context: TemplatePropCompletionContext) => {
    const source = context.state.doc.sliceString(0, context.pos)
    const expressionStart = findExpressionStart({
      source,
      cursor: context.pos,
    })

    if (expressionStart === undefined) {
      return null
    }

    const prefix = source.slice(expressionStart, context.pos)

    if (prefix && !propKeyPattern.test(prefix)) {
      return null
    }

    const matchingOptions = options.filter((option) => option.label.startsWith(prefix))

    if (!context.explicit && matchingOptions.length === 0) {
      return null
    }

    return {
      from: expressionStart,
      to: context.pos,
      options: matchingOptions,
      validFor: propKeyPattern,
    }
  }
}
