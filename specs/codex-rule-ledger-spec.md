# Codex Rule Ledger v0.1 Specification

## Status

Approved for implementation on 2026-07-13 for the OpenAI Build Week Developer
Tools track.

## Product Promise

Codex Rule Ledger reconstructs the instruction chain described by a supplied
Codex launch capture, extracts atomic observable obligations, and shows what the
supplied session artifacts support, contradict, do not evidence, or make
inapplicable.

The product does not certify compliance, authenticate the capture, replay a
session, or infer that an unlogged action did not occur.

## Canonical Language

- **Launch Capture**: supplied metadata and candidate instruction files for one
  Codex run, including Codex home, project root, launch working directory,
  configured fallback filenames, configured instruction byte limit, Codex
  version, content hashes, and provenance level.
- **Reconstructed Instruction Chain**: the ordered instruction content selected
  from the Launch Capture using the documented Codex discovery rules.
- **Audit Bundle**: one Launch Capture, task, normalized command/completion
  events, and the captured Git base/head changed-path set.
- **Obligation**: an atomic instruction whose trigger and required action are
  stated explicitly enough to evaluate against supplied evidence.
- **Audit Input State**: `READY` or `INSUFFICIENT_INPUT`.
- **Obligation Disposition**: `EVALUATED`, `DECLINED_NON_OBSERVABLE`, or
  `HUMAN_REVIEW_REQUIRED`.
- **Ledger Result**: for an evaluated obligation, exactly one of `SUPPORTED`,
  `CONTRADICTED`, `NOT_EVIDENCED`, or `NOT_APPLICABLE`.
- **Evidence Link**: a source-anchored reference to an exact instruction quote,
  normalized command/completion event, or captured changed-path set.
- **Evidence Ledger**: the reconstructed chain, obligation assessments, evidence
  links, input hashes, and provenance warning exported from one audit.

The terms “compliance proof,” “agent replay,” “verified truth,” and “tamper-proof
receipt” are not synonyms and must not be used for these concepts.

## Constraints

- v0.1 demonstrates Codex 0.144.0 JSONL-derived command/completion events and
  POSIX launch-capture paths only; other versions and path platforms fail
  closed.
- Instruction discovery supports the global location plus project root through
  launch working directory, with `AGENTS.override.md`, `AGENTS.md`, configured
  fallback names, exactly one inventory entry per candidate filename in each
  scope, one existing candidate per directory, trim-empty content omission
  after candidate selection, and the configured combined byte limit.
- The current filesystem is not substituted for a missing historical Launch
  Capture.
- A complete Launch Capture is still untrusted input and is labeled accordingly.
- Only affirmative supplied evidence can yield `SUPPORTED`, `CONTRADICTED`, or
  `NOT_APPLICABLE`; evidence absence yields `NOT_EVIDENCED`.
- A diagnostic executed after the audited session is a separate current-state
  observation and cannot change a historical Ledger Result.
- GPT-5.6 may extract obligations and propose evidence candidates. Every
  selected source requires an input-digest-bound coverage receipt containing
  its content hash, exact proposal IDs, and exactly one complete trimmed source
  line for each proposal. A line cannot receive more than one disposition.
  Each complete source line matching one of the four strict v0.1 forms must
  receive exactly one total disposition, that disposition must be evaluable,
  and it cannot also be declined or assigned to human review. An evaluable
  proposal is accepted only when its
  exact command, conditional path, polarity, trigger, and canonical normalized
  rule are deterministically entailed by that one cited line. Deterministic
  code owns discovery, semantic completeness and entailment checks,
  source/quote validation, state transitions, evidence sufficiency, hashes, and
  final mechanically decidable results.
- The public demo operates on sanitized, repository-owned fixtures only. It does
  not accept arbitrary source archives, traces, URLs, or commands.
- Hosted model calls are allowlisted by fixture identifier and content hash and
  bounded in size. The public demo serves a repository-owned recorded analysis
  by default; live analysis is an explicit, server-controlled local demo path
  subject to the approved total spend cap.
- The generic local export performs deterministic path and common
  credential-marker redaction, but is not a data-loss-prevention system. The
  public v0.1 additionally enforces a fixed, synthetic, secret-scanned fixture
  and exposes only the boundary-safe ledger projection.

## Scenario 1 — Inspect a captured Codex session

An engineering reviewer selects the built-in “validation drift” fixture. The
product reconstructs the global-to-launch-directory instruction chain and shows
its selected sources in merge order. It then presents:

- one obligation supported by an affirmative successful command event;
- one obligation contradicted by an affirmative failed validation followed by
  a completion claim;
- one obligation with no sufficient supplied evidence;
- one conditional obligation whose trigger affirmatively did not occur; and
- one subjective instruction declined as non-observable.

Each assessment opens the exact instruction source and evidence or
missing-evidence explanation. The interface always displays the
`LOCAL_CAPTURE_UNATTESTED` provenance boundary.

### Acceptance criteria

- Discovery order matches the supplied launch context, override/fallback order,
  empty-file behavior, and byte limit.
- Audit state, Obligation Disposition, and Ledger Result are visually and
  structurally distinct.
- The contradicted result cites affirmative conflicting evidence rather than a
  missing event.
- The not-evidenced result explicitly says absence is not proof of non-action.
- The non-observable instruction never enters the four-state result machine.
- A reviewer can complete the fixture flow and open its evidence in under 90
  seconds.

## Scenario 2 — Fail closed on insufficient launch context

A reviewer opens a fixture whose launch working directory or instruction
manifest is missing or whose recorded hashes do not match its supplied content.
The audit reports `INSUFFICIENT_INPUT`, names every failed prerequisite, and
produces no obligation results.

### Acceptance criteria

- Missing launch context cannot silently fall back to the current filesystem.
- Hash mismatch cannot be represented as a ready audit.
- No model call occurs for an insufficient Audit Bundle.
- The UI explains that structural readiness is not authenticity.

## Scenario 3 — Extract obligations with GPT-5.6

A reviewer requests a live analysis of an allowlisted fixture. GPT-5.6 returns
typed obligation candidates and evidence candidates. The product validates the
response, declines non-observable instructions, deterministically assigns the
eligible results, and marks the ledger with the model identifier and input hash.

### Acceptance criteria

- The model response is accepted only through a closed schema.
- Unknown states, missing source anchors, or malformed evidence candidates fail
  closed without partial success.
- Stale input digests, missing source coverage, duplicate proposal IDs,
  mismatched source hashes, and quotes not contained in the selected source fail
  closed without partial success.
- Commands, conditional paths, triggers, polarity, or normalized rules not
  explicitly entailed by the cited quote fail closed without partial success.
- Deterministic adjudication produces the same Ledger Results for the same
  normalized evidence regardless of candidate ordering.
- A successful retry between a failed command and completion prevents that
  earlier failure from becoming affirmative contradiction evidence.
- The model cannot change discovery order, hashes, provenance, or a deterministic
  mechanical result.
- Repeating the public hosted fixture analysis reuses the immutable,
  repository-owned recorded result and does not invoke the model.

## Scenario 4 — Export an evidence ledger

A reviewer exports the completed fixture audit. The export binds the supplied
inputs and assessments with content hashes and plainly states its provenance
limitations.

### Acceptance criteria

- The export is deterministic for the same normalized input and assessment.
- The export contains the reconstructed source order, every obligation
  disposition/result, every evidence link, model metadata when used, and input
  hashes.
- The export says it is supported by supplied artifacts and is not an
  authenticity, trusted-time, or compliance attestation.
- No known fixture secret, environment value, captured absolute path, or raw
  trace payload appears in the export; regression tests cover path and common
  credential-like marker redaction.

## Deep Module And Test Seam Decision

The primary deep module exposes one interface:

```text
runLedgerAudit(bundle, semanticAnalyzer) -> AuditExecution
```

Callers and tests cross this same seam. The module hides instruction discovery,
manifest validation, normalization, obligation disposition, deterministic
adjudication, evidence linking, and export-ready hashing. Deleting it would
spread those invariants across the API, UI, CLI, and tests, so it earns its
depth.

`AuditExecution` keeps capture readiness and analyzer execution separate: a
completed execution contains either a `READY` audit or an
`INSUFFICIENT_INPUT` audit, while analyzer refusal, timeout, and malformed output
are explicit failed executions. The Launch Capture inventories every candidate
slot in global and root-to-launch-directory scope as present, absent, or empty;
omitting a higher-precedence candidate therefore cannot fabricate a chain.

Two adapters make the semantic-analysis seam real:

- a deterministic fixture adapter for tests and disclosed demo fallback; and
- a GPT-5.6 structured-output adapter for live analysis.

Both adapters return typed source-linked trigger and assertion proposals, never
Ledger Results. Deterministic code validates the source anchors, evaluates the
proposal against the normalized evidence catalog, and owns the final state.
Recorded and live responses are bound to the exact semantic-input digest. A
per-source coverage receipt binds proposal IDs and exact quotes to the selected
source hash so fixture drift or model omission cannot silently yield a ready
ledger.

The highest-value automated test exercises the complete “validation drift”
Audit Bundle through this interface and asserts the reconstructed chain, all
four evaluated results, the declined instruction, evidence anchors, provenance,
and deterministic export hash. A thin browser test verifies that the same
outcome is legible and navigable in the judge-facing flow.

## Out Of Scope For v0.1

- runtime enforcement or prevention;
- generalized compliance certification;
- Claude, Cursor, Copilot, or arbitrary agent trace formats;
- arbitrary repository or trace upload in the hosted demo;
- replaying or executing commands from a trace;
- command working-directory, repository-tree, commit-identity, or edit-timing
  attestation;
- cryptographic or trusted-time attestation;
- validation-outcome, task-condition, or arbitrary event evidence types beyond
  the v0.1 command/completion and changed-path contracts;
- multi-user accounts, billing, team dashboards, or persistent customer data;
- estate platform or shared-runtime adoption; and
- post-event OSS ownership until separately approved.

## v0.2 Local Audit Bundle CLI Extension

The v0.1 deterministic audit contract remains unchanged. v0.2 adds a
repo-local process adapter that accepts only an
already-normalized Audit Bundle directory. Recorded/keyless analysis is the
default; `--live` is the sole local GPT-5.6 opt-in and obtains its credential
from the process environment only.

The adapter strictly partitions and bounds the capture, diff, session, and
recorded-analysis components; rejects duplicate JSON members, unknown or
overlapping fields, symbolic links, non-regular files, malformed schemas, and
structurally insufficient capture inventories; and publishes canonical output
atomically without replacing an existing file. It does not discover a
repository, normalize a raw Codex session, execute captured commands, upload or
persist data, add a public model route, or change ledger verdict/provenance
contracts.

The second repository fixture is explicitly synthetic and exercises a distinct
instruction topology, conditional non-trigger, successful required command,
retry recovery, missing evidence, subjective decline, and human review. The
detailed scenarios, exit classes, test seams, and acceptance criteria are
authoritative in [`audit-bundle-cli-spec.md`](audit-bundle-cli-spec.md).

## v0.2 Public Recorded-Case Explorer Extension

The public demo exposes exactly two repository-owned, recorded cases through a
client-side selector. Case 001 remains the default `build-week-demo-v1`
validation-drift story. Case 002 is the existing
`synthetic-retry-recovery-v1` retry-recovery story. Both cases are rendered
from server-validated, canonical audit results and require no model request,
credential, upload, persistence, or user-supplied fixture.

Case 002 is visibly labeled `SYNTHETIC_SANITIZED` and “not a captured real
session.” The selector does not change `GET /api/audit`, which continues to
return Case 001 only. It does not change fixture bytes, deterministic verdict
or provenance contracts, the CLI, or the live GPT adapter.

### Scenario 6 — Compare two disclosed recorded cases

An engineering reviewer opens the public demo on Case 001, follows a compact
three-step tour, and inspects the contradicted validation obligation. The
reviewer switches to Case 002 to inspect retry recovery, then switches back.
Each case shows its own story, disclosure, chain metadata, initial record, and
outcome mix.

### Acceptance criteria

- Case 001 is selected on first load and preserves the existing validation-
  drift flow and export digest.
- Case 002 is selected only by an explicit reviewer action and visibly states
  that it is synthetic, sanitized, and not a captured real session.
- Each case supplies its own title, story, disclosure, initial record, and
  optional discovery-exclusion metadata; no Case 001 metadata leaks into Case
  002.
- Switching cases resets the result filter to `ALL` and selects that case's
  truthful initial record. Switching in either direction never leaves a stale
  selected row or inspector.
- The three-step tour is case-aware. It does not claim Case 002 contains a
  contradiction; its retry-recovery record begins at `NOT_EVIDENCED`.
- The outcome legend explicitly explains that `NOT_EVIDENCED` is neither a
  failure nor compliance.
- Each case exports its own digest-bound canonical ledger without changing
  `/api/audit` or making a model request.
- The selector, tour, disclosure, legend, records, and inspector remain usable
  at desktop and mobile widths.

### Test seam decision

The explorer crosses the existing browser seam because its risk is the
composition of server-validated fixture output with client state. Five focused
browser flows exercise initial render, switching in both directions,
case-aware copy, filter and selection reset, both downloads, the legend, and a
mobile no-overflow check. Existing engine and CLI tests continue to own fixture
parsing, deterministic outcomes, digests, API behavior, and model-boundary
guarantees.
