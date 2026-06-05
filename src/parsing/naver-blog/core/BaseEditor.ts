import type { CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type { ExportOptions } from "../../../domain/export-options/Types.js"
import type { ParsedBlock, ParsedPost, ParserBlockOptions } from "../../../domain/parser/Types.js"
import type { BlockTemplateDefinition } from "../../../domain/template/Types.js"
import type { UnknownRecord } from "../../../shared/object/UnknownRecord.js"

import type { BaseBlock, ParserBlockContext, ParserBlockConvertContext } from "./BaseBlock.js"
import type { ParserBlockInspection, ParserBlockSourceEvidence } from "./BaseEditorTypes.js"

import { LeafBlock } from "./BaseBlock.js"
import { inspectEditorBlocks } from "./BaseEditorInspection.js"

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

export type BaseEditorParseInput = {
  $: CheerioAPI
  sourceUrl?: string
  tags: string[]
  options: Pick<ExportOptions, "blockOutputs"> & {
    resolveLinkUrl?: (url: string) => string
  }
  captureBlockEvidence?: (evidence: ParserBlockSourceEvidence) => void
}

const getParserBlockTemplateKey = ({
  editorType,
  block,
}: {
  editorType: string
  block: BaseBlock
}) => block.templateDefinition?.key ?? `${editorType}:${block.id}`

export abstract class BaseEditor {
  abstract readonly type: string
  abstract readonly label: string

  protected readonly supportedBlocks: readonly BaseBlock[] = []

  abstract canParse(html: string): boolean

  abstract parse(input: BaseEditorParseInput): ParsedPost

  inspect(_input: BaseEditorParseInput): ParserBlockInspection[] {
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

  protected inspectBlocks({
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
    return inspectEditorBlocks({
      $,
      nodes,
      tags,
      options,
      sourceUrl,
      supportedBlocks: this.supportedBlocks,
      moduleContext,
    })
  }

  protected runBlocks({
    $,
    nodes,
    tags,
    options,
    sourceUrl,
    moduleContext,
    captureBlockEvidence,
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
    captureBlockEvidence?: (evidence: ParserBlockSourceEvidence) => void
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
        (supportedBlock) => supportedBlock instanceof LeafBlock && supportedBlock.match(context),
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

      captureBlockEvidence?.({
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
