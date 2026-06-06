import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { ParsedBlock, ParsedPost } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { ParserBlockOptions } from "@exitpress/domain/parser/schema/ParserBlockOptions.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"
import type { CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type { ParserBlock, ParserBlockContext, ParserBlockConvertContext } from "./ParserBlock.js"
import type { ParserBlockInspection, ParserBlockParseEvidence } from "./ParserBlockDiagnostics.js"

import { LeafParserBlock } from "./ParserBlock.js"
import { inspectParserBlocks } from "./ParserBlockInspector.js"

const describeParserNode = ({ $node, node, moduleType }: ParserBlockContext) => {
  const tagName = node.type === "tag" ? node.tagName.toLowerCase() : node.type
  const className = $node.attr("class")
  const parts = [tagName]

  if (className) {
    parts.push(`class="${className}"`)
  }

  if (moduleType) {
    parts.push(`moduleType="${moduleType}"`)
  }

  return parts.join(" ")
}

export type BlogEditorParseInput = {
  $: CheerioAPI
  sourceUrl?: string
  tags: string[]
  options: Pick<ExportOptions, "blockOutputs"> & {
    resolveLinkUrl?: (url: string) => string
  }
  captureBlockParseEvidence?: (evidence: ParserBlockParseEvidence) => void
}

const getParserBlockTemplateKey = ({
  editorType,
  block,
}: {
  editorType: string
  block: ParserBlock
}) => block.templateDefinition?.key ?? `${editorType}:${block.id}`

export abstract class BlogEditorParser {
  abstract readonly type: string
  abstract readonly label: string

  protected readonly supportedBlocks: readonly ParserBlock[] = []

  abstract canParse(html: string): boolean

  abstract parse(input: BlogEditorParseInput): ParsedPost

  inspect(_input: BlogEditorParseInput): ParserBlockInspection[] {
    return []
  }

  getBlockTemplateDefinitions(): BlockTemplateDefinition[] {
    const ret: BlockTemplateDefinition[] = []
    const seenKeys = new Set<string>()

    this.supportedBlocks.forEach((block) => {
      const templateDefinition = block.templateDefinition

      if (!templateDefinition || templateDefinition.presets.length < 1) {
        return
      }

      const key = getParserBlockTemplateKey({ editorType: this.type, block })

      if (seenKeys.has(key)) {
        return
      }

      seenKeys.add(key)
      ret.push({
        ...templateDefinition,
        key,
      })
    })

    return ret
  }

  protected inspectSupportedParserBlocks({
    $,
    nodes,
    tags,
    options,
    sourceUrl,
    moduleContext,
  }: {
    $: CheerioAPI
    nodes: AnyNode[]
    tags: string[]
    options: ParserBlockOptions
    sourceUrl?: string
    moduleContext?: (node: AnyNode) => {
      moduleData?: UnknownRecord | null
      moduleType?: string | null
      hasQuote?: boolean
    }
  }) {
    return inspectParserBlocks({
      $,
      nodes,
      tags,
      options,
      sourceUrl,
      supportedBlocks: this.supportedBlocks,
      moduleContext,
    })
  }

  protected parseSupportedParserBlocks({
    $,
    nodes,
    tags,
    options,
    sourceUrl,
    moduleContext,
    captureBlockParseEvidence,
  }: {
    $: CheerioAPI
    nodes: AnyNode[]
    tags: string[]
    options: ParserBlockOptions
    sourceUrl?: string
    moduleContext?: (node: AnyNode) => {
      moduleData?: UnknownRecord | null
      moduleType?: string | null
      hasQuote?: boolean
    }
    captureBlockParseEvidence?: (evidence: ParserBlockParseEvidence) => void
  }) {
    const createBlockContext = (node: AnyNode): ParserBlockContext => ({
      $,
      $node: $(node),
      node,
      sourceUrl,
      tags,
      options,
      matchLeafNode,
      ...moduleContext?.(node),
    })

    const matchLeafNode = (node: AnyNode) => {
      const context = createBlockContext(node)

      return this.supportedBlocks.some(
        (supportedBlock) =>
          supportedBlock instanceof LeafParserBlock && supportedBlock.match(context),
      )
    }

    let outputBlockCount = 0

    const matchNode = (node: AnyNode, path: string): ParsedBlock[] => {
      const context = createBlockContext(node)
      const block = this.supportedBlocks.find((supportedBlock) => supportedBlock.match(context))

      if (!block) {
        throw new Error(`파싱 가능한 ${this.type} block이 없습니다: ${describeParserNode(context)}`)
      }

      const convertContext = {
        ...context,
        blockId: getParserBlockTemplateKey({ editorType: this.type, block }),
        path,
        matchNode,
      } satisfies ParserBlockConvertContext

      const startIndex = outputBlockCount
      const parsedBlocks = block.convert(convertContext)
      const blockIndexes = parsedBlocks.map((_parsedBlock, offset) => startIndex + offset)
      outputBlockCount = Math.max(outputBlockCount, startIndex + parsedBlocks.length)

      captureBlockParseEvidence?.({
        path,
        blocks: parsedBlocks,
        blockIndexes,
        blockId: convertContext.blockId,
        parserBlockId: block.id,
        parserBlockLabel: block.label,
      })

      return parsedBlocks
    }

    return nodes.flatMap((node, index) => matchNode(node, String(index)))
  }
}
