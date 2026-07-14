# Release and submission proof

## Immutable source

- Product PR: `https://github.com/OrionArchitekton/codex-rule-ledger/pull/1`
- Reviewed head SHA: `[LATEST_GREEN_REVIEWED_HEAD_SHA]`
- Merge SHA: `NOT_MERGED — independent approval required`
- License: MIT
- Repository visibility/API proof: public GitHub repository verified through the
  GitHub API on `2026-07-14T04:51:41Z`.

## Automated verification

- Local `npm audit`: zero known vulnerabilities on `2026-07-14T04:51:41Z`.
- Lint: pass — `npm run lint`.
- Typecheck: pass — `npm run typecheck`.
- Unit/contract: 40/40 pass — `npm test`.
- Production build: pass — static `/` and `/api/audit` routes.
- Browser acceptance: 1/1 Chromium flow pass; 497 ms browser flow.
- Gitleaks: `[LATEST_COMMITTED_HISTORY_SCAN]`
- CI run: `[CI_RUN_URL]`

## GPT-5.6 proof

- Model: `gpt-5.6`
- Prompt contract: `semantic-obligations-v2`
- Prompt SHA-256: `8d9c6eea9279e1fb9d4bbd2999271178de66f7e1b36327e0737da6812b909236`
- Fixture digest: `1b2d24559d4fa8cee0a1f46d13a6d2ee7fc58a4c605d2fe9caf234d371870752`
- Response ID: `[LIVE_GPT_RESPONSE_ID]`
- Input/output tokens: `[TOKEN_COUNTS]`
- Cost ledger: `[ACTUAL_COST] / $20 maximum`
- Secret scope: `[DOPPLER_PROJECT_CONFIG_PROOF_WITHOUT_SECRET_VALUE]`

## Public deployment

- Estate deploy-target/secret-scope admission: `[ADMISSION_PR_AND_MERGE]`
- Vercel project and deployment ID: `[VERCEL_IDS]`
- Public URL: `[PUBLIC_VERCEL_URL]`
- Deployed Git SHA: `[DEPLOYED_SHA]`
- Root/API HTTP proof: `[HTTP_STATUS_AND_TIMESTAMP]`
- Desktop/mobile screenshot paths: `docs/assets/`
- Rollback target: `[LAST_KNOWN_GOOD_SHA_OR_REMOVE_TARGET]`

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
