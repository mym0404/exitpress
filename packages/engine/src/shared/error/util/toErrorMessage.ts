// Converts unknown thrown values into a displayable message.
export const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)
