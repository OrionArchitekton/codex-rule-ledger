# Codex Rule Ledger

Evidence-bound audits for Codex runs: support, contradict, or admit the evidence
cannot decide.

For staff engineers, platform teams, and security reviewers deciding whether
to accept, investigate, or block an agent-produced change pending evidence.

![Codex Rule Ledger desktop demo](docs/assets/codex-rule-ledger-desktop.png)

## Judge it in 60 seconds

1. [Open the keyless public demo](https://codex-rule-ledger.vercel.app) on the
   default **Case 001: Validation drift** and read its reconstructed chain.
2. Open “Do not claim completion after `npm run typecheck` fails” and inspect
   the linked source, failed-typecheck event, and completion event.
3. Switch to **Case 002: Retry recovery** to see why a successful retry yields
   `NOT_EVIDENCED`, then export that case's digest-bound ledger.

No login, API key, upload, private repository, or rebuild is required. This
case-switch, inspect, and export path is covered by the repository's Chromium
E2E acceptance tests at desktop and mobile widths.

## Why it exists

A diff shows what an agent changed, but not which instruction chain a supplied
Codex launch capture reconstructs or whether the captured session supports the
run's validation claims. Rather than asking only whether a rule passed, Rule
Ledger first asks whether the supplied evidence makes any verdict admissible.

The public demo makes that review legible in one screen:

- the reconstructed global-to-launch-directory instruction chain;
- `SUPPORTED`, `CONTRADICTED`, `NOT_EVIDENCED`, and `NOT_APPLICABLE` results;
- declined subjective instructions outside the mechanical result machine;
- exact source links plus evidence or search records for each disposition; and
- a deterministic, hash-bound JSON export labeled
  `LOCAL_CAPTURE_UNATTESTED`.

Confusing missing evidence with compliance can admit an unverified “done”
claim. Confusing it with failure can reject work that happened but was not
captured. Rule Ledger preserves that distinction for human review.

It reports supplied evidence. It does **not** certify compliance, authenticate
a trace, or infer that an unlogged action did not happen.

## Run locally

Prerequisites: Node.js 22.13 or newer within the 22.x line, or Node.js 24+, and
npm. Release CI and the documented judge path use Node.js 24 on Ubuntu Linux.

```bash
git clone https://github.com/OrionArchitekton/codex-rule-ledger.git
cd codex-rule-ledger
npm ci
npm run dev
```

Open `http://localhost:3000`. The page defaults to the disclosed
`build-week-demo-v1` synthetic case and can switch locally to the disclosed
`synthetic-retry-recovery-v1` case. Case 002 is visibly labeled
`SYNTHETIC_SANITIZED` and is not a captured real session. Both use recorded
analysis, so evaluators do not need an API key or private repository.

For the complete local proof on a fresh Ubuntu machine, install the Chromium
test browser and its system dependencies once, then run verification:

```bash
npx playwright install --with-deps chromium
npm run verify
```

Verification runs lint, typecheck, all 77 unit and contract tests, the
production build, and five Chromium E2E flows.

## Audit an already-normalized bundle locally

v0.2 adds a repo-local CLI for disclosed Audit Bundle directories that already
contain normalized capture, diff, and session JSON. Recorded analysis is the
keyless default:

```bash
npm run --silent audit -- \
  --bundle fixtures/synthetic-retry-recovery-v1 \
  --out ledger.json
```

Use `--out -` to send only the canonical ledger JSON to stdout. A file output
is created privately, atomically, and without replacing an existing path. The
ledger digest is reported on stderr.

Explicit local `--live` mode uses one GPT-5.6 analysis request. It requires
`OPENAI_API_KEY` to already be present in the process environment; the key is
never accepted as an argument:

```bash
npm run --silent audit -- --bundle <normalized-bundle> --out ledger.json --live
```

The CLI accepts only `capture-manifest.json`, `diff.json`, and `session.json`
as its normalized bundle components; recorded mode also requires
`semantic-analysis.json`. It does not crawl a repository, import raw Codex
sessions, execute captured commands, upload data, or change the public
recorded-case explorer. Review
[`docs/runbooks/local-audit-cli.md`](docs/runbooks/local-audit-cli.md) and
[`SECURITY.md`](SECURITY.md) before using `--live`.

## What the recorded cases prove

Case 001 exercises instruction override/fallback order and the configured byte
limit. Its normalized events yield:

| Rule | Result | Required evidence |
|---|---|---|
| Run `npm test` successfully before completion | `SUPPORTED` | An exit-zero command event before completion |
| Do not complete after `npm run typecheck` fails | `CONTRADICTED` | A failed command, no successful retry, then a completion event |
| Run `npm run build` successfully before completion | `NOT_EVIDENCED` | The required command is absent from the capture |
| Run `npm run docs:check` when `README.md` changes | `NOT_APPLICABLE` | The captured changed-path set affirmatively excludes `README.md` |
| “Make the interface delightful” | `DECLINED_NON_OBSERVABLE` | Subjective prose never receives a mechanical pass/fail result |

Case 002 uses a distinct three-source topology and six-record outcome mix. Its
failed typecheck is followed by an exact successful retry before completion,
so the earlier failure is not affirmative contradiction evidence.

`NOT_EVIDENCED` means only that the supplied capture lacks sufficient evidence.
It is neither failure nor compliance and is never treated as proof of
non-action.

## Architecture

One deep module owns the audit boundary:

```ts
runLedgerAudit(bundle, semanticAnalyzer) -> AuditExecution
```

Behind that seam, deterministic TypeScript validates the complete launch
manifest, reconstructs instruction discovery, checks content hashes, evaluates
typed evidence queries, assigns ledger results, redacts absolute paths, and
produces a canonical SHA-256-bound export.

Semantic analysis is replaceable:

- `RecordedFixtureAnalyzer` powers tests and the unrestricted public demo.
- `OpenAIResponsesAnalyzer` uses GPT-5.6 structured output for typed,
  source-linked proposals.
- The v0.2 CLI selects either adapter only after strict, bounded bundle parsing;
  recorded mode never reads an API key.

GPT-5.6 cannot emit a ledger verdict, reorder instruction discovery, alter
hashes, or cite an unknown source. Its source text is explicitly treated as
untrusted data. Evaluable output must use one of four canonical v0.1 rule forms,
and deterministic code verifies that every exact command, conditional path,
polarity, and trigger is explicitly entailed by the cited quote. Refusal,
malformed or fabricated semantics, an unallowlisted fixture digest, or a
timeout fails closed. The live adapter has no tools, stores no response through
the API request, redacts absolute paths and common credential-like markers
before transmission, has no automatic retry, and applies strict input/output
bounds.

## Codex and GPT-5.6

From the minimal Build Week event brief, Codex independently selected the
problem, scoped and designed v0.1, implemented and tested it, drove adversarial
review and repairs, deployed the public demo, and packaged the release. Codex
then implemented the separately authorized v0.2 CLI and final public
recorded-case explorer. This is a workflow disclosure, not independent
proof of agent authorship. Dan remained the solo participant and retained
credentials, spend, eligibility, publication, and submission authority. The
repository preserves the living specs and witnessed build ledger in
[`docs/BUILD_LEDGER.md`](docs/BUILD_LEDGER.md).

Codex accelerated the workflow by carrying 42 vertical RED-to-GREEN slices and
review repairs from living specs through tests, implementation, CI, deployment,
and submission assets. The key architecture decision was to let GPT-5.6
propose semantics while deterministic TypeScript alone owns evidence
sufficiency and final ledger states.

In live mode, GPT-5.6 performs the semantic step: it maps complete instruction
lines in the four strict v0.1 forms into source-linked observable proposals and
declines subjective or ambiguous language. Deterministic code requires every
supported directive to have exactly one total, evaluable disposition and
remains the authority for all final evidence states. The public demo serves two
recorded synthetic cases from the same typed contract so judging does not
consume API budget or expose a key.

## Input, privacy, and trust boundary

The public deployment remains deliberately recorded-case-only. It exposes
exactly two repository-owned synthetic cases and accepts no visitor input. The
local v0.2 CLI accepts only already-normalized Audit Bundle directories and
demonstrates Codex
0.144.0 with POSIX capture paths. `GET /api/audit` remains default-only for
Case 001. Neither surface accepts uploads or URLs,
executes captured commands, or normalizes raw sessions. Both included cases are
synthetic and contain no private code or credentials.

Hashes bind the supplied bytes after capture; they do not establish
authenticity, trusted time, or what a model actually received. Read
[`SECURITY.md`](SECURITY.md) before adapting the analyzer to real traces.
Command events in v0.1 also do not attest the command working directory,
repository tree, commit identity, or edit timing.

## Project map

- [`specs/codex-rule-ledger-spec.md`](specs/codex-rule-ledger-spec.md): living
  behavior contract and acceptance criteria.
- [`src/ledger`](src/ledger): deterministic audit core and analyzer adapters.
- [`fixtures/build-week-demo-v1`](fixtures/build-week-demo-v1): disclosed
  synthetic capture and recorded semantic proposal batch.
- [`fixtures/synthetic-retry-recovery-v1`](fixtures/synthetic-retry-recovery-v1):
  second disclosed synthetic topology with retry-safe mixed outcomes.
- [`specs/audit-bundle-cli-spec.md`](specs/audit-bundle-cli-spec.md): v0.2
  local CLI behavior and safety contract.
- [`tests`](tests): deep-seam, adapter, and route contract tests.
- [`e2e/demo.spec.ts`](e2e/demo.spec.ts): judge-facing browser acceptance flow.
- [`docs/runbooks/public-demo.md`](docs/runbooks/public-demo.md): rollout,
  validation, monitoring, and rollback.

## Status and license

This is a v0.2 OpenAI Build Week Developer Tools entry and a Personal Authority
`hackathon-project`. Post-event OSS graduation is a separate decision.

MIT licensed. See [`LICENSE`](LICENSE).
