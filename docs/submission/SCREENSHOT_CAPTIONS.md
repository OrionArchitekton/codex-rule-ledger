# Submission media order and captions

Use this order so the submission reads as product first, reusable local
contract second, and build corroboration third.

1. **Product UI:** `docs/assets/codex-rule-ledger-desktop.png`

   A story-labeled selector exposes two disclosed recorded cases above the
   three-step judge tour. Case 001 shows the reconstructed instruction chain,
   four evidence results, the `NOT_EVIDENCED` legend, and linked inspector.

2. **CLI receipt:** `docs/assets/cli-recorded-v0.2.png`

   The same Case 002 topology now visible in the browser crosses the local CLI
   in keyless recorded mode, producing six records across supported,
   not-evidenced, not-applicable, declined, and human-review classes.

3. **Build provenance:** `docs/assets/build-provenance-v0.2.png`

   Corroborating `/feedback`, Git, CI, deployment, and metadata-only Langfuse
   receipts. This card documents the disclosed workflow; it is not an
   authorship or transcript attestation.

4. **Optional mobile view:** `docs/assets/codex-rule-ledger-mobile.png`

   The same two-case review desk at a mobile viewport, with the selector, tour,
   disclosure, and evidence legend stacked without horizontal overflow. Use
   only if the Devpost gallery has room after the three load-bearing images
   above.

Do not lead with the provenance card. Judges should first understand the
reviewer problem and the working product, then see the CLI generalization and
build evidence.
