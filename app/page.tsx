import { LedgerDemo } from "./components/ledger-demo";
import { loadBuildWeekDemoFixture } from "../src/fixtures/build-week-demo";
import { runLedgerAudit } from "../src/ledger";
import { RecordedFixtureAnalyzer } from "../src/ledger/analyzers/recorded-fixture";

export const dynamic = "force-static";

export default async function HomePage() {
  const fixture = loadBuildWeekDemoFixture();
  const execution = await runLedgerAudit(
    fixture.bundle,
    new RecordedFixtureAnalyzer(fixture.analysis),
  );

  if (
    execution.execution !== "COMPLETED" ||
    execution.audit.inputState !== "READY"
  ) {
    throw new Error("The disclosed demo fixture failed closed.");
  }

  return (
    <LedgerDemo
      audit={{
        ledger: execution.audit.ledger,
        ledgerDigest: execution.audit.ledgerDigest,
      }}
    />
  );
}
