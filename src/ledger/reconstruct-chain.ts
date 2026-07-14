import { posix } from "node:path";

import type {
  CaptureBundleV1,
  DiscoveryDecision,
  InstructionCandidate,
  InstructionScope,
  ReconstructedInstruction,
} from "./contracts";

const PRIMARY_FILENAMES = ["AGENTS.override.md", "AGENTS.md"] as const;

export interface Reconstruction {
  chain: readonly ReconstructedInstruction[];
  discovery: readonly DiscoveryDecision[];
}

function orderedProjectDirectories(root: string, cwd: string): string[] {
  const normalizedRoot = posix.normalize(root);
  const normalizedCwd = posix.normalize(cwd);
  const relative = posix.relative(normalizedRoot, normalizedCwd);

  if (relative === "") {
    return [normalizedRoot];
  }

  const directories = [normalizedRoot];
  let cursor = normalizedRoot;
  for (const segment of relative.split("/")) {
    cursor = posix.join(cursor, segment);
    directories.push(cursor);
  }
  return directories;
}

function candidatesInPrecedenceOrder(
  scope: InstructionScope,
  fallbackFilenames: readonly string[],
): InstructionCandidate[] {
  const names =
    scope.kind === "GLOBAL"
      ? [...PRIMARY_FILENAMES]
      : [
          ...PRIMARY_FILENAMES,
          ...fallbackFilenames.filter(
            (name, index, all) =>
              name !== "" &&
              !PRIMARY_FILENAMES.includes(
                name as (typeof PRIMARY_FILENAMES)[number],
              ) &&
              all.indexOf(name) === index,
          ),
        ];
  const byFilename = new Map(
    scope.candidates.map((candidate) => [candidate.filename, candidate]),
  );
  return names.flatMap((name) => {
    const candidate = byFilename.get(name);
    return candidate ? [candidate] : [];
  });
}

function selectGlobal(
  scope: InstructionScope,
  fallbackFilenames: readonly string[],
): {
  selected?: Extract<InstructionCandidate, { status: "PRESENT" }>;
  decisions: DiscoveryDecision[];
} {
  const decisions: DiscoveryDecision[] = [];
  let selected: Extract<InstructionCandidate, { status: "PRESENT" }> | undefined;

  for (const candidate of candidatesInPrecedenceOrder(scope, fallbackFilenames)) {
    if (selected) {
      decisions.push({
        candidateId: candidate.candidateId,
        decision: "EXCLUDED",
        reason: "LOWER_PRECEDENCE",
      });
    } else if (
      candidate.status === "PRESENT" &&
      candidate.content.trim() === ""
    ) {
      decisions.push({
        candidateId: candidate.candidateId,
        decision: "EXCLUDED",
        reason: "EMPTY",
      });
    } else if (candidate.status === "PRESENT") {
      selected = candidate;
    } else {
      decisions.push({
        candidateId: candidate.candidateId,
        decision: "EXCLUDED",
        reason: candidate.status,
      });
    }
  }

  return { selected, decisions };
}

function selectProject(
  scope: InstructionScope,
  fallbackFilenames: readonly string[],
): {
  selected?: Extract<InstructionCandidate, { status: "PRESENT" }>;
  decisions: DiscoveryDecision[];
} {
  const decisions: DiscoveryDecision[] = [];
  let occupied = false;
  let selected: Extract<InstructionCandidate, { status: "PRESENT" }> | undefined;

  for (const candidate of candidatesInPrecedenceOrder(scope, fallbackFilenames)) {
    if (occupied) {
      decisions.push({
        candidateId: candidate.candidateId,
        decision: "EXCLUDED",
        reason: "LOWER_PRECEDENCE",
      });
    } else if (candidate.status === "ABSENT") {
      decisions.push({
        candidateId: candidate.candidateId,
        decision: "EXCLUDED",
        reason: "ABSENT",
      });
    } else if (
      candidate.status === "EMPTY" ||
      (candidate.status === "PRESENT" && candidate.content.trim() === "")
    ) {
      occupied = true;
      decisions.push({
        candidateId: candidate.candidateId,
        decision: "EXCLUDED",
        reason: "EMPTY",
      });
    } else {
      occupied = true;
      selected = candidate;
    }
  }

  return { selected, decisions };
}

function includeSource(
  scope: InstructionScope,
  candidate: Extract<InstructionCandidate, { status: "PRESENT" }>,
  remainingBytes?: number,
): {
  source?: ReconstructedInstruction;
  decision: DiscoveryDecision;
  usedBytes: number;
} {
  if (remainingBytes === 0) {
    return {
      decision: {
        candidateId: candidate.candidateId,
        decision: "EXCLUDED",
        reason: "BYTE_LIMIT_REACHED",
      },
      usedBytes: 0,
    };
  }

  const original = Buffer.from(candidate.content, "utf8");
  const included =
    remainingBytes === undefined ? original : original.subarray(0, remainingBytes);
  const content = included.toString("utf8");
  const truncated = included.length < original.length;

  return {
    source: {
      sourceId: candidate.candidateId,
      scope: scope.kind,
      directory: scope.directory,
      filename: candidate.filename,
      content,
      contentSha256: candidate.sha256,
      originalBytes: original.length,
      includedBytes: included.length,
      truncated,
    },
    decision: {
      candidateId: candidate.candidateId,
      decision: "SELECTED",
      includedBytes: included.length,
      truncated,
    },
    usedBytes: included.length,
  };
}

export function reconstructInstructionChain(
  bundle: CaptureBundleV1,
): Reconstruction {
  const chain: ReconstructedInstruction[] = [];
  const discovery: DiscoveryDecision[] = [];
  const byKey = new Map(
    bundle.instructionScopes.map((scope) => [
      `${scope.kind}:${posix.normalize(scope.directory)}`,
      scope,
    ]),
  );

  const global = byKey.get(`GLOBAL:${posix.normalize(bundle.codex.home)}`);
  if (global) {
    const selection = selectGlobal(global, bundle.codex.fallbackFilenames);
    discovery.push(...selection.decisions);
    if (selection.selected) {
      const included = includeSource(global, selection.selected);
      discovery.push(included.decision);
      if (included.source) chain.push(included.source);
    }
  }

  let remainingBytes = bundle.codex.projectDocMaxBytes;
  for (const directory of orderedProjectDirectories(
    bundle.codex.projectRoot,
    bundle.codex.launchWorkingDirectory,
  )) {
    const scope = byKey.get(`PROJECT:${directory}`);
    if (!scope) continue;

    const selection = selectProject(scope, bundle.codex.fallbackFilenames);
    discovery.push(...selection.decisions);
    if (!selection.selected) continue;

    const included = includeSource(scope, selection.selected, remainingBytes);
    discovery.push(included.decision);
    if (included.source) chain.push(included.source);
    remainingBytes = Math.max(0, remainingBytes - included.usedBytes);
  }

  return { chain, discovery };
}
