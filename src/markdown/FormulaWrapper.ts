const FORMULA_WRAPPER_SEPARATOR = "..."
const FORMULA_WRAPPER_ALT_SEPARATOR = "…"

export const splitFormulaWrapper = ({
  wrapper,
  fallbackOpen,
  fallbackClose,
}: {
  wrapper: string
  fallbackOpen: string
  fallbackClose: string
}) => {
  if (!wrapper) {
    return {
      open: fallbackOpen,
      close: fallbackClose,
    }
  }

  const separator = wrapper.includes(FORMULA_WRAPPER_SEPARATOR)
    ? FORMULA_WRAPPER_SEPARATOR
    : wrapper.includes(FORMULA_WRAPPER_ALT_SEPARATOR)
      ? FORMULA_WRAPPER_ALT_SEPARATOR
      : null

  if (!separator) {
    return {
      open: wrapper,
      close: wrapper,
    }
  }

  const [open, ...rest] = wrapper.split(separator)
  const close = rest.join(separator)

  return {
    open,
    close,
  }
}
