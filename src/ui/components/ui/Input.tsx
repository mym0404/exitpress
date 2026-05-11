import type * as React from "react"
import { cn } from "../../lib/Cn.js"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[var(--radius-md)] border border-input bg-[color-mix(in_srgb,var(--panel)_86%,transparent)] px-3 py-2 text-base text-foreground shadow-[var(--panel-shadow-border)] transition-[color,background-color,border-color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:shadow-[var(--focus-ring)]",
        "[aria-invalid=true]:border-[var(--destructive)] [aria-invalid=true]:shadow-[var(--panel-shadow-border),0_0_0_1px_color-mix(in_srgb,var(--destructive)_18%,transparent)]",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
