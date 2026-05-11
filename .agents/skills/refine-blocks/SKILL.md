---
name: refine-blocks
description: Review and refine GitHub PRs created by the ingest-blog skill for this repository. Use when Codex needs to inspect ai-generated parser support PRs, decide merge or close with [AI GENERATED] comments, pull merged parser changes locally, evaluate parser block boundaries, make parser block refinements, verify block coverage, check:local, and fixture coverage, then open a Korean improvement PR.
---

# Refine Blocks

## Purpose

Use this skill to review `ai-generated` GitHub PRs that add or modify Naver Blog parser blocks, decide whether to merge or close them, pull merged changes locally, and open a follow-up refinement PR when block boundaries need improvement.

The skill is for repository workflow and parser block responsibility. Do not record routine per-block parsing details in `.agents/knowledge/*`.

## PR Selection

- If the user names PR numbers, review only those PRs.
- If the user does not name PRs, list open ready PRs with the `ai-generated` label.
- Skip draft PRs unless the user explicitly asks to review drafts.
- For each PR, inspect the body, diff, changed parser files, fixture changes, and review comments before deciding.
- Identify the owning editor family and target block from the actual code diff, not from the PR title alone.

## Merge Or Close Decision

- Default to merge when the PR adds or extends a parser block that solves a real parsing failure.
- Close only when an existing block already handles the same DOM/content family and the PR is a duplicate.
- Do not close because the implementation could be cleaner. Merge first when the block is valid, then refine locally.
- Review the PR at the target block boundary: what input shape it claims, what AST it emits, where it sits in `supportedBlocks`, and which neighboring blocks might overlap.
- Check whether the PR keeps first-match parser behavior coherent for the editor family.

Before merge or close, add a GitHub comment whose first line is exactly `[AI GENERATED]`.

Merge comment shape:

```text
[AI GENERATED]

Merge reason:
- Target: <editor family> <block name>
- Boundary: <what this block handles>
- Existing blocks: <why this does not duplicate another block>
- Decision: <why merge is appropriate>
```

Close comment shape:

```text
[AI GENERATED]

Close reason:
- Target: <editor family> <block name>
- Duplicate: <existing block that already handles this case>
- Evidence: <specific overlap from code, fixture, or DOM shape>
- Decision: <why this PR should be closed>
```

When merging, prefer a squash merge with branch deletion if GitHub allows it. If the repository only allows another merge method, use the allowed method and report it.

## Pull And Refine

After a merge:

- Ensure the local worktree has no unrelated changes that would be overwritten.
- Check out `main`.
- Run `git pull --ff-only origin main`.
- Create a refinement branch named `worktree/refine-blocks-<pr-number-or-support-unit>`.
- Re-review the merged block in the context of the owning editor family.

Refinement criteria:

- The block should solve one clear problem sufficiently.
- The block should not make another block meaningless.
- The block should not blur boundaries between neighboring blocks.
- The editor family should keep mutually exclusive, justified parser block responsibilities.
- Aggressive refactoring is allowed when it makes these boundaries clearer, including modifying, merging, removing, or reordering existing blocks.
- Keep the refactor scoped to parser block responsibility. Change renderer or AST contracts only when the parser block boundary cannot be made correct otherwise.

Do not open an empty improvement PR. If no concrete refinement is needed, report that no follow-up PR was created and include the reason.

## Improvement PR

When refinement changes are needed:

- Keep changes focused on the reviewed editor family and directly related block boundaries.
- Include or update a fixture that exercises every modified block.
- Do not add the hidden `ingest-blog` support-unit marker to the follow-up PR.
- Add the `ai-generated` label when available.
- Write the PR in Korean with these sections: `## 요약`, `## 변경 사항`, `## 검증`.
- Mention the original reviewed PR number and the block boundary reason in the PR body.

## Required Verification

Before opening the improvement PR, all of these must pass:

- `pnpm test:parser-blocks`
- `pnpm check:local`
- Fixture verification for the modified block or blocks

The parser block coverage result must stay at 100%. If a verification command fails, identify whether the failure is caused by the refinement. Fix refinement-caused failures before opening the PR. If the failure is unrelated pre-existing state, report the exact command and scope instead of hiding it.
