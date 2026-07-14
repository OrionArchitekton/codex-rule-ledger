# Codex Rule Ledger Build Ledger

This ledger records the witnessed vertical RED→GREEN cycles for v0.1. Times are
local to the build workstation unless otherwise noted.

## Slice 1 — Missing launch context fails closed

Acceptance target: a blank launch working directory yields
`INSUFFICIENT_INPUT`, emits no obligation records, and never invokes the
semantic analyzer.

### RED — API surface absent

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:33 PDT.
- Witness: Vitest could not import the not-yet-created `src/ledger` deep module.

### RED — Behavioral assertion

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:33 PDT; one test executed.
- Witness: expected `INSUFFICIENT_INPUT`, received `READY`.

### GREEN

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 0 on 2026-07-13 18:33 PDT; one test passed.
- Implementation: structural launch-directory validation returns the named
  issue before the analyzer seam is crossed.

## Slice 2 — Reconstruct the selected instruction chain

Acceptance target: a complete candidate inventory reconstructs global and
root-to-launch scope in documented precedence order, records lower-precedence
exclusions, and supplies the resulting chain to the analyzer.

### RED

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:36 PDT; one of two tests failed.
- Witness: the ready audit had no `chain`, so the selected-source assertion
  failed while reading it.

### GREEN

- Command: `npm run typecheck && npm test -- tests/ledger-audit.test.ts`
- Result: exit 0 on 2026-07-13 18:38 PDT; typecheck and both tests passed.
- Implementation: deterministic reconstruction selects global guidance,
  project override/AGENTS/fallback candidates, records exclusions, applies the
  project byte budget, and crosses the analyzer seam only after reconstruction.

## Slice 3 — Affirmative command success

Acceptance target: an observable command obligation is `SUPPORTED` only when
the supplied event catalog contains the exact successful command before an
affirmative completion claim, with both events linked.

### RED

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:39 PDT; one of three tests failed.
- Witness: the ledger returned no obligation records for the analyzer's typed
  command proposal.

### GREEN

- Command: `npm run typecheck && npm test -- tests/ledger-audit.test.ts`
- Result: exit 0 on 2026-07-13 18:41 PDT; typecheck and all three tests passed.
- Implementation: source anchors are validated, proposals are deterministically
  ordered, and exact success plus later completion produces a source- and
  event-linked `SUPPORTED` record. Absence takes the distinct
  `NOT_EVIDENCED` path.

## Slice 4 — Affirmative contradiction

Acceptance target: a failed required command followed by an explicit completion
claim yields `CONTRADICTED` with both ordered events; failure or completion
absence alone does not.

### RED

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:41 PDT; one of four tests failed.
- Witness: the deep module rejected the no-completion-after-failure assertion
  and returned a failed execution instead of a ledger result.

### GREEN

- Command: `npm run typecheck && npm test -- tests/ledger-audit.test.ts`
- Result: exit 0 on 2026-07-13 18:42 PDT; typecheck and all four tests passed.
- Implementation: deterministic ordered-event adjudication links the failed
  command and later completion claim as affirmative conflicting evidence.

## Slice 5 — Missing evidence versus false trigger

Acceptance target: a missing required command remains `NOT_EVIDENCED`, while a
conditional rule whose exact path is absent from the captured changed-path set
is `NOT_APPLICABLE` with that set linked as affirmative trigger evidence.

### RED

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:42 PDT; one of five tests failed.
- Witness: the conditional trigger was rejected as unsupported and failed the
  complete execution.

### GREEN

- Command: `npm run typecheck && npm test -- tests/ledger-audit.test.ts`
- Result: exit 0 on 2026-07-13 18:43 PDT; typecheck and all five tests passed.
- Implementation: changed-path triggers are evaluated before assertions;
  inactive conditions carry an exact path-set link, while missing command
  evidence carries an explicit non-action limitation.

## Slice 6 — Decline and human-review dispositions

Acceptance target: subjective and ambiguous/conflicting instructions remain
outside the four-result state machine and retain source anchors.

### RED

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:43 PDT; one of six tests failed.
- Witness: non-evaluable proposals failed the execution instead of becoming
  explicit non-result dispositions.

### GREEN

- Command: `npm run typecheck && npm test -- tests/ledger-audit.test.ts`
- Result: exit 0 on 2026-07-13 18:43 PDT; typecheck and all six tests passed.
- Implementation: declined and human-review records are discriminated unions
  with source links and no `finding` field, making accidental pass/fail states
  unrepresentable.

## Slice 7 — Complete manifest and hash validation

Acceptance target: every omitted candidate slot and mismatched content hash is
reported together as `INSUFFICIENT_INPUT`, before semantic analysis.

### RED

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:44 PDT; one of seven tests failed.
- Witness: an incomplete, hash-corrupted capture was incorrectly marked
  `READY`.

### GREEN

- Command: `npm run typecheck && npm test -- tests/ledger-audit.test.ts`
- Result: exit 0 on 2026-07-13 18:44 PDT; typecheck and all seven tests passed.
- Implementation: structural validation computes SHA-256 locally, inventories
  every precedence slot, returns all issues in deterministic order, and blocks
  the analyzer on failure.

## Slice 8 — Canonical evidence-ledger export

Acceptance target: identical normalized inputs produce byte-identical exports
and digests, any bound input change alters the digest, and private absolute home
paths are not emitted.

### RED

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:45 PDT; one of eight tests failed.
- Witness: ready audits had no ledger or digest.

### GREEN

- Command: `npm run typecheck && npm test -- tests/ledger-audit.test.ts`
- Result: exit 0 on 2026-07-13 18:46 PDT; typecheck and all eight tests passed.
- Implementation: stable-key canonical JSON binds the capture, event catalog,
  changed paths, semantic analysis, chain, records, and model metadata. Exported
  paths use `$CODEX_HOME`/`$PROJECT_ROOT` labels and carry the explicit
  non-attestation warning.

## Slice 9 — Full validation-drift fixture

Acceptance target: one repository-owned sanitized fixture crosses only
`runLedgerAudit` and produces the documented chain, byte-limit exclusion, all
four evaluated results, a declined subjective instruction, and an export hash.

### RED

- Command: `npm test -- tests/ledger-audit.test.ts`
- Result: exit 1 on 2026-07-13 18:47 PDT before test collection.
- Witness: the repository fixture loader and recorded analyzer did not exist.

### GREEN

- Command: `npm run typecheck && npm test -- tests/ledger-audit.test.ts`
- Result: exit 0 on 2026-07-13 18:50 PDT; typecheck and all nine tests passed.
- Implementation: strict Zod schemas load separate capture, session, diff, and
  semantic-analysis fixtures. The recorded analyzer returns the same typed
  contract expected from GPT-5.6, and the highest-value regression test uses
  only the public deep seam.

## Slice 10 — GPT-5.6 structured semantic adapter

Acceptance target: one allowlisted, bounded, zero-retry GPT-5.6 Responses API
request returns typed semantic proposals without granting the model authority
to emit ledger verdicts.

### RED

- Command: `npm test -- tests/openai-responses-analyzer.test.ts`
- Result: exit 1 on 2026-07-13 18:52 PDT before test collection.
- Witness: the GPT-5.6 Responses adapter did not exist.

### GREEN

- Commands: `npm test -- tests/openai-responses-analyzer.test.ts` and
  `npm run typecheck`
- Result: both exited 0 on 2026-07-13 18:53 PDT; one adapter test passed.
- Implementation: the official `responses.parse` + `zodTextFormat` path
  hard-codes `gpt-5.6`, uses `store: false`, omits tools, caps output and input,
  sends no captured directory paths, uses an abort deadline, records token and
  response metadata, and fails closed on refusal or absent parsed output.

## Slice 11 — Immutable public audit endpoint

Acceptance target: the public endpoint exposes only the repository-owned
recorded fixture and no credential-driven or user-supplied execution surface.

### RED

- Command: `npm test -- tests/audit-route.test.ts`
- Result: exit 1 on 2026-07-13 18:54 PDT before test collection.
- Witness: the fixed-fixture route did not exist.

### GREEN

- Command: `npm run typecheck && npm test -- tests/audit-route.test.ts`
- Result: exit 0 on 2026-07-13 18:54 PDT; typecheck and the route test passed.
- Implementation: a static GET route runs the disclosed recorded analyzer,
  fails closed on fixture drift, returns bounded-cache/nosniff headers, and has no
  upload, command, URL, request-body, or API-secret input.

## Slice 12 — Judge-facing forensic evidence desk

Acceptance target: a reviewer can open the fixture, see readiness and every
result class, select the contradiction, inspect both linked events and its
instruction source, filter exceptions, and export the ledger in under 90
seconds.

### RED

- Command: `npm run test:e2e -- --project=chromium`
- Result: exit 1 on 2026-07-13 18:54 PDT because no page shell existed. After
  the shell landed, the behavioral assertion still failed because its canonical
  result labels did not match the human-readable labels.
- Environment witness: the sandbox blocked local port binding and the installed
  browser revision was stale; the approved local-server lane and Playwright's
  exact Chromium revision resolved those runner-only failures.

### GREEN

- Command: `npm run test:e2e -- --project=chromium`
- Result: exit 0 on 2026-07-13; the complete Chromium flow passed in 903 ms
  (1.6 s runner time).
- Implementation: the responsive editorial evidence desk shows the launch
  chain, typed ledger, interactive evidence inspector, result filters,
  provenance boundary, deterministic digest, and JSON export. The public page
  remains a server-produced fixed fixture with client code only for inspection
  and download.

## Slice 13 — Required instruction-scope inventory

- RED: `npm test -- tests/ledger-audit.test.ts -t "captured instruction-scope inventory is empty"` returned `READY` for an empty inventory.
- GREEN: the same command passed after global and every root-to-launch scope
  became required before analysis.

## Slice 14 — Event-order invariance

- RED: `npm test -- tests/ledger-audit.test.ts -t "serialized event order"`
  returned `NOT_EVIDENCED` despite an earlier failure and later completion.
- GREEN: deterministic adjudication now normalizes by sequence/event ID and the
  same test links the affirmative contradiction pair.

## Slice 15 — Downloaded bytes match the displayed digest

- RED: the SHA-256 of plain browser JSON differed from the canonical ledger
  digest.
- GREEN: the in-memory ledger now preserves canonical key order; unit proof and
  Playwright hash the actual download and match its digest-derived filename.

## Slice 16 — Analysis/input binding and source coverage

- RED: a validly rehashed instruction changed from “run” to “never run” while a
  stale recorded proposal still yielded `SUPPORTED`; a live empty proposal
  batch also resolved successfully.
- GREEN: every analysis carries the exact semantic-input digest, every selected
  source requires a disposition, duplicate/unknown proposal identities fail,
  and stale or incomplete output becomes `INVALID_ANALYZER_OUTPUT`.

## Slice 17 — Exact semantic source receipts

- RED: the structured response contract had no source-content receipt or exact
  quote/span binding.
- GREEN: each source coverage entry now binds its SHA-256, exact proposal IDs,
  and one verbatim contained quote per proposal; deterministic validation runs
  before adjudication.

## Slice 18 — Boundary-safe export and public API

- RED: synthetic `/home/alice/.env` and `SECRET_TEST_ONLY` markers crossed the
  export, while `/api/audit` exposed raw fixture directories and source content.
- GREEN: recursive boundary redaction removes captured absolute paths and common
  credential-like markers, the model payload crosses the same redaction seam,
  and the public route/page serialize only the boundary-safe ledger projection.

## Slice 19 — Ambiguous capture structure fails closed

- RED: missing/outside-root scopes, duplicate scope/candidate/event identities,
  duplicate sequences, whitespace-only selected content, and unsupported
  version/platform inputs could be treated as ready.
- GREEN: structural validation reports every ambiguity together; the v0.1
  envelope is explicitly Codex 0.144.0 plus POSIX, and trim-empty project files
  occupy their selected slot without becoming model-visible content.

## Slice 20 — One-shot GPT-5.6 proof command

- RED: `npm test -- tests/live-proof.test.ts` could not import a live proof
  module; the adapter was not reachable from a shipped operator path.
- GREEN: the operator-only `npm run proof:gpt-live` path makes exactly one
  allowlisted, zero-retry call and emits metadata-only proof containing model,
  prompt/input/semantic digests, response ID, token usage, and ledger digest.

## Current regression state

- `npm test`: 4 files, 36 tests passed after the hardening slices.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; `/` and `/api/audit` are static.
- `npm run test:e2e`: passed in the approved loopback-binding lane; the browser
  inspected the contradiction and verified the downloaded bytes against the
  displayed digest. The default filesystem/network sandbox correctly rejected
  the local server bind before this runner-only escalation.

## Slice 21 — Candidate filename uniqueness

- RED: two unique candidate IDs with the same filename in one scope passed
  structural validation and the later entry silently shadowed the first.
- GREEN: structural validation reports `DUPLICATE_CANDIDATE_FILENAME` before
  reconstruction or model analysis.

## Slice 22 — Recovered validation failures

- RED: a failed command followed by a successful retry and then completion was
  still labeled `CONTRADICTED`.
- GREEN: only a failure whose next completion has no intervening successful run
  of the same exact command becomes affirmative contradiction evidence.

## Slice 23 — Source-entailment and prompt-injection boundary

- RED: a source-linked proposal could invent a command, turn a conditional
  instruction into `ALWAYS`, or emit arbitrary normalized prose.
- GREEN: prompt v2 treats every payload field as untrusted inert data, while
  deterministic validation enforces exact command/path anchors, polarity,
  conditionality, and four canonical normalized rule forms before adjudication.

## Slice 24 — Public alias and cross-browser export lifecycle

- RED: `/api/audit` used year-long immutable caching at an unversioned alias,
  and the browser revoked the export object URL synchronously after clicking it.
- GREEN: alias caching is bounded to five minutes with revalidation, and object
  URL cleanup is deferred until the browser has initiated the download.

## Slice 25 — Atomic directive entailment and completeness

- RED: substring command matching accepted `npm test` from `npm test:e2e`, a
  multi-line quote could splice a trigger from one directive onto another, and
  model dispositions could decline away every supported observable directive.
- GREEN: evaluable proposals cite exactly one complete strict-form source line;
  exact backtick-wrapped commands and paths are parsed atomically, and each
  supported directive must appear as exactly one evaluable proposal.

## Slice 26 — Nonempty launch roots

- RED: empty Codex-home and project-root values normalized to `.` and could
  produce a ready audit with misleading relative scopes.
- GREEN: structural validation rejects either empty root before reconstruction
  or semantic analysis.
