import { Box, Heading, Spinner, Text } from "@primer/react"

export const BootstrapLoadingOverlay = () => (
  <Box
    as="section"
    data-step-view="bootstrap-loading"
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "grid",
      placeItems: "center",
      px: 3,
      py: 4,
    }}
  >
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: 0,
        bg: "canvas.default",
        opacity: 0.78,
        backdropFilter: "blur(6px)",
      }}
    />
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: "544px",
        display: "grid",
        gap: 3,
        justifyItems: "center",
        px: [4, 5],
        py: [5, 6],
        textAlign: "center",
        border: "1px solid",
        borderColor: "border.default",
        borderRadius: 2,
        bg: "canvas.overlay",
        boxShadow: "shadow.floating.medium",
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid",
          borderColor: "border.default",
          borderRadius: "50%",
          bg: "canvas.subtle",
        }}
      >
        <Spinner size="large" srText={null} />
      </Box>
      <Box sx={{ display: "grid", gap: 1 }}>
        <Heading sx={{ fontSize: 3, lineHeight: 1.25 }}>작업 상태를 확인하는 중입니다.</Heading>
        <Text sx={{ display: "block", m: 0, fontSize: 1, lineHeight: 1.6, color: "fg.muted" }}>
          이전 작업을 불러올지, 새로 시작할지 확인 중입니다.
        </Text>
      </Box>
    </Box>
  </Box>
)
