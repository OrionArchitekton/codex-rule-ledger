import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { link, lstat, open, unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { parseArgs } from "node:util";

import { RecordedFixtureAnalyzer } from "../ledger/analyzers/recorded-fixture";
import { createOpenAIResponsesAnalyzer } from "../ledger/analyzers/openai-responses";
import {
  buildSemanticAnalysisInput,
  digestSemanticAnalysisInput,
  runLedgerAudit,
  serializeEvidenceLedger,
} from "../ledger";
import type {
  CaptureBundleV1,
  SemanticAnalysis,
  SemanticAnalyzer,
} from "../ledger/contracts";
import { reconstructInstructionChain } from "../ledger/reconstruct-chain";
import {
  captureBundleSchema,
  parseSemanticAnalysis,
} from "../ledger/schemas";
import { validateCaptureBundle } from "../ledger/validate-bundle";

const MAX_COMPONENT_BYTES = 1_048_576;
const MAX_JSON_DEPTH = 64;

const captureManifestSchema = captureBundleSchema
  .pick({
    schemaVersion: true,
    captureId: true,
    provenance: true,
    codex: true,
    instructionScopes: true,
    task: true,
  })
  .strict();
const diffSchema = captureBundleSchema
  .pick({ changedPaths: true, validations: true })
  .strict();
const sessionSchema = captureBundleSchema.pick({ events: true }).strict();

export interface CliRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface LoadedBundle {
  bundle: CaptureBundleV1;
  semanticAnalysis?: SemanticAnalysis;
}

export interface AuditBundleCliDependencies {
  env?: Readonly<Record<string, string | undefined>>;
  createLiveAnalyzer?: (options: {
    apiKey: string;
    allowedInputDigest: string;
  }) => SemanticAnalyzer;
}

async function readBoundedJson(
  bundleDirectory: string,
  filename: string,
): Promise<unknown> {
  const path = join(bundleDirectory, filename);
  let file;
  try {
    file = await open(
      path,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > MAX_COMPONENT_BYTES) {
      throw new Error("component is not a bounded regular file");
    }
    const bytes = Buffer.allocUnsafe(MAX_COMPONENT_BYTES + 1);
    let bytesRead = 0;
    while (bytesRead < bytes.length) {
      const result = await file.read(
        bytes,
        bytesRead,
        bytes.length - bytesRead,
        null,
      );
      if (result.bytesRead === 0) break;
      bytesRead += result.bytesRead;
    }
    if (bytesRead > MAX_COMPONENT_BYTES) {
      throw new Error("component exceeds its byte bound");
    }
    const contents = new TextDecoder("utf-8", { fatal: true }).decode(
      bytes.subarray(0, bytesRead),
    );
    assertUniqueJsonKeys(contents);
    return JSON.parse(contents) as unknown;
  } catch {
    throw new Error(`bundle component rejected: ${filename}`);
  } finally {
    await file?.close();
  }
}

function assertUniqueJsonKeys(contents: string): void {
  const stack: ({ kind: "ARRAY" } | { kind: "OBJECT"; keys: Set<string> })[] =
    [];

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];
    if (character === '"') {
      let end = index + 1;
      let escaped = false;
      for (; end < contents.length; end += 1) {
        const current = contents[end];
        if (escaped) {
          escaped = false;
        } else if (current === "\\") {
          escaped = true;
        } else if (current === '"') {
          break;
        }
      }
      if (end >= contents.length) return;

      let cursor = end + 1;
      while (/\s/u.test(contents[cursor] ?? "")) cursor += 1;
      const frame = stack.at(-1);
      if (frame?.kind === "OBJECT" && contents[cursor] === ":") {
        const key = JSON.parse(contents.slice(index, end + 1)) as string;
        if (frame.keys.has(key)) throw new Error("duplicate JSON key");
        frame.keys.add(key);
      }
      index = end;
    } else if (character === "{") {
      if (stack.length >= MAX_JSON_DEPTH) {
        throw new Error("JSON nesting exceeds its depth bound");
      }
      stack.push({ kind: "OBJECT", keys: new Set() });
    } else if (character === "[") {
      if (stack.length >= MAX_JSON_DEPTH) {
        throw new Error("JSON nesting exceeds its depth bound");
      }
      stack.push({ kind: "ARRAY" });
    } else if (character === "}" || character === "]") {
      stack.pop();
    }
  }
}

async function loadBundle(
  bundleDirectory: string,
  includeRecordedAnalysis: boolean,
): Promise<LoadedBundle> {
  const [captureManifestInput, diffInput, sessionInput, semanticAnalysisInput] =
    await Promise.all([
      readBoundedJson(bundleDirectory, "capture-manifest.json"),
      readBoundedJson(bundleDirectory, "diff.json"),
      readBoundedJson(bundleDirectory, "session.json"),
      includeRecordedAnalysis
        ? readBoundedJson(bundleDirectory, "semantic-analysis.json")
        : Promise.resolve(undefined),
    ]);

  try {
    const captureManifest = captureManifestSchema.parse(captureManifestInput);
    const diff = diffSchema.parse(diffInput);
    const session = sessionSchema.parse(sessionInput);
    const loaded: LoadedBundle = {
      bundle: captureBundleSchema.parse({
        ...captureManifest,
        ...diff,
        ...session,
      }),
    };
    if (includeRecordedAnalysis) {
      loaded.semanticAnalysis = parseSemanticAnalysis(semanticAnalysisInput);
    }
    return loaded;
  } catch {
    throw new Error("bundle schema rejected");
  }
}

async function publishNoClobber(path: string, contents: string): Promise<void> {
  const temporaryPath = join(
    dirname(path),
    `.${basename(path)}.tmp-${randomUUID()}`,
  );
  let file;
  try {
    file = await open(temporaryPath, "wx", 0o600);
    await file.writeFile(contents, { encoding: "utf8" });
    await file.sync();
    await file.close();
    file = undefined;
    await link(temporaryPath, path);
  } finally {
    await file?.close();
    await unlink(temporaryPath).catch(() => undefined);
  }
}

async function outputPathIsAvailable(path: string): Promise<boolean> {
  try {
    if (!(await lstat(dirname(path))).isDirectory()) return false;
  } catch {
    return false;
  }

  try {
    await lstat(path);
    return false;
  } catch (error) {
    if (!(
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    )) return false;
  }

  const probePath = join(
    dirname(path),
    `.${basename(path)}.probe-${randomUUID()}`,
  );
  const probeLinkPath = `${probePath}.link`;
  let probe;
  try {
    probe = await open(probePath, "wx", 0o600);
    await probe.close();
    probe = undefined;
    await link(probePath, probeLinkPath);
    return true;
  } catch {
    return false;
  } finally {
    await probe?.close();
    await unlink(probeLinkPath).catch(() => undefined);
    await unlink(probePath).catch(() => undefined);
  }
}

export async function runAuditBundleCli(
  argv: readonly string[],
  dependencies: AuditBundleCliDependencies = {},
): Promise<CliRunResult> {
  let values;
  try {
    ({ values } = parseArgs({
      args: [...argv],
      allowPositionals: false,
      options: {
        bundle: { type: "string" },
        out: { type: "string" },
        live: { type: "boolean" },
      },
      strict: true,
    }));
  } catch {
    return { exitCode: 2, stdout: "", stderr: "usage error\n" };
  }
  if (!values.bundle || !values.out) {
    return { exitCode: 2, stdout: "", stderr: "usage error\n" };
  }
  const bundleOptionCount = argv.filter(
    (argument) => argument === "--bundle" || argument.startsWith("--bundle="),
  ).length;
  const outOptionCount = argv.filter(
    (argument) => argument === "--out" || argument.startsWith("--out="),
  ).length;
  const liveOptionCount = argv.filter(
    (argument) => argument === "--live" || argument.startsWith("--live="),
  ).length;
  if (
    bundleOptionCount !== 1 ||
    outOptionCount !== 1 ||
    liveOptionCount > 1
  ) {
    return { exitCode: 2, stdout: "", stderr: "usage error\n" };
  }
  const live = values.live === true;

  let loaded: LoadedBundle;
  try {
    loaded = await loadBundle(values.bundle, !live);
  } catch (error) {
    return {
      exitCode: 3,
      stdout: "",
      stderr: `${error instanceof Error ? error.message : "bundle rejected"}\n`,
    };
  }

  if (validateCaptureBundle(loaded.bundle).length > 0) {
    return { exitCode: 3, stdout: "", stderr: "audit input rejected\n" };
  }
  if (values.out !== "-" && !(await outputPathIsAvailable(values.out))) {
    return { exitCode: 5, stdout: "", stderr: "output rejected\n" };
  }

  let analyzer: SemanticAnalyzer;
  if (live) {
    const apiKey = (dependencies.env ?? process.env).OPENAI_API_KEY;
    if (!apiKey?.trim()) {
      return { exitCode: 4, stdout: "", stderr: "live key required\n" };
    }
    const reconstruction = reconstructInstructionChain(loaded.bundle);
    const semanticInput = buildSemanticAnalysisInput(
      loaded.bundle,
      reconstruction.chain,
    );
    try {
      analyzer = (
        dependencies.createLiveAnalyzer ?? createOpenAIResponsesAnalyzer
      )({
        apiKey,
        allowedInputDigest: digestSemanticAnalysisInput(semanticInput),
      });
    } catch {
      return { exitCode: 4, stdout: "", stderr: "live analyzer rejected\n" };
    }
  } else {
    if (!loaded.semanticAnalysis || loaded.semanticAnalysis.metadata.mode !== "RECORDED") {
      return { exitCode: 3, stdout: "", stderr: "recorded analysis rejected\n" };
    }
    analyzer = new RecordedFixtureAnalyzer(
      loaded.semanticAnalysis,
      `recorded:${loaded.bundle.captureId}`,
    );
  }

  const execution = await runLedgerAudit(
    loaded.bundle,
    analyzer,
  );
  if (
    execution.execution !== "COMPLETED" ||
    execution.audit.inputState !== "READY"
  ) {
    return {
      exitCode: live ? 4 : 3,
      stdout: "",
      stderr: live ? "live analysis rejected\n" : "audit input rejected\n",
    };
  }

  const output = serializeEvidenceLedger(execution.audit.ledger);
  const outputDigest = createHash("sha256").update(output, "utf8").digest("hex");
  if (outputDigest !== execution.audit.ledgerDigest) {
    return { exitCode: 1, stdout: "", stderr: "internal digest error\n" };
  }
  if (values.out === "-") {
    return {
      exitCode: 0,
      stdout: output,
      stderr: `ledgerDigest=${execution.audit.ledgerDigest}\n`,
    };
  }
  try {
    await publishNoClobber(values.out, output);
  } catch {
    return { exitCode: 5, stdout: "", stderr: "output rejected\n" };
  }
  return {
    exitCode: 0,
    stdout: "",
    stderr: `ledgerDigest=${execution.audit.ledgerDigest}\n`,
  };
}
