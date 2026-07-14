import {
  runLedgerAudit,
  type AuditOutcome,
} from "../ledger";
import { RecordedFixtureAnalyzer } from "../ledger/analyzers/recorded-fixture";
import { loadBuildWeekDemoFixture } from "./build-week-demo";

type ReadyAudit = Extract<AuditOutcome, { inputState: "READY" }>;

export async function loadReadyBuildWeekDemoAudit(): Promise<ReadyAudit> {
  const fixture = loadBuildWeekDemoFixture();
  const execution = await runLedgerAudit(
    fixture.bundle,
    new RecordedFixtureAnalyzer(fixture.analysis),
  );

  if (
    execution.execution !== "COMPLETED" ||
    execution.audit.inputState !== "READY"
  ) {
    throw new Error("The repository-owned demo fixture failed closed.");
  }

  return execution.audit;
}
