import { Accordion as AccordionPrimitive } from "radix-ui"

import type { ComponentProps } from "react"

function Accordion({ ...props }: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({ ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" {...props} />
}

function AccordionTrigger({ ...props }: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return <AccordionPrimitive.Trigger data-slot="accordion-trigger" {...props} />
}

function AccordionContent({ ...props }: ComponentProps<typeof AccordionPrimitive.Content>) {
  return <AccordionPrimitive.Content data-slot="accordion-content" {...props} />
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
