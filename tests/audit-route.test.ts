import { describe, expect, it } from "vitest";

import { GET } from "../app/api/audit/route";

describe("GET /api/audit", () => {
  it("serves only the repository-owned fixture outcome with bounded alias caching", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
    );
    expect(payload).toEqual(
      expect.objectContaining({
        fixture: {
          id: "build-week-demo-v1",
          title: "Validation drift",
          analyzerMode: "RECORDED",
        },
        execution: expect.objectContaining({ execution: "COMPLETED" }),
      }),
    );
    expect(payload.execution.audit.inputState).toBe("READY");
    expect(payload.execution.audit.records).toHaveLength(5);
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("OPENAI_API_KEY");
    expect(serialized).not.toContain("/fixture/home");
    expect(serialized).not.toContain("/fixture/workspace");
    expect(serialized).not.toContain('"content":');
    expect(payload.execution.audit.chain[0]).toEqual(
      expect.objectContaining({ displayPath: "$CODEX_HOME/AGENTS.md" }),
    );
  });
});
