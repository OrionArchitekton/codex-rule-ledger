# Release and submission proof

## Immutable source

- Product PR: `https://github.com/OrionArchitekton/codex-rule-ledger/pull/1`
- Merged PR head SHA: `7058c9f1e7439159d5a9beeff2d053e7cfa8c14e`
- Merge SHA: `72b0fb3dd174162cd2450f14ed3a7434a4398b4f`
- Merge time: `2026-07-14T21:14:20Z`
- License: MIT
- Repository visibility/API proof: public GitHub repository verified through the
  GitHub API on `2026-07-14T21:28:00Z`.

## Automated verification

- Post-merge `npm ci` and `npm audit --audit-level=low`: zero known
  vulnerabilities on `2026-07-14`.
- Lint: pass — `npm run lint`.
- Typecheck: pass — `npm run typecheck`.
- Unit/contract: 40/40 pass — `npm test`.
- Production build: pass — static `/` and `/api/audit` routes.
- Local browser acceptance: 1/1 Chromium flow pass on merged source.
- Public browser acceptance: desktop and mobile evaluator flows pass, including
  evidence inspection, exception filtering, and digest-bound ledger export.
- Gitleaks: `gitleaks git --redact --no-banner .` scanned 16 commits and 1.10 MB
  with no leaks during the post-merge preflight on `2026-07-14`.
- Primary CI run:
  `https://github.com/OrionArchitekton/codex-rule-ledger/actions/runs/29365481985`;
  all required dependency, secret, guardrail, and fail-closed checks are green
  on the merged PR head.

## GPT-5.6 proof

- Model: `gpt-5.6`
- Prompt contract: `semantic-obligations-v2`
- Prompt SHA-256: `8d9c6eea9279e1fb9d4bbd2999271178de66f7e1b36327e0737da6812b909236`
- Fixture digest: `1b2d24559d4fa8cee0a1f46d13a6d2ee7fc58a4c605d2fe9caf234d371870752`
- Call status: `PENDING — no dedicated OpenAI key has been injected and no
  billable proof command has been attempted`.
- Response ID: `[LIVE_GPT_RESPONSE_ID]`
- Input/output tokens: `[TOKEN_COUNTS]`
- Cost ledger: `no proof call attempted / $20 maximum`
- Secret scope: Doppler project `openai-build-week-rule-ledger` materialized on
  `2026-07-14T21:22:05Z`; root configs are `dev` and `prd`, staging was removed,
  and `OPENAI_API_KEY` is absent. Doppler's automatic non-root personal overlay
  is unused. No Doppler or OpenAI secret is attached to Vercel.

## Public deployment

- Estate deploy-target/secret-scope admission:
  `https://github.com/OrionArchitekton/orion-estate-audit/pull/586` merged as
  `6f2a600c105aec6a257b745a4b8931e4faf4c60e` at
  `2026-07-14T21:12:49Z`.
- Estate managed-web identity follow-up:
  `https://github.com/OrionArchitekton/orion-estate-audit/pull/588` merged as
  `b250f23b0b112ea6679884af51c55860309c890e` at
  `2026-07-14T22:08:31Z`.
- Vercel project ID: `prj_rARPEaSAbfGZ59anhwcpKaROMMQg`.
- Verified preview deployment: `dpl_BTp2oWpNJY4qN1eCXaqBk9E4csP4`.
- Production deployment: `dpl_6vE9ioGXiVswok1iut3V4hbvWbJX` (`READY`).
- Public URL: https://codex-rule-ledger.vercel.app
- Deployed Git SHA: `72b0fb3dd174162cd2450f14ed3a7434a4398b4f`;
  Vercel `githubCommitSha` matches the live GitHub `main` head.
- Root/API HTTP proof: root `200`, `GET /api/audit` `200`, and
  `POST /api/audit` `405` at `2026-07-14T21:35:35Z`. The API returned only
  `build-week-demo-v1` in `RECORDED` mode with five ledger records; public
  secret/path scans passed and the Vercel project had zero environment
  variables.
- Estate live reconciliation: project binding and production parity both pass
  for `personal-brand-hackathons-codex-rule-ledger`.
- Desktop/mobile screenshot paths: `docs/assets/`
- Rollback target: remove or disable the aliases/project for this first public
  release; there is no user data, database, queue, or migration to roll back.

## Participant-held gates

- [ ] Age-of-majority attestation supplied.
- [ ] Jurisdiction/participation attestation supplied.
- [ ] Official conflicts/exclusions attestation supplied.
- [ ] Prior Sponsor/Administrator relationship attestation supplied.
- [ ] Primary `/feedback` ID supplied from this build thread.
- [ ] Public YouTube video reviewed and uploaded.
- [ ] Final Devpost fields reviewed and submitted before 2026-07-21 17:00 PT.

Until all four eligibility attestations are checked, Devpost submission,
YouTube upload, and social publishing remain unauthorized.
