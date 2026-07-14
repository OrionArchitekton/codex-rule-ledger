# Security Policy

## Supported surface

The supported v0.1 surface is the repository-owned synthetic fixture and its
read-only audit UI. Arbitrary repository ingestion, trace upload, URL fetching,
command execution, authentication, persistence, and public live-model calls are
not supported.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository. Do not attach
real Codex traces, source archives, environment dumps, API keys, access tokens,
or customer data to a public issue.

Include the affected commit, the smallest synthetic reproduction, expected and
actual behavior, and impact. Maintainers will acknowledge a report when it is
triaged; no response-time guarantee is implied for this hackathon v0.1.

## Data and model boundary

- The public demo invokes only a recorded analyzer over a fixed synthetic
  fixture.
- An OpenAI credential must remain server-side and scoped to the dedicated
  project/config admitted for this product.
- Live analysis is restricted to an exact fixture digest and bounded request;
  it has no tools, retries, arbitrary input, or raw path transmission.
- Logs and proof artifacts must retain response metadata only, never secrets or
  raw private trace content.
- A content digest is integrity binding, not proof of source authenticity or
  trusted time.

If any boundary above changes, threat-model and document the new ingestion,
retention, authorization, abuse, spend, and deletion controls before release.
