# Design System

## Source Of Truth
- UI primitives come from Primer React and Octicons.
- Screen styling should use Primer component props and `sx`.
- Global CSS is reserved for fonts, root sizing, scrollbar styling, and small semantic app hooks that cannot reasonably live in `sx`.
- Reusable local UI helpers live under `packages/web/src/components/primer/`.

## Visual Direction
- The app is a GitHub-style operational wizard with light and dark themes.
- Prioritize dense, readable, task-focused layouts over marketing-style sections.
- Use quiet borders, compact spacing, clear section hierarchy, and Primer status labels.
- Keep the main workflow immediately usable; do not add explanatory UI copy for implementation instructions.

## Primitive Rules
- Use Primer React for buttons, forms, dialogs, menus, labels, progress, layout surfaces, and feedback.
- Use Octicons for icons.
- Use Primer `Box` with `sx` for layout, native overflow regions, separators, table-like structures, and small custom surfaces.
- Do not add shadcn, Radix UI wrappers, Remix icons, Tailwind utility styling, or compatibility shims.
- Do not test Primer internals; test only project behavior and integration.

## Feature UI Rules
- UI text should describe user-facing state or action only.
- Access, visibility, and permissions should be enforced in behavior rather than explained as decorative copy.
- Long-running export/upload/resume states need clear progress and retry affordances.
- Avoid helper text, badges, or labels that only mirror implementation requirements.
- Template editors are the source of truth for template values. Adjacent previews and result panels show only derived output, validation state, or errors.
- Treat card-wrapped single form controls as an anti-pattern. A lone input, select, checkbox, radio, or small checkbox group should live in a plain field row or compact grid.
- Use bordered panels only when the surface is a distinct work area, repeated result item, table/list container, preview, editor, dialog, or status panel.
- Do not nest panels just to create spacing. Use grid gaps, section dividers, or inline rows before adding another wrapper.

## Verification
- UI logic can use focused pure or hook tests.
- Browser workflow coverage belongs in Playwright local/live e2e tests.
- Meaningful UI changes require browser validation when practical.
- Browser validation should check desktop and mobile width, light and dark theme where relevant, horizontal overflow, console errors, and visible consistency with Primer UI.
