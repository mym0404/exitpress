# Primer React Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Exitpress web UI with Primer React, Octicons, Primer styling, and full browser verification for every major screen and every existing UI wrapper.

**Architecture:** Keep domain, server, export, parser, and API behavior unchanged. Replace the UI system at the web package boundary by introducing Primer providers and focused Primer-based view components, then rewrite the app shell, forms, overlays, result surfaces, Storybook route, and knowledge docs. Remove shadcn/Radix/remix icon/Tailwind dependencies only after all active screens render through Primer.

**Tech Stack:** TypeScript ESM, React 19, Vite, Primer React, Octicons React, Vitest, Playwright, Browser plugin screenshots, `mise exec -- pnpm ...`.

---

## Execution Rules

- Do not create a branch, commit, push, or PR unless the user explicitly asks.
- Run commands from `/Users/mj/.codex/worktrees/a7fc/farewell-naver-blog`.
- Use `mise exec -- pnpm ...` for repo scripts.
- UI-changing tasks must pass static checks before browser checks.
- Browser checks must cover desktop, mobile, light, and dark when the touched surface is user-visible.
- If a screenshot shows shadcn/Radix visual leftovers, fix within the same task and repeat browser verification.
- Before marking a UI milestone complete, dispatch the project-local custom agent `primer_ui_specialist`, registered in `.codex/config.toml` and backed by `.codex/agents/primer_ui_specialist.toml`, for read-only Primer Product UI, Primer React, Octicons, token, accessibility, and screenshot-evidence review.
- Subagents used for verification are read-only. Implementation workers receive explicit file ownership before editing.

## File Structure Plan

### Create

- `.codex/config.toml`: register project-local Codex subagents and keep concurrency at the repo-required cap.
- `.codex/agents/primer_ui_specialist.toml`: project-local Codex custom agent for read-only Primer Product UI specialist review.
- `packages/web/src/app/PrimerAppProvider.tsx`: Primer `ThemeProvider`, `BaseStyles`, color mode bridge.
- `packages/web/src/app/ThemeColorMode.ts`: mapping between `ThemePreference` and Primer color modes.
- `packages/web/src/styles/global.css`: minimal non-Tailwind reset, app root sizing, CodeMirror/log exceptions.
- `packages/web/src/components/primer/PrimerStatusLabel.tsx`: shared status label mapping.
- `packages/web/src/components/primer/PrimerPage.tsx`: shared page section/layout helpers built from Primer `Box`.
- `packages/web/src/components/primer/PrimerToast.tsx`: replacement toast adapter used by hooks.
- `packages/web/src/components/primer/PrimerVerificationMatrix.md`: living component-to-screen verification checklist.

### Modify

- `pnpm-workspace.yaml`: add Primer catalog entries and remove old UI catalog entries in Task 10.
- `packages/web/package.json`: add Primer packages and remove old UI dependencies in Task 10.
- `packages/web/vite.config.ts`: remove Tailwind plugin after Tailwind classes are gone.
- `packages/web/src/Main.tsx`: import new global CSS.
- `packages/web/src/app/App.tsx`: switch toast import and keep app state behavior.
- `packages/web/src/app/AppShell.tsx`: rebuild shell with Primer layout.
- `packages/web/src/app/AppStepView.tsx`: rebuild running/result step surfaces.
- `packages/web/src/app/BootstrapLoadingOverlay.tsx`: Primer loading surface.
- `packages/web/src/features/common/shell/WizardHeader.tsx`: Primer header, nav, theme controls.
- `packages/web/src/features/common/shell/WizardDock.tsx`: Primer footer actions.
- `packages/web/src/features/common/shell/WizardFlow.tsx`: Octicons only.
- `packages/web/src/features/scan/BlogInputPanel.tsx`: Primer input form.
- `packages/web/src/features/scan/CategoryPanel.tsx`: Primer table/list selection.
- `packages/web/src/features/options/*.tsx`: Primer option screens.
- `packages/web/src/features/upload/*.tsx`: Primer upload provider forms.
- `packages/web/src/features/job-results/*.tsx`: Primer results, logs, menus, progress.
- `packages/web/src/features/resume/ResumeDialogPanel.tsx`: Primer dialog.
- `packages/web/src/features/storybook/StorybookPage.tsx`: Primer Storybook route.
- `.agents/knowledge/DESIGN.md`: Primer source of truth.
- `AGENTS.md`: update design system summary if still says shadcn/Radix.
- `tests/e2e/scenarios/ui-smoke.spec.ts`: extend screenshot/navigation coverage where practical.
- `tests/e2e/scenarios/ui-resume-smoke.spec.ts`: keep resume dialog coverage aligned.

### Delete Or Empty After Migration

- `packages/web/src/components/ui/Accordion.tsx`
- `packages/web/src/components/ui/Alert.tsx`
- `packages/web/src/components/ui/Badge.tsx`
- `packages/web/src/components/ui/Button.tsx`
- `packages/web/src/components/ui/Card.tsx`
- `packages/web/src/components/ui/Checkbox.tsx`
- `packages/web/src/components/ui/Collapsible.tsx`
- `packages/web/src/components/ui/Dialog.tsx`
- `packages/web/src/components/ui/DropdownMenu.tsx`
- `packages/web/src/components/ui/Field.tsx`
- `packages/web/src/components/ui/Input.tsx`
- `packages/web/src/components/ui/Progress.tsx`
- `packages/web/src/components/ui/ScrollArea.tsx`
- `packages/web/src/components/ui/Select.tsx`
- `packages/web/src/components/ui/Separator.tsx`
- `packages/web/src/components/ui/Skeleton.tsx`
- `packages/web/src/components/ui/Sonner.tsx`
- `packages/web/src/components/ui/Table.tsx`
- `packages/web/src/components/ui/Tabs.tsx`
- `packages/web/src/components/ui/ToggleGroup.tsx`
- `packages/web/src/components/ui/Tooltip.tsx`
- `packages/web/src/lib/Cn.ts`

Delete only after imports are gone. Do not leave re-export shims.

## Task 1: Baseline Inventory And Verification Matrix

**Files:**
- Create: `packages/web/src/components/primer/PrimerVerificationMatrix.md`
- Read: `packages/web/src/components/ui/*.tsx`
- Read: `packages/web/src/features/**/*.{ts,tsx}`

- [ ] **Step 1: Confirm UI wrapper inventory**

Run:

```bash
rg --files packages/web/src/components/ui
rg -n "@radix-ui/|radix-ui|@remixicon/react" packages/web/src
rg -n "from \"(\\.\\./)+components/ui|from \"(\\.\\./)+\\.\\./components/ui|components/ui" packages/web/src
```

Expected:
- 21 files under `packages/web/src/components/ui`.
- Direct Radix/remix imports only in current UI and known feature files.
- Import list matches the approved design spec.

- [ ] **Step 2: Write verification matrix**

Create `packages/web/src/components/primer/PrimerVerificationMatrix.md` with this table and keep it updated during execution:

```markdown
# Primer Verification Matrix

| Existing UI wrapper | Final state | Primer replacement | Verification screen | Browser evidence | Result |
|---|---|---|---|---|---|
| Accordion | 실행 전 | Details/ActionList | Storybook route | 실행 전 | 실행 전 |
| Alert | 실행 전 | Flash | Frontmatter, Resume | 실행 전 | 실행 전 |
| Badge | 실행 전 | Label/Token | Header, Category, Results | 실행 전 | 실행 전 |
| Button | 실행 전 | Button/IconButton | All major screens | 실행 전 | 실행 전 |
| Card | 실행 전 | Box/PageLayout/BorderBox | App shell, Options, Results | 실행 전 | 실행 전 |
| Checkbox | 실행 전 | Checkbox/FormControl | Category, Frontmatter, Upload | 실행 전 | 실행 전 |
| Collapsible | 실행 전 | Details | Structure preview | 실행 전 | 실행 전 |
| Dialog | 실행 전 | Dialog | Resume, Template help | 실행 전 | 실행 전 |
| DropdownMenu | 실행 전 | ActionMenu/ActionList | Results, Template editor | 실행 전 | 실행 전 |
| Field | 실행 전 | FormControl | Blog input, Category | 실행 전 | 실행 전 |
| Input | 실행 전 | TextInput | Blog input, Category, Upload | 실행 전 | 실행 전 |
| Progress | 실행 전 | ProgressBar | Running, Upload | 실행 전 | 실행 전 |
| ScrollArea | 실행 전 | Box overflow | Results, Logs, Storybook | 실행 전 | 실행 전 |
| Select | 실행 전 | Select/SelectPanel | Options, Upload provider | 실행 전 | 실행 전 |
| Separator | 실행 전 | Box border | Logs | 실행 전 | 실행 전 |
| Skeleton | 실행 전 | Removed if unused | rg check | 실행 전 | 실행 전 |
| Sonner | 실행 전 | Flash/toast adapter | Notifications | 실행 전 | 실행 전 |
| Table | 실행 전 | Primer table pattern | Category, Results | 실행 전 | 실행 전 |
| Tabs | 실행 전 | Removed if unused | rg check | 실행 전 | 실행 전 |
| ToggleGroup | 실행 전 | SegmentedControl | Theme, Upload auth | 실행 전 | 실행 전 |
| Tooltip | 실행 전 | Tooltip | Results row actions | 실행 전 | 실행 전 |
```

- [ ] **Step 3: Verify no accidental edits**

Run:

```bash
git status --short
```

Expected:
- Only the design doc and this new plan/matrix files are untracked or modified at this point.

## Task 2: Primer Dependencies And Provider

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `packages/web/package.json`
- Modify: `packages/web/src/Main.tsx`
- Create: `packages/web/src/app/ThemeColorMode.ts`
- Create: `packages/web/src/app/PrimerAppProvider.tsx`
- Create: `packages/web/src/styles/global.css`
- Delete in Task 10: `packages/web/src/styles/globals.css`

- [ ] **Step 1: Add Primer catalog entries**

Edit `pnpm-workspace.yaml` catalog to include:

```yaml
  "@primer/octicons-react": ^19.19.0
  "@primer/react": ^37.14.0
```

If `pnpm` resolves newer compatible versions, keep the resolved lockfile state and use the catalog values that `pnpm` writes.

- [ ] **Step 2: Add web dependencies**

Edit `packages/web/package.json` dependencies to include:

```json
"@primer/octicons-react": "catalog:",
"@primer/react": "catalog:"
```

Keep old UI dependencies until Task 10.

- [ ] **Step 3: Install lockfile changes**

Run:

```bash
mise exec -- pnpm install
```

Expected:
- `pnpm-lock.yaml` updates.
- No install error.

- [ ] **Step 4: Create theme mapping**

Create `packages/web/src/app/ThemeColorMode.ts`:

```ts
import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"

export const getPrimerColorMode = (themePreference: ThemePreference) =>
  themePreference === "light" ? "day" : "night"
```

- [ ] **Step 5: Create Primer provider**

Create `packages/web/src/app/PrimerAppProvider.tsx`:

```tsx
import { BaseStyles, ThemeProvider } from "@primer/react"

import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"
import type { ReactNode } from "react"

import { getPrimerColorMode } from "./ThemeColorMode.js"

export const PrimerAppProvider = ({
  children,
  themePreference,
}: {
  children: ReactNode
  themePreference: ThemePreference
}) => (
  <ThemeProvider colorMode={getPrimerColorMode(themePreference)}>
    <BaseStyles>{children}</BaseStyles>
  </ThemeProvider>
)
```

- [ ] **Step 6: Create minimal global CSS**

Create `packages/web/src/styles/global.css`:

```css
@font-face {
  font-family: "Geist Sans";
  src: url("../assets/fonts/Geist-Variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "Geist Mono";
  src: url("../assets/fonts/GeistMono-Variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

html,
body,
#root {
  min-height: 100%;
  width: 100%;
  margin: 0;
}

body {
  font-family: "Geist Sans", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  overflow-x: clip;
}

code,
pre,
.font-mono,
.cm-editor,
.cm-content {
  font-family: "Geist Mono", "SFMono-Regular", "Roboto Mono", monospace;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 7: Switch CSS import**

In `packages/web/src/Main.tsx`, replace:

```ts
import "./styles/globals.css"
```

with:

```ts
import "./styles/global.css"
```

Rely on `BaseStyles` from `PrimerAppProvider.tsx` for Primer base styling.

- [ ] **Step 8: Wrap app shell**

In `packages/web/src/app/AppShell.tsx`, wrap the returned shell with `PrimerAppProvider`:

```tsx
import { Box } from "@primer/react"

import { PrimerAppProvider } from "./PrimerAppProvider.js"

export const AppShell = (props: AppShellProps) => (
  <PrimerAppProvider themePreference={props.themePreference}>
    <Box as="main" sx={{ minHeight: "100vh", bg: "canvas.default", color: "fg.default" }}>
      {/* existing shell content, migrated in Task 3 */}
    </Box>
  </PrimerAppProvider>
)
```

Keep prop typing equivalent to the current inline props object or extract `type AppShellProps` in the same file.

- [ ] **Step 9: Static verification**

Run:

```bash
mise exec -- pnpm check:type
mise exec -- pnpm build:ui
```

Expected:
- Both pass before browser checks.

- [ ] **Step 10: Browser verification**

Start the app:

```bash
mise exec -- pnpm dev
```

Open the served local URL in Browser. Capture:
- desktop light first screen
- desktop dark first screen
- mobile light first screen
- mobile dark first screen

Expected:
- App renders inside Primer provider.
- No blank screen.
- Theme toggle still changes visual mode.

Stop the dev server after verification.

## Task 3: App Shell And Navigation

**Files:**
- Modify: `packages/web/src/app/AppShell.tsx`
- Modify: `packages/web/src/app/BootstrapLoadingOverlay.tsx`
- Modify: `packages/web/src/features/common/shell/WizardHeader.tsx`
- Modify: `packages/web/src/features/common/shell/WizardDock.tsx`
- Modify: `packages/web/src/features/common/shell/WizardFlow.tsx`
- Modify: `packages/web/src/components/primer/PrimerVerificationMatrix.md`

- [ ] **Step 1: Replace shell layout with Primer Box**

In `AppShell.tsx`, remove `cn`, `dashboard-shell`, `shell-backdrop`, and Tailwind class layout. Use this structure:

```tsx
<PrimerAppProvider themePreference={themePreference}>
  <Box as="main" sx={{ minHeight: "100vh", bg: "canvas.default", color: "fg.default" }}>
    <ResumeDialogPanel
      resumeDialog={resumeDialog}
      resettingResume={resettingResume}
      restoringResume={restoringResume}
      onReset={onResetResume}
      onRestore={onRestoreResume}
    />
    {bootstrapping ? <BootstrapLoadingOverlay /> : null}
    <Box sx={{ maxWidth: "1280px", mx: "auto", px: [3, 4], py: [3, 4], pb: isSetupStep ? 7 : 4 }}>
      <WizardHeader
        title={stepMeta[currentStep].title}
        description={stepMeta[currentStep].description}
        themePreference={themePreference}
        headerStatus={headerStatus}
        summaryCards={summaryCards}
        onThemeChange={onThemeChange}
      />
      <Box as="section" ref={stepViewRef} data-step-view={currentStep} sx={{ display: "grid", gap: 3 }}>
        {children}
      </Box>
    </Box>
    <WizardDock
      isSetupStep={isSetupStep}
      setupStep={setupStep}
      setupStepIndex={setupStepIndex}
      currentScanTarget={currentScanTarget}
      scanPending={scanPending}
      exportDisabled={exportDisabled}
      nextDisabled={nextDisabled}
      submitting={submitting}
      nextButtonLabel={nextButtonLabel}
      nextActionIcon={
        <NextActionIcon setupStep={setupStep} scanPending={scanPending} submitting={submitting} />
      }
      onPrevious={onPrevious}
      onForceScan={onForceScan}
      onNext={onNext}
    />
  </Box>
</PrimerAppProvider>
```

- [ ] **Step 2: Replace header icons**

In `WizardHeader.tsx`, replace Remix imports with Octicons:

```tsx
import {
  BookIcon,
  ChevronLeftIcon,
  GlobeIcon,
  MarkGithubIcon,
  MoonIcon,
  SunIcon,
} from "@primer/octicons-react"
import { ActionList, Box, Button, Header, IconButton, Label, SegmentedControl, Text } from "@primer/react"
```

Use `IconButton` for back link and `SegmentedControl` for theme selection.

- [ ] **Step 3: Replace status badge**

Create or use `PrimerStatusLabel` with:

```tsx
import { Label } from "@primer/react"

export const PrimerStatusLabel = ({ status, children }: { status: string; children: string }) => {
  const variant =
    status === "failed" || status === "error"
      ? "danger"
      : status === "running" || status === "uploading"
        ? "accent"
        : status === "ready" || status === "completed"
          ? "success"
          : "secondary"

  return <Label variant={variant}>{children}</Label>
}
```

- [ ] **Step 4: Replace dock buttons**

In `WizardDock.tsx`, use Primer `Button` and `ButtonGroup` or `Box` with `Button`. Keep existing labels and event handlers. Do not add instructional UI copy.

- [ ] **Step 5: Replace next action icons**

In `WizardFlow.tsx`, replace `RiArrowRightLine`, `RiDownload2Line`, `RiLoader4Line`, `RiRadarLine` with:

```tsx
import { ArrowRightIcon, DownloadIcon, IssueOpenedIcon, SyncIcon } from "@primer/octicons-react"
```

For spinning loader, use Primer `Spinner` in `NextActionIcon`.

- [ ] **Step 6: Replace loading overlay**

In `BootstrapLoadingOverlay.tsx`, use:

```tsx
import { Box, Spinner, Text } from "@primer/react"
```

Render a centered `Box` with `Spinner size="large"` and the current Korean loading text.

- [ ] **Step 7: Verify shell**

Run:

```bash
mise exec -- pnpm check:type
mise exec -- pnpm build:ui
```

Expected:
- No Remix icon import remains in shell files.
- Build passes.

- [ ] **Step 8: Browser verify shell**

Capture desktop/mobile and light/dark screenshots for:
- first export screen
- theme toggle opened/changed
- bottom action region

Expected:
- Header, status, summary, and actions look like GitHub product UI.
- No large rounded shadcn dashboard card remains in shell.

## Task 4: Shared Primer Building Blocks

**Files:**
- Create: `packages/web/src/components/primer/PrimerPage.tsx`
- Create or modify: `packages/web/src/components/primer/PrimerStatusLabel.tsx`
- Create or modify: `packages/web/src/components/primer/PrimerToast.tsx`
- Modify: `packages/web/src/app/App.tsx`
- Modify: `packages/web/src/features/common/hooks/UseWizardCategoryActions.ts`
- Modify: `packages/web/src/features/common/hooks/UseWizardScanActions.ts`
- Modify: `packages/web/src/features/common/hooks/UseWizardResumeActions.ts`
- Modify: `packages/web/src/features/job-results/UseJobNotifications.ts`

- [ ] **Step 1: Create page helpers**

Create `PrimerPage.tsx`:

```tsx
import { Box, Heading, Text } from "@primer/react"

import type { ReactNode } from "react"

export const PrimerPanel = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      bg: "canvas.default",
      borderColor: "border.default",
      borderStyle: "solid",
      borderWidth: 1,
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
      <Text as="p" sx={{ color: "fg.muted", fontSize: 1, mt: 1 }}>
        {description}
      </Text>
    ) : null}
  </Box>
)

export const PrimerPanelBody = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: "grid", gap: 3, p: 3 }}>{children}</Box>
)
```

- [ ] **Step 2: Create toast adapter**

Create `PrimerToast.tsx`:

```tsx
import { Flash } from "@primer/react"
import { useEffect, useState } from "react"

type ToastMessage = {
  id: number
  message: string
  variant: "default" | "danger" | "success"
}

export const toast = {
  success: (message: string) => {
    window.dispatchEvent(new CustomEvent("exitpress-toast", { detail: { message, variant: "success" } }))
  },
  error: (message: string) => {
    window.dispatchEvent(new CustomEvent("exitpress-toast", { detail: { message, variant: "danger" } }))
  },
  message: (message: string) => {
    window.dispatchEvent(new CustomEvent("exitpress-toast", { detail: { message, variant: "default" } }))
  },
}

export const PrimerToastViewport = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<Omit<ToastMessage, "id">>).detail
      const id = Date.now()

      setMessages((current) => [...current, { id, ...detail }])
      window.setTimeout(() => {
        setMessages((current) => current.filter((message) => message.id !== id))
      }, 3800)
    }

    window.addEventListener("exitpress-toast", handleToast)

    return () => {
      window.removeEventListener("exitpress-toast", handleToast)
    }
  }, [])

  return (
    <div style={{ position: "fixed", right: 16, top: 16, zIndex: 1000 }}>
      {messages.map((message) => (
        <Flash key={message.id} variant={message.variant}>
          {message.message}
        </Flash>
      ))}
    </div>
  )
}
```

Mount `PrimerToastViewport` in `AppShell.tsx` where the old `Toaster` rendered.

- [ ] **Step 3: Switch toast imports**

Replace imports from `components/ui/Sonner.js` with `components/primer/PrimerToast.js`.

- [ ] **Step 4: Static verification**

Run:

```bash
mise exec -- pnpm check:type
```

Expected:
- Toast callers compile.

## Task 5: Blog Input And Category Selection

**Files:**
- Modify: `packages/web/src/features/scan/BlogInputPanel.tsx`
- Modify: `packages/web/src/features/scan/CategoryPanel.tsx`
- Modify: `packages/web/src/features/scan/CategorySelection.spec.ts`
- Modify: `packages/web/src/components/primer/PrimerVerificationMatrix.md`

- [ ] **Step 1: Rewrite blog input with Primer form controls**

Use this component shape:

```tsx
import { Box, Button, Flash, FormControl, TextInput } from "@primer/react"

import { PrimerPanel, PrimerPanelBody } from "../../components/primer/PrimerPage.js"

type BlogInputPanelProps = {
  blogIdOrUrl: string
  outputDir: string
  scanPending: boolean
  scanStatus: string
  scanStatusTone: ScanStatusTone
  onBlogIdOrUrlChange: (value: string) => void
  onOutputDirChange: (value: string) => void
  onOutputDirBlur: () => void
}

export const BlogInputPanel = ({
  blogIdOrUrl,
  outputDir,
  scanPending,
  scanStatus,
  scanStatusTone,
  onBlogIdOrUrlChange,
  onOutputDirChange,
  onOutputDirBlur,
}: BlogInputPanelProps) => (
  <PrimerPanel>
    <PrimerPanelBody>
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: ["1fr", "1fr 1fr"] }}>
        <FormControl>
          <FormControl.Label>블로그 ID 또는 주소</FormControl.Label>
          <TextInput
            id="blogIdOrUrl"
            value={blogIdOrUrl}
            disabled={scanPending}
            onChange={(event) => onBlogIdOrUrlChange(event.target.value)}
            block
          />
          <FormControl.Caption>네이버 블로그 ID나 전체 주소를 입력합니다.</FormControl.Caption>
        </FormControl>
        <FormControl>
          <FormControl.Label>결과 저장 경로</FormControl.Label>
          <TextInput
            id="outputDir"
            value={outputDir}
            required
            onChange={(event) => onOutputDirChange(event.target.value)}
            onBlur={onOutputDirBlur}
            block
          />
        </FormControl>
      </Box>
      {scanStatus ? <Flash variant={scanStatusTone === "error" ? "danger" : "default"}>{scanStatus}</Flash> : null}
    </PrimerPanelBody>
  </PrimerPanel>
)
```

Keep existing prop names by extracting `type BlogInputPanelProps` from the current component.

- [ ] **Step 2: Rewrite category table**

Use Primer `Box`, native `table`, Primer `Checkbox`, `TextInput`, `Button`, and `Label`. Keep category selection logic unchanged.

- [ ] **Step 3: Run focused tests**

Run:

```bash
mise exec -- pnpm vitest run packages/web/src/features/scan/CategorySelection.spec.ts --configLoader runner --silent
mise exec -- pnpm check:type
mise exec -- pnpm build:ui
```

Expected:
- Category pure tests pass.
- Typecheck/build pass.

- [ ] **Step 4: Browser verify scan screens**

Capture:
- blog input desktop/mobile light/dark
- category selection desktop/mobile light/dark
- category search after typing
- category checkbox selected state

Expected:
- Form and table look like GitHub settings/list UI.
- No shadcn Card, Badge, Input, Checkbox, Table import remains in these files.

## Task 6: Option Screens

**Files:**
- Modify: `packages/web/src/features/options/OptionControls.tsx`
- Modify: `packages/web/src/features/options/ExportOptionsPanel.tsx`
- Modify: `packages/web/src/features/options/StructureOptionsStep.tsx`
- Modify: `packages/web/src/features/options/StructurePreview.tsx`
- Modify: `packages/web/src/features/options/FrontmatterOptionsStep.tsx`
- Modify: `packages/web/src/features/options/AssetsOptionsStep.tsx`
- Modify: `packages/web/src/features/options/LinksOptionsStep.tsx`
- Modify: `packages/web/src/features/options/DiagnosticsOptionsStep.tsx`
- Modify: `packages/web/src/features/options/UploadProviderOptionsStep.tsx`
- Modify: `packages/web/src/features/upload/UploadProviderSettingsForm.tsx`
- Modify: `packages/web/src/features/upload/UploadGithubOptions.tsx`
- Modify: `packages/web/src/features/options/UploadProviderOptionsStep.spec.tsx`
- Modify: `packages/web/src/components/primer/PrimerVerificationMatrix.md`

- [ ] **Step 1: Replace OptionControls API internals**

Keep exported option helper names if feature files still use them, but implement them with Primer:

```tsx
import { Box, Checkbox, FormControl, Select, Text } from "@primer/react"
```

Use `FormControl` for labels/descriptions and `Select` for simple select fields. Use `Checkbox` inside label rows for boolean options.

- [ ] **Step 2: Rewrite ExportOptionsPanel shell**

Use `PrimerPanel`, `PrimerPanelHeader`, `PrimerPanelBody`. Remove `Card`, `CardContent`, `board-card`, and `panel-body`.

- [ ] **Step 3: Replace structure preview icons**

In `StructurePreview.tsx`, replace custom SVG icons with:

```tsx
import { ChevronDownIcon, FileIcon, FileDirectoryIcon } from "@primer/octicons-react"
```

Use Primer `Details` for nested tree display.

- [ ] **Step 4: Rewrite upload provider forms**

Use Primer `FormControl`, `Select`, `TextInput`, `Checkbox`, `SegmentedControl`, `Flash`, and `Button`. Keep existing validation functions from `UploadProviderFormRules.ts`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
mise exec -- pnpm vitest run packages/web/src/features/options/UploadProviderOptionsStep.spec.tsx packages/web/src/features/upload/UploadProviderSettingsForm.spec.tsx packages/web/src/features/options/TemplatePreview.spec.ts packages/web/src/features/options/TemplatePropAutocomplete.spec.ts packages/web/src/features/options/BlockTemplateCard.spec.ts --configLoader runner --silent
mise exec -- pnpm check:type
mise exec -- pnpm build:ui
```

Expected:
- Existing option behavior tests pass or are updated only for accessible Primer roles/names.
- Typecheck/build pass.

- [ ] **Step 6: Browser verify every option step**

Capture light/dark and desktop/mobile screenshots for:
- structure
- frontmatter
- assets
- upload provider
- links
- diagnostics
- markdown options

Interact with:
- select controls
- checkbox controls
- segmented controls
- structure preview

Expected:
- All option screens use Primer form grammar.
- No Tailwind card grid look remains.

## Task 7: Template Editor, Dialog, ActionMenu, Tooltip

**Files:**
- Modify: `packages/web/src/features/options/TemplateEditorCard.tsx`
- Modify: `packages/web/src/features/options/BlockTemplateCard.tsx`
- Modify: `packages/web/src/features/options/BlockTemplateOptions.tsx`
- Modify: `packages/web/src/features/job-results/JobResultsTable.tsx` for tooltip/menu pieces if shared here
- Modify: `packages/web/src/components/primer/PrimerVerificationMatrix.md`

- [ ] **Step 1: Replace template editor chrome**

Use Primer `Box`, `Button`, `IconButton`, `ActionMenu`, `ActionList`, `Dialog`, `Label`, and existing CodeMirror editor. Keep CodeMirror package usage unchanged.

- [ ] **Step 2: Replace help dialog**

Use Primer `Dialog` controlled by local state:

```tsx
const [helpOpen, setHelpOpen] = useState(false)

{helpOpen ? (
  <Dialog title="템플릿 문법" onClose={() => setHelpOpen(false)}>
    {/* existing help content */}
  </Dialog>
) : null}
```

- [ ] **Step 3: Replace menu actions**

Use:

```tsx
<ActionMenu>
  <ActionMenu.Button>작업</ActionMenu.Button>
  <ActionMenu.Overlay>
    <ActionList>
      <ActionList.Item onSelect={onReset}>기본값으로 되돌리기</ActionList.Item>
    </ActionList>
  </ActionMenu.Overlay>
</ActionMenu>
```

- [ ] **Step 4: Verify overlay behavior**

Run:

```bash
mise exec -- pnpm check:type
mise exec -- pnpm build:ui
```

Browser checks:
- open template help dialog
- close with close button
- close with Escape
- open action menu
- select menu item
- verify focus is not trapped after close

Expected:
- No `DropdownMenu`, `Dialog`, `Tooltip` imports from `components/ui`.

## Task 8: Running, Upload, Results, Logs

**Files:**
- Modify: `packages/web/src/app/AppStepView.tsx`
- Modify: `packages/web/src/features/job-results/ProgressSections.tsx`
- Modify: `packages/web/src/features/job-results/UploadPanel.tsx`
- Modify: `packages/web/src/features/job-results/JobResultsPanel.tsx`
- Modify: `packages/web/src/features/job-results/JobResultsTable.tsx`
- Modify: `packages/web/src/features/job-results/JobLogsPanel.tsx`
- Modify: `packages/web/src/features/job-results/CompactMetrics.tsx`
- Modify: `packages/web/src/components/primer/PrimerVerificationMatrix.md`

- [ ] **Step 1: Replace progress with Primer ProgressBar**

Use:

```tsx
import { ProgressBar } from "@primer/react"

<ProgressBar progress={percentage} aria-label="진행률" />
```

Compute `percentage` from existing completed/total values.

- [ ] **Step 2: Replace result table**

Use native `table` inside Primer `Box` with Primer colors:

```tsx
<Box sx={{ border: "1px solid", borderColor: "border.default", borderRadius: 2, overflow: "auto" }}>
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    {/* existing headers and rows */}
  </table>
</Box>
```

- [ ] **Step 3: Replace row action menu icons**

Replace Remix imports with Octicons:

```tsx
import { FileIcon, FileDirectoryOpenFillIcon, KebabHorizontalIcon, LinkExternalIcon } from "@primer/octicons-react"
```

Use Primer `ActionMenu` for row actions.

- [ ] **Step 4: Rewrite logs as GitHub Actions style surface**

Use Primer `Box` with dark code surface and monospace text. Keep existing log data mapping unchanged.

- [ ] **Step 5: Run tests**

Run:

```bash
mise exec -- pnpm vitest run packages/web/src/features/job-results/UseExportJob.spec.tsx --configLoader runner --silent
mise exec -- pnpm check:type
mise exec -- pnpm build:ui
```

Expected:
- Job hook tests pass.
- Typecheck/build pass.

- [ ] **Step 6: Browser verify result states**

Capture:
- running state
- upload ready/uploading state
- completed result table
- failed result table
- logs panel
- row action menu open
- tooltip or accessible label display

Expected:
- Result and logs look like GitHub Actions/Checks surfaces.
- No `Table`, `ScrollArea`, `DropdownMenu`, `Tooltip`, `Progress`, `Badge`, `Card` imports from `components/ui`.

## Task 9: Resume Dialog, Storybook, Loading, Edge States

**Files:**
- Modify: `packages/web/src/features/resume/ResumeDialogPanel.tsx`
- Modify: `packages/web/src/features/storybook/StorybookPage.tsx`
- Modify: `packages/web/src/app/BootstrapLoadingOverlay.tsx`
- Modify: `packages/web/src/components/primer/PrimerVerificationMatrix.md`

- [ ] **Step 1: Rewrite resume dialog**

Use Primer `Dialog`, `Flash`, `Button`, and `Box`. Keep reset/restore handlers unchanged.

- [ ] **Step 2: Rewrite Storybook route**

Replace Accordion/Card UI with Primer navigation and detail layout:

```tsx
import { ActionList, Box, Heading, Label, PageLayout, Text } from "@primer/react"
```

Use `ActionList` for fixture navigation and `Box` for rendered block previews.

- [ ] **Step 3: Verify route and dialog**

Run:

```bash
mise exec -- pnpm vitest run packages/web/src/features/storybook/StorybookCatalog.spec.ts --configLoader runner --silent
mise exec -- pnpm check:type
mise exec -- pnpm build:ui
```

Browser checks:
- `/storybook` desktop/mobile light/dark
- resume dialog open/restore/reset paths using existing smoke setup
- loading overlay screenshot

Expected:
- Storybook no longer looks like shadcn accordion/card UI.
- Resume dialog is Primer Dialog and keyboard close works.

## Task 10: Remove Old UI System

**Files:**
- Modify: `packages/web/package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `packages/web/vite.config.ts`
- Delete: `packages/web/src/components/ui/*`
- Delete: `packages/web/src/styles/globals.css`
- Delete: `packages/web/src/lib/Cn.ts`
- Modify: every remaining import returned by `rg`

- [ ] **Step 1: Remove remaining imports**

Run:

```bash
rg -n "components/ui|@radix-ui/|radix-ui|@remixicon/react|tailwind-merge|class-variance-authority" packages/web/src
```

Expected:
- Any result points to code that must be migrated before deletion.

- [ ] **Step 2: Remove Tailwind plugin from Vite**

In `packages/web/vite.config.ts`, remove:

```ts
import tailwindcss from "@tailwindcss/vite"
```

and change:

```ts
plugins: [react(), tailwindcss()],
```

to:

```ts
plugins: [react()],
```

- [ ] **Step 3: Remove old dependencies**

Remove from `packages/web/package.json`:

```json
"@radix-ui/react-scroll-area": "catalog:",
"@radix-ui/react-slot": "catalog:",
"@remixicon/react": "catalog:",
"class-variance-authority": "catalog:",
"radix-ui": "catalog:",
"tailwind-merge": "catalog:",
"tailwindcss": "catalog:"
```

Remove `@tailwindcss/vite` from devDependencies.

- [ ] **Step 4: Remove old catalog entries if unused workspace-wide**

From `pnpm-workspace.yaml`, remove the old Radix/remix/Tailwind/catalog entries only if `rg` confirms no other package uses them.

- [ ] **Step 5: Install lockfile changes**

Run:

```bash
mise exec -- pnpm install
```

Expected:
- Lockfile removes old UI packages.

- [ ] **Step 6: Delete old files**

Delete the 21 files in `packages/web/src/components/ui`, `packages/web/src/styles/globals.css`, and `packages/web/src/lib/Cn.ts`.

- [ ] **Step 7: Static verification**

Run:

```bash
rg -n "@radix-ui/|radix-ui|@remixicon/react" packages/web package.json pnpm-lock.yaml
rg -n "tailwindcss|tailwind-merge|@tailwindcss|@import \"tailwindcss\"" packages/web package.json pnpm-workspace.yaml pnpm-lock.yaml
mise exec -- pnpm check:unused
mise exec -- pnpm check:type
mise exec -- pnpm check:lint
mise exec -- pnpm build:ui
```

Expected:
- `rg` commands return no old UI dependency usage except historical text in docs/specs.
- Check commands pass.

## Task 11: Component-Level Subagent Verification

**Files:**
- Modify: `packages/web/src/components/primer/PrimerVerificationMatrix.md`
- No production code edits in verification subagents.

- [ ] **Step 1: Spawn one read-only verifier per component group**

Use 21 verifier prompts. Each verifier must inspect browser screenshots or removal evidence for exactly one row in the matrix.

Prompt template:

```text
작업 위치: /Users/mj/.codex/worktrees/a7fc/farewell-naver-blog

읽기 전용 검증만 수행하세요. 파일 수정, 브랜치, 커밋, PR 금지.

담당 컴포넌트: <COMPONENT_NAME>
검증 목표:
- 기존 shadcn/Radix 래퍼가 Primer 대체 또는 제거로 처리됐는지 확인
- 실제 사용 화면에서 GitHub Primer UI와 이질감이 없는지 확인
- 라이트/다크, 데스크톱/모바일 증거가 있는지 확인

출력:
- 담당 컴포넌트
- 확인 파일과 줄 번호
- 확인 화면
- 브라우저 증거 경로 또는 제거 rg 증거
- 판정: 통과 / 수정 필요
- 수정 필요 시 구체적 문제 1개 이상
```

- [ ] **Step 2: Update matrix**

For each returned verifier result, update `PrimerVerificationMatrix.md` row:

```markdown
| Button | Primer Button/IconButton | Button/IconButton | App shell, options, results | screenshots/button-*.png | Passed |
```

- [ ] **Step 3: Repeat failures**

For each `수정 필요` result:
- Fix the relevant production file.
- Re-run static checks for that area.
- Re-run the same verifier prompt.
- Update the matrix only after passing.

## Task 12: Major Screen Browser Verification

**Files:**
- Modify: `tests/e2e/scenarios/ui-smoke.spec.ts`
- Modify: `tests/e2e/scenarios/ui-resume-smoke.spec.ts`
- Create: `tests/e2e/scenarios/ui-primer-visual.spec.ts`
- Modify: `packages/web/src/components/primer/PrimerVerificationMatrix.md`

- [ ] **Step 1: Add visual smoke test file**

Create `tests/e2e/scenarios/ui-primer-visual.spec.ts` with Playwright routes using the existing e2e test server helpers from nearby tests. The test should visit:
- export first screen
- category screen
- each option screen reachable through the wizard
- running/result screens using existing mock API state
- storybook route
- resume dialog route/state where existing helper supports it

- [ ] **Step 2: Add screenshot assertions**

Use Playwright `page.screenshot()` evidence paths or `expect(page).toHaveScreenshot()` if the repo already uses snapshot comparison. Prefer evidence screenshots over brittle pixel snapshots unless existing tests already use snapshots.

- [ ] **Step 3: Run browser checks**

Run:

```bash
mise exec -- pnpm build:ui
mise exec -- pnpm check:playwright
```

Expected:
- Browser smoke passes.
- Screenshots exist for all major screens listed in the design spec.

- [ ] **Step 4: Manual Browser plugin inspection**

Open the local app with Browser and inspect:
- desktop light
- desktop dark
- mobile light
- mobile dark

Expected:
- No text overlap.
- No button overflow.
- No non-Primer-looking shadcn/Radix remnants.
- Every major screen reads as GitHub product UI.

## Task 13: Knowledge Docs

**Files:**
- Modify: `.agents/knowledge/DESIGN.md`
- Modify: `AGENTS.md` if design summary still references shadcn/Radix
- Modify: `.agents/knowledge/verification.md` if browser verification guidance needs Primer-specific coverage
- Modify: `docs/superpowers/specs/2026-06-12-primer-react-redesign-design.md` only if implementation changes the accepted design truth

- [ ] **Step 1: Rewrite design source of truth**

Change `.agents/knowledge/DESIGN.md` to state:

```markdown
# Design System

## Source Of Truth
- Web UI uses Primer React components, Primer layout primitives, and Octicons.
- Shared UI helpers live under `packages/web/src/components/primer/`.
- Feature UI composes Primer components directly when a shared helper is not needed.

## Visual Direction
- The app follows GitHub product UI: dense, practical, readable, and task-focused.
- Use Primer color, spacing, border, typography, and focus patterns.
- Keep light and dark themes aligned through Primer color mode.

## Primitive Rules
- Do not add shadcn, Radix, remix icon, or Tailwind UI primitives.
- Use Primer `Button`, `IconButton`, `FormControl`, `TextInput`, `Select`, `Checkbox`, `ActionMenu`, `ActionList`, `Dialog`, `Flash`, `Label`, `ProgressBar`, `Tooltip`, `Box`, and related primitives.
- Use Octicons for icons.

## Verification
- UI changes require static checks and browser verification.
- Major screens must be checked in light/dark and desktop/mobile when touched.
```

- [ ] **Step 2: Remove stale references**

Run:

```bash
rg -n "shadcn|Radix|remix icon|Tailwind" AGENTS.md .agents/knowledge docs
```

Expected:
- Remaining matches are historical design spec context or explicit prohibitions, not current instructions to use old UI.

- [ ] **Step 3: Verify docs**

Run:

```bash
mise exec -- pnpm check:fmt
```

Expected:
- Markdown formatting is not affected by oxfmt, or command passes for files it checks.

## Task 14: Final Static And Browser Gate

**Files:**
- All changed files.

- [ ] **Step 1: Run full focused UI gate**

Run:

```bash
mise exec -- pnpm check:fmt
mise exec -- pnpm check:lint
mise exec -- pnpm check:type
mise exec -- pnpm check:unused
mise exec -- pnpm build:ui
mise exec -- pnpm check:playwright
```

Expected:
- All pass.

- [ ] **Step 2: Run Vitest suite if UI test changes were broad**

Run:

```bash
mise exec -- pnpm check:test
```

Expected:
- Full Vitest suite passes.

- [ ] **Step 3: Final grep gate**

Run:

```bash
rg -n "@radix-ui/|radix-ui|@remixicon/react" packages/web package.json pnpm-lock.yaml
rg -n "tailwindcss|tailwind-merge|@tailwindcss|@import \"tailwindcss\"" packages/web package.json pnpm-workspace.yaml pnpm-lock.yaml
rg -n "components/ui" packages/web/src
```

Expected:
- No production references remain.

- [ ] **Step 4: Final Browser evidence review**

Review screenshots from Task 12 and matrix from Task 11.

Expected:
- Every major screen has browser evidence.
- Every existing UI wrapper row is passed or removed.
- Light/dark and desktop/mobile coverage is complete.

## Task 15: Completion Report

**Files:**
- Read: `packages/web/src/components/primer/PrimerVerificationMatrix.md`
- Read: final command output
- Read: `git status --short`

- [ ] **Step 1: Summarize changed user-visible behavior**

Report:
- shadcn/Radix/remix icon UI 👉 Primer React/Octicons UI
- Tailwind-driven styling 👉 Primer styling
- old card-heavy shell 👉 GitHub product UI shell
- static and browser verification results

- [ ] **Step 2: Report remaining risk**

If any live upload or network e2e cannot run, state:
- 막힌 것
- 원인
- 영향
- 필요한 선택

- [ ] **Step 3: Do not commit unless asked**

Run:

```bash
git status --short
```

Expected:
- Changed files are visible for user review.
- No commit has been created unless user explicitly requested one.
