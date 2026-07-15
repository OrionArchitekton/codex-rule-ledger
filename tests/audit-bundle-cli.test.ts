import { createHash } from "node:crypto";
import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { runAuditBundleCli } from "../src/cli/audit-bundle";
import { parseSemanticAnalysis } from "../src/ledger/schemas";

const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "codex-rule-ledger-cli-"));
  temporaryDirectories.push(directory);
  return directory;
}

async function copiedFixture(): Promise<string> {
  const directory = await temporaryDirectory();
  const bundleDirectory = join(directory, "bundle");
  await cp(resolve("fixtures/build-week-demo-v1"), bundleDirectory, {
    recursive: true,
  });
  return bundleDirectory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("runAuditBundleCli", () => {
  it("writes the canonical ledger for a recorded normalized bundle", async () => {
    const outputDirectory = await temporaryDirectory();
    const outputPath = join(outputDirectory, "ledger.json");
    const result = await runAuditBundleCli([
      "--bundle",
      resolve("fixtures/build-week-demo-v1"),
      "--out",
      outputPath,
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");

    const output = await readFile(outputPath, "utf8");
    const outputDigest = createHash("sha256")
      .update(output, "utf8")
      .digest("hex");
    const ledger = JSON.parse(output) as {
      captureId: string;
      provenance: { level: string };
    };

    expect(ledger).toEqual(
      expect.objectContaining({
        captureId: "build-week-validation-drift-v1",
        provenance: expect.objectContaining({
          level: "LOCAL_CAPTURE_UNATTESTED",
        }),
      }),
    );
    expect(result.stderr).toBe(`ledgerDigest=${outputDigest}\n`);
    expect(output).not.toContain("/fixture/");
    expect((await stat(outputPath)).mode & 0o777).toBe(0o600);

    const repeatedPath = join(outputDirectory, "ledger-repeat.json");
    const repeated = await runAuditBundleCli([
      "--bundle",
      resolve("fixtures/build-week-demo-v1"),
      "--out",
      repeatedPath,
    ]);
    expect(repeated.exitCode).toBe(0);
    expect(await readFile(repeatedPath, "utf8")).toBe(output);
  });

  it.each([
    {
      name: "unknown component fields",
      mutate: async (bundleDirectory: string) => {
        const path = join(bundleDirectory, "capture-manifest.json");
        const value = JSON.parse(await readFile(path, "utf8")) as Record<
          string,
          unknown
        >;
        value.unexpected = "SECRET_CANARY";
        await writeFile(path, JSON.stringify(value));
      },
    },
    {
      name: "overlapping component fields",
      mutate: async (bundleDirectory: string) => {
        const path = join(bundleDirectory, "session.json");
        const value = JSON.parse(await readFile(path, "utf8")) as Record<
          string,
          unknown
        >;
        value.changedPaths = [];
        await writeFile(path, JSON.stringify(value));
      },
    },
    {
      name: "duplicate top-level JSON keys",
      mutate: async (bundleDirectory: string) => {
        await writeFile(
          join(bundleDirectory, "diff.json"),
          '{"changedPaths":["src/audit.ts"],"changedPaths":["src/audit.ts"],"validations":[]}',
        );
      },
    },
    {
      name: "duplicate nested JSON keys",
      mutate: async (bundleDirectory: string) => {
        const path = join(bundleDirectory, "capture-manifest.json");
        const contents = await readFile(path, "utf8");
        await writeFile(
          path,
          contents.replace(
            '"version": "0.144.0",',
            '"version": "0.144.0",\n    "version": "0.144.0",',
          ),
        );
      },
    },
    {
      name: "malformed JSON",
      mutate: async (bundleDirectory: string) => {
        await writeFile(
          join(bundleDirectory, "diff.json"),
          '{"changedPaths":["SECRET_CANARY"],',
        );
      },
    },
    {
      name: "excessive JSON nesting",
      mutate: async (bundleDirectory: string) => {
        await writeFile(join(bundleDirectory, "diff.json"), "{".repeat(65));
      },
    },
    {
      name: "invalid UTF-8",
      mutate: async (bundleDirectory: string) => {
        await writeFile(
          join(bundleDirectory, "diff.json"),
          Buffer.from([0x7b, 0x22, 0xff, 0x22, 0x3a, 0x31, 0x7d]),
        );
      },
    },
    {
      name: "missing components",
      mutate: async (bundleDirectory: string) => {
        await rm(join(bundleDirectory, "session.json"));
      },
    },
    {
      name: "symbolic-link components",
      mutate: async (bundleDirectory: string) => {
        const path = join(bundleDirectory, "diff.json");
        const target = join(bundleDirectory, "diff-target.json");
        await writeFile(target, '{"changedPaths":[],"validations":[]}');
        await rm(path);
        await symlink(target, path);
      },
    },
    {
      name: "oversized components",
      mutate: async (bundleDirectory: string) => {
        await writeFile(
          join(bundleDirectory, "session.json"),
          `{"events":[],"padding":"${"x".repeat(1_048_576)}"}`,
        );
      },
    },
    {
      name: "malformed recorded analysis",
      mutate: async (bundleDirectory: string) => {
        await writeFile(
          join(bundleDirectory, "semantic-analysis.json"),
          '{"proposals":["SECRET_CANARY"],',
        );
      },
    },
    {
      name: "symbolic-link recorded analysis",
      mutate: async (bundleDirectory: string) => {
        const path = join(bundleDirectory, "semantic-analysis.json");
        const target = join(bundleDirectory, "analysis-target.json");
        await writeFile(target, "{}");
        await rm(path);
        await symlink(target, path);
      },
    },
    {
      name: "oversized recorded analysis",
      mutate: async (bundleDirectory: string) => {
        await writeFile(
          join(bundleDirectory, "semantic-analysis.json"),
          `{"padding":"${"x".repeat(1_048_576)}"}`,
        );
      },
    },
  ])("fails closed for $name", async ({ mutate }) => {
    const bundleDirectory = await copiedFixture();
    const outputPath = join(await temporaryDirectory(), "ledger.json");
    await mutate(bundleDirectory);

    const result = await runAuditBundleCli([
      "--bundle",
      bundleDirectory,
      "--out",
      outputPath,
    ]);

    expect(result.exitCode).toBe(3);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toContain("SECRET_CANARY");
    await expect(readFile(outputPath, "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it.each([
    { name: "missing required options", argv: [] },
    { name: "unknown options", argv: ["--unknown"] },
    { name: "positional arguments", argv: ["bundle"] },
    {
      name: "repeated options",
      argv: [
        "--bundle",
        "first",
        "--bundle",
        "second",
        "--out",
        "ledger.json",
      ],
    },
    {
      name: "API keys in arguments",
      argv: ["--api-key", "SECRET_CANARY"],
    },
  ])("returns a safe usage error for $name", async ({ argv }) => {
    const result = await runAuditBundleCli(argv);

    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(result.stderr).not.toContain("SECRET_CANARY");
  });

  it("writes canonical output to stdout only when --out is a dash", async () => {
    const result = await runAuditBundleCli([
      "--bundle",
      resolve("fixtures/build-week-demo-v1"),
      "--out",
      "-",
    ]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      captureId: "build-week-validation-drift-v1",
    });
    expect(result.stderr).toMatch(/^ledgerDigest=[a-f0-9]{64}\n$/);
  });

  it("never clobbers an existing output or leaves a temporary file", async () => {
    const outputDirectory = await temporaryDirectory();
    const outputPath = join(outputDirectory, "ledger.json");
    await writeFile(outputPath, "sentinel", { mode: 0o600 });

    const result = await runAuditBundleCli([
      "--bundle",
      resolve("fixtures/build-week-demo-v1"),
      "--out",
      outputPath,
    ]);

    expect(result).toMatchObject({ exitCode: 5, stdout: "" });
    expect(await readFile(outputPath, "utf8")).toBe("sentinel");
    expect(await readdir(outputDirectory)).toEqual(["ledger.json"]);
  });

  it("rejects an output whose parent directory does not exist", async () => {
    const outputDirectory = await temporaryDirectory();
    const outputPath = join(outputDirectory, "missing", "ledger.json");

    const result = await runAuditBundleCli([
      "--bundle",
      resolve("fixtures/build-week-demo-v1"),
      "--out",
      outputPath,
    ]);

    expect(result).toEqual({
      exitCode: 5,
      stdout: "",
      stderr: "output rejected\n",
    });
    expect(await readdir(outputDirectory)).toEqual([]);
  });

  it("rejects an output whose parent is a regular file", async () => {
    const outputDirectory = await temporaryDirectory();
    const parentPath = join(outputDirectory, "parent");
    await writeFile(parentPath, "sentinel", { mode: 0o600 });

    const result = await runAuditBundleCli([
      "--bundle",
      resolve("fixtures/build-week-demo-v1"),
      "--out",
      join(parentPath, "ledger.json"),
    ]);

    expect(result).toEqual({
      exitCode: 5,
      stdout: "",
      stderr: "output rejected\n",
    });
    expect(await readdir(outputDirectory)).toEqual(["parent"]);
    expect(await readFile(parentPath, "utf8")).toBe("sentinel");
  });

  it("keeps recorded mode keyless and never constructs a live analyzer", async () => {
    const outputPath = join(await temporaryDirectory(), "ledger.json");
    const createLiveAnalyzer = vi.fn(() => {
      throw new Error("live analyzer must not be constructed");
    });
    const env = new Proxy(
      {},
      {
        get() {
          throw new Error("environment must not be read in recorded mode");
        },
      },
    );

    const result = await runAuditBundleCli(
      [
        "--bundle",
        resolve("fixtures/build-week-demo-v1"),
        "--out",
        outputPath,
      ],
      { createLiveAnalyzer, env },
    );

    expect(result.exitCode).toBe(0);
    expect(createLiveAnalyzer).not.toHaveBeenCalled();
  });

  it("rejects a stale recorded input digest without publishing output", async () => {
    const bundleDirectory = await copiedFixture();
    const analysisPath = join(bundleDirectory, "semantic-analysis.json");
    const analysis = JSON.parse(await readFile(analysisPath, "utf8")) as {
      metadata: { inputDigest: string };
    };
    analysis.metadata.inputDigest = "0".repeat(64);
    await writeFile(analysisPath, JSON.stringify(analysis));
    const outputPath = join(await temporaryDirectory(), "ledger.json");

    const result = await runAuditBundleCli([
      "--bundle",
      bundleDirectory,
      "--out",
      outputPath,
    ]);

    expect(result).toMatchObject({ exitCode: 3, stdout: "" });
    await expect(readFile(outputPath, "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("fails --live without an environment key before analyzer construction", async () => {
    const outputPath = join(await temporaryDirectory(), "ledger.json");
    const createLiveAnalyzer = vi.fn();

    const result = await runAuditBundleCli(
      [
        "--bundle",
        resolve("fixtures/build-week-demo-v1"),
        "--out",
        outputPath,
        "--live",
      ],
      { createLiveAnalyzer, env: {} },
    );

    expect(result).toMatchObject({ exitCode: 4, stdout: "" });
    expect(createLiveAnalyzer).not.toHaveBeenCalled();
    await expect(readFile(outputPath, "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("rejects an unavailable live output before key access or analyzer construction", async () => {
    const outputDirectory = await temporaryDirectory();
    const outputPath = join(outputDirectory, "ledger.json");
    await writeFile(outputPath, "sentinel", { mode: 0o600 });
    const createLiveAnalyzer = vi.fn();
    const env = new Proxy(
      {},
      {
        get() {
          throw new Error("key must not be read for unavailable output");
        },
      },
    );

    const result = await runAuditBundleCli(
      [
        "--bundle",
        resolve("fixtures/build-week-demo-v1"),
        "--out",
        outputPath,
        "--live",
      ],
      { createLiveAnalyzer, env },
    );

    expect(result).toMatchObject({ exitCode: 5, stdout: "" });
    expect(createLiveAnalyzer).not.toHaveBeenCalled();
    expect(await readFile(outputPath, "utf8")).toBe("sentinel");
  });

  it("rejects an insufficient live bundle before reading the key or constructing an analyzer", async () => {
    const bundleDirectory = await copiedFixture();
    const manifestPath = join(bundleDirectory, "capture-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      codex: { launchWorkingDirectory: string };
    };
    manifest.codex.launchWorkingDirectory = "";
    await writeFile(manifestPath, JSON.stringify(manifest));
    const createLiveAnalyzer = vi.fn();
    const env = new Proxy(
      {},
      {
        get() {
          throw new Error("key must not be read for insufficient input");
        },
      },
    );

    const result = await runAuditBundleCli(
      ["--bundle", bundleDirectory, "--out", "-", "--live"],
      { createLiveAnalyzer, env },
    );

    expect(result).toMatchObject({ exitCode: 3, stdout: "" });
    expect(createLiveAnalyzer).not.toHaveBeenCalled();
  });

  it("binds one live analyzer to the validated bundle digest", async () => {
    const recorded = JSON.parse(
      await readFile(
        resolve("fixtures/build-week-demo-v1/semantic-analysis.json"),
        "utf8",
      ),
    ) as {
      metadata: Record<string, unknown>;
      [key: string]: unknown;
    };
    const liveAnalysis = parseSemanticAnalysis({
      ...recorded,
      metadata: {
        ...recorded.metadata,
        mode: "LIVE",
        model: "gpt-5.6",
        responseId: "resp_cli_live_test",
        inputTokens: 10,
        outputTokens: 20,
      },
    });
    const analyze = vi.fn(async () => structuredClone(liveAnalysis));
    const createLiveAnalyzer = vi.fn(() => ({
      id: "openai:gpt-5.6:semantic-obligations-v2",
      analyze,
    }));

    const result = await runAuditBundleCli(
      [
        "--bundle",
        resolve("fixtures/build-week-demo-v1"),
        "--out",
        "-",
        "--live",
      ],
      {
        createLiveAnalyzer,
        env: { OPENAI_API_KEY: "SECRET_CANARY" },
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain("SECRET_CANARY");
    expect(result.stderr).not.toContain("SECRET_CANARY");
    expect(createLiveAnalyzer).toHaveBeenCalledOnce();
    expect(createLiveAnalyzer).toHaveBeenCalledWith({
      apiKey: "SECRET_CANARY",
      allowedInputDigest:
        "1b2d24559d4fa8cee0a1f46d13a6d2ee7fc58a4c605d2fe9caf234d371870752",
    });
    expect(analyze).toHaveBeenCalledOnce();
    expect(JSON.parse(result.stdout)).toMatchObject({
      analyzer: { mode: "LIVE", model: "gpt-5.6" },
    });
  });

  it("fails a live analyzer error closed without leaking its message", async () => {
    const analyze = vi.fn(async () => {
      throw new Error("SECRET_CANARY upstream failure");
    });

    const result = await runAuditBundleCli(
      [
        "--bundle",
        resolve("fixtures/build-week-demo-v1"),
        "--out",
        "-",
        "--live",
      ],
      {
        createLiveAnalyzer: () => ({ id: "test-live", analyze }),
        env: { OPENAI_API_KEY: "SECRET_CANARY" },
      },
    );

    expect(result).toMatchObject({ exitCode: 4, stdout: "" });
    expect(result.stderr).not.toContain("SECRET_CANARY");
    expect(analyze).toHaveBeenCalledOnce();
  });

  it("audits a second synthetic topology with retry-safe mixed outcomes", async () => {
    const result = await runAuditBundleCli([
      "--bundle",
      resolve("fixtures/synthetic-retry-recovery-v1"),
      "--out",
      "-",
    ]);

    expect(result.exitCode).toBe(0);
    const ledger = JSON.parse(result.stdout) as {
      analyzer: { id: string };
      captureDigest: string;
      chain: { sourceId: string }[];
      records: {
        disposition: string;
        finding?: { result: string };
      }[];
    };
    expect(ledger.analyzer.id).toBe(
      "recorded:synthetic-retry-recovery-v1",
    );
    expect(ledger.chain.map(({ sourceId }) => sourceId)).toEqual([
      "global-override",
      "packages-fallback",
      "cli-agents",
    ]);
    expect(
      ledger.records.map((record) =>
        record.disposition === "EVALUATED"
          ? record.finding?.result
          : record.disposition,
      ),
    ).toEqual([
      "HUMAN_REVIEW_REQUIRED",
      "NOT_APPLICABLE",
      "NOT_EVIDENCED",
      "SUPPORTED",
      "DECLINED_NON_OBSERVABLE",
      "NOT_EVIDENCED",
    ]);

    const first = await runAuditBundleCli([
      "--bundle",
      resolve("fixtures/build-week-demo-v1"),
      "--out",
      "-",
    ]);
    expect(ledger.captureDigest).not.toBe(
      (JSON.parse(first.stdout) as { captureDigest: string }).captureDigest,
    );
  });
});
