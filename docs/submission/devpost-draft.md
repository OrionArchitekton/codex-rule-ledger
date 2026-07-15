# Devpost submission draft

> Draft only. Do not submit until the participant supplies all four eligibility
> attestations. Replace every bracketed proof field with a live-verified value.

## Identity

- **Project:** Codex Rule Ledger
- **Track:** Developer Tools
- **Tagline:** Turn layered Codex instructions and session evidence into an
  inspectable rule ledger—without pretending missing logs prove compliance.
- **Repository:** https://github.com/OrionArchitekton/codex-rule-ledger
- **License:** MIT
- **Live demo:** https://codex-rule-ledger.vercel.app
- **Video:** `[PUBLIC_YOUTUBE_URL]`
- **Primary Codex feedback ID:** `019f5dda-3975-70b3-abc0-2f18d72c3aea`

## Inspiration

When a coding agent says a task is done, reviewers can inspect the diff—but the
diff alone does not show which layered repository instructions governed the run
or whether the captured session supports the validation it claims. Codex can
load global guidance, project guidance, directory overrides, and configured
fallback files into one launch-context instruction chain. Reading that chain
and a full trace by hand is slow, and it is easy to make a worse mistake:
treating an absent event as proof that an action never happened.

We built Codex Rule Ledger to give reviewers a smaller, honest object: an
evidence ledger for observable instructions, linked back to the supplied source
and event that justifies every result.

## What it does

The demo reconstructs a disclosed Codex instruction chain from a synthetic
launch capture, including override/fallback precedence and a configured byte
limit. It then evaluates typed obligations against normalized session evidence
and presents four deliberately distinct outcomes:

- `SUPPORTED`: affirmative supplied evidence matches the rule;
- `CONTRADICTED`: affirmative supplied evidence conflicts with the rule;
- `NOT_EVIDENCED`: the capture does not contain enough evidence, which is not
  proof of non-action; and
- `NOT_APPLICABLE`: affirmative trigger evidence shows the conditional rule did
  not apply.

Subjective prose is declined outside that result state machine. Reviewers can
inspect exact source/event anchors and export a deterministic SHA-256-bound JSON
ledger. Every view retains the `LOCAL_CAPTURE_UNATTESTED` warning: hashes bind
the supplied bytes, but do not authenticate them or establish trusted time.

v0.2 also ships a repo-local CLI for already-normalized Audit Bundle
directories. Recorded analysis is keyless by default; explicit local `--live`
mode binds one GPT-5.6 request to the validated bundle digest. A second
disclosed synthetic case exercises a different instruction topology, a
successful retry that prevents a false contradiction, a conditional
non-trigger, missing evidence, subjective decline, and human review. The public
Vercel demo remains fixed-fixture and keyless.

## How we built it

From the minimal Build Week event prompt, Codex independently selected the
problem, scoped and designed v0.1, implemented and tested it, drove adversarial
review and repairs, deployed the public demo, and packaged the release. Codex
then implemented the separately authorized v0.2 CLI scope. The repository
preserves the living behavior specs and 39 witnessed vertical RED-to-GREEN
slices. Dan remained the solo participant and retained credentials, spend,
eligibility, publication, and submission authority. This is the disclosed
workflow account; the corroborating records do not independently attest agent
authorship.

The product uses Next.js and strict TypeScript around one deep audit seam:

```text
runLedgerAudit(bundle, semanticAnalyzer) -> AuditExecution
```

Deterministic code owns manifest completeness, instruction discovery, hashes,
evidence queries, final result states, path redaction, and canonical export.
GPT-5.6, through the Responses API structured-output path, performs the
indispensable semantic job: it maps complete instruction lines in the four
strict v0.1 forms into source-linked observable proposals and declines
subjective or ambiguous rules. Deterministic code requires exactly one total,
evaluable disposition for every supported directive. GPT-5.6 cannot emit a
final ledger verdict or invent a source anchor.

For safe and unrestricted judging, the public site serves a repository-owned
recording from the same typed analyzer contract. The live GPT-5.6 proof uses the
same allowlisted fixture, with no tools, no automatic retries, no filesystem
paths, strict byte/event/output limits, `store: false`, and an operator-injected
dedicated key. The public Vercel project remains keyless.

## Challenges

The hardest part was preserving epistemic honesty in the state model. “No test
event exists” is not the same as “the test did not run,” and “the input bundle
is structurally complete” is not the same as “the capture is authentic.” We
therefore separated input readiness, obligation disposition, and evaluated
result into different types and made contradictory evidence require an
affirmative event.

The second challenge was keeping GPT-5.6 meaningful without delegating truth to
the model. The model proposes typed semantics; deterministic application code
adjudicates the complete evidence catalog and rejects unknown anchors,
malformed output, refusal, or timeout.

## Accomplishments

- One browser flow makes layered instruction discovery and five distinct
  obligation outcomes understandable in under 90 seconds.
- The same deep module seam drives contract tests, the API route, and the UI.
- The fixed fixture covers override precedence, fallback selection, byte-limit
  exclusion, success, affirmative contradiction, missing evidence,
  inapplicability, and subjective-rule decline.
- The public route serves a repository-owned recorded fixture and accepts no uploads, URLs, commands, raw
  traces, API keys, or user-controlled model calls.
- The local v0.2 CLI accepts already-normalized bundles through the same deep
  audit seam, defaults to recorded/keyless mode, and fails closed on malformed,
  duplicate, oversized, linked, non-regular, stale, or incomplete inputs.
- A second disclosed synthetic case proves the engine and CLI are not
  hard-coded to one instruction topology or result mix.
- The repository includes CI, secret scanning, dependency review, a security
  policy, and an operator rollback runbook.

## What we learned

Agent-audit interfaces need to communicate what they cannot know as carefully
as what they found. A useful ledger is not a green compliance badge; it is a
compact chain of inspectable claims whose sources, evidence, and limitations
survive export.

We also learned that the best model boundary is narrow and asymmetric: semantic
understanding benefits from GPT-5.6, while ordering, hashes, evidence
sufficiency, and terminal states benefit from deterministic code.

## What's next

After the event, the first step is not a universal agent dashboard. It is a
careful OSS extraction of the deterministic core, a versioned capture/import
contract, more disclosed Codex fixtures, and signed capture provenance only
when a real key-backed attestation design exists. Support for other agent
harnesses and private traces would require separate threat modeling,
authorization, retention, and deletion controls.

## Built with

Codex, GPT-5.6, OpenAI Responses API, structured outputs, Next.js, React,
TypeScript, Zod, Vitest, Playwright, GitHub Actions, and Vercel.

## Proof fields before submission

- https://codex-rule-ledger.vercel.app — HTTP 200 and commit binding verified.
- `[PUBLIC_YOUTUBE_URL]` — public, audio present, duration at most 2:59.
- `019f5dda-3975-70b3-abc0-2f18d72c3aea` — official `/feedback` upload returned
  this exact primary-build thread ID with diagnostic logs excluded.
- Live GPT-5.6 proof completed at `2026-07-15T01:21:59.222Z`; the public release
  proof carries a shortened response identifier and SHA-256 fingerprint while
  the full ID remains in private operator-session evidence.
- The v0.2 CLI completed exactly one separate GPT-5.6 proof at
  `2026-07-15T04:23:34Z`: 1,323 input / 820 output tokens, `$0.031215`
  conservative cost, six mixed-outcome records, and canonical ledger digest
  `f63e106a…dca6`. The dedicated key remained ephemeral and Vercel remained
  keyless.
- https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29373378393
  — lint, typecheck, unit, boundary, build, and browser checks green on the
  release baseline; dependency review, Gitleaks, and the fail-closed PR gate
  are also green for that baseline.
