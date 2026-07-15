import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("proof:gpt-live CLI", () => {
  it("starts successfully and fails before the API boundary when the key is absent", () => {
    const env = { ...process.env };
    delete env.OPENAI_API_KEY;

    const result = spawnSync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "proof:gpt-live", "--silent"],
      {
        cwd: process.cwd(),
        env,
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("OPENAI_API_KEY is required");
    expect(result.stderr).not.toContain(
      "Top-level await is currently not supported",
    );
  });
});
