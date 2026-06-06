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

      props[propName] = resolved.reference
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
