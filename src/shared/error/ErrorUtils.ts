export const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)
