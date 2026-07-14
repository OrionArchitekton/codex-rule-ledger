import { loadBuildWeekDemoFixture } from "../../../src/fixtures/build-week-demo";
import { runLedgerAudit } from "../../../src/ledger";
import { RecordedFixtureAnalyzer } from "../../../src/ledger/analyzers/recorded-fixture";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const fixture = loadBuildWeekDemoFixture();
  const execution = await runLedgerAudit(
    fixture.bundle,
    new RecordedFixtureAnalyzer(fixture.analysis),
  );

  if (
    execution.execution !== "COMPLETED" ||
    execution.audit.inputState !== "READY"
  ) {
    return Response.json(
      { error: "The repository-owned audit fixture failed closed." },
      { status: 500 },
    );
  }

  const publicAudit = {
    inputState: "READY" as const,
    provenance: execution.audit.provenance,
    chain: execution.audit.ledger.chain,
    discovery: execution.audit.ledger.discovery,
    records: execution.audit.ledger.records,
    analyzer: execution.audit.ledger.analyzer,
    ledger: execution.audit.ledger,
    ledgerDigest: execution.audit.ledgerDigest,
  };

  return Response.json(
    {
      fixture: {
        id: "build-week-demo-v1",
        title: "Validation drift",
        analyzerMode: "RECORDED",
      },
      execution: { execution: "COMPLETED", audit: publicAudit },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
