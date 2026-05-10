export class AbortOperationError extends Error {
  constructor(message = "작업이 중단되었습니다.") {
    super(message)
    this.name = "AbortOperationError"
  }
}

export const isAbortOperationError = (error: unknown): error is AbortOperationError =>
  error instanceof AbortOperationError

export const throwIfAborted = (
  signal?: AbortSignal | null,
  message = "작업이 중단되었습니다.",
) => {
  if (signal?.aborted) {
    throw new AbortOperationError(message)
  }
}
