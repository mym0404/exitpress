import { Box, Heading, Text } from "@primer/react"

import type { ReactNode } from "react"

export const PrimerPanel = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      bg: "canvas.default",
      border: "1px solid",
      borderColor: "border.default",
      borderRadius: 2,
      overflow: "hidden",
    }}
  >
    {children}
  </Box>
)

export const PrimerPanelHeader = ({
  title,
  description,
}: {
  title: string
  description?: string
}) => (
  <Box sx={{ borderBottom: "1px solid", borderColor: "border.default", px: 3, py: 3 }}>
    <Heading as="h2" sx={{ fontSize: 2 }}>
      {title}
    </Heading>
    {description ? (
      <Text sx={{ display: "block", color: "fg.muted", fontSize: 1, mt: 1 }}>{description}</Text>
    ) : null}
  </Box>
)

export const PrimerPanelBody = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: "grid", gap: 3, p: 3 }}>{children}</Box>
)
