import { ArrowRightIcon, CheckIcon, CopyIcon, MarkGithubIcon } from "@primer/octicons-react"
import { Box, Button, Heading, Link, LinkButton, Text } from "@primer/react"
import { useState } from "react"

import { PrimerAppProvider } from "../app/PrimerAppProvider.js"

import exportScreen from "./assets/export-screen.png"
import storybookScreen from "./assets/storybook-screen.png"

const githubUrl = "https://github.com/mym0404/exitpress"
const demoUrl = `${import.meta.env.BASE_URL}storybook/`
const setupHref = "#setup"
const colors = { background: "#181818", foreground: "#f0f0f0", muted: "#a6a6a6", border: "#343434" }
const container = { maxWidth: 1600, mx: "auto", px: [24, 40, 80] }
const section = { py: [64, 88, 120], borderBottom: "1px solid", borderColor: colors.border }
const columns = {
  display: "grid",
  gridTemplateColumns: ["1fr", "1fr", "1fr", "1fr 1fr"],
  gap: [32, 48, 64],
}
const heading = {
  fontFamily: "inherit",
  fontSize: [36, 44, 52],
  fontWeight: 650,
  lineHeight: 1.08,
  letterSpacing: "-0.04em",
}
const link = {
  color: colors.muted,
  fontSize: [13, 16],
  textDecoration: "none",
  "&:hover": { color: colors.foreground },
}
const screenshot = {
  display: "block",
  width: "100%",
  height: "auto",
  border: "1px solid",
  borderColor: colors.border,
  borderRadius: 8,
}
const heroButton = { height: [48, 56, 60], fontSize: [16, 19], px: 4 }
const quickStart = `git clone ${githubUrl}.git
cd exitpress
mise trust
mise install
mise exec -- pnpm install
mise exec -- pnpm start`

const SectionLabel = ({ children }: { children: string }) => (
  <Box
    as="p"
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 3,
      color: colors.muted,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.08em",
      mb: 4,
      "&::before": { content: '""', width: 36, height: 4, bg: colors.border },
    }}
  >
    {children}
  </Box>
)

export const Website = () => {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle")

  const copyCommands = async () => {
    try {
      await navigator.clipboard.writeText(quickStart)
      setCopyStatus("copied")
    } catch {
      setCopyStatus("failed")
    }
  }

  return (
    <PrimerAppProvider themePreference="dark">
      <Box
        sx={{
          bg: colors.background,
          color: colors.foreground,
          fontFamily: '"Geist Sans", sans-serif',
          minHeight: "100dvh",
          "& a:focus-visible, & button:focus-visible, & pre:focus-visible": {
            outline: "2px solid",
            outlineColor: "accent.fg",
            outlineOffset: 4,
          },
        }}
      >
        <Box as="header" sx={{ borderBottom: "1px solid", borderColor: colors.border }}>
          <Box
            sx={{
              ...container,
              minHeight: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            <Link
              href={import.meta.env.BASE_URL}
              aria-label="ExitPress home"
              sx={{
                color: colors.foreground,
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                fontSize: [19, 24],
                fontWeight: 650,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <Box
                as="img"
                src={`${import.meta.env.BASE_URL}brand/logo.png`}
                alt=""
                width={28}
                height={28}
              />
              ExitPress
            </Link>
            <Box
              as="nav"
              aria-label="Main navigation"
              sx={{ display: "flex", alignItems: "center", gap: [3, 4, 5] }}
            >
              <Link href={setupHref} sx={link}>
                Setup
              </Link>
              <Link href="#demo" sx={link}>
                Demo
              </Link>
              <Link href={githubUrl} sx={link}>
                GitHub
              </Link>
            </Box>
          </Box>
        </Box>

        <Box as="main" sx={container}>
          <Box
            as="section"
            aria-labelledby="hero-title"
            sx={{
              ...section,
              ...columns,
              gridTemplateColumns: ["1fr", "1fr", "1fr", "minmax(0, 0.8fr) minmax(0, 1.3fr)"],
              alignItems: "center",
              minHeight: [0, 0, 0, 840],
              gap: [48, 56, 64],
            }}
          >
            <Box>
              <Box
                as="h1"
                id="hero-title"
                sx={{
                  ...heading,
                  fontSize: [64, 80, 80, "clamp(64px, 6.8vw, 112px)"],
                  fontWeight: 700,
                  mb: 3,
                }}
              >
                ExitPress
              </Box>
              <Box
                as="p"
                sx={{
                  fontSize: [28, 34, 44],
                  lineHeight: 1.2,
                  letterSpacing: "-0.035em",
                  fontWeight: 500,
                  maxWidth: 460,
                }}
              >
                Every post deserves an exit.
              </Box>
              <Box
                as="p"
                sx={{
                  color: colors.muted,
                  fontSize: [18, 22],
                  lineHeight: 1.6,
                  mt: 4,
                  maxWidth: 490,
                }}
              >
                Export public Naver Blog and Tistory posts to Markdown or MDX, with frontmatter,
                images, and links.
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 5 }}>
                <LinkButton
                  href={setupHref}
                  trailingVisual={ArrowRightIcon}
                  size="large"
                  sx={{
                    ...heroButton,
                    bg: colors.foreground,
                    color: colors.background,
                    borderColor: colors.foreground,
                    "&:hover": { bg: "#ffffff", color: colors.background },
                  }}
                >
                  Get started
                </LinkButton>
                <LinkButton
                  href={githubUrl}
                  leadingVisual={MarkGithubIcon}
                  size="large"
                  sx={{ ...heroButton, bg: "#222222", borderColor: colors.border }}
                >
                  GitHub
                </LinkButton>
              </Box>
              <Link
                href={setupHref}
                aria-label="See installation instructions"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  mt: 4,
                  p: 3,
                  maxWidth: 470,
                  bg: "#131313",
                  border: "1px solid",
                  borderColor: colors.border,
                  borderRadius: 6,
                  color: colors.foreground,
                  fontFamily: '"Geist Mono", monospace',
                  fontSize: 19,
                  textDecoration: "none",
                }}
              >
                <Text sx={{ color: colors.muted }}>$</Text> pnpm start
              </Link>
            </Box>
            <Box
              as="img"
              src={exportScreen}
              alt="ExitPress blog input screen with Naver Blog, output folder, and Markdown format settings"
              width={1024}
              height={720}
              fetchPriority="high"
              sx={{ ...screenshot, boxShadow: "0 24px 64px #00000040" }}
            />
          </Box>

          <Box as="section" id="demo" aria-labelledby="demo-title" sx={section}>
            <Box
              sx={{
                ...columns,
                alignItems: "end",
                mb: 5,
                gridTemplateColumns: ["1fr", "1fr", "1fr", "1fr 2fr"],
              }}
            >
              <SectionLabel>DEMO</SectionLabel>
              <Heading
                as="h2"
                id="demo-title"
                sx={{ ...heading, textAlign: ["left", "left", "left", "right"] }}
              >
                See what your posts become.
              </Heading>
            </Box>
            <Box
              as="img"
              src={storybookScreen}
              alt="ExitPress Parser Storybook showing a Tistory list, its HTML, original capture, and Markdown output"
              width={1440}
              height={1120}
              loading="lazy"
              sx={screenshot}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
              <Link
                href={demoUrl}
                sx={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 18 }}
              >
                Explore the parser demo <ArrowRightIcon />
              </Link>
            </Box>
          </Box>

          <Box as="section" aria-labelledby="about-title" sx={{ ...section, ...columns }}>
            <Box>
              <SectionLabel>WHAT IT IS</SectionLabel>
              <Heading as="h2" id="about-title" sx={{ ...heading, maxWidth: 500 }}>
                Your writing.
                <br />
                Ready for
                <br />
                its next home.
              </Heading>
            </Box>
            <Box sx={{ color: colors.muted, pt: [0, 0, 5] }}>
              <Box as="p" sx={{ fontSize: [23, 28], lineHeight: 1.5 }}>
                ExitPress turns public blog posts into files you can keep, edit, and publish
                anywhere.
              </Box>
              <Box as="p" sx={{ fontSize: 19, lineHeight: 1.6, mt: 4 }}>
                Export to GitHub Flavored Markdown, Fumadocs, Docusaurus, or Nextra.
              </Box>
              <Box as="p" sx={{ fontSize: 19, lineHeight: 1.6, mt: 4 }}>
                Keep frontmatter, download images, rewrite internal links, and resume interrupted
                exports.
              </Box>
            </Box>
          </Box>

          <Box
            as="section"
            id="setup"
            aria-labelledby="setup-title"
            sx={{ ...section, borderBottom: 0 }}
          >
            <Box sx={columns}>
              <Box>
                <SectionLabel>SETUP</SectionLabel>
                <Heading as="h2" id="setup-title" sx={heading}>
                  Run it locally.
                  <br />
                  Take your posts with you.
                </Heading>
                <Box as="p" sx={{ color: colors.muted, fontSize: 19, lineHeight: 1.6, mt: 4 }}>
                  Install{" "}
                  <Link
                    href="https://mise.jdx.dev/getting-started.html"
                    sx={{ color: colors.foreground, textDecoration: "underline" }}
                  >
                    mise
                  </Link>
                  , clone the repository, and start ExitPress.
                </Box>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: colors.border,
                    borderRadius: 6,
                    bg: "#0f0f0f",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 3,
                      px: 3,
                      py: 2,
                      borderBottom: "1px solid",
                      borderColor: colors.border,
                    }}
                  >
                    <Text sx={{ fontSize: 12, color: colors.muted, letterSpacing: "0.08em" }}>
                      QUICK START
                    </Text>
                    <Button
                      onClick={() => void copyCommands()}
                      leadingVisual={copyStatus === "copied" ? CheckIcon : CopyIcon}
                      size="small"
                      aria-label="Copy installation commands"
                    >
                      {copyStatus === "copied" ? "Copied" : "Copy"}
                    </Button>
                  </Box>
                  <Box
                    as="pre"
                    tabIndex={0}
                    aria-label="Installation commands"
                    sx={{ p: [3, 4], overflowX: "auto", fontSize: [12, 14], lineHeight: 2.1 }}
                  >
                    <code>{quickStart}</code>
                  </Box>
                </Box>
                <Box
                  as="p"
                  aria-live="polite"
                  sx={{
                    color: copyStatus === "failed" ? "danger.fg" : colors.muted,
                    fontSize: 14,
                    mt: 2,
                    minHeight: 21,
                  }}
                >
                  {copyStatus === "failed"
                    ? "Copy failed. Select the commands above to copy them."
                    : copyStatus === "copied"
                      ? "Installation commands copied."
                      : ""}
                </Box>
                <Box as="p" sx={{ color: colors.muted, fontSize: 17, lineHeight: 1.6, mt: 2 }}>
                  Open{" "}
                  <Link href="http://localhost:4173" sx={{ color: colors.foreground }}>
                    http://localhost:4173
                  </Link>
                  , choose your blog, and export.
                </Box>
              </Box>
            </Box>
            <Box
              as="ol"
              sx={{
                ...columns,
                gridTemplateColumns: ["1fr", "1fr", "1fr", "repeat(3, 1fr)"],
                listStyle: "none",
                m: 0,
                p: 0,
                mt: [5, 6],
                gap: 4,
              }}
            >
              {["Choose your blog", "Select posts and format", "Export to local files"].map(
                (step, index) => (
                  <Box
                    as="li"
                    key={step}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    <Text
                      aria-hidden="true"
                      sx={{ color: colors.muted, fontSize: 32, fontWeight: 650 }}
                    >
                      {index + 1}.
                    </Text>
                    {step}
                  </Box>
                ),
              )}
            </Box>
          </Box>
        </Box>

        <Box as="footer" sx={{ borderTop: "1px solid", borderColor: colors.border }}>
          <Box
            sx={{
              ...container,
              py: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 3,
            }}
          >
            <Text sx={{ color: colors.muted, fontSize: 14 }}>
              © {new Date().getFullYear()} ExitPress
            </Text>
            <Box as="nav" aria-label="Footer navigation" sx={{ display: "flex", gap: [3, 4] }}>
              <Link href={githubUrl} sx={link}>
                GitHub
              </Link>
              <Link href={demoUrl} sx={link}>
                Demo
              </Link>
              <Link href={`${githubUrl}/blob/main/LICENSE`} sx={link}>
                MIT License
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </PrimerAppProvider>
  )
}
