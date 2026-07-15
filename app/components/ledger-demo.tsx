"use client";

import { useMemo, useState } from "react";

import type {
  AuditOutcome,
  EvidenceLink,
  ObligationRecord,
} from "../../src/ledger";
import type { PublicDemoCase } from "../../src/fixtures/ready-public-demo-cases";

type ReadyAudit = Extract<AuditOutcome, { inputState: "READY" }>;
type Filter = "ALL" | "EVALUATED" | "EXCEPTIONS";

const RESULT_LABELS = {
  SUPPORTED: "Supported",
  CONTRADICTED: "Contradicted",
  NOT_EVIDENCED: "Not evidenced",
  NOT_APPLICABLE: "Not applicable",
} as const;

function recordId(record: ObligationRecord): string {
  return record.disposition === "EVALUATED"
    ? record.obligation.proposalId
    : record.proposalId;
}

function recordTitle(record: ObligationRecord): string {
  return record.disposition === "EVALUATED"
    ? record.obligation.normalizedRule
    : record.source[0].quote;
}

function recordSource(record: ObligationRecord) {
  return record.disposition === "EVALUATED"
    ? record.obligation.source
    : record.source;
}

function recordStatus(record: ObligationRecord): string {
  if (record.disposition === "EVALUATED") return record.finding.result;
  return record.disposition;
}

function statusLabel(record: ObligationRecord): string {
  if (record.disposition === "EVALUATED") {
    return RESULT_LABELS[record.finding.result];
  }
  return record.disposition === "DECLINED_NON_OBSERVABLE"
    ? "Declined"
    : "Human review";
}

function evidenceFor(record: ObligationRecord): readonly EvidenceLink[] {
  if (record.disposition !== "EVALUATED") return [];
  if (record.finding.result === "SUPPORTED") return record.finding.supporting;
  if (record.finding.result === "CONTRADICTED") {
    return record.finding.contradicting;
  }
  if (record.finding.result === "NOT_APPLICABLE") {
    return record.finding.nonTrigger;
  }
  return [];
}

function belongsToFilter(record: ObligationRecord, filter: Filter): boolean {
  if (filter === "ALL") return true;
  if (filter === "EVALUATED") return record.disposition === "EVALUATED";
  return (
    record.disposition !== "EVALUATED" ||
    record.finding.result === "CONTRADICTED" ||
    record.finding.result === "NOT_EVIDENCED"
  );
}

function shortDigest(value: string): string {
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

export function LedgerDemo({
  cases,
}: {
  cases: readonly [PublicDemoCase, PublicDemoCase];
}) {
  const [activeCaseId, setActiveCaseId] = useState(cases[0].id);
  const activeCase =
    cases.find((demoCase) => demoCase.id === activeCaseId) ?? cases[0];
  const audit: Pick<ReadyAudit, "ledger" | "ledgerDigest"> = activeCase.audit;
  const records = audit.ledger.records;
  const initial =
    records.find((record) => recordId(record) === activeCase.initialRecordId) ??
    records[0];
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState(cases[0].initialRecordId);
  const visibleRecords = useMemo(
    () => records.filter((record) => belongsToFilter(record, filter)),
    [filter, records],
  );
  const selected =
    records.find((record) => recordId(record) === selectedId) ?? initial;

  const counts = useMemo(
    () =>
      records.reduce<Record<string, number>>((current, record) => {
        const key = recordStatus(record);
        current[key] = (current[key] ?? 0) + 1;
        return current;
      }, {}),
    [records],
  );

  function selectCase(demoCase: PublicDemoCase) {
    setActiveCaseId(demoCase.id);
    setFilter("ALL");
    setSelectedId(demoCase.initialRecordId);
  }

  function exportLedger() {
    const body = `${JSON.stringify(audit.ledger, null, 2)}\n`;
    const blob = new Blob([body], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `codex-rule-ledger-${audit.ledgerDigest.slice(0, 12)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  return (
    <main className="site-shell">
      <div className="top-rule" aria-hidden="true" />
      <header className="masthead">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            RL
          </span>
          <div>
            <p className="brand-name">Codex Rule Ledger</p>
            <p className="brand-subline">Evidence desk / Build Week 2026</p>
          </div>
        </div>
        <div className="edition-block">
          <span>{activeCase.number}</span>
          <span>{activeCase.title}</span>
        </div>
      </header>

      <section className="case-explorer" aria-label="Recorded cases">
        <div className="case-explorer-heading">
          <span>Recorded case index</span>
          <p>Two keyless audits. Same deterministic contract.</p>
        </div>
        <div className="case-selector">
          {cases.map((demoCase) => {
            const selectedCase = demoCase.id === activeCase.id;
            return (
              <button
                aria-label={`${demoCase.number}: ${demoCase.title}`}
                aria-pressed={selectedCase}
                className={selectedCase ? "case-option case-option-active" : "case-option"}
                key={demoCase.id}
                onClick={() => selectCase(demoCase)}
                type="button"
              >
                <span>{demoCase.number}</span>
                <strong>{demoCase.title}</strong>
                <small>{demoCase.story}</small>
              </button>
            );
          })}
        </div>
        <div className="case-disclosure" aria-live="polite">
          <strong>{activeCase.disclosureLabel}</strong>
          <span>{activeCase.disclosureNote}</span>
        </div>
      </section>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-title-block">
          <p className="kicker">Captured instructions, mechanically adjudicated</p>
          <h1 id="page-title">Codex Rule Ledger</h1>
        </div>
        <div className="hero-copy">
          <p className="dek">
            Reconstruct the instruction chain once. Split observable rules from
            subjective prose. Follow every result back to the supplied event.
          </p>
          <div className="provenance-stamp">
            <span className="stamp-dot" aria-hidden="true" />
            <span>
              Provenance
              <strong>LOCAL_CAPTURE_UNATTESTED</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="summary-rail" aria-label="Audit summary">
        <div className="summary-cell summary-primary">
          <span>Audit input</span>
          <strong>READY</strong>
        </div>
        <div className="summary-cell">
          <span>Selected chain</span>
          <strong>{audit.ledger.chain.length} sources</strong>
        </div>
        <div className="summary-cell">
          <span>Evaluated</span>
          <strong>
            {records.filter((record) => record.disposition === "EVALUATED").length}{" "}
            rules
          </strong>
        </div>
        <div className="summary-cell summary-digest">
          <span>Ledger SHA-256</span>
          <code>{shortDigest(audit.ledgerDigest)}</code>
        </div>
      </section>

      <section
        aria-label="Three-step judge tour"
        className="judge-tour"
        role="region"
      >
        <div className="judge-tour-heading">
          <span>Fast path</span>
          <h2>Judge it in 60 seconds</h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <p>Read the reconstructed instruction chain</p>
          </li>
          <li>
            <span>02</span>
            <p>{activeCase.tourFocus}</p>
          </li>
          <li>
            <span>03</span>
            <p>Export the digest-bound ledger</p>
          </li>
        </ol>
      </section>

      <section
        aria-label="Outcome legend"
        className="outcome-legend"
        role="region"
      >
        <div className="outcome-legend-heading">
          <span>Verdict key</span>
          <strong>Evidence decides admissibility</strong>
        </div>
        <dl>
          <div>
            <dt className="status-supported">Supported</dt>
            <dd>Affirmative supporting evidence.</dd>
          </div>
          <div>
            <dt className="status-contradicted">Contradicted</dt>
            <dd>Affirmative conflicting evidence.</dd>
          </div>
          <div className="legend-not-evidenced">
            <dt className="status-not_evidenced">Not evidenced</dt>
            <dd>
              Neither failure nor compliance; the supplied evidence cannot
              support either verdict.
            </dd>
          </div>
          <div>
            <dt className="status-not_applicable">Not applicable</dt>
            <dd>The trigger affirmatively did not occur.</dd>
          </div>
        </dl>
      </section>

      <div className="desk-grid">
        <section className="chain-panel" aria-labelledby="chain-heading">
          <div className="panel-heading">
            <div>
              <span className="panel-index">01</span>
              <h2 id="chain-heading">Instruction chain</h2>
            </div>
            <span className="panel-note">Root → launch CWD</span>
          </div>
          <ol className="chain-list">
            {audit.ledger.chain.map((source, index) => (
              <li className="chain-entry" key={source.sourceId}>
                <span className="chain-node" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="scope-label">{source.scope}</span>
                  <code>{source.displayPath}</code>
                  <span className="source-meta">
                    {source.includedBytes} B · {source.contentSha256.slice(0, 8)}
                  </span>
                </div>
              </li>
            ))}
            {activeCase.excludedSource ? (
              <li className="chain-entry chain-excluded">
                <span className="chain-node" aria-hidden="true">
                  ×
                </span>
                <div>
                  <span className="scope-label">BYTE LIMIT</span>
                  <code>{activeCase.excludedSource.displayPath}</code>
                  <span className="source-meta">
                    {activeCase.excludedSource.reason}
                  </span>
                </div>
              </li>
            ) : null}
          </ol>
          <p className="chain-caption">
            One chain, captured at launch. No per-file instruction fiction.
          </p>
        </section>

        <section className="ledger-panel" aria-labelledby="ledger-heading">
          <div className="panel-heading ledger-heading-row">
            <div>
              <span className="panel-index">02</span>
              <h2 id="ledger-heading">Obligation ledger</h2>
            </div>
            <span className="panel-note">{records.length} extracted</span>
          </div>
          <div className="filter-bar" aria-label="Filter obligations">
            {(["ALL", "EVALUATED", "EXCEPTIONS"] as const).map((value) => (
              <button
                aria-pressed={filter === value}
                className={filter === value ? "filter-active" : ""}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {value === "ALL"
                  ? "All"
                  : value === "EVALUATED"
                    ? "Evaluated"
                    : "Exceptions"}
              </button>
            ))}
          </div>
          <div className="ledger-list" aria-live="polite">
            {visibleRecords.map((record, index) => {
              const id = recordId(record);
              const source = recordSource(record)[0];
              const selectedRow = selectedId === id;
              return (
                <button
                  aria-pressed={selectedRow}
                  className={`ledger-row ${selectedRow ? "ledger-row-selected" : ""}`}
                  key={id}
                  onClick={() => setSelectedId(id)}
                  type="button"
                >
                  <span className="record-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="record-copy">
                    <strong>{recordTitle(record)}</strong>
                    <span>
                      {source.directory}/{source.filename}
                    </span>
                  </span>
                  <span
                    className={`status-chip status-${recordStatus(record).toLowerCase()}`}
                  >
                    {statusLabel(record)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="ledger-totals" aria-label="Result totals">
            <span>
              <i className="total-dot dot-supported" /> {counts.SUPPORTED ?? 0} supported
            </span>
            <span>
              <i className="total-dot dot-contradicted" /> {counts.CONTRADICTED ?? 0}{" "}
              contradicted
            </span>
            <span>
              <i className="total-dot dot-open" /> {counts.NOT_EVIDENCED ?? 0} open
            </span>
          </div>
        </section>

        <section
          aria-label="Evidence inspector"
          className="inspector-panel"
          role="region"
        >
          <div className="panel-heading inspector-heading">
            <div>
              <span className="panel-index">03</span>
              <h2>Evidence inspector</h2>
            </div>
            <span className="live-indicator">
              <i aria-hidden="true" /> bound
            </span>
          </div>
          {selected ? (
            <div className="inspector-body">
              <div className="inspector-status-row">
                <span
                  className={`status-chip status-${recordStatus(selected).toLowerCase()}`}
                >
                  {statusLabel(selected)}
                </span>
                <code>{recordId(selected)}</code>
              </div>
              <h3>{recordTitle(selected)}</h3>

              <div className="inspector-section">
                <p className="section-label">Instruction source</p>
                {recordSource(selected).map((source) => (
                  <figure className="source-quote" key={source.sourceId}>
                    <figcaption>
                      {source.directory}/{source.filename}
                    </figcaption>
                    <blockquote>{source.quote}</blockquote>
                  </figure>
                ))}
              </div>

              {selected.disposition === "EVALUATED" &&
              selected.finding.result === "NOT_EVIDENCED" ? (
                <div className="inspector-section missing-evidence">
                  <p className="section-label">Evidence search</p>
                  <p>{selected.finding.search.explanation}</p>
                  <strong>Absence is not proof of non-action.</strong>
                  <code>
                    events {selected.finding.search.sequenceRange.first ?? "∅"}–
                    {selected.finding.search.sequenceRange.last ?? "∅"}
                  </code>
                </div>
              ) : null}

              {evidenceFor(selected).length > 0 ? (
                <div className="inspector-section">
                  <p className="section-label">Linked evidence</p>
                  <ol className="evidence-list">
                    {evidenceFor(selected).map((evidence) => (
                      <li key={evidence.evidenceId}>
                        <span className="evidence-glyph" aria-hidden="true">
                          {evidence.kind === "EVENT" ? "↳" : "◇"}
                        </span>
                        <div>
                          <code>{evidence.evidenceId}</code>
                          <p>{evidence.label}</p>
                          {evidence.kind === "EVENT" ? (
                            <span>sequence {evidence.sequence}</span>
                          ) : (
                            <span>{evidence.paths.join(", ") || "No matching path"}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {selected.disposition !== "EVALUATED" ? (
                <div className="inspector-section disposition-note">
                  <p className="section-label">Disposition</p>
                  <p>
                    This instruction is {selected.reason.toLowerCase().replaceAll("_", " ")}.
                    It never enters the four-state result machine.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <section className="provenance-footer" aria-label="Provenance boundary">
        <div>
          <span className="footer-index">Boundary note</span>
          <p>{audit.ledger.provenance.warning}</p>
        </div>
        <button className="export-button" onClick={exportLedger} type="button">
          Export ledger <span aria-hidden="true">↗</span>
        </button>
      </section>

      <footer className="site-footer">
        <span>Open source · MIT</span>
        <span>GPT-5.6 semantic path · public demo uses recorded analysis</span>
        <span>Evidence, not compliance.</span>
      </footer>
    </main>
  );
}
