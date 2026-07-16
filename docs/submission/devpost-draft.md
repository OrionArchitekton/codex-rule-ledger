# Devpost submission record

> Submitted to OpenAI Build Week at
> https://devpost.com/software/codex-rule-ledger. Logged-out verification on
> `2026-07-16` confirmed the full story, public video embed, three-image gallery,
> captions, and external links.

## Identity

- **Project:** Codex Rule Ledger
- **Track:** Developer Tools
- **Tagline:** Evidence-bound audits for Codex runs: support, contradict, or
  admit the evidence cannot decide.
- **Audience and decision:** Staff engineers, platform teams, and security
  reviewers deciding whether the supplied evidence supports accepting,
  investigating, or blocking an agent-produced change.
- **Repository:** https://github.com/OrionArchitekton/codex-rule-ledger
- **License:** MIT
- **Live demo:** https://codex-rule-ledger.vercel.app
- **Devpost:** https://devpost.com/software/codex-rule-ledger
- **Video:** https://youtu.be/7zJCkww6TaE (published source:
  `docs/assets/codex-rule-ledger-demo-v0.2.mp4`)
- **Primary Codex feedback ID:** `019f5dda-3975-70b3-abc0-2f18d72c3aea`

## Judge it in 60 seconds

1. Open the [keyless public demo](https://codex-rule-ledger.vercel.app) on the
   default **Case 001: Validation drift** and read its reconstructed chain.
2. Open the contradicted typecheck rule and inspect its exact source plus the
   linked failure and completion events.
3. Switch to **Case 002: Retry recovery** and see why an exact successful retry
   prevents a false contradiction without becoming a compliance claim. Then
   export that case's digest-bound ledger.

No account, API key, upload, private repository, or rebuild is required. The
review flow is covered by Chromium browser acceptance at desktop and mobile
viewports.

## Inspiration

An agent-produced diff can look ready while its supplied session evidence says
otherwise.
In the default demo, `npm run typecheck` fails and a completion event follows.
Rule Ledger turns that sequence into one `CONTRADICTED` row linking the
reconstructed instruction, failed command, and completion event.

Codex Rule Ledger turns an already-normalized launch-and-session bundle into a
source-linked evidence ledger for staff engineers, platform teams, and security
reviewers deciding whether to accept, investigate, or block the change. A rule
audit can start by asking whether a rule passed. Rule Ledger first asks whether
the supplied evidence makes any verdict admissible. Missing evidence is neither
failure nor compliance.

## What it does

Rule Ledger reconstructs the instruction chain described by the supplied
launch capture, separates mechanically observable obligations from subjective
prose, and returns four result states:

- `SUPPORTED`: affirmative supplied evidence matches the rule;
- `CONTRADICTED`: affirmative supplied evidence conflicts with the rule;
- `NOT_EVIDENCED`: the capture does not contain enough evidence, which is not
  proof of non-action; and
- `NOT_APPLICABLE`: affirmative trigger evidence shows the conditional rule did
  not apply.

Non-observable instructions are declined rather than guessed into pass/fail.
Ambiguous or conflicting instructions are routed to `HUMAN_REVIEW_REQUIRED`;
declined and human-review dispositions stay outside the four mechanical result
states. Each row links to its instruction source and the supplied evidence or
search record behind its disposition. Export produces deterministic
SHA-256-bound JSON labeled `LOCAL_CAPTURE_UNATTESTED`; the hash binds the
supplied bytes, not their authenticity or time.

Confusing `NOT_EVIDENCED` with compliance can admit an unverified “done” claim.
Confusing it with failure can reject work that happened but was not captured.
Rule Ledger preserves that distinction for human review.

v0.2 reuses the same audit contract in a repo-local CLI for already-normalized
bundles. Recorded mode is keyless by default; explicit local `--live` mode uses
one GPT-5.6 semantic-analysis request. The public demo exposes both
repository-owned synthetic fixtures through a story-labeled, keyless selector.
Neither is a captured real session, and the explorer accepts no visitor-supplied
audit material, credential, or model request.

## How judges can test it

**Live demo:** https://codex-rule-ledger.vercel.app. Use the 60-second flow
above to inspect the product without rebuilding it.

**Supported local judge platform:** Ubuntu Linux with Node.js 24 and npm. The
package contract also supports Node.js `^22.13.0 || >=24.0.0`; normalized POSIX
paths are supported, while Windows CLI behavior is not claimed.

```bash
git clone https://github.com/OrionArchitekton/codex-rule-ledger.git
cd codex-rule-ledger
npm ci
npm run --silent audit -- \
  --bundle fixtures/synthetic-retry-recovery-v1 \
  --out ledger.json
```

The command writes a private, no-clobber ledger and reports its digest on
stderr. For the complete release proof on fresh Ubuntu, run
`npx playwright install --with-deps chromium` once and then `npm run verify`.
Verification runs lint, typecheck, all 77 unit and contract tests, the
production build, and five Chromium E2E flows. Judges do not need `--live`; that
operator-only mode requires an environment key and is excluded from the public
test path.

## How we built it

Working from the minimal event prompt, Codex independently selected the
problem; scoped, designed, implemented, and tested v0.1; drove adversarial
review and repair; deployed the keyless demo; and implemented the separately
authorized v0.2 CLI and final public recorded-case explorer. Dan remained the
sole entrant and retained release authorization, credentials, spend,
eligibility, and publication decisions. The public repository and product work
began inside the submission period.

The repository preserves 42 witnessed vertical RED-to-GREEN slices and 77
current tests. The architecture keeps each authority legible:

- **Codex:** selected and scoped the problem, implemented the vertical slices,
  drove review repair, deployment, and submission packaging.
- **GPT-5.6:** in live mode, maps complete instruction lines into typed,
  source-linked semantic proposals, routes ambiguous or conflicting language
  to human review, and declines subjective, unbounded, or non-observable
  language.
- **Deterministic TypeScript:** owns input validation, instruction discovery,
  hashes, evidence queries, semantic coverage, and every final ledger state.

GPT-5.6 does not own final verdicts, and deterministic validation rejects an
unknown or fabricated source anchor before any ledger is produced. The public
demo serves two repository-owned synthetic fixtures with recorded semantic
analysis through the same typed analyzer contract, so keyless judging consumes
no API budget and exposes no key.

Detailed `/feedback`, Git, CI, deployment, metadata-only Langfuse, and bounded
live-request receipts are linked in the [v0.2 CLI baseline provenance card](https://github.com/OrionArchitekton/codex-rule-ledger/blob/main/docs/submission/build-provenance-v0.2.md)
and [final release proof](https://github.com/OrionArchitekton/codex-rule-ledger/blob/main/docs/submission/release-proof.md).
Together they corroborate build continuity across the disclosed workflow; they
do not independently attest authorship, transcript authenticity, or individual
edits.

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

- A zero-login browser workflow turns Case 001's failed typecheck followed by
  completion into a source-linked contradiction, while Case 002 prevents an
  exact successful retry from becoming a false contradiction.
- One audit seam drives tests, the API, the UI, and the v0.2 normalized-bundle
  CLI.
- Both disclosed synthetic topologies are judge-visible in the browser and
  export through the same audit contract.
- The release has 77 unit and contract tests across seven files plus five
  Chromium acceptance flows, successful bounded GPT-5.6 proof requests, and a
  keyless public deployment.

## What we learned

Reviewers do not need another green compliance badge. They need a compact
explanation of what the supplied evidence supports, contradicts, and cannot
decide. The second case also demonstrated why retry recovery matters: an
earlier failure is not a contradiction when an exact successful retry precedes
completion.

## What's next

Next, we will package the deterministic core as an OSS library and version the
capture/import contract so teams can integrate already-normalized bundles into
review workflows. More disclosed fixtures come next. Private traces and signed
provenance require separate authorization, retention, deletion, and attestation
designs.

## Built with

Codex, GPT-5.6, OpenAI Responses API, structured outputs, Next.js, React,
TypeScript, Zod, Vitest, Playwright, GitHub Actions, and Vercel.

## Submission media order

1. **Product UI:** `docs/assets/codex-rule-ledger-desktop.png`
2. **CLI receipt:** `docs/assets/cli-recorded-v0.2.png`
3. **v0.2 CLI baseline provenance:** `docs/assets/build-provenance-v0.2.png`
4. **Optional mobile view:** `docs/assets/codex-rule-ledger-mobile.png`

Use the final 140-character-limit captions in
`docs/submission/SCREENSHOT_CAPTIONS.md`.

## Publication status

- [x] Participant eligibility attestations supplied.
- [x] Finished 2:57 video published as **Public** on YouTube and verified while
  logged out at https://youtu.be/7zJCkww6TaE.
- [x] Final Devpost page reviewed, submitted, and verified while logged out at
  https://devpost.com/software/codex-rule-ledger.
- [x] Final-surface proof is complete and reconciled in the
  [PR #16 post-merge receipt](https://github.com/OrionArchitekton/codex-rule-ledger/pull/16#issuecomment-4982803645).
