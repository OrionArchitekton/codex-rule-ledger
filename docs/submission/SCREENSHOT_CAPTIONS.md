# Submission media order and captions

Use this order so the submission reads as product first, reusable local
contract second, and build corroboration third.

1. **Product UI:** `docs/assets/codex-rule-ledger-desktop.png`

   Case 001 turns a failed typecheck followed by completion into one
   `CONTRADICTED` row with linked evidence. The two-case selector, three-step
   tour, and `NOT_EVIDENCED` legend make the reviewer path visible at a glance.

2. **CLI receipt:** `docs/assets/cli-recorded-v0.2.png`

   Case 002's successful retry prevents a false contradiction. The same
   already-normalized bundle crosses the keyless local CLI and produces a
   six-record, digest-bound ledger.

3. **v0.2 CLI baseline provenance:** `docs/assets/build-provenance-v0.2.png`

   Corroborating build-continuity receipts for the v0.2 CLI baseline (PR #14,
   merge `ad00952`). PR #16's immutable reconciliation binds the final public
   explorer. Neither receipt attests authorship or transcript authenticity.

4. **Optional mobile view:** `docs/assets/codex-rule-ledger-mobile.png`

   The same two-case review desk at a mobile viewport, with the selector, tour,
   disclosure, and evidence legend stacked without horizontal overflow. Use
   only if the Devpost gallery has room after the three load-bearing images
   above.

Do not lead with the provenance card. Judges should first understand the
reviewer problem and the working product, then see the CLI generalization and
build evidence.
