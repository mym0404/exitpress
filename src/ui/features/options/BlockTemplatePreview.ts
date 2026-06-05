import type { ExportOptions } from "../../../domain/export-options/Types.js"
import type {
  BlockTemplateDefinition,
  TemplatePropDefinition,
  TemplateValue,
} from "../../../domain/template/Types.js"

const toPreviewAssetPath = (sourceUrl: string) => {
  const pathname = (() => {
    try {
      return new URL(sourceUrl).pathname
    } catch {
      return sourceUrl
    }
  })()
  const filename = pathname.split("/").filter(Boolean).at(-1) || "image.png"

  return `../../public/${filename}`
}

const getPreviewUrl = ({
  sourceUrl,
  imageHandlingMode,
}: {
  sourceUrl: string
  imageHandlingMode: ExportOptions["assets"]["imageHandlingMode"]
}) => (imageHandlingMode === "remote" ? sourceUrl : toPreviewAssetPath(sourceUrl))

const sampleStringByKey: Record<string, string> = {
  alt: "diagram",
  caption: "caption",
  code: "const value = 1",
  formula: "x^2 + y^2 = z^2",
  html: "<table><tr><td>cell</td></tr></table>",
  language: "ts",
  markdown: "| col |\n| --- |\n| value |",
  text: "Text",
  title: "Demo video",
  url: "https://example.com/image.png",
}

const createPreviewValue = ({
  key,
  prop,
  imageHandlingMode,
}: {
  key: string
  prop: TemplatePropDefinition
  imageHandlingMode: ExportOptions["assets"]["imageHandlingMode"]
}): TemplateValue => {
  if (key === "url" || key.endsWith("Url")) {
    return getPreviewUrl({
      sourceUrl: sampleStringByKey[key] ?? "https://example.com/image.png",
      imageHandlingMode,
    })
  }

  if (prop.type === "boolean" || prop.type === "boolean?") {
    return true
  }

  if (prop.type === "number" || prop.type === "number?") {
    return 1
  }

  if (prop.type === "array" || prop.type === "array?") {
    return []
  }

  if (prop.type === "object" || prop.type === "object?") {
    return {}
  }

  return sampleStringByKey[key] ?? prop.label
}

const expressionPattern = /\$\{([^{}]*)\}/g

const splitTopLevel = ({ expression, operator }: { expression: string; operator: string }) => {
  const parts: string[] = []
  let current = ""
  let quote: '"' | "'" | undefined
  let depth = 0

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index]!
    const next = expression.slice(index, index + operator.length)

    if (quote) {
      current += char

      if (char === "\\" && index + 1 < expression.length) {
        index += 1
        current += expression[index]!
        continue
      }

      if (char === quote) {
        quote = undefined
      }

      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      current += char
      continue
    }

    if (char === "(") {
      depth += 1
      current += char
      continue
    }

    if (char === ")") {
      depth -= 1
      current += char
      continue
    }

    if (depth === 0 && next === operator) {
      parts.push(current.trim())
      current = ""
      index += operator.length - 1
      continue
    }

    current += char
  }

  parts.push(current.trim())

  return parts
}

const findTopLevelQuestion = (expression: string) => {
  let quote: '"' | "'" | undefined
  let depth = 0

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index]!

    if (quote) {
      if (char === "\\") {
        index += 1
        continue
      }

      if (char === quote) {
        quote = undefined
      }

      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      continue
    }

    if (char === "(") {
      depth += 1
      continue
    }

    if (char === ")") {
      depth -= 1
      continue
    }

    if (depth === 0 && char === "?") {
      return index
    }
  }

  return -1
}

const splitTernary = (expression: string) => {
  const questionIndex = findTopLevelQuestion(expression)

  if (questionIndex === -1) {
    return undefined
  }

  const condition = expression.slice(0, questionIndex).trim()
  const branches = splitTopLevel({
    expression: expression.slice(questionIndex + 1),
    operator: ":",
  })

  if (branches.length < 2) {
    return undefined
  }

  return {
    condition,
    whenFalse: branches.slice(1).join(":").trim(),
    whenTrue: branches[0]!,
  }
}

const parseStringLiteral = (expression: string) => {
  const trimmed = expression.trim()
  const quote = trimmed[0]

  if ((quote !== "'" && quote !== '"') || trimmed.at(-1) !== quote) {
    return undefined
  }

  return trimmed.slice(1, -1).replaceAll("\\n", "\n").replaceAll("\\'", "'").replaceAll('\\"', '"')
}

const readPath = ({
  props,
  path,
}: {
  props: Record<string, TemplateValue>
  path: string
}): TemplateValue => {
  const segments = path.split(".")
  let current: TemplateValue = props[segments[0]!] as TemplateValue

  for (const segment of segments.slice(1)) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined
    }

    current = current[segment]
  }

  return current
}

const evaluatePreviewExpression = ({
  expression,
  props,
}: {
  expression: string
  props: Record<string, TemplateValue>
}): TemplateValue => {
  const trimmed = expression.trim()
  const ternary = splitTernary(trimmed)

  if (ternary) {
    return evaluatePreviewExpression({
      expression: evaluatePreviewExpression({ expression: ternary.condition, props })
        ? ternary.whenTrue
        : ternary.whenFalse,
      props,
    })
  }

  const nullishParts = splitTopLevel({ expression: trimmed, operator: "??" })

  if (nullishParts.length > 1) {
    const value = evaluatePreviewExpression({ expression: nullishParts[0]!, props })

    return value === undefined || value === null
      ? evaluatePreviewExpression({ expression: nullishParts.slice(1).join(" ?? "), props })
      : value
  }

  const plusParts = splitTopLevel({ expression: trimmed, operator: "+" })

  if (plusParts.length > 1) {
    return plusParts
      .map((part) => evaluatePreviewExpression({ expression: part, props }))
      .map((value) => (value === undefined || value === null ? "" : String(value)))
      .join("")
  }

  const stringValue = parseStringLiteral(trimmed)

  if (stringValue !== undefined) {
    return stringValue
  }

  if (trimmed === "true") {
    return true
  }

  if (trimmed === "false") {
    return false
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(trimmed)) {
    return readPath({ props, path: trimmed })
  }

  return ""
}

const renderPreviewTemplate = ({
  template,
  props,
}: {
  template: string
  props: Record<string, TemplateValue>
}) =>
  template.replace(expressionPattern, (_match, expression: string) => {
    const value = evaluatePreviewExpression({ expression, props })

    return value === undefined || value === null ? "" : String(value)
  })

export const createBlockTemplatePreviewProps = ({
  definition,
  imageHandlingMode,
}: {
  definition: BlockTemplateDefinition
  imageHandlingMode: ExportOptions["assets"]["imageHandlingMode"]
}) =>
  Object.fromEntries(
    Object.entries(definition.props).map(([key, prop]) => [
      key,
      createPreviewValue({ key, prop, imageHandlingMode }),
    ]),
  )

export const renderBlockTemplatePreview = ({
  definition,
  template,
  imageHandlingMode,
}: {
  definition: BlockTemplateDefinition
  template: string
  imageHandlingMode: ExportOptions["assets"]["imageHandlingMode"]
}) =>
  renderPreviewTemplate({
    template,
    props: createBlockTemplatePreviewProps({
      definition,
      imageHandlingMode,
    }),
  })
