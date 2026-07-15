# YouTube upload packet

This packet prepares the participant-held public upload. Do not publish until
the participant has reviewed the final video and supplied the required
eligibility attestations.

## Title

Codex Rule Ledger | Evidence-bound audits for Codex runs | OpenAI Build Week

## Description

For staff engineers, platform teams, and security reviewers deciding whether
to accept, investigate, or block an agent-produced change pending evidence.

A diff shows what an agent changed, but not which instruction chain a supplied
Codex launch capture reconstructs or whether the captured session supports the
run's validation claims. Codex Rule Ledger turns an already-normalized
launch-and-session bundle into a source-linked ledger of support,
contradiction, missing evidence, inapplicability, and declined non-observable
instructions.

Rather than asking only whether a rule passed, Rule Ledger first asks whether
the supplied evidence makes any verdict admissible. Missing evidence is neither
failure nor compliance.

Judge it in 60 seconds:

1. Open the keyless demo on Case 001 and read its instruction chain.
2. Inspect the contradicted typecheck rule and its linked events.
3. Switch to Case 002 for retry recovery, then export its digest-bound ledger.

Codex independently selected and scoped the problem, implemented the vertical
test-driven slices, drove adversarial review repair, deployed the keyless demo,
and packaged the submission. In live mode, GPT-5.6 maps complete instruction
lines into typed, source-linked semantic proposals. Deterministic TypeScript
owns input validation, instruction discovery, hashes, evidence sufficiency,
and every final ledger state.

The public demo exposes exactly two repository-owned recorded synthetic cases:
no account, API key, upload, or private repository is required. The video
follows the unchanged default Case 001 flow; the live selector now also exposes
the existing retry-recovery case. v0.2 includes a local CLI for the same
already-normalized bundle contract.

Live demo: https://codex-rule-ledger.vercel.app

Source and judge instructions:
https://github.com/OrionArchitekton/codex-rule-ledger

Build and release proof:
https://github.com/OrionArchitekton/codex-rule-ledger/blob/main/docs/submission/release-proof.md

Primary Codex `/feedback` session ID:
`019f5dda-3975-70b3-abc0-2f18d72c3aea`

OpenAI Build Week, Developer Tools track.

## Chapters

```text
00:00 The review problem
00:19 Reconstructed instruction chain
00:38 Evidence states and inspector
01:04 Digest-bound export
01:25 Keyless v0.2 CLI and second case
01:50 Codex, GPT-5.6, and the deterministic verdict boundary
02:46 The reviewer decision
```

## Upload settings and checks

- Visibility: **Public**. Unlisted does not satisfy the event requirement.
- Video: `docs/assets/codex-rule-ledger-demo-v0.2.mp4`
- Captions: `docs/submission/codex-rule-ledger-demo-v0.2.srt`
- Thumbnail: choose a clean 16:9 frame from the opening product-UI shot. Keep
  the ledger legible and do not overlay unsupported claims; the tall desktop
  screenshot should not be uploaded without a deliberate crop.
- Category: Science & Technology.
- Audience setting: not made for kids.
- License: Standard YouTube License unless the participant deliberately chooses
  otherwise.
- No copyrighted music, third-party footage, secrets, raw traces, private IDs,
  or unsupported enforcement claims appear in the reviewed video.
- After upload, watch the public URL while logged out, confirm 1080p processing
  and captions, then replace `[PUBLIC_YOUTUBE_URL]` in the Devpost draft.

## Pinned comment

Try the keyless demo in under a minute: inspect Case 001's contradicted
typecheck rule, switch to Case 002's retry recovery, and export either
digest-bound ledger. https://codex-rule-ledger.vercel.app
