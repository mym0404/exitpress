import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import type { ComponentProps } from "react"

function Collapsible({ ...props }: ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleContent({
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />
}

export { Collapsible, CollapsibleContent }
