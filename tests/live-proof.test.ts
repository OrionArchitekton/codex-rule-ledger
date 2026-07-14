import { describe, expect, it, vi } from "vitest";

import { loadBuildWeekDemoFixture } from "../src/fixtures/build-week-demo";
import { executeBuildWeekLiveProof } from "../src/ledger/live-proof";

describe("executeBuildWeekLiveProof", () => {
  it("runs one GPT-5.6 request over the allowlisted fixture and returns metadata-only proof", async () => {
    const fixture = loadBuildWeekDemoFixture();
    const parse = vi.fn().mockResolvedValue({
      id: "resp_live_build_week_proof",
      output: [],
      output_parsed: {
        proposals: fixture.analysis.proposals,
        sourceCoverage: fixture.analysis.sourceCoverage,
      },
      usage: { input_tokens: 777, output_tokens: 222 },
    });

    const proof = await executeBuildWeekLiveProof({
      apiKey: "test-only-not-sent",
      client: { responses: { parse } },
      now: () => new Date("2026-07-13T21:00:00.000Z"),
    });

    expect(parse).toHaveBeenCalledOnce();
    expect(proof).toEqual(
      expect.objectContaining({
        schemaVersion: "1",
        generatedAt: "2026-07-13T21:00:00.000Z",
        model: "gpt-5.6",
        promptVersion: "semantic-obligations-v1",
        inputDigest: fixture.analysis.metadata.inputDigest,
        responseId: "resp_live_build_week_proof",
        inputTokens: 777,
        outputTokens: 222,
        proposalCount: 5,
        sourceCoverageCount: 4,
        ledgerDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
        semanticAnalysisDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    const serialized = JSON.stringify(proof);
    expect(serialized).not.toContain("test-only-not-sent");
    expect(serialized).not.toContain("/fixture/");
    expect(serialized).not.toContain('"proposals"');
  });
});
