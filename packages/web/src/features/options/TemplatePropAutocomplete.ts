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

const propKeyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/

const findTemplateVariableStart = ({ source, cursor }: { source: string; cursor: number }) => {
  const openIndex = source.lastIndexOf("{{", cursor)

  if (openIndex === -1) {
    return undefined
  }

  if (source.slice(openIndex + 2, cursor).includes("}}")) {
    return undefined
  }

  const expressionStart = openIndex + 2
  const prefixStart = source.slice(expressionStart, cursor).search(/\S/)

  return prefixStart === -1 ? cursor : expressionStart + prefixStart
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
    const expressionStart = findTemplateVariableStart({
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
