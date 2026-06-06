import { cva } from "class-variance-authority"
import * as React from "react"

import type { VariantProps } from "class-variance-authority"

import { cn } from "../../lib/Cn.js"

const alertVariants = cva(
  "relative w-full rounded-[var(--radius-lg)] border px-4 py-3 text-sm [&>p]:leading-relaxed",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-foreground shadow-[var(--panel-shadow-border)]",
        destructive:
          "border-[color-mix(in_srgb,var(--destructive)_28%,transparent)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)] shadow-[var(--panel-shadow-border)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription, AlertTitle }
