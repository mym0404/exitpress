# Design System

## Source Of Truth
- Global tokens, theme variables, helper surfaces, and font declarations live in `packages/web/src/styles/globals.css`.
- UI primitives live in `packages/web/src/components/ui/*`.
- UI shell and common hooks live in `packages/web/src/features/common/*`.
- Feature composition lives under `packages/web/src/features/scan`, `packages/web/src/features/options`, `packages/web/src/features/job-results`, `packages/web/src/features/resume`, and `packages/web/src/features/storybook`.
- Brand assets live in `packages/web/public/brand`.
- Storybook capture assets live in `packages/web/src/features/storybook/assets`.

## Visual Direction
- The default theme is dark; light is a companion theme.
- The product is a dense single-column wizard, not a marketing page.
- Use typography, contrast, shadow-as-border, and spacing rhythm over decorative illustration.
- Cards, forms, tables, logs, and dialogs should share semantic tokens.
- Accent colors communicate state, not decoration.
- Status accents are blue for scan/running, pink for upload/partial, coral red for destructive/failure, and green for success.

## Token Rules
- `globals.css` is the only place for shared color tokens.
- Feature files should not introduce repeated raw hex values or repeated slate utility palettes.
- Repeated state colors should become tokens or helper classes.
- Focus should remain visible through the `focus-ring` token.
- Dark/light theme persistence is restored from `.cache/export-ui-settings.json`.

## Primitive Rules
- Prefer installed shadcn primitives before custom controls.
- Current primitive layer includes Alert, Badge, Button, Card, Checkbox, Collapsible, Dialog, Input, Progress, ScrollArea, Select, Separator, Skeleton, Sonner, Table, Tabs, ToggleGroup, and Tooltip.
- Use `Select` for single-choice dropdowns.
- Use `Checkbox` for boolean fields.
- Use `ToggleGroup` for small visible mutually-exclusive choices.
- Use `Table` plus `ScrollArea` for dense row comparison.
- Use `Dialog` for resume, reset, and modal interrupt flows.
- Use `Sonner` for short completion or failure feedback.
- New icons must come from `@remixicon/react`.

## Feature Contracts
- The wizard step model stays in `packages/web/src/app/App.tsx` and common shell files.
- `/storybook` is a static Storybook surface and must read the generated catalog without importing parser, renderer, or export wizard bootstrap code.
- Storybook navigation follows `Editor -> Block` and reflects every parser block from `supportedBlocks`.
- The top wizard header should show stage context without duplicating long instructions inside each step.
- Feature files should own layout and composition; primitives and tokens own repeated visual language.
- `running`, `upload`, and `result` stages share the result table surface.
- Upload badges remain soft badges for `대기`, `부분 완료`, `완료`, and `실패`.
- Floating bottom dock should read as a command dock, not a full-width footer.
- Theme toggle is only in the top shell.
- Horizontal form grids must solve control alignment with alignment constraints, not reserved or
  fixed heights. Field containers should use `content-start`/`self-start`, and the grid parent
  should use breakpoint-scoped `items-start`, so labels, descriptions, or error messages in one
  column do not stretch sibling fields or move their controls.

## Accessibility And Motion
- Normal text contrast target is 4.5:1 or better in dark and light themes.
- Do not remove outlines without replacing them with tokenized focus visibility.
- Use 150-300ms opacity/transform transitions.
- Reduced-motion users must still understand progress, toast, dialog, and toggle state changes.

## Verification
- `mise exec -- pnpm build:ui`: Vite build and token/primitive compile signal.
- `mise exec -- pnpm storybook:check`: generated Storybook catalog freshness signal.
- `mise exec -- pnpm check:local`: typecheck, Storybook catalog check, and offline tests.
- `mise exec -- pnpm smoke:ui`: dark default render, light persistence, category/export/upload flow, result table, resume dialog, and recovery path.
