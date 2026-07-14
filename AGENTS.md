# Codex Rule Ledger — Repository Instructions

## Purpose

This repository owns the OpenAI Build Week hackathon demo, submission assets,
and proof artifacts for Codex Rule Ledger. It is a Personal Authority
`hackathon-project`; it is not a Cosmocrat, Orion Runtime, business, shared
platform, or shared-infrastructure surface.

## Product Boundary

Codex Rule Ledger evaluates supplied artifacts against a reconstructed Codex
launch-context instruction chain. It reports evidence, not compliance.

- Never claim the product proves an agent obeyed instructions.
- Never treat an absent trace event as proof that an action did not happen.
- `CONTRADICTED` requires affirmative conflicting evidence.
- Hashes bind supplied artifacts after capture; they do not authenticate the
  artifacts, establish trusted time, or prove what the model received.
- Subjective or non-observable instructions must be declined or routed to human
  review, never guessed into a pass/fail result.
- The hosted demo accepts only repository-owned, sanitized fixture identifiers.
  Arbitrary repository uploads, arbitrary commands, and trace-supplied command
  execution are outside v0.1.

## Development Workflow

- Work only on a `codex/` task branch in a fresh worktree.
- Carry user-visible behavior in `specs/codex-rule-ledger-spec.md`.
- Implement one tracer-bullet slice at a time with a witnessed RED, minimal
  GREEN, then refactor while green.
- Keep deterministic discovery, validation, hashing, and ledger-state decisions
  outside the model adapter.
- Never expose secrets in source, fixtures, tests, logs, screenshots, prompts,
  generated ledgers, or command output.

## Required Verification

Before claiming completion, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Record live-model, deployment, cost-control, and public-URL proof separately.

## External Gates

The public GitHub repository is approved. Vercel deployment and an OpenAI API
secret are allowed only after the matching estate deploy-target and secret-scope
admission lands. Devpost submission, YouTube upload, and eligibility assertions
remain participant-held actions.
