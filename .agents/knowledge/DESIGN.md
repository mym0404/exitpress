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

## Verification
- UI logic can use focused pure or hook tests.
- Browser workflow coverage belongs in smoke/e2e harnesses.
- Meaningful UI changes require browser validation when practical.
