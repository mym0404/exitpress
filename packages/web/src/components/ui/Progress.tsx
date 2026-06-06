import type { ComponentPropsWithoutRef } from "react"

import { cn } from "../../lib/Cn.js"

export const Progress = ({
  className,
  indicatorClassName,
  value,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  indicatorClassName?: string
  value: number
}) => {
  const boundedValue = Math.min(Math.max(value, 0), 100)

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={boundedValue}
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--muted)_78%,transparent)]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-300 ease-out",
          indicatorClassName,
        )}
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  )
}
