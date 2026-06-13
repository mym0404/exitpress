import { Box } from "@primer/react"

import type { ComponentProps } from "react"

export const CompactMetrics = ({
  items,
  sx,
}: {
  items: { label: string; value: string }[]
  sx?: ComponentProps<typeof Box>["sx"]
}) => (
  <Box
    sx={{
      display: "flex",
      minWidth: 0,
      flexWrap: "wrap",
      alignItems: "center",
      gap: 3,
      color: "fg.muted",
      fontSize: 1,
      lineHeight: "20px",
      ...sx,
    }}
  >
    {items.map((item) => (
      <Box
        key={item.label}
        as="span"
        sx={{
          display: "inline-flex",
          minWidth: 0,
          maxWidth: "100%",
          flexWrap: "wrap",
          alignItems: "baseline",
          columnGap: 2,
          rowGap: 1,
        }}
      >
        <Box as="span" sx={{ flexShrink: 0, color: "fg.muted" }}>
          {item.label}
        </Box>
        <Box
          as="strong"
          sx={{ minWidth: 0, overflowWrap: "anywhere", color: "fg.default", fontWeight: 600 }}
        >
          {item.value}
        </Box>
      </Box>
    ))}
  </Box>
)
