# Devpost submission draft

> Draft only. Do not submit until the participant supplies all four eligibility
> attestations and the finished video has a public YouTube URL.

## Identity

- **Project:** Codex Rule Ledger
- **Track:** Developer Tools
- **Tagline:** Evidence-bound audits for Codex runs: support, contradict, or
  admit the evidence cannot decide.
- **Audience and decision:** Staff engineers, platform teams, and security
  reviewers deciding whether to accept, investigate, or block an
  agent-produced change pending evidence.
- **Repository:** https://github.com/OrionArchitekton/codex-rule-ledger
- **License:** MIT
- **Live demo:** https://codex-rule-ledger.vercel.app
- **Video:** `[PUBLIC_YOUTUBE_URL]` (upload-ready source:
  `docs/assets/codex-rule-ledger-demo-v0.2.mp4`)
- **Primary Codex feedback ID:** `019f5dda-3975-70b3-abc0-2f18d72c3aea`

## Judge it in 60 seconds

1. Open the [keyless public demo](https://codex-rule-ledger.vercel.app) on the
   default **Case 001: Validation drift** and read its reconstructed chain.
2. Open the contradicted typecheck rule and inspect its exact source plus the
   linked failure and completion events.
3. Switch to **Case 002: Retry recovery**, use the legend to see why an exact
   successful retry yields `NOT_EVIDENCED`, then export that case's
   digest-bound ledger.

No account, API key, upload, private repository, or rebuild is required. The
review flow is covered by Chromium browser acceptance at desktop and mobile
viewports.

## Inspiration

Staff engineers, platform teams, and security reviewers can inspect an
agent-produced diff, but the diff does not show which instruction chain a
supplied Codex launch capture reconstructs or whether the captured session
supports the run's validation claims. That leaves a real human decision:
accept the change, investigate it, or block it pending evidence.

Codex Rule Ledger turns an already-normalized launch-and-session bundle into a
source-linked evidence ledger. Rather than asking only whether a rule passed,
Rule Ledger first asks whether the supplied evidence makes any verdict
admissible. Missing evidence is neither failure nor compliance.

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
Each row links to its instruction source and the supplied evidence or search
record behind its disposition. Export produces deterministic SHA-256-bound JSON
labeled `LOCAL_CAPTURE_UNATTESTED`; the hash binds the supplied bytes, not their
authenticity or time.

Confusing `NOT_EVIDENCED` with compliance can admit an unverified “done” claim.
Confusing it with failure can reject work that happened but was not captured.
Rule Ledger preserves that distinction for human review.

v0.2 reuses the same audit contract in a repo-local CLI for already-normalized
bundles. Recorded mode is keyless by default; explicit local `--live` mode uses
one GPT-5.6 semantic-analysis request. The public demo now exposes both
repository-owned synthetic cases through a story-labeled, keyless selector.
Neither is a captured real session. The explorer accepts no upload, arbitrary
fixture, credential, or model request.

## How judges can test it

**Public browser path:** Use the 60-second flow above. It is the fastest way to
inspect the product without rebuilding it.

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
begin inside the submission period.

The repository preserves 42 witnessed vertical RED-to-GREEN slices and 77
current tests. The architecture keeps each authority legible:

| Layer | Responsibility |
| --- | --- |
| Codex | Selected and scoped the problem, implemented the vertical slices, drove review repair, deployment, and submission packaging. |
| GPT-5.6 | In live mode, maps complete instruction lines into typed, source-linked semantic proposals and declines ambiguous or subjective rules. |
| Deterministic TypeScript | Owns input validation, instruction discovery, hashes, evidence queries, semantic coverage, and every final ledger state. |

GPT-5.6 cannot emit a final verdict or invent a source anchor. The public demo
serves two repository-owned recordings through the same typed analyzer contract,
so unrestricted judging consumes no API budget and exposes no key.

The [build-provenance card](https://github.com/OrionArchitekton/codex-rule-ledger/blob/main/docs/submission/build-provenance-v0.2.md)
and [release proof](https://github.com/OrionArchitekton/codex-rule-ledger/blob/main/docs/submission/release-proof.md)
carry the detailed `/feedback`, Git, CI, deployment, metadata-only Langfuse,
and bounded live-request receipts. They corroborate the disclosed workflow;
they do not independently attest authorship.

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

- A zero-login browser workflow compares two disclosed recorded cases, exposes
  their instruction chains and outcome mixes, and exports each digest-bound
  ledger.
- One audit seam drives tests, the API, the UI, and the v0.2 normalized-bundle
  CLI.
- The second synthetic topology is judge-visible in the browser and
  demonstrates that the contract handles a different instruction chain and
  outcome mix.
- The release has 77 unit and contract tests across seven files plus five
  Chromium acceptance flows, successful bounded GPT-5.6 proof requests, and a
  keyless public deployment.

## What we learned

Agent-audit interfaces need to communicate what they cannot know as carefully
as what they found. A useful ledger is not a green compliance badge; it is a
compact chain of inspectable claims whose sources, evidence, and limitations
survive export.

We also learned that the best model boundary is narrow and asymmetric:
semantic understanding benefits from GPT-5.6, while ordering, hashes, evidence
sufficiency, and terminal states benefit from deterministic code.

## What's next

After the event, the next step is a careful OSS extraction of the deterministic
core, a versioned capture/import contract, more disclosed Codex fixtures, and
signed capture provenance only when a real key-backed attestation design
exists. Support for other agent harnesses and private traces requires separate
threat modeling, authorization, retention, and deletion controls.

## Built with

Codex, GPT-5.6, OpenAI Responses API, structured outputs, Next.js, React,
TypeScript, Zod, Vitest, Playwright, GitHub Actions, and Vercel.

## Submission media order

1. **Product UI:** `docs/assets/codex-rule-ledger-desktop.png`
2. **CLI receipt:** `docs/assets/cli-recorded-v0.2.png`
3. **Build provenance:** `docs/assets/build-provenance-v0.2.png`
4. **Optional mobile view:** `docs/assets/codex-rule-ledger-mobile.png`

Use the reviewed captions in `docs/submission/SCREENSHOT_CAPTIONS.md`.

## Operator-only gates

- [ ] Supply all four participant eligibility attestations.
- [ ] Upload the finished 2:57 video as **Public** on YouTube using
  `docs/submission/YOUTUBE.md`, then replace `[PUBLIC_YOUTUBE_URL]`.
- [ ] Perform the final Devpost preview and submit before the event deadline.
- [x] Final-surface local proof, captions, fresh screenshots, and upload-ready
  video are complete; the exact runtime receipt will be attached to the merged
  final-surface PR.
