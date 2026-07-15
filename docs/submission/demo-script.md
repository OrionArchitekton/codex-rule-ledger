# Codex Rule Ledger v0.2 demo script

Final runtime: 2:57.219. Hard ceiling: 2:59. The shot plan drove the
repository-owned `agent-demo-video` pipeline. Each action block was captured as
a verified clip before the final compliant narration render. Local asset URLs were
served from the repository root during capture and do not appear in the video.

### SHOT problem
- target: dashboard
- narration: A code diff shows what an agent changed, but not which layered instructions governed the run or whether the session supports its validation claims. Codex Rule Ledger turns those supplied artifacts into an inspectable evidence ledger, always labeled as an unattested local capture.
- action: goto url="https://codex-rule-ledger.vercel.app/"
- action: wait ms=900
- action: highlight selector=".provenance-stamp"
- action: wait ms=900

### SHOT chain
- target: dashboard
- narration: The demo reconstructs one launch-time chain from global scope to the working directory. This synthetic case includes global and project guidance, a fallback, a deeper override, and a candidate excluded by the byte limit. It never invents missing history from today's filesystem.
- action: goto url="https://codex-rule-ledger.vercel.app/"
- action: wait ms=700
- action: highlight selector=".chain-panel"
- action: wait ms=700
- action: highlight selector=".chain-excluded"

### SHOT evidence
- target: dashboard
- narration: Each observable instruction gets a source-linked state. A successful test is supported. A failed typecheck followed by completion is contradicted by evidence. A missing build event is not evidenced, not failed. An untriggered documentation rule is not applicable, and subjective prose is declined. The inspector exposes the exact source and event anchors.
- action: goto url="https://codex-rule-ledger.vercel.app/"
- action: wait ms=650
- action: click selector=".ledger-list .ledger-row:nth-child(5)"
- action: highlight selector=".inspector-panel"
- action: wait ms=900
- action: click selector=".filter-bar button:nth-child(3)"
- action: highlight selector=".ledger-list"

### SHOT export
- target: dashboard
- narration: Export preserves every source, result, evidence link, input hash, and warning. The filename is bound to the canonical SHA-256 ledger digest. Those hashes bind supplied bytes after capture; they do not authenticate the capture, prove trusted time, or guarantee obedience.
- action: goto url="https://codex-rule-ledger.vercel.app/"
- action: wait ms=650
- action: highlight selector=".summary-digest"
- action: highlight selector=".provenance-footer"
- action: click selector=".export-button"
- action: wait ms=700

### SHOT cli
- target: dashboard
- narration: Version zero point two adds a local CLI for already-normalized Audit Bundles. Recorded analysis is the keyless default and never reads an API key. This second synthetic case crosses the same deterministic audit seam, produces six records across five outcome classes, writes a private no-clobber file, and proves the engine is not hard-coded to one topology.
- action: goto url="http://127.0.0.1:4178/docs/assets/cli-recorded-v0.2.html"
- action: wait ms=500
- action: highlight selector=".command"
- action: wait ms=600
- action: highlight selector=".receipt"
- action: highlight selector=".outcomes"
- action: highlight selector=".guard"

### SHOT provenance
- target: dashboard
- narration: Codex independently selected this problem, scoped both releases, and made the key architecture decision: GPT should understand instruction semantics, while deterministic code must own truth. It implemented each vertical test-driven slice, drove adversarial review repairs, deployed the keyless demo, and packaged this submission. Dan retained credentials, spend, eligibility, and publication authority. GPT-5.6 maps complete instruction lines into source-linked observable proposals; TypeScript owns discovery, hashes, evidence sufficiency, and every final verdict. Official feedback, metadata-only Langfuse, reviewed Git, green CI, and production receipts corroborate that workflow without attesting prompts, reasoning, or individual edits.
- action: goto url="http://127.0.0.1:4178/docs/assets/build-provenance-v0.2.svg"
- action: wait ms=500
- action: highlight selector="svg"
- action: wait ms=900

### SHOT close
- target: dashboard
- narration: Codex Rule Ledger does not promise compliance. It gives reviewers a compact, runnable account of what supplied evidence supports, what it contradicts, and what it cannot prove.
- action: goto url="https://codex-rule-ledger.vercel.app/"
- action: wait ms=650
- action: highlight selector=".provenance-footer"
- action: wait ms=900

## Recording acceptance

- Upload-ready artifact:
  `docs/assets/codex-rule-ledger-demo-v0.2.mp4`; checked caption companion:
  `docs/submission/codex-rule-ledger-demo-v0.2.srt`.
- Final MP4 is no longer than 2:59, has narration and checked captions, and
  uses only repository-owned visuals.
- The live product flow, contradiction inspector, export click, v0.2 CLI
  receipt, GPT-5.6 boundary, and provenance card are visible.
- No secrets, local absolute paths, private IDs other than the approved
  feedback thread ID, private code, copyrighted music, or unlicensed media
  appear.
- Captions preserve “unattested local capture,” “not evidenced,” GPT-5.6,
  and the distinction between corroboration and authorship attestation.
