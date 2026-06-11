# Design System

## Source Of Truth
- Global theme tokens live in the web package stylesheet.
- Reusable UI primitives live in the web package's UI component folder.
- Feature UI composes existing primitives and feature-local components.

## Visual Direction
- The app is a dark-first operational wizard.
- Prioritize dense, readable, task-focused layouts over marketing-style sections.
- Keep the main workflow immediately usable; do not add explanatory UI copy for implementation instructions.

## Primitive Rules
- Use existing shadcn/Radix primitives as-is.
- Do not add tests for primitive internals.
- Use project-approved icon libraries already present in the codebase.
- Keep form controls, tables, progress, dialogs, tabs, and menus consistent with existing primitives.

## Feature UI Rules
- UI text should describe user-facing state or action only.
- Access, visibility, and permissions should be enforced in behavior rather than explained as decorative copy.
- Long-running export/upload/resume states need clear progress and retry affordances.
- Avoid adding helper text, badges, or labels solely to mirror implementation requirements.
- Template editors are the source of truth for template values. Adjacent previews and result panels show only derived output, validation state, or errors; they do not repeat the current template string in a separate label, code block, or summary.
- Treat card-wrapped single form controls as an anti-pattern. A lone input, select, checkbox, radio, or small checkbox group should live in a plain field row or compact grid, not inside a bordered/shadowed card.
- Use cards only when the surface is a distinct work area, repeated result item, table/list container, preview, editor, dialog, or status panel with enough content to justify its visual boundary.
- Do not nest form cards inside a panel just to create spacing. Use grid gaps, section dividers, or inline rows before adding another wrapper.

## Verification
- UI logic can use focused pure or hook tests.
- Browser workflow coverage belongs in Playwright smoke/e2e tests.
- Meaningful UI changes require browser validation when practical.
