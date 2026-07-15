# Release and submission proof

> v0.2 candidate packet: the implementation, PR, CI, merge, and production
> receipts remain pending until this branch lands. The immutable source and
> deployment sections below still describe the verified v0.1 baseline and must
> be reconciled before any v0.2 release claim.

## v0.2 candidate evidence

- Feature commit: `8eec1ca612ce28a83891d7c041ed0791014b7cb0`.
- Local verification on that commit: lint pass, typecheck pass, 75/75 tests
  across 7 files, production build pass with static `/` and `/api/audit`, and
  1/1 Chromium acceptance pass against an explicit local production server.
- Dependency/secret preflight: `npm audit` reported zero vulnerabilities; a
  repo-file-only Gitleaks scan found no leak. A raw directory scan found only
  ignored Next.js-generated build keys under `.next`.
- Pending before v0.2 release: public PR URL/head CI, review disposition, merge
  SHA, keyless Vercel deployment binding, endpoint/browser reconciliation, and
  a final render-time Langfuse re-query.

## Immutable source

- Product PR: https://github.com/OrionArchitekton/codex-rule-ledger/pull/1
- Merged PR head SHA: `7058c9f1e7439159d5a9beeff2d053e7cfa8c14e`
- Merge SHA: `72b0fb3dd174162cd2450f14ed3a7434a4398b4f`
- Merge time: `2026-07-14T21:14:20Z`
- Application release baseline: `251ef31cda0615a5438c4061943bce689535a05b`.
  It includes reviewed dependency-maintenance PRs
  [#12](https://github.com/OrionArchitekton/codex-rule-ledger/pull/12),
  [#9](https://github.com/OrionArchitekton/codex-rule-ledger/pull/9), and
  [#13](https://github.com/OrionArchitekton/codex-rule-ledger/pull/13).
- License: MIT
- Repository visibility/API proof: public GitHub repository verified through the
  GitHub API on `2026-07-14T21:28:00Z`.

## Build provenance

- Disclosed workflow: from the minimal Build Week event prompt, Codex
  independently selected the problem, scoped and designed v0.1, implemented
  and tested it, drove adversarial review and repairs, deployed the public demo,
  and packaged the release. Codex then implemented the separately authorized
  v0.2 CLI scope. The build ledger records 39 witnessed vertical RED-to-GREEN
  slices across both versions.
- Operator boundary: Dan remained the solo participant and retained authority
  for credentials and spend plus participant-held eligibility, publication,
  and submission gates.
- Attribution limit: Git commits use Dan's authenticated repository identity
  and carry no Codex co-author trailers. This workflow disclosure is not an
  independent cryptographic attestation of agent authorship.
- Official Codex feedback: JSON-RPC `feedback/upload` completed without an
  error, excluded optional diagnostic logs, and returned thread ID
  `019f5dda-3975-70b3-abc0-2f18d72c3aea`, matching the primary build session.
- Langfuse corroboration, queried at `2026-07-15T04:13:31Z`: the private
  metadata-only session with that same ID contained 17 snapshots spanning
  `2026-07-14T00:27:36.990Z` through `2026-07-15T03:37:10.386Z`; all 17 linked
  generation observations reported `gpt-5.6-sol`, source `codex`, and CLI
  `0.144.0-alpha.4`. No prompt or output bodies were recorded.
- Corroboration limit: the feedback ID, Langfuse metadata, Git/PR/CI receipts,
  and deployment binding support build continuity. They do not cryptographically
  attest agent authorship, authenticate a transcript, or prove what the model
  received.

## Automated verification

- Dependency-maintenance preflight: `npm ci` reported zero vulnerabilities and
  `npm run verify` passed before merge. At `2026-07-14T22:35:22Z`, the release
  baseline had zero open Dependabot alerts and no open Dependabot pull requests.
- Lint: pass — `npm run lint`.
- Typecheck: pass — `npm run typecheck`.
- Release-baseline unit/contract: 40/40 pass across 4 test files — `npm test`.
- PR #11 proof-head unit/contract: 41/41 pass across 5 test files. The
  [PR checks page](https://github.com/OrionArchitekton/codex-rule-ledger/pull/11/checks)
  resolves to the current head rather than pinning a stale intermediate run.
- Production build: pass — static `/` and `/api/audit` routes.
- Local browser acceptance: 1/1 Chromium flow pass on merged source.
- Public browser acceptance: desktop and mobile evaluator flows pass, including
  evidence inspection, exception filtering, and digest-bound ledger export.
- [Main CI run](https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29373378393):
  lint, typecheck, unit, boundary, build, and browser checks are green on
  `251ef31cda0615a5438c4061943bce689535a05b`.
- [Main Gitleaks run](https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29373378365):
  the upgraded Gitleaks action passed on the same release SHA. Dependency
  review and the required-checks fail-closed gate also passed on the PR #13
  current-base merge before the release baseline was merged.

## GPT-5.6 proof

- Model: `gpt-5.6`, the standard alias for
  [GPT-5.6 Sol](https://developers.openai.com/api/docs/models).
- Prompt contract: `semantic-obligations-v2`
- Prompt SHA-256: `8d9c6eea9279e1fb9d4bbd2999271178de66f7e1b36327e0737da6812b909236`
- Fixture digest: `1b2d24559d4fa8cee0a1f46d13a6d2ee7fc58a4c605d2fe9caf234d371870752`
- Call status: COMPLETED at `2026-07-15T01:21:59.222Z` with exactly one
  OpenAI request and zero automatic retries. An earlier CLI invocation failed
  during local TypeScript transformation, before the API boundary; the
  entrypoint was repaired and covered by a regression test before this call.
- Response ID: `resp_026bb975…f24e6d`; full ID retained in private
  operator-session evidence. SHA-256 fingerprint:
  `77abb9627038d89be32da286b06a1eef8c59b22854b04e3eb0fc204d04074636`.
- Input/output tokens: `1,315 / 846`.
- Result counts: `5` proposals and `4` source-coverage receipts.
- Semantic-analysis digest:
  `bd163dc845061355f31a93738cbd67915b66bf2c68df513c389cdfc33244da78`.
- Ledger digest:
  `d3b706e5546958d1c9504e1342a0553dfdaad29e299a20dbc1ba1ad41f961d67`.
- Request controls: `store: false`, tools disabled, automatic retries `0`.
- Cost ledger: conservative standard-price upper bound `$0.031955 / $12`
  effective operator ceiling (`$20` remained the approved build-fire maximum).
  This uses the published GPT-5.6 Sol rates of `$5 / 1M` input tokens and
  `$30 / 1M` output tokens and assumes no cached-input discount.
- Secret scope: Doppler project `openai-hack-codex-ledger`, config `prd`.
  `OPENAI_API_KEY` presence was verified without displaying its value and was
  injected ephemerally for the operator proof. It was not written to the
  repository or attached to Vercel.

## v0.2 CLI GPT-5.6 proof

- Completed once at `2026-07-15T04:23:34Z` through the committed local CLI and
  the second disclosed `synthetic-retry-recovery-v1` bundle.
- Controls: one request, automatic retries `0`, `store: false`, tools disabled,
  structured output, bounded request, environment-only key, and no public model
  route.
- Semantic-input digest:
  `607741187403a987ae7d59c3d8246bed4926b479d71d9aa797cd91881781fffa`.
- Response ID: `resp_04e26c5d…`; full ID retained only in the private proof
  ledger. SHA-256 fingerprint:
  `11da2e91cb958e3ee4ae4311c82c94ea40c02f440c2c00caec5c43715677030a`.
- Input/output tokens: `1,323 / 820`; conservative cost on the same standard
  price basis as the v0.1 proof: `$0.031215`, below the separately authorized
  `$0.25` v0.2 call ceiling.
- Result mix: `1 SUPPORTED`, `2 NOT_EVIDENCED`, `1 NOT_APPLICABLE`,
  `1 DECLINED_NON_OBSERVABLE`, and `1 HUMAN_REVIEW_REQUIRED`.
- Canonical ledger/file digest:
  `f63e106aece6195a3b18d2de6bac482997955a41fce6b9ae728c37c0c5f7dca6`.
  The private output was mode `0600`; its scan contained no fixture absolute
  path, API-key marker, or OpenAI key-shaped value.
- The dedicated key was injected ephemerally from Doppler and was not written
  to the repository, proof metadata, or Vercel.

## Public deployment

- Estate deploy-target/secret-scope admission:
  https://github.com/OrionArchitekton/orion-estate-audit/pull/586 merged as
  `6f2a600c105aec6a257b745a4b8931e4faf4c60e` at
  `2026-07-14T21:12:49Z`.
- Estate managed-web identity follow-up:
  https://github.com/OrionArchitekton/orion-estate-audit/pull/588 merged as
  `b250f23b0b112ea6679884af51c55860309c890e` at
  `2026-07-14T22:08:31Z`.
- Vercel project ID: `prj_rARPEaSAbfGZ59anhwcpKaROMMQg`.
- Verified preview deployment: `dpl_BTp2oWpNJY4qN1eCXaqBk9E4csP4`.
- Production deployment: `dpl_FTbqyajmqnCYpfq15WsioAGt4BbS` (`READY`).
- Public URL: https://codex-rule-ledger.vercel.app
- Deployed Git SHA: `251ef31cda0615a5438c4061943bce689535a05b`;
  at `2026-07-14T22:35:22Z`, Vercel `githubCommitSha` matched the then-current
  GitHub `main` head.
- PR #11 merged as `86a064e5266f529dc6f8640830b44ff2bc38426f` and is the
  pre-v0.2 source baseline. The preceding `251ef31` deployment statement is a
  historical time-bound binding, not current v0.2 production proof.
- Root/API HTTP proof: root `200`, `GET /api/audit` `200`, and
  `POST /api/audit` `405` at `2026-07-14T22:35:22Z`. The API returned only
  `build-week-demo-v1` in `RECORDED` mode with five ledger records; public
  secret/path scans passed and the Vercel project had zero environment
  variables.
- Public browser proof on the release baseline: desktop evidence inspection and
  digest-bound export passed; the Pixel 7 viewport passed evidence inspection
  and exception filtering.
- Estate live reconciliation: project binding and production parity both pass
  for `personal-brand-hackathons-codex-rule-ledger`.
- Desktop/mobile screenshot paths: `docs/assets/`
- Rollback target: reassign the public alias to known-good deployment
  `dpl_BY7v1BNwYSJXfeUtVtHXvUP8RRXN`, or remove the aliases/project. There is
  no user data, database, queue, or migration to roll back.

## Participant-held gates

- [ ] Age-of-majority attestation supplied.
- [ ] Jurisdiction/participation attestation supplied.
- [ ] Official conflicts/exclusions attestation supplied.
- [ ] Prior Sponsor/Administrator relationship attestation supplied.
- [x] Primary `/feedback` ID supplied from this build thread.
- [ ] Public YouTube video reviewed and uploaded.
- [ ] Final Devpost fields reviewed and submitted before 2026-07-21 17:00 PT.

Until all four eligibility attestations are checked, Devpost submission,
YouTube upload, and social publishing remain unauthorized.
