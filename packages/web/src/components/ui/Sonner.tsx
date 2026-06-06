import { Toaster as Sonner, toast } from "sonner"

import type { ToasterProps } from "sonner"

export const Toaster = ({ theme = "dark", ...props }: ToasterProps) => (
  <Sonner
    closeButton
    expand
    position="top-right"
    richColors
    theme={theme}
    toastOptions={{
      classNames: {
        toast:
          "rounded-[var(--radius-xl)] border border-border bg-popover text-popover-foreground shadow-[var(--panel-shadow-floating)]",
        title: "text-sm font-semibold",
        description: "text-sm text-muted-foreground",
        actionButton: "rounded-[var(--radius-md)]",
        cancelButton: "rounded-[var(--radius-md)]",
      },
    }}
    {...props}
  />
)

export { toast }
