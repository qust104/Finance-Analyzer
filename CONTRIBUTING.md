# Contributing

## QA gate (before finishing)

1. `npx vitest run` — all green
2. `npm run lint`
3. `npm run build` (includes typecheck)
4. `npm run test:e2e` — only when Playwright-relevant files changed

## Checklist for a new entity with CRUD

Every new entity (transactions, budgets, categories, recurring, future
Goals/Tags, ...) must inherit the same defensive properties instead of
reinventing its own level:

- [ ] **Delete safety**: deletion removes immediately but is reversible —
      `useUndoableDelete` (or a confirm) with the same 5 s window.
      Undo must restore the exact entity state (id and engine fields like
      `lastPostedDate`), not a recreated equivalent.
- [ ] **Mutation errors surface**: the UI shows the server message
      (`mutationErrorMessage` + `saveState` pattern); background jobs
      report through a non-blocking `Toast`, never a swallowed catch.
- [ ] **Referential integrity**: a row may only reference an existing
      entity. Validate existence at the `local.ts` handler level (schemas
      stay pure); deletions of referenced entities return 409 and include
      the new entity in the in-use check.
- [ ] **Tests**: undo test with the exact-state assertion, server-reject
      and accept tests (positive test required — it catches over-strict
      validation), toast/visibility test for background operations.

## Conventions

- No code comments unless asked; existing comments are kept.
- Validation lives in zod schemas at the boundaries; referential checks
  live next to repositories in `local.ts`.
- New UI strings in English; tests in `*.test.ts(x)` next to sources.
- Read `AGENTS.md` for structure and gotchas before starting.
