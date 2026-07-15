import retryCaptureManifest from "../../fixtures/synthetic-retry-recovery-v1/capture-manifest.json";
import retryDiff from "../../fixtures/synthetic-retry-recovery-v1/diff.json";
import retrySemanticAnalysis from "../../fixtures/synthetic-retry-recovery-v1/semantic-analysis.json";
import retrySession from "../../fixtures/synthetic-retry-recovery-v1/session.json";
import {
  runLedgerAudit,
  type AuditOutcome,
  type ObligationRecord,
} from "../ledger";
import { RecordedFixtureAnalyzer } from "../ledger/analyzers/recorded-fixture";
import { captureBundleSchema } from "../ledger/schemas";
import { loadReadyBuildWeekDemoAudit } from "./ready-build-week-demo";

type ReadyAudit = Extract<AuditOutcome, { inputState: "READY" }>;
type PublicReadyAudit = Pick<ReadyAudit, "ledger" | "ledgerDigest">;

export interface PublicDemoCase {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly story: string;
  readonly disclosureLabel: "SYNTHETIC_SANITIZED";
  readonly disclosureNote: string;
  readonly initialRecordId: string;
  readonly tourFocus: string;
  readonly excludedSource?: {
    readonly displayPath: string;
    readonly reason: string;
  };
  readonly audit: PublicReadyAudit;
}

function recordId(record: ObligationRecord): string {
  return record.disposition === "EVALUATED"
    ? record.obligation.proposalId
    : record.proposalId;
}

function assertInitialRecord(demoCase: PublicDemoCase): PublicDemoCase {
  if (
    !demoCase.audit.ledger.records.some(
      (record) => recordId(record) === demoCase.initialRecordId,
    )
  ) {
    throw new Error(
      `The repository-owned ${demoCase.id} fixture has no truthful initial record.`,
    );
  }

  return demoCase;
}

async function loadReadyRetryRecoveryAudit(): Promise<ReadyAudit> {
  const bundle = captureBundleSchema.parse({
    ...retryCaptureManifest,
    ...retryDiff,
    ...retrySession,
  });
  const execution = await runLedgerAudit(
    bundle,
    new RecordedFixtureAnalyzer(
      retrySemanticAnalysis,
      "recorded:synthetic-retry-recovery-v1",
    ),
  );

  if (
    execution.execution !== "COMPLETED" ||
    execution.audit.inputState !== "READY"
  ) {
    throw new Error("The repository-owned retry-recovery fixture failed closed.");
  }

  return execution.audit;
}

export async function loadReadyPublicDemoCases(): Promise<
  readonly [PublicDemoCase, PublicDemoCase]
> {
  const [buildWeekAudit, retryRecoveryAudit] = await Promise.all([
    loadReadyBuildWeekDemoAudit(),
    loadReadyRetryRecoveryAudit(),
  ]);

  return [
    assertInitialRecord({
      id: "build-week-demo-v1",
      number: "Case 001",
      title: "Validation drift",
      story: "A completion claim follows a failed typecheck.",
      disclosureLabel: "SYNTHETIC_SANITIZED",
      disclosureNote:
        "Repository-owned synthetic case; not a captured real session.",
      initialRecordId: "typecheck-no-completion",
      tourFocus: "Open the contradicted typecheck rule",
      excludedSource: {
        displayPath: "$PROJECT_ROOT/apps/web/demo/AGENTS.md",
        reason: "Excluded at 164 B budget",
      },
      audit: {
        ledger: buildWeekAudit.ledger,
        ledgerDigest: buildWeekAudit.ledgerDigest,
      },
    }),
    assertInitialRecord({
      id: "synthetic-retry-recovery-v1",
      number: "Case 002",
      title: "Retry recovery",
      story: "An exact successful retry prevents a false contradiction.",
      disclosureLabel: "SYNTHETIC_SANITIZED",
      disclosureNote:
        "Repository-authored sanitized synthetic case; not a captured real session.",
      initialRecordId: "typecheck-recovery",
      tourFocus: "Inspect retry recovery without a false contradiction",
      audit: {
        ledger: retryRecoveryAudit.ledger,
        ledgerDigest: retryRecoveryAudit.ledgerDigest,
      },
    }),
  ];
}
