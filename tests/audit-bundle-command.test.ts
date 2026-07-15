import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

const execute = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("npm run --silent audit", () => {
  it("publishes a recorded ledger through the executable boundary", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rule-ledger-command-"));
    temporaryDirectories.push(directory);
    const outputPath = join(directory, "ledger.json");

    const { stdout, stderr } = await execute(
      "npm",
      [
        "run",
        "--silent",
        "audit",
        "--",
        "--bundle",
        resolve("fixtures/synthetic-retry-recovery-v1"),
        "--out",
        outputPath,
      ],
      {
        cwd: resolve("."),
        env: { ...process.env, OPENAI_API_KEY: "SECRET_CANARY" },
      },
    );

    expect(stdout).not.toContain("SECRET_CANARY");
    expect(stderr).toMatch(/ledgerDigest=[a-f0-9]{64}/);
    expect(JSON.parse(await readFile(outputPath, "utf8"))).toMatchObject({
      captureId: "synthetic-retry-recovery-v1",
      analyzer: { mode: "RECORDED" },
    });
  });

  it("keeps stdout parseable and rejects an argv key without echoing it", async () => {
    const { stdout, stderr } = await execute(
      "npm",
      [
        "run",
        "--silent",
        "audit",
        "--",
        "--bundle",
        resolve("fixtures/synthetic-retry-recovery-v1"),
        "--out",
        "-",
      ],
      { cwd: resolve(".") },
    );

    expect(JSON.parse(stdout)).toMatchObject({
      captureId: "synthetic-retry-recovery-v1",
    });
    expect(stderr).toMatch(/^ledgerDigest=[a-f0-9]{64}\n$/);

    let rejected: unknown;
    try {
      await execute(
        "npm",
        [
          "run",
          "--silent",
          "audit",
          "--",
          "--api-key",
          "SECRET_CANARY",
        ],
        { cwd: resolve(".") },
      );
    } catch (error) {
      rejected = error;
    }
    expect(rejected).toMatchObject({ code: 2 });
    const processError = rejected as { stderr: string; stdout: string };
    expect(processError.stdout).not.toContain("SECRET_CANARY");
    expect(processError.stderr).not.toContain("SECRET_CANARY");
  });

  it("rejects a named-pipe component without blocking", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rule-ledger-fifo-"));
    temporaryDirectories.push(directory);
    const bundleDirectory = join(directory, "bundle");
    await cp(resolve("fixtures/build-week-demo-v1"), bundleDirectory, {
      recursive: true,
    });
    const fifoPath = join(bundleDirectory, "session.json");
    await rm(fifoPath);
    await execute("mkfifo", [fifoPath]);

    let rejected: unknown;
    try {
      await execute(
        "npm",
        [
          "run",
          "--silent",
          "audit",
          "--",
          "--bundle",
          bundleDirectory,
          "--out",
          join(directory, "ledger.json"),
        ],
        { cwd: resolve("."), timeout: 2_000 },
      );
    } catch (error) {
      rejected = error;
    }

    expect(rejected).toMatchObject({ code: 3, killed: false });
  });
});
