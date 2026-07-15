# Codex Rule Ledger

Evidence-bound audits for observable Codex repository instructions.

![Codex Rule Ledger desktop demo](docs/assets/codex-rule-ledger-desktop.png)

Codex Rule Ledger reconstructs the instruction chain described by a supplied
Codex launch capture, separates mechanically observable obligations from
subjective prose, and links each result to the supplied session evidence.

It reports evidence. It does **not** certify compliance, authenticate a trace,
or infer that an unlogged action did not happen.

## Why it exists

Repository instructions are layered: global guidance, project guidance, and
directory-specific overrides can all govern one Codex run. Reviewing only the
diff does not show which instructions applied or whether the captured session
contains evidence for the validation it claims.

The public demo makes that review legible in one screen:

- the reconstructed global-to-launch-directory instruction chain;
- `SUPPORTED`, `CONTRADICTED`, `NOT_EVIDENCED`, and `NOT_APPLICABLE` results;
- declined subjective instructions outside the mechanical result machine;
- exact instruction and event anchors for each result; and
- a deterministic, hash-bound JSON export labeled
  `LOCAL_CAPTURE_UNATTESTED`.

## Try the fixed-fixture demo

[Open the public fixture-only demo](https://codex-rule-ledger.vercel.app).
It requires no login, API key, upload, or private repository access.

Prerequisites: Node.js 22.13 or newer within the 22.x line, or Node.js 24+, and
npm. Release CI and the documented judge path use Node.js 24 on Ubuntu Linux.

```bash
git clone https://github.com/OrionArchitekton/codex-rule-ledger.git
cd codex-rule-ledger
npm ci
npm run dev
```

Open `http://localhost:3000`. The page is preloaded with the sanitized
`build-week-demo-v1` fixture, so evaluators do not need an API key, private
repository, or rebuild step. Select ledger rows to inspect their evidence, use
the filters to isolate exceptions, and export the canonical ledger JSON.

To run the complete local proof:

```bash
npm run verify
```

The individual checks are `lint`, `typecheck`, `test`, `build`, and
`test:e2e`. The browser acceptance flow starts its own local server.

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
sessions, execute captured commands, upload data, or change the fixture-only
public site. Review [`docs/runbooks/local-audit-cli.md`](docs/runbooks/local-audit-cli.md)
and [`SECURITY.md`](SECURITY.md) before using `--live`.

## What the fixture proves

The disclosed synthetic capture exercises instruction override/fallback order
and the configured byte limit. Its normalized events yield:

| Rule | Result | Required evidence |
|---|---|---|
| Run `npm test` successfully before completion | `SUPPORTED` | An exit-zero command event before completion |
| Do not complete after `npm run typecheck` fails | `CONTRADICTED` | A failed command, no successful retry, then a completion event |
| Run `npm run build` successfully before completion | `NOT_EVIDENCED` | The required command is absent from the capture |
| Run `npm run docs:check` when `README.md` changes | `NOT_APPLICABLE` | The captured changed-path set affirmatively excludes `README.md` |
| “Make the interface delightful” | `DECLINED_NON_OBSERVABLE` | Subjective prose never receives a mechanical pass/fail result |

`NOT_EVIDENCED` means only that the supplied capture lacks sufficient evidence.
It is never treated as proof of non-action.

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
then implemented the separately authorized v0.2 CLI scope through nine more
vertical RED-to-GREEN slices. This is a workflow disclosure, not independent
proof of agent authorship. Dan remained the solo participant and retained
credentials, spend, eligibility, publication, and submission authority. The
repository preserves the living specs and witnessed build ledger in
[`docs/BUILD_LEDGER.md`](docs/BUILD_LEDGER.md).

GPT-5.6 performs the indispensable semantic step: it maps complete instruction
lines in the four strict v0.1 forms into source-linked observable proposals and
declines subjective or ambiguous language. Deterministic code proves that every
supported directive has exactly one total disposition—and that disposition is
evaluable—and remains the authority for all final evidence states. The public
demo serves a recorded result from the same typed contract so judging does not
consume API budget or expose a key.

## Input, privacy, and trust boundary

The public deployment remains deliberately fixture-only. The local v0.2 CLI
accepts only already-normalized Audit Bundle directories and demonstrates Codex
0.144.0 with POSIX capture paths. Neither surface accepts uploads or URLs,
executes captured commands, or normalizes raw sessions. Both included cases are
synthetic and contain no private code or credentials.

Hashes bind the supplied bytes after capture; they do not establish
authenticity, trusted time, or what a model actually received. Read
[`SECURITY.md`](SECURITY.md) before adapting the analyzer to real traces.
Command events in v0.1 also do not attest the command working directory,
repository tree, commit identity, or edit timing.

## Project map

- [`specs/codex-rule-ledger-spec.md`](specs/codex-rule-ledger-spec.md) — living
  behavior contract and acceptance criteria.
- [`src/ledger`](src/ledger) — deterministic audit core and analyzer adapters.
- [`fixtures/build-week-demo-v1`](fixtures/build-week-demo-v1) — disclosed
  synthetic capture and recorded semantic proposal batch.
- [`fixtures/synthetic-retry-recovery-v1`](fixtures/synthetic-retry-recovery-v1)
  — second disclosed synthetic topology with retry-safe mixed outcomes.
- [`specs/audit-bundle-cli-spec.md`](specs/audit-bundle-cli-spec.md) — v0.2
  local CLI behavior and safety contract.
- [`tests`](tests) — deep-seam, adapter, and route contract tests.
- [`e2e/demo.spec.ts`](e2e/demo.spec.ts) — judge-facing browser acceptance flow.
- [`docs/runbooks/public-demo.md`](docs/runbooks/public-demo.md) — rollout,
  validation, monitoring, and rollback.

## Status and license

This is a v0.2 OpenAI Build Week Developer Tools entry and a Personal Authority
`hackathon-project`. Post-event OSS graduation is a separate decision.

MIT licensed. See [`LICENSE`](LICENSE).
