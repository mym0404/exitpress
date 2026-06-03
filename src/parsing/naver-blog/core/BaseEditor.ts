import type { CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type {
  AstBlock,
  EditorBlockOutputDefinition,
  ParsedPost,
  ParserBlockOptions,
} from "../../../domain/ast/Types.js"
import type { ExportOptions } from "../../../domain/export-options/Types.js"
import type { UnknownRecord } from "../../../shared/object/UnknownRecord.js"

import type { BaseBlock, ParserBlockContext, ParserBlockConvertContext } from "./BaseBlock.js"
import type { ParserBlockInspection, ParserBlockSourceEvidence } from "./BaseEditorTypes.js"

import { resolveBlockOutputSelection } from "../../../domain/export-options/BlockOutputSelection.js"

import { LeafBlock } from "./BaseBlock.js"
import { inspectEditorBlocks } from "./BaseEditorInspection.js"
import {
  applyBlockOutputSelection,
  createBlockOutputSelectionKey,
} from "./BaseEditorOutputSelection.js"

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

export abstract class BaseEditor {
  abstract readonly type: string
  abstract readonly label: string

  protected readonly supportedBlocks: readonly BaseBlock[] = []

  abstract canParse(html: string): boolean

  abstract parse(input: BaseEditorParseInput): ParsedPost

  inspect(_input: BaseEditorParseInput): ParserBlockInspection[] {
    return []
  }

  getBlockOutputDefinitions(): EditorBlockOutputDefinition[] {
    const definitions: EditorBlockOutputDefinition[] = []
    const seenKeys = new Set<string>()

    this.supportedBlocks.forEach((block) => {
      const outputOptions = block.outputOptions

      if (!block.id || !outputOptions || outputOptions.length < 2) {
        return
      }

      const key = this.createBlockOutputSelectionKey(block.id)

      if (seenKeys.has(key)) {
        return
      }

      seenKeys.add(key)
      definitions.push({
        key,
        editorType: this.type,
        editorLabel: this.label,
        blockId: block.id,
        blockLabel: block.label,
        options: [...outputOptions],
      })
    })

    return definitions
  }

  private createBlockOutputSelectionKey(blockId: string) {
    return createBlockOutputSelectionKey({
      editorType: this.type,
      blockId,
    })
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

    const matchNode = (node: AnyNode, path: string): AstBlock[] => {
      const context = createBlockContext(node)
      const block = this.supportedBlocks.find((supportedBlock) => supportedBlock.match(context))

      if (!block) {
        throw new Error(`파싱 가능한 ${this.type} block이 없습니다: ${describeParserNode(context)}`)
      }

      const outputOptions = block.outputOptions
      const firstOutputOption = outputOptions?.[0]
      const outputSelection =
        block.id && outputOptions && outputOptions.length >= 2 && firstOutputOption
          ? resolveBlockOutputSelection({
              blockType: firstOutputOption.preview.type,
              outputOptions,
              blockOutputs: options.blockOutputs,
              selectionKey: this.createBlockOutputSelectionKey(block.id),
            })
          : undefined
      const convertContext = {
        ...context,
        path,
        outputSelection,
        matchNode,
      } satisfies ParserBlockConvertContext

      return block.convert(convertContext).map((parsedBlock) => {
        const blockWithSelection = applyBlockOutputSelection({
          editorType: this.type,
          parsedBlock,
          parserBlock: block,
          options,
        })

        captureBlockEvidence?.({
          path,
          block: blockWithSelection,
          blockType: blockWithSelection.type,
          parserBlockId: block.id,
          parserBlockLabel: block.label,
        })

        return blockWithSelection
      })
    }

    return nodes.flatMap((node, index) => matchNode(node, String(index)))
  }
}
