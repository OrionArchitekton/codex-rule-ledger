import { loadReadyBuildWeekDemoAudit } from "../../../src/fixtures/ready-build-week-demo";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  let audit;
  try {
    audit = await loadReadyBuildWeekDemoAudit();
  } catch {
    return Response.json(
      { error: "The repository-owned audit fixture failed closed." },
      { status: 500 },
    );
  }

  const publicAudit = {
    inputState: "READY" as const,
    provenance: audit.provenance,
    chain: audit.ledger.chain,
    discovery: audit.ledger.discovery,
    records: audit.ledger.records,
    analyzer: audit.ledger.analyzer,
    ledger: audit.ledger,
    ledgerDigest: audit.ledgerDigest,
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
        "Cache-Control":
          "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
