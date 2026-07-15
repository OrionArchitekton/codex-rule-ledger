---
verified: 2026-07-14
review_after: 2026-07-21
topics:
  - codex-rule-ledger
  - audit-bundle-cli
  - gpt-5.6
  - local-proof
references:
  - package.json
  - specs/audit-bundle-cli-spec.md
  - src/cli/audit-bundle.ts
  - src/ledger/analyzers/openai-responses.ts
  - fixtures/synthetic-retry-recovery-v1/capture-manifest.json
---

# Local Audit Bundle CLI runbook

## Scope and invariants

The v0.2 CLI evaluates an already-normalized local Audit Bundle through the
unchanged `runLedgerAudit` seam. Recorded mode is keyless and is the default.
`--live` is an explicit operator action that permits one bounded GPT-5.6
semantic-analysis request. The CLI never discovers a repository, imports a raw
session, executes a captured command, uploads a bundle, or changes the public
fixture-only route.

The local operator owns input review. Redaction is defense in depth rather than
DLP; do not send private source, secrets, personal data, or an unreviewed bundle
through live mode.

## Preflight

1. Use Node.js 22 or newer and install the lockfile with `npm ci`.
2. Confirm the bundle directory contains `capture-manifest.json`, `diff.json`,
   and `session.json`; recorded mode also requires `semantic-analysis.json`.
3. Review the normalized content and ensure it contains no secret or private
   material. Do not supply a raw Codex transcript.
4. Choose a new output path or `-` for stdout. The CLI never overwrites a file.
5. For `--live` only, inject `OPENAI_API_KEY` from the admitted dedicated secret
   scope into the process environment. Never place the key in an argument.

## Run

Recorded/keyless:

```bash
npm run --silent audit -- --bundle <normalized-bundle> --out <new-ledger.json>
```

Explicit local live mode:

```bash
npm run --silent audit -- --bundle <normalized-bundle> --out <new-ledger.json> --live
```

Exit codes are `0` for a ready ledger, `2` for usage, `3` for rejected bundle
or recorded analysis, `4` for a live-key/analyzer failure, and `5` for output
publication failure. An unexpected internal digest invariant exits `1`.

## Monitoring and cost control

- Treat each live invocation as at most one billable request; the application
  has zero automatic retries.
- Confirm stderr reports only `ledgerDigest=<sha256>` on success and never
  inspect or publish raw model output.
- Stop if a response is refused, times out, lacks complete source coverage, or
  fails deterministic entailment. No partial ledger is valid.
- The Build Week operator allowance permits at most one dedicated-key v0.2
  proof call and caps that call at $0.25. This is not a general product budget.

## Validation

```bash
npm run --silent audit -- \
  --bundle fixtures/synthetic-retry-recovery-v1 \
  --out /tmp/codex-rule-ledger-v0.2.json
npm run verify
```

Verify the output is canonical JSON, its SHA-256 matches the stderr receipt,
its provenance remains `LOCAL_CAPTURE_UNATTESTED`, no captured absolute path is
present, and a repeated run to the same path fails without changing the file.

## Rollback

The CLI adds no database, service, route, account, or persistent state. Roll
back by reverting the v0.2 CLI commit or checking out the last known-good tag.
Delete only operator-created ledger files after confirming they are not needed
as release proof. If a key or private input may have leaked, revoke the key and
follow the relevant incident process; deleting the ledger alone is not
remediation.
