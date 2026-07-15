# Build provenance card — v0.2

**Status:** corroborated build continuity, not an authorship attestation
**Rendered:** `2026-07-15T04:45:47Z`

## Official Codex receipt

- `/feedback` returned the primary build thread ID
  `019f5dda-3975-70b3-abc0-2f18d72c3aea` with classification `good_result`.
- Optional diagnostic logs were excluded from the upload.

## Public source, CI, and deployment receipts

| Receipt | Verified value |
| --- | --- |
| Product PR | [OrionArchitekton/codex-rule-ledger#14](https://github.com/OrionArchitekton/codex-rule-ledger/pull/14) |
| Reviewed head | `20c2d0331d31876851eee689a8a4705afb146013` |
| Squash merge | `ad009529911577132e336ecd605e57d55114444a` at `2026-07-15T04:38:38Z` |
| Main CI | [repo-guardrails](https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29389462057) and [Gitleaks](https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29389462055), both successful on the merge SHA |
| Production | Immutable deployment `dpl_GHL2zVtNjBiVMr7wHbD2sDLMgnZa`, `READY`, bound to `main` at the merge SHA; the [public alias](https://codex-rule-ledger.vercel.app) resolved to it at `2026-07-15T04:49:00Z` |
| Keyless boundary | Zero configured Vercel project environment variables |
| Route proof | root `200`, `GET /api/audit` `200`, `POST /api/audit` `405` |

## Render-time Langfuse metadata

The private metadata-only session was re-queried at
`2026-07-15T04:45:47Z` and matched the official feedback thread ID.

| Field | Verified value |
| --- | --- |
| Trace interval | `2026-07-14T00:27:36.990Z` to `2026-07-15T03:37:10.386Z` |
| Latest generation observation | `2026-07-15T03:37:10.387Z` |
| Traces / generation observations | `17 / 17` |
| Model | `gpt-5.6-sol` |
| Source | `codex` |
| CLI | `0.144.0-alpha.4` |
| Levels | `16 DEFAULT`, `1 ERROR` |
| Trace input/output bodies | `0 / 0` |
| Observation input/output bodies | `0 / 0` |

No private trace or observation IDs, hostnames, paths, SDK identifiers,
prompts, outputs, reasoning, or tool inputs are published.

## Limits

These receipts corroborate one continuous build lane. They do not
cryptographically attest agent authorship, authenticate a transcript, prove
what the model received, or attribute individual file edits. Git, CI, and
deployment receipts prove public source and runtime state; the Langfuse card is
metadata-only corroboration.

Machine-readable companion:
[`build-provenance-v0.2.json`](build-provenance-v0.2.json).
