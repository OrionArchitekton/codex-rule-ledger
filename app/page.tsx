import { LedgerDemo } from "./components/ledger-demo";
import { loadReadyPublicDemoCases } from "../src/fixtures/ready-public-demo-cases";

export const dynamic = "force-static";

export default async function HomePage() {
  const cases = await loadReadyPublicDemoCases();

  return <LedgerDemo cases={cases} />;
}
