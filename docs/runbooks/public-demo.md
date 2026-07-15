---
verified: 2026-07-15
review_after: 2026-07-21
topics:
  - codex-rule-ledger
  - vercel
  - recorded-case-explorer
  - rollback
references:
  - package.json
  - app/api/audit/route.ts
  - src/fixtures/ready-public-demo-cases.ts
  - fixtures/build-week-demo-v1/capture-manifest.json
  - fixtures/synthetic-retry-recovery-v1/capture-manifest.json
  - e2e/demo.spec.ts
---

# Public demo runbook

## Scope and invariants

The public v0.2 is a stateless Next.js application that serves exactly two
immutable, repository-owned synthetic recorded cases. A client-side selector
switches only between those server-validated cases. It must not expose an
OpenAI key, accept uploads or arbitrary identifiers, execute commands, fetch
user-controlled URLs, or persist visitor data. `GET /api/audit` is the only
audit route and remains default-only for `build-week-demo-v1`.

The unrestricted hosted path uses the recorded analyzer. A live GPT-5.6 call
is a separately controlled proof path and is not required for public judging.

## Preflight

1. Confirm the deploy commit is the reviewed PR head or merged `main` SHA.
2. Confirm estate deploy-target and secret-scope admission are landed before
   creating or changing the hosted target.
3. Run `npm ci`, full `npm audit`, and `npm run verify`.
4. Run `gitleaks git --redact --no-banner .` on the commit history.
5. Confirm `GET /api/audit` contains only the default-case data and no absolute
   home path, environment value, token, or raw private trace.
6. Confirm the root renders exactly Case 001 and Case 002, with Case 001 as the
   default and Case 002 labeled `SYNTHETIC_SANITIZED` and not a captured real
   session.
7. Deploy without `OPENAI_API_KEY`; both public cases require no secret.

## Rollout

1. Deploy the reviewed SHA to a preview target.
2. Open the preview in a clean browser session at desktop and mobile widths.
3. Exercise Case 001: inspect the chain, select the contradicted record, filter
   exceptions, open evidence, and export the ledger.
4. Switch to Case 002, verify filter and row selection reset, inspect
   `typecheck-recovery`, and export the second digest-bound ledger. Switch back
   and confirm Case 001 resets to `typecheck-no-completion`.
5. Verify both exported JSON digests and provenance warnings match the page.
6. Confirm each case's middle tour step matches its story, the outcome legend
   says `NOT_EVIDENCED` is neither failure nor compliance, and desktop/mobile
   layouts have no horizontal overflow.
7. Promote the same immutable build to the admitted public target.
8. Record the Git SHA, deployment ID/URL, UTC timestamp, and validation output
   in the release proof packet.

## Monitoring

During the submission and judging window, check:

- public root and `GET /api/audit` return HTTP 200;
- no route exposes a mutation method or user-controlled fixture identifier;
- the root selector exposes only the two reviewed repository-owned cases;
- browser console and platform function logs contain no errors or secrets;
- response latency remains sufficient for the under-90-second evaluator flow;
- deployment maps to the recorded Git SHA; and
- the repository remains public and accessible with its MIT license.

Because the demo is static and uses two recorded cases, there are no
model-spend, queue, database, or retention metrics on the public path.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Expected repository v0.2 validation evidence: 77 unit/contract tests pass, the
production build contains static `/` and `/api/audit`, and five Playwright
flows cover the default case, switching both directions, reset state, both
exports, the case-aware tour, the outcome legend, and mobile no-overflow. The
`LOCAL_CAPTURE_UNATTESTED` warning remains visible for both cases.

## Rollback

Redeploy the last known-good SHA and verify the same smoke flow. If provenance,
secret exposure, arbitrary input, or integrity is in doubt, remove the public
deployment rather than serving a degraded audit. No data rollback is required:
the product has no database, migration, queue, account, or user-data store.

After rollback, preserve the failing deployment metadata and sanitized logs for
root-cause analysis; never preserve leaked secret values or private traces.
