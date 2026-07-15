# Release and submission proof

> The v0.2 CLI baseline remains bound to its reviewed source and immutable
> deployment below. The final public-surface release adds a two-case in-memory
> recorded explorer and therefore changes the public UI runtime. It does not
> change the deterministic core, fixture bytes, dependencies, `/api/audit`, the
> GPT path, keys, uploads, persistence, authentication, or the finished video.

## Final public-surface release candidate

- Surface: Case 001 remains the default `build-week-demo-v1` validation-drift
  story. Case 002 exposes the existing `synthetic-retry-recovery-v1` story and
  is visibly labeled `SYNTHETIC_SANITIZED` and not a captured real session.
- Judge path: a story-labeled selector, case-aware three-step tour, and outcome
  legend teach that `NOT_EVIDENCED` is neither failure nor compliance.
- State contract: every switch resets the filter to `ALL` and selects the
  active case's pinned initial record. Case-specific discovery metadata cannot
  leak between cases.
- Runtime boundary: both audits are computed from repository-owned recorded
  fixtures during static generation and switch in memory. `GET /api/audit`
  remains Case-001-only; `POST /api/audit` remains disallowed.
- Verification: 77/77 unit and contract tests across 7 files plus 5/5 Chromium
  acceptance flows, lint, typecheck, and a static production build are green
  locally. The browser suite covers both exports, switching in both directions,
  reset state, case-aware copy, the legend, and a 390px no-overflow path.
- Fresh screenshots:
  `docs/assets/codex-rule-ledger-desktop.png` (1440x1631, SHA-256
  `bd8014d8baf3fca6a17c519198382bc73645fff02f668558c45458040c884984`)
  and `docs/assets/codex-rule-ledger-mobile.png` (390x3843, SHA-256
  `a782943c7e8065288424c4cb41b3fd188053613e79c6ea5014f971d1d566e232`).
- Spend boundary: no OpenAI request, key access, or model spend occurred for
  this release.
- To avoid a self-referential proof commit, the exact merge SHA, main CI,
  deployment ID and immutable URL, alias timestamp, zero-environment-variable
  check, route probes, both browser exports, screenshot hashes, estate parity,
  and rollback target will be posted as an immutable reconciliation comment on
  https://github.com/OrionArchitekton/codex-rule-ledger/pull/16 after merge and
  production verification.

## v0.2 CLI baseline: immutable source and review

- Product PR: https://github.com/OrionArchitekton/codex-rule-ledger/pull/14
- Reviewed PR head: `20c2d0331d31876851eee689a8a4705afb146013`.
- Squash merge SHA: `ad009529911577132e336ecd605e57d55114444a` at
  `2026-07-15T04:38:38Z`.
- Review disposition: all eight review conversations were resolved. Accepted
  output-cleanup, parser-allocation, missing-parent test, and public-demo
  wording findings landed; raw debug-error output and a Windows skip were
  declined to preserve the approved non-leak and POSIX contracts. CodeRabbit's
  sole finding landed; its latest recorded review is `APPROVED` at
  `2026-07-15T04:40:14Z`. The admin merge bypassed only the impossible
  self-codeowner approval rule after every executable and conversation gate was
  green.
- Baseline local verification: lint pass, typecheck pass, 77/77 tests across 7
  files, production build pass with static `/` and `/api/audit`, and 1/1
  Chromium acceptance pass.
- Dependency/secret preflight: `npm audit` reported zero vulnerabilities; a
  repo-file-only Gitleaks scan found no leak. A raw directory scan found only
  ignored Next.js-generated build keys under `.next`.
- [Main repo-guardrails](https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29389462057)
  and [main Gitleaks](https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29389462055)
  both completed successfully on the merge SHA.

## v0.1 historical source baseline

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
  v0.2 CLI scope and final public recorded-case explorer. The build ledger
  records 39 witnessed vertical RED-to-GREEN slices through the CLI baseline
  and three final-surface slices, for 42 total.
- Operator boundary: Dan remained the solo participant and retained authority
  for credentials and spend plus participant-held eligibility, publication,
  and submission gates.
- Attribution limit: Git commits use Dan's authenticated repository identity
  and carry no Codex co-author trailers. This workflow disclosure is not an
  independent cryptographic attestation of agent authorship.
- Official Codex feedback: JSON-RPC `feedback/upload` completed without an
  error, excluded optional diagnostic logs, and returned thread ID
  `019f5dda-3975-70b3-abc0-2f18d72c3aea`, matching the primary build session.
- Langfuse corroboration, re-queried at render time on
  `2026-07-15T04:45:47Z`: the private metadata-only session with that same ID
  contained 17 traces spanning `2026-07-14T00:27:36.990Z` through
  `2026-07-15T03:37:10.386Z` and 17 linked generation observations, the latest
  at `2026-07-15T03:37:10.387Z`. Every observation reported `gpt-5.6-sol`,
  source `codex`, and CLI `0.144.0-alpha.4`. Sixteen were `DEFAULT` and one was
  `ERROR`; trace and observation input/output body counts were all zero.
- Public provenance card:
  [`build-provenance-v0.2.md`](build-provenance-v0.2.md),
  [`build-provenance-v0.2.json`](build-provenance-v0.2.json), and
  [`build-provenance-v0.2.png`](../assets/build-provenance-v0.2.png).
- Corroboration limit: the feedback ID, Langfuse metadata, Git/PR/CI receipts,
  and deployment binding support build continuity. They do not cryptographically
  attest agent authorship, authenticate a transcript, or prove what the model
  received.

## v0.2 CLI baseline automated verification

- v0.2 main source: 42 targeted unit/boundary test executions across 4 files,
  plus lint, typecheck, production build, and Chromium E2E, all green in
  [run 29389462057](https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29389462057)
  on `ad009529911577132e336ecd605e57d55114444a`.
- v0.2 main Gitleaks:
  [run 29389462055](https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29389462055)
  passed on the same merge SHA.
- The baseline full local release suite was 77/77 tests across 7 files, as
  recorded in the baseline local-verification receipt above; the split CI jobs
  executed 42 targeted release-boundary tests.
- PR-head dependency review, Gitleaks, fail-closed aggregation, GitGuardian,
  Vercel preview, lint, typecheck, unit, boundary, build, and E2E all passed;
  zero review conversations remained unresolved at merge.
- The following v0.1/PR #11 counts and links are retained as historical proof,
  not as the current v0.2 release gate.
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
- Baseline local browser acceptance: 1/1 Chromium flow pass on merged source.
- Baseline public browser acceptance: desktop and mobile evaluator flows pass, including
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

## v0.2 CLI baseline public deployment

- Estate deploy-target/secret-scope admission:
  https://github.com/OrionArchitekton/orion-estate-audit/pull/586 merged as
  `6f2a600c105aec6a257b745a4b8931e4faf4c60e` at
  `2026-07-14T21:12:49Z`.
- Estate managed-web identity follow-up:
  https://github.com/OrionArchitekton/orion-estate-audit/pull/588 merged as
  `b250f23b0b112ea6679884af51c55860309c890e` at
  `2026-07-14T22:08:31Z`.
- Vercel project ID: `prj_rARPEaSAbfGZ59anhwcpKaROMMQg`.
- Production deployment: `dpl_GHL2zVtNjBiVMr7wHbD2sDLMgnZa` (`READY`),
  created at `2026-07-15T04:38:41.202Z`.
- Immutable deployment URL:
  https://codex-rule-ledger-er2blsask-dan-mercedes-projects.vercel.app
- Public URL: https://codex-rule-ledger.vercel.app
- Historical deployment binding: `gitSource.ref`, `gitSource.sha`, and
  `meta.githubCommitSha` resolve to `main` and
  `ad009529911577132e336ecd605e57d55114444a`; independent public-alias
  inspection resolved to this exact deployment ID at
  `2026-07-15T04:49:00Z`. This immutable deployment remains the source-bound
  v0.2 CLI baseline runtime receipt; it is not the final-surface deployment.
- Keyless proof: the Vercel project reported zero configured project
  environment variables. Vercel system variables are not included in this
  claim.
- Root/API HTTP proof: root `200`, `GET /api/audit` `200`, and
  `POST /api/audit` `405` at `2026-07-15T04:49:00Z`. The API returned only
  `build-week-demo-v1`, execution `COMPLETED`, input `READY`, analyzer
  `RECORDED`, provenance `LOCAL_CAPTURE_UNATTESTED`, and five records. The API
  response SHA-256 was
  `51e226b4a717506fd574385a7f7929fba41939edfc3ef458e38011fe0b5f8c48`;
  public secret/path/content scans passed.
- Public browser export proof at `2026-07-15T04:49:36.248Z`: the contradiction
  inspector exposed `event-typecheck-failure`; export produced
  `codex-rule-ledger-4fc6eab5bc7b.json`, 8,621 bytes, with matching SHA-256
  `4fc6eab5bc7b9a8fad5f6eb887d4a5ddb62bba470b8061684b6a4330171bc3ba`.
- The baseline screenshots were superseded by the final-surface captures
  recorded near the top of this packet; no current artifact path is bound to
  the older screenshot hashes.
- Estate live reconciliation: project binding and production parity both pass
  for `personal-brand-hackathons-codex-rule-ledger`.
- Rollback target: known-good pre-v0.2 deployment
  `dpl_3x4wpvuDABZrdztd6KuHnC9hJi9U`, bound to
  `86a064e5266f529dc6f8640830b44ff2bc38426f`. Reassign the public alias only if
  validation fails, then repeat alias identity, route, payload, and browser
  checks. There is no user data, database, queue, or migration to roll back.

## Demo media

- Upload-ready narrated video:
  [`codex-rule-ledger-demo-v0.2.mp4`](../assets/codex-rule-ledger-demo-v0.2.mp4),
  1920x1080 H.264 at 30 fps with AAC-LC audio, `177.219` seconds and
  `10,698,820` bytes. SHA-256:
  `dc71469a08a379359331e9ac9e67eaa146cba9626671fd2b585cb28451b4f441`.
- Checked caption companion:
  [`codex-rule-ledger-demo-v0.2.srt`](codex-rule-ledger-demo-v0.2.srt), 54
  non-overlapping cues ending at `177.150` seconds, with no cue longer than nine
  words. SHA-256:
  `475d9c908d52aa47e6989abcefbb18d546bdaa3d21ad7d35b070080a065317bb`.
- The seven-shot recording uses repository-owned visuals, the exact public
  production site, an actual contradiction-inspection flow, an actual
  digest-verified export, the recorded v0.2 CLI receipt, and the allowlisted
  provenance card. It contains no music, secret value, local absolute path,
  private trace ID, prompt, output body, reasoning, or tool input.
- The finished video follows the unchanged default Case 001 flow and does not
  show the later public case selector. The final-surface release and fresh
  product screenshots expose Case 002 without changing the video artifact.
- The voiceover explicitly covers what the working product does, how Codex
  selected, scoped, architected, implemented, reviewed, deployed, and packaged
  it, the participant authority boundary, and how GPT-5.6 produces source-linked
  semantic proposals while deterministic TypeScript owns every final verdict.
- Media QC: duration is below the `2:59` ceiling; video and audio both start at
  zero; audio measured `-22.9 dB` mean and `-1.5 dB` peak with no two-second
  silence; representative frames across all seven shots were inspected at
  original resolution.
- Public YouTube upload remains a participant-held publication gate. The local
  artifact is complete and does not need a rehearsal or re-recording.

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
