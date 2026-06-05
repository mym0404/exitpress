import * as React from "react"

import { cn } from "../../lib/Cn.js"

const FieldGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="field-group"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  ),
)
FieldGroup.displayName = "FieldGroup"

const Field = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    disabled?: boolean
    invalid?: boolean
  }
>(({ className, disabled, invalid, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    data-slot="field"
    data-disabled={disabled || undefined}
    data-invalid={invalid || undefined}
    className={cn(
      "group/field grid w-full min-w-0 content-start gap-2 self-start data-[disabled=true]:opacity-60 data-[invalid=true]:text-destructive",
      className,
    )}
    {...props}
  />
))
Field.displayName = "Field"

const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<"label"> & {
    htmlFor: string
  }
>(({ className, htmlFor, ...props }, ref) => (
  <label
    ref={ref}
    htmlFor={htmlFor}
    data-slot="field-label"
    className={cn("text-sm font-semibold leading-snug text-foreground", className)}
    {...props}
  />
))
FieldLabel.displayName = "FieldLabel"

const FieldDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="field-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  ),
)
FieldDescription.displayName = "FieldDescription"

const FieldError = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="field-error"
      className={cn("text-sm leading-6 text-destructive", className)}
      {...props}
    />
  ),
)
FieldError.displayName = "FieldError"

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel }
