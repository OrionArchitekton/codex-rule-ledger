# Normalized Audit Bundle CLI v0.2 Specification

## Status

Approved for implementation on 2026-07-14 for the OpenAI Build Week
Developer Tools submission. The feature must be green and reviewable by
2026-07-17 at 12:00 PM PT or be removed from the submission release.

## Product Promise

An engineering reviewer can run Codex Rule Ledger locally against an
already-normalized, disclosed Audit Bundle directory and receive the same
canonical, digest-bound Evidence Ledger produced by the existing audit engine.

The CLI does not discover repositories, import raw Codex transcripts, execute
captured commands, authenticate capture history, or make the hosted demo accept
user input. Recorded analysis is the keyless default. Live GPT-5.6 analysis is
an explicit local action using an environment-held key.

## Canonical Language

- **Normalized Audit Bundle Directory**: a local directory containing
  `capture-manifest.json`, `diff.json`, and `session.json` whose disjoint
  top-level fields combine into one strict `CaptureBundleV1`.
- **Recorded Analysis**: `semantic-analysis.json`, parsed through the same
  closed semantic schema and bound to the reconstructed semantic-input digest.
- **Recorded Mode**: the default CLI mode. It requires Recorded Analysis and
  performs no model request or API-key lookup.
- **Live Mode**: the explicit `--live` CLI mode. It ignores any Recorded
  Analysis, requires `OPENAI_API_KEY` from the environment, and binds one
  GPT-5.6 request to the selected normalized bundle.
- **Canonical CLI Output**: the existing canonical Evidence Ledger JSON, whose
  SHA-256 equals the digest reported by the completed audit and CLI receipt.

## Constraints

- The existing `runLedgerAudit(bundle, semanticAnalyzer) -> AuditExecution`
  interface remains the sole deterministic audit seam. The CLI is an adapter;
  it cannot assign verdicts, relax validation, or change provenance language.
- This CLI slice introduces no new runtime dependency, service, database,
  authentication surface, upload, public model endpoint, repository crawler,
  raw-session normalizer, CI Action, or hosted fixture selector. A separately
  authorized public recorded-case explorer may expose only repository-owned,
  server-validated recorded cases and does not change this CLI contract.
- Bundle components are read only from the four known filenames. Each required
  file must be a bounded regular file, not a symbolic link, and each component
  must contain only its owned top-level fields. Unknown, overlapping, missing,
  malformed, or oversized content fails closed.
- Recorded Mode never reads `OPENAI_API_KEY` and never constructs a live model
  adapter.
- Live Mode obtains the key from `OPENAI_API_KEY`, never from an argument,
  file, output, error, or ledger. It inherits `store: false`, no tools,
  `maxRetries: 0`, the existing timeout and request bounds, structured output,
  prompt-injection treatment, source coverage, and digest allowlisting.
- A structurally insufficient bundle makes no model request and writes no
  ledger.
- Output to a path is private by default, atomic, and no-clobber. Output to `-`
  writes only canonical ledger JSON to stdout. Diagnostics go only to stderr
  and never include file content, semantic output, or key material.
- The repository-owned second case is synthetic, sanitized, and disclosed as
  such. It must differ from the Build Week fixture in instruction topology and
  result texture; it must not be described as a real Codex session.
- The real-build provenance card is corroboration, not an audit result. It may
  contain only the verified feedback session ID, public Git/PR/CI/deployment
  receipts, and render-time-verified metadata-only Langfuse fields. It cannot
  claim that Langfuse recorded prompts, edits, tool calls, or repository truth.

## CLI Interface

```text
npm run --silent audit -- --bundle <directory> --out <path-or-dash> [--live]
```

- `--bundle` and `--out` are required exactly once.
- `--live` is an optional flag. Recorded Mode is used when it is absent.
- Unknown flags, positional arguments, repeated options, or an API key passed
  as an argument are usage errors.
- Success exits `0`.
- Usage errors exit `2`.
- Bundle read, parse, schema, or structural-readiness failures exit `3`.
- Analyzer, live-key, refusal, timeout, or semantic-output failures exit `4`.
- Output publication failures exit `5`.

## Scenario 1 - Run a recorded normalized bundle

A reviewer points the CLI at a valid repository-owned bundle directory and an
unused output path. The CLI parses each component, combines the bundle without
field overriding, runs the Recorded Analysis through `runLedgerAudit`, and
atomically publishes the canonical ledger.

### Acceptance criteria

- The command succeeds without reading an API key or constructing a live
  analyzer.
- The output is byte-for-byte canonical and its SHA-256 equals the reported
  ledger digest.
- Repeating the command to a different unused path produces identical bytes.
- The existing Build Week fixture and the second disclosed fixture both cross
  this same CLI seam.

## Scenario 2 - Fail closed before analysis or output

A reviewer supplies a missing file, symbolic link, oversized file, malformed
JSON, unexpected component field, overlapping component field, schema-invalid
bundle, stale analysis digest, or structurally insufficient Launch Capture.

### Acceptance criteria

- The command exits with the documented nonzero class and writes no ledger.
- No live analyzer is constructed and no model request occurs for a bundle
  failure.
- Errors identify the failed component or contract without echoing its value.
- An existing output path is never overwritten.

## Scenario 3 - Opt into one local live analysis

A reviewer runs the same command with `--live` and supplies
`OPENAI_API_KEY` through the environment. The CLI binds the analyzer to the
selected bundle's reconstructed semantic-input digest and crosses the existing
audit seam once.

### Acceptance criteria

- Missing or blank environment keys fail before a request and before output.
- The key is not accepted through CLI arguments and never appears in output or
  diagnostics.
- The request uses GPT-5.6 structured output with `store: false`, no tools,
  zero automatic retries, existing byte/count bounds, and the existing timeout.
- The model returns semantic proposals only. Deterministic code still owns
  readiness, coverage, entailment, adjudication, provenance, and final output.
- Refusal, timeout, malformed output, stale digest, or incomplete coverage
  fails closed with no partial ledger.

## Scenario 4 - Demonstrate a second disclosed case

The repository includes a second synthetic normalized bundle with a different
instruction layout and evidence sequence. Its recorded analysis demonstrates a
successful required command, an intervening successful retry that prevents a
false contradiction, a conditional non-trigger, and an instruction routed to
human review.

### Acceptance criteria

- The fixture is labeled `SYNTHETIC_SANITIZED` in its disclosure and never
  described as a captured real session.
- Its bundle and recorded analysis pass the same strict schemas as the first
  fixture.
- Its canonical output has a different digest from the first fixture.
- A regression test proves the retry does not become contradiction evidence.

## Scenario 5 - Present real build provenance without overclaiming

The submission packet includes a compact provenance card binding the official
feedback session ID to public Git, PR, CI, and deployment receipts and to the
same metadata-only private Langfuse session identifier.

### Acceptance criteria

- Every public receipt is linked directly and rechecked before release.
- Langfuse values are re-queried before the final render and limited to session
  ID, source, model, CLI version, observed interval, and snapshot count.
- The card says Langfuse is metadata-only corroboration and does not prove file
  edits or repository work by itself.
- Raw Langfuse exports, private trace IDs, local paths, prompts, outputs,
  reasoning, tool inputs, and secret or SDK identifiers are absent.

## Deep Module And Test Seam Decision

The audit engine keeps its existing deep interface:

```text
runLedgerAudit(bundle, semanticAnalyzer) -> AuditExecution
```

The CLI adds one process-adapter interface:

```text
runAuditBundleCli(argv, dependencies) -> CliRunResult
```

Tests and the executable cross the process-adapter seam. The adapter owns
argument parsing, bounded file loading, mode selection, conversion of
`AuditExecution` into exit classes, and atomic output publication. It delegates
all instruction discovery, semantic completeness, verdicts, evidence links,
hashes, redaction, and canonical ledger serialization to the existing deep
module. Deleting the adapter would spread those process concerns across the
executable and tests; deleting the audit module would spread the product
invariants across every caller. Both therefore earn their depth and locality.

Dependencies are accepted rather than created inside the process adapter so
tests can prove keyless behavior, no-request failure paths, and output
publication without mocking the deterministic audit engine.
