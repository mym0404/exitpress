import type { AssetRecord } from "../../domain/export-job/Types.js"
import type {
  AssetCandidate,
  BlockRenderInput,
  TemplateValue,
} from "../../domain/template/Types.js"

type ResolveAsset = (input: {
  assetRole: AssetCandidate["assetRole"]
  sourceUrl: string
  dedupKey: string
}) => Promise<{
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

const setPathValue = ({
  renderInputs,
  path,
  value,
}: {
  renderInputs: BlockRenderInput[]
  path: string[]
  value: string
}) => {
  const [inputIndexText, ...propPath] = path
  const inputIndex = Number(inputIndexText)
  const renderInput = renderInputs[inputIndex]

  if (!Number.isInteger(inputIndex) || !renderInput || propPath.length === 0) {
    throw new Error(`Invalid asset target path: ${path.join(".")}`)
  }

  let target: TemplateValue = renderInput.props

  for (const segment of propPath.slice(0, -1)) {
    if (!target || typeof target !== "object" || Array.isArray(target)) {
      throw new Error(`Invalid asset target path: ${path.join(".")}`)
    }

    target = target[segment]
  }

  if (!target || typeof target !== "object" || Array.isArray(target)) {
    throw new Error(`Invalid asset target path: ${path.join(".")}`)
  }

  target[propPath[propPath.length - 1]!] = value
}

const clearRenderInputAtPath = ({
  renderInputs,
  path,
}: {
  renderInputs: BlockRenderInput[]
  path: string[]
}) => {
  const inputIndex = Number(path[0])
  const renderInput = renderInputs[inputIndex]

  if (Number.isInteger(inputIndex) && renderInput) {
    renderInput.template = ""
  }
}

export const resolveAssetCandidatesForRender = async ({
  renderInputs,
  assetCandidates,
  resolveAsset,
}: {
  renderInputs: BlockRenderInput[]
  assetCandidates: AssetCandidate[]
  resolveAsset: ResolveAsset
}) => {
  const nextRenderInputs = renderInputs.map((input) => ({
    ...input,
    props: cloneTemplateValue(input.props) as Record<string, TemplateValue>,
  }))
  const assetRecords: AssetRecord[] = []

  for (const candidate of assetCandidates) {
    const resolved = await resolveAsset({
      assetRole: candidate.assetRole,
      sourceUrl: candidate.sourceUrl,
      dedupKey: candidate.dedupKey,
    })

    if (!resolved.reference && candidate.required) {
      clearRenderInputAtPath({
        renderInputs: nextRenderInputs,
        path: candidate.targetPropPath,
      })
      continue
    }

    setPathValue({
      renderInputs: nextRenderInputs,
      path: candidate.targetPropPath,
      value: resolved.reference,
    })
    assetRecords.push(resolved.record)
  }

  return {
    renderInputs: nextRenderInputs,
    assetRecords,
  }
}
