# Codex Rule Ledger Runbook

The operator runbook for the public fixed-fixture demo is
[`docs/runbooks/public-demo.md`](docs/runbooks/public-demo.md).

Fast local validation:

```bash
npm ci
npm run verify
```

The safe rollback for a hosted release is to redeploy the last known-good Git
SHA or remove the deployment target. The demo has no database, migration,
queue, scheduled job, or persisted user data to roll back.
