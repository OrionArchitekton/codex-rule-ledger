import { LedgerDemo } from "./components/ledger-demo";
import { loadReadyBuildWeekDemoAudit } from "../src/fixtures/ready-build-week-demo";

export const dynamic = "force-static";

export default async function HomePage() {
  const audit = await loadReadyBuildWeekDemoAudit();

  return (
    <LedgerDemo
      audit={{
        ledger: audit.ledger,
        ledgerDigest: audit.ledgerDigest,
      }}
    />
  );
}
