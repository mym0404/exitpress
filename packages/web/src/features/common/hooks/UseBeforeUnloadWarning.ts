import { useEffect } from "react"

export const useBeforeUnloadWarning = (shouldWarnBeforeUnload: boolean) => {
  useEffect(() => {
    if (!shouldWarnBeforeUnload) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [shouldWarnBeforeUnload])
}
