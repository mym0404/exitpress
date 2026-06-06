import type { TemplateValue } from "../../template/schema/TemplateValue.js"

import type { ParsedBlockAsset } from "./Media.js"

// Normalized parser block consumed by template rendering.
export type ParsedBlock = {
  blockId: string
  props: Record<string, TemplateValue>
  assets?: Record<string, ParsedBlockAsset>
}

// Parser output consumed by renderer and exporter.
export type ParsedPost = {
  tags: string[]
  blocks: ParsedBlock[]
}
