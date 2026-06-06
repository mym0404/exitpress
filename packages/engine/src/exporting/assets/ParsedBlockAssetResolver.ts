import type { AssetRecord } from "@exitpress/domain/export-job/schema/UploadState.js"
import type { ParsedBlockAsset } from "@exitpress/domain/parser/schema/Media.js"
import type { ParsedBlock } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { TemplateValue } from "@exitpress/domain/template/schema/TemplateValue.js"

type ResolveAsset = (input: { role: ParsedBlockAsset["role"]; sourceUrl: string }) => Promise<{
  reference: string
  record: AssetRecord
}>

const cloneTemplateValue = (value: TemplateValue): TemplateValue => {
  if (Array.isArray(value)) {
    return value.map(cloneTemplateValue)
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, cloneTemplateValue(child)]),
    )
  }

  return value
}

const setTemplateValueAtPath = ({
  props,
  path,
  value,
}: {
  props: Record<string, TemplateValue>
  path: string
  value: TemplateValue
}) => {
  const segments = path.split(".").filter(Boolean)
  const lastSegment = segments.at(-1)

  if (!lastSegment) {
    return false
  }

  let target: TemplateValue = props

  for (const segment of segments.slice(0, -1)) {
    if (Array.isArray(target)) {
      const index = Number(segment)

      if (!Number.isInteger(index)) {
        return false
      }

      target = target[index]
      continue
    }

    if (!target || typeof target !== "object") {
      return false
    }

    target = target[segment]
  }

  if (Array.isArray(target)) {
    const index = Number(lastSegment)

    if (!Number.isInteger(index)) {
      return false
    }

    target[index] = value
    return true
  }

  if (!target || typeof target !== "object") {
    return false
  }

  target[lastSegment] = value
  return true
}

export const resolveParsedBlockAssetsForRender = async ({
  blocks,
  resolveAsset,
}: {
  blocks: ParsedBlock[]
  resolveAsset: ResolveAsset
}) => {
  const resolvedBlocks: ParsedBlock[] = []
  const assetRecords: AssetRecord[] = []

  for (const block of blocks) {
    const props = cloneTemplateValue(block.props) as Record<string, TemplateValue>
    let omitBlock = false

    for (const [propName, asset] of Object.entries(block.assets ?? {})) {
      const resolved = await resolveAsset({
        role: asset.role,
        sourceUrl: asset.sourceUrl,
      })

      if (!resolved.reference && asset.required) {
        omitBlock = true
        continue
      }

      if (!setTemplateValueAtPath({ props, path: propName, value: resolved.reference })) {
        if (asset.required) {
          omitBlock = true
        }

        continue
      }

      assetRecords.push(resolved.record)
    }

    if (!omitBlock) {
      resolvedBlocks.push({
        blockId: block.blockId,
        props,
        ...(block.assets ? { assets: block.assets } : {}),
      })
    }
  }

  return {
    blocks: resolvedBlocks,
    assetRecords,
  }
}
