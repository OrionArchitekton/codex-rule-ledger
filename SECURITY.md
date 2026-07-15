# Security Policy

## Supported surface

The supported v0.2 surface is the repository-owned synthetic fixture and its
read-only public UI plus the repo-local Audit Bundle CLI. The CLI accepts only
already-normalized local components; it does not discover repositories or
normalize raw Codex sessions. Trace upload, URL fetching, captured-command
execution, authentication, persistence, and public live-model calls are not
supported.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository. Do not attach
real Codex traces, source archives, environment dumps, API keys, access tokens,
or customer data to a public issue.

Include the affected commit, the smallest synthetic reproduction, expected and
actual behavior, and impact. Maintainers will acknowledge a report when it is
triaged; no response-time guarantee is implied for this hackathon release.

## Data and model boundary

- The public demo invokes only a recorded analyzer over a fixed synthetic
  fixture and remains keyless.
- The local CLI defaults to recorded mode, which does not read an OpenAI key or
  construct a live analyzer. `--live` is the only model opt-in.
- A live credential must enter only through `OPENAI_API_KEY` in the local
  process environment and remain scoped to the dedicated project/config
  admitted for this product. It must never be passed in argv, committed,
  logged, embedded in a bundle, or attached to Vercel.
- CLI component files are bounded regular files opened without following their
  final symbolic link. Unknown or misplaced top-level fields, malformed JSON,
  invalid schemas, incomplete launch captures, and stale recorded analysis fail
  before output; structurally insufficient live input fails before key access
  or analyzer construction.
- Live analysis binds one request to the validated semantic-input digest. It
  has no tools, automatic retries, or response storage request and inherits the
  existing byte/count limits, timeout, structured output, and source-coverage
  checks.
- Every model payload field is treated as untrusted inert data. Evaluable
  proposals must pass deterministic exact-quote and closed-rule entailment
  checks before they can reach adjudication.
- Logs and proof artifacts must retain response metadata only, never secrets or
  raw private trace content.
- Path and credential-marker redaction is defense in depth, not data-loss
  prevention. Do not use `--live` on private or unreviewed normalized content.
- File output is mode `0600`, atomically published, and no-clobber. Treat ledger
  output as potentially sensitive even though known path and credential-like
  markers are redacted.
- A content digest is integrity binding, not proof of source authenticity or
  trusted time.

If any boundary above changes, threat-model and document the new ingestion,
retention, authorization, abuse, spend, and deletion controls before release.
