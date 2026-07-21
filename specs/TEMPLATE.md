# Spec: {{TITLE}}

- Date: {{YYYY-MM-DD}}
- Status: draft | approved | building | blocked | done
  (building = a session is on it now; approved = parked, resumable by anyone — the supervisor auto-resumes approved/building specs; blocked = needs a human)

## Problem

What hurts today, for whom. One paragraph.

## Goal

The end state, stated as observable behavior — what a user or system can do after this ships.

## Non-goals

What this deliberately does not cover. Prevents scope creep during autonomous runs.

## Acceptance criteria

Each criterion is machine-verifiable: paired with a command whose exit status decides pass/fail. Criteria that can only be checked by a human must name who checks and how.

- [ ] {{CRITERION_1}} — verify: `{{COMMAND}}`
- [ ] {{CRITERION_2}} — verify: `{{COMMAND}}`

## Constraints

Deadlines, compatibility requirements, performance budgets, things that must not break.

## Stop if (only if a run could plausibly overreach)

Concrete tripwires that mean pause and ask a human, even mid-run — not scope description (that's Non-goals), a live circuit breaker: "touching more than N files outside {{path}}", "a test that already passes starts failing", "the same file edited by two different criteria".

- {{TRIPWIRE_CONDITION}}

## Interfaces (only if criteria depend on each other)

If one criterion's work is consumed by another (a function signature, a schema, a file format), name it exactly here — a fresh session working a later criterion sees only its own line, not the earlier ones, and needs the exact name/type/shape, not a description.

- {{PRODUCED_BY_CRITERION_N}}: {{exact signature/schema/format}}

## Plan (filled at Plan stage)

Files to touch, order of work, known risks.

## Decisions log (append during Build)

- {{DATE}} — {{decision made and why}}

## Outcome (filled at Ship)

What shipped vs the spec, deviations and why, evidence per acceptance criterion.
