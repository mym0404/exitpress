import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import type * as React from "react"
import { cn } from "../../lib/Cn.js"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        success: "border-transparent bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
        ready: "border-transparent bg-[var(--status-ready-bg)] text-[var(--status-ready-fg)]",
        running: "border-transparent bg-[var(--status-running-bg)] text-[var(--status-running-fg)]",
        idle: "border-transparent bg-[var(--status-idle-bg)] text-[var(--status-idle-fg)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
