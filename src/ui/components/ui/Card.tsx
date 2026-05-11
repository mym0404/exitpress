import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import * as React from "react"
import { cn } from "../../lib/Cn.js"

const cardVariants = cva("rounded-[var(--radius-xl)] text-card-foreground", {
  variants: {
    variant: {
      default: "border border-border bg-card shadow-[var(--panel-shadow-border)]",
      panel: "board-card",
      subtle: "subtle-panel",
      elevated: "border border-border bg-card shadow-[var(--panel-shadow-elevated)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const Card = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & VariantProps<typeof cardVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.ComponentProps<"h3">>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold leading-none tracking-[-0.04em] text-foreground", className)}
      {...props}
    />
  ),
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
)
CardContent.displayName = "CardContent"

export { Card, CardContent, CardDescription, CardHeader, CardTitle }
