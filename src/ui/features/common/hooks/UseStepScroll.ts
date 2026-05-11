import type { RefObject } from "react"
import { useEffect } from "react"

export const useStepScroll = ({
  currentStep,
  isSetupStep,
  previousStepRef,
  stepViewRef,
}: {
  currentStep: string
  isSetupStep: boolean
  previousStepRef: RefObject<string | null>
  stepViewRef: RefObject<HTMLElement | null>
}) => {
  useEffect(() => {
    const previousStep = previousStepRef.current
    previousStepRef.current = currentStep

    if (!isSetupStep || previousStep === null || previousStep === currentStep) {
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
    stepViewRef.current?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    })
  }, [currentStep, isSetupStep, previousStepRef, stepViewRef])
}
