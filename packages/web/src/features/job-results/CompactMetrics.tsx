import { cn } from "../../lib/Cn.js"

export const CompactMetrics = ({
  items,
  className,
}: {
  items: Array<{ label: string; value: string }>
  className?: string
}) => (
  <div
    className={cn(
      "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-sm leading-6 text-muted-foreground",
      className,
    )}
  >
    {items.map((item) => (
      <span
        key={item.label}
        className="inline-flex min-w-0 max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-0.5"
      >
        <span className="shrink-0 text-muted-foreground">{item.label}</span>
        <strong className="metric-value min-w-0 break-all font-semibold">{item.value}</strong>
      </span>
    ))}
  </div>
)
