import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import * as React from "react"

import type { VariantProps } from "class-variance-authority"

import { cn } from "../../lib/Cn.js"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] border border-transparent text-sm font-medium transition-[color,background-color,border-color,box-shadow,filter,transform] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--panel-shadow-border)] hover:opacity-92",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-[var(--panel-shadow-border)] hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--panel-shadow-border)] hover:brightness-105",
        ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        outline:
          "border-border bg-transparent text-foreground shadow-[var(--panel-shadow-border)] hover:bg-accent hover:text-accent-foreground",
        surface:
          "border-border bg-card text-card-foreground shadow-[var(--panel-shadow-border)] hover:bg-accent hover:text-accent-foreground",
        "quiet-destructive":
          "text-destructive hover:bg-[var(--status-error-bg)] hover:text-destructive",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = "Button"

export { Button }
