import { Box, Flash, Text } from "@primer/react"
import { useEffect, useState } from "react"

type ToastOptions = {
  description?: string
}

type ToastVariant = "default" | "danger" | "success"

type ToastMessage = {
  id: number
  message: string
  description?: string
  variant: ToastVariant
}

const toastEventName = "exitpress-toast"
let toastId = 0

const toastAccentByVariant: Record<ToastVariant, string> = {
  default: "accent.emphasis",
  danger: "danger.emphasis",
  success: "success.emphasis",
}

const dispatchToast = (message: string, variant: ToastVariant, options?: ToastOptions) => {
  if (typeof window === "undefined") {
    return
  }

  toastId += 1
  window.dispatchEvent(
    new CustomEvent<Omit<ToastMessage, "id">>(toastEventName, {
      detail: {
        message,
        description: options?.description,
        variant,
      },
    }),
  )
}

export const toast = Object.assign(
  (message: string, options?: ToastOptions) => {
    dispatchToast(message, "default", options)
  },
  {
    error: (message: string, options?: ToastOptions) => {
      dispatchToast(message, "danger", options)
    },
    message: (message: string, options?: ToastOptions) => {
      dispatchToast(message, "default", options)
    },
    success: (message: string, options?: ToastOptions) => {
      dispatchToast(message, "success", options)
    },
  },
)

export const PrimerToastViewport = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<Omit<ToastMessage, "id">>).detail
      toastId += 1
      const id = toastId

      setMessages((current) => [...current, { id, ...detail }])
      window.setTimeout(() => {
        setMessages((current) => current.filter((message) => message.id !== id))
      }, 3800)
    }

    window.addEventListener(toastEventName, handleToast)

    return () => {
      window.removeEventListener(toastEventName, handleToast)
    }
  }, [])

  return (
    <Box
      aria-live="polite"
      aria-relevant="additions"
      sx={{
        position: "fixed",
        bottom: ["96px", 3],
        right: 3,
        zIndex: 1000,
        display: "grid",
        gap: 2,
        width: ["calc(100% - 32px)", "360px"],
      }}
    >
      {messages.map((message) => (
        <Flash
          key={message.id}
          role={message.variant === "danger" ? "alert" : "status"}
          variant={message.variant === "default" ? undefined : message.variant}
          sx={{
            bg: "canvas.overlay",
            borderColor: "border.default",
            borderLeftColor: toastAccentByVariant[message.variant],
            borderLeftWidth: "4px",
            boxShadow: "shadow.floating.small",
          }}
        >
          <Text sx={{ display: "block", fontWeight: "semibold" }}>{message.message}</Text>
          {message.description ? (
            <Text sx={{ display: "block", mt: 1, color: "fg.muted" }}>{message.description}</Text>
          ) : null}
        </Flash>
      ))}
    </Box>
  )
}
