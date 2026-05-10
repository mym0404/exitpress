import type { CheerioAPI } from "cheerio"
import type { AnyNode } from "domhandler"

import type { AstBlock, BlockOutputSelection, EditorBlockOutputDefinition, ParsedPost, ParserBlockOptions } from "../blocks/Types.js"
import type { ExportOptions } from "../exporter/Types.js"
import type { UnknownRecord } from "../common/Types.js"
import { resolveBlockOutputSelection } from "../blocks/BlockRegistry.js"
import {
  ContainerBlock,
  LeafBlock,
  type BaseBlock,
  type ParserBlockConvertContext,
  type ParserBlockContext
} from "../blocks/BaseBlock.js"
import { compactText } from "../common/TextUtils.js"

const inspectTextMaxLength = 200
const inspectHtmlMaxLength = 700

const truncateInspectionValue = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value

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
  options: Pick<ExportOptions, "blockOutputs"> &
    {
      resolveLinkUrl?: (url: string) => string
    }
  captureBlockEvidence?: (evidence: ParserBlockSourceEvidence) => void
}

export type ParserBlockInspection = {
  path: string
  tagName: string
  unsupported: boolean
  text: string
  html: string
  id?: string
  className?: string
  style?: string
  moduleType?: string
  moduleData?: UnknownRecord
  matchedBlockId?: string
  matchedBlockLabel?: string
  children?: ParserBlockInspection[]
}

export type ParserBlockSourceEvidence = {
  path: string
  block: AstBlock
  blockType: AstBlock["type"]
  parserBlockId: string
  parserBlockLabel: string
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
    return `${this.type}:${blockId}`
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

    const inspectNode = (node: AnyNode, path: string): ParserBlockInspection => {
      const context = createBlockContext(node)
      const block = this.supportedBlocks.find((supportedBlock) => supportedBlock.match(context))
      const $node = $(node)
      const tagName = node.type === "tag" ? node.tagName.toLowerCase() : node.type
      const children =
        node.type === "tag" && (!block || block instanceof ContainerBlock)
          ? $node
              .contents()
              .toArray()
              .map((child, index) => inspectNode(child, `${path}.${index}`))
          : []
      const id = $node.attr("id")
      const className = $node.attr("class")
      const style = $node.attr("style")
      const moduleType = typeof context.moduleType === "string" ? context.moduleType : undefined
      const moduleData = context.moduleData ?? undefined

      return {
        path,
        tagName,
        unsupported: !block,
        text: truncateInspectionValue(compactText($node.text()), inspectTextMaxLength),
        html: truncateInspectionValue(compactText($.html($node) ?? ""), inspectHtmlMaxLength),
        ...(id ? { id } : {}),
        ...(className ? { className } : {}),
        ...(style ? { style } : {}),
        ...(moduleType ? { moduleType } : {}),
        ...(moduleData ? { moduleData } : {}),
        ...(block
          ? {
              matchedBlockId: block.id,
              matchedBlockLabel: block.label,
            }
          : {}),
        ...(children.length > 0 ? { children } : {}),
      }
    }

    return nodes.map((node, index) => inspectNode(node, String(index)))
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
    const applyOutputSelection = ({
      parsedBlock,
      parserBlock,
    }: {
      parsedBlock: AstBlock
      parserBlock: BaseBlock
    }) => {
      const outputOptions = parserBlock.outputOptions

      if (
        !parserBlock.id ||
        !outputOptions ||
        outputOptions.length < 2 ||
        !outputOptions.some((option) => option.preview.type === parsedBlock.type)
      ) {
        return parsedBlock
      }

      const selectionKey = this.createBlockOutputSelectionKey(parserBlock.id)

      if (
        (parserBlock.id === "paragraph" || parserBlock.id === "linkCard") &&
        !options.blockOutputs.defaults?.[selectionKey]
      ) {
        return parsedBlock
      }

      return {
        ...parsedBlock,
        outputSelectionKey: selectionKey,
        outputSelection: resolveBlockOutputSelection({
          blockType: parsedBlock.type,
          outputOptions: outputOptions.filter((option) => option.preview.type === parsedBlock.type),
          blockOutputs: options.blockOutputs,
          selectionKey,
        }) as BlockOutputSelection,
      } as AstBlock & {
        outputSelectionKey: string
        outputSelection: BlockOutputSelection
      }
    }

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
        const blockWithSelection = applyOutputSelection({
          parsedBlock,
          parserBlock: block,
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
