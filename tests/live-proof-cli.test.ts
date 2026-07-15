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
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain("OPENAI_API_KEY is required");
    expect(output).not.toContain("Top-level await is currently not supported");
  });
});
