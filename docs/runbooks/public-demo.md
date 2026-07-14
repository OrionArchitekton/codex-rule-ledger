---
verified: 2026-07-13
review_after: 2026-07-21
topics:
  - codex-rule-ledger
  - vercel
  - fixed-fixture-demo
  - rollback
references:
  - package.json
  - app/api/audit/route.ts
  - src/fixtures/build-week-demo.ts
  - fixtures/build-week-demo-v1/capture-manifest.json
  - e2e/demo.spec.ts
---

# Public demo runbook

## Scope and invariants

The public v0.1 is a stateless Next.js application that serves one immutable,
repository-owned synthetic fixture. It must not expose an OpenAI key, accept
uploads or arbitrary identifiers, execute commands, fetch user-controlled
URLs, or persist visitor data. `GET /api/audit` is the only audit route.

The unrestricted hosted path uses the recorded analyzer. A live GPT-5.6 call
is a separately controlled proof path and is not required for public judging.

## Preflight

1. Confirm the deploy commit is the reviewed PR head or merged `main` SHA.
2. Confirm estate deploy-target and secret-scope admission are landed before
   creating or changing the hosted target.
3. Run `npm ci`, full `npm audit`, and `npm run verify`.
4. Run `gitleaks git --redact --no-banner .` on the commit history.
5. Confirm `GET /api/audit` contains only fixture data and no absolute home
   path, environment value, token, or raw private trace.
6. Deploy without `OPENAI_API_KEY`; the public fixture requires no secret.

## Rollout

1. Deploy the reviewed SHA to a preview target.
2. Open the preview in a clean browser session at desktop and mobile widths.
3. Exercise the full flow: inspect the chain, select the contradicted record,
   filter exceptions, open evidence, and export the ledger.
4. Verify the exported JSON digest and provenance warning match the page.
5. Promote the same immutable build to the admitted public target.
6. Record the Git SHA, deployment ID/URL, UTC timestamp, and validation output
   in the release proof packet.

## Monitoring

During the submission and judging window, check:

- public root and `GET /api/audit` return HTTP 200;
- no route exposes a mutation method or user-controlled fixture selection;
- browser console and platform function logs contain no errors or secrets;
- response latency remains sufficient for the under-90-second evaluator flow;
- deployment maps to the recorded Git SHA; and
- the repository remains public and accessible with its MIT license.

Because the demo is static/fixed-fixture, there are no model-spend, queue,
database, or retention metrics on the public path.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Expected contract evidence: 40 unit/contract tests pass, the production build
contains `/` and `/api/audit`, and the Playwright flow completes with the
`LOCAL_CAPTURE_UNATTESTED` warning visible.

## Rollback

Redeploy the last known-good SHA and verify the same smoke flow. If provenance,
secret exposure, arbitrary input, or integrity is in doubt, remove the public
deployment rather than serving a degraded audit. No data rollback is required:
the product has no database, migration, queue, account, or user-data store.

After rollback, preserve the failing deployment metadata and sanitized logs for
root-cause analysis; never preserve leaked secret values or private traces.
