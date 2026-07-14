import { createHash } from "node:crypto";
import { posix } from "node:path";

import type {
  CaptureBundleV1,
  InputIssue,
  InstructionScope,
} from "./contracts";

const PRIMARY_FILENAMES = ["AGENTS.override.md", "AGENTS.md"] as const;
const SUPPORTED_CODEX_VERSION = "0.144.0";

function expectedFilenames(
  scope: InstructionScope,
  fallbackFilenames: readonly string[],
): readonly string[] {
  if (scope.kind === "GLOBAL") return PRIMARY_FILENAMES;

  return [
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
}

function digest(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function expectedScopeKeys(bundle: CaptureBundleV1): readonly string[] {
  const home = posix.normalize(bundle.codex.home);
  const root = posix.normalize(bundle.codex.projectRoot);
  const cwd = posix.normalize(bundle.codex.launchWorkingDirectory);
  const relative = posix.relative(root, cwd);
  const projectDirectories = [root];

  if (relative !== "" && relative !== ".." && !relative.startsWith("../")) {
    let cursor = root;
    for (const segment of relative.split("/")) {
      cursor = posix.join(cursor, segment);
      projectDirectories.push(cursor);
    }
  }

  return [
    `GLOBAL:${home}`,
    ...projectDirectories.map((directory) => `PROJECT:${directory}`),
  ];
}

export function validateCaptureBundle(
  bundle: CaptureBundleV1,
): readonly InputIssue[] {
  const issues: InputIssue[] = [];
  const seenScopeKeys = new Set<string>();
  const seenCandidateIds = new Set<string>();
  const seenEventIds = new Set<string>();
  const seenEventSequences = new Set<number>();

  if (bundle.codex.version !== SUPPORTED_CODEX_VERSION) {
    issues.push({
      code: "UNSUPPORTED_CODEX_VERSION",
      field: "codex.version",
      message: `v0.1 demonstrates discovery fidelity only for Codex ${SUPPORTED_CODEX_VERSION}.`,
    });
  }

  for (const [field, value] of [
    ["codex.home", bundle.codex.home],
    ["codex.projectRoot", bundle.codex.projectRoot],
    ["codex.launchWorkingDirectory", bundle.codex.launchWorkingDirectory],
  ] as const) {
    if (value !== "" && !posix.isAbsolute(value)) {
      issues.push({
        code: "UNSUPPORTED_PATH_PLATFORM",
        field,
        message: "v0.1 supports POSIX absolute launch-capture paths only.",
      });
    }
  }

  if (bundle.codex.launchWorkingDirectory.trim() === "") {
    issues.push({
      code: "MISSING_LAUNCH_WORKING_DIRECTORY",
      field: "codex.launchWorkingDirectory",
      message:
        "The supplied launch capture does not identify the launch working directory.",
    });
  } else {
    const root = posix.normalize(bundle.codex.projectRoot);
    const cwd = posix.normalize(bundle.codex.launchWorkingDirectory);
    const relative = posix.relative(root, cwd);
    if (relative === ".." || relative.startsWith("../")) {
      issues.push({
        code: "LAUNCH_DIRECTORY_OUTSIDE_PROJECT_ROOT",
        field: "codex.launchWorkingDirectory",
        message:
          "The supplied launch working directory is outside the captured project root.",
      });
    }
  }

  const suppliedScopeKeys = new Set<string>();
  for (const scope of bundle.instructionScopes) {
    const scopeKey = `${scope.kind}:${posix.normalize(scope.directory)}`;
    if (seenScopeKeys.has(scopeKey)) {
      issues.push({
        code: "DUPLICATE_INSTRUCTION_SCOPE",
        field: `instructionScopes[${scopeKey}]`,
        message: `The capture contains more than one ${scopeKey} instruction scope.`,
      });
    }
    seenScopeKeys.add(scopeKey);
    suppliedScopeKeys.add(scopeKey);

    for (const candidate of scope.candidates) {
      if (seenCandidateIds.has(candidate.candidateId)) {
        issues.push({
          code: "DUPLICATE_CANDIDATE_ID",
          field: `instructionCandidates[${candidate.candidateId}]`,
          message: `The instruction candidate ID ${candidate.candidateId} is not unique.`,
        });
      }
      seenCandidateIds.add(candidate.candidateId);
    }
  }
  for (const scopeKey of expectedScopeKeys(bundle)) {
    if (!suppliedScopeKeys.has(scopeKey)) {
      issues.push({
        code: "MISSING_INSTRUCTION_SCOPE",
        field: `instructionScopes[${scopeKey}]`,
        message: `The capture does not inventory the required ${scopeKey} instruction scope.`,
      });
    }
  }

  for (const scope of bundle.instructionScopes) {
    const candidatesByFilename = new Map(
      scope.candidates.map((candidate) => [candidate.filename, candidate]),
    );
    for (const filename of expectedFilenames(
      scope,
      bundle.codex.fallbackFilenames,
    )) {
      if (!candidatesByFilename.has(filename)) {
        issues.push({
          code: "INCOMPLETE_CANDIDATE_INVENTORY",
          field: `instructionScopes[${scope.kind}:${scope.directory}].${filename}`,
          message: `The capture does not say whether ${filename} was present, absent, or empty in this scope.`,
        });
      }
    }

    for (const candidate of scope.candidates) {
      if (
        candidate.status === "PRESENT" &&
        digest(candidate.content) !== candidate.sha256.toLowerCase()
      ) {
        issues.push({
          code: "CONTENT_HASH_MISMATCH",
          field: `instructionCandidates[${candidate.candidateId}].sha256`,
          message: `The supplied content for ${candidate.filename} does not match its recorded SHA-256 digest.`,
        });
      }
    }
  }

  for (const event of bundle.events) {
    if (seenEventIds.has(event.eventId)) {
      issues.push({
        code: "DUPLICATE_EVENT_ID",
        field: `events[${event.eventId}]`,
        message: `The normalized event ID ${event.eventId} is not unique.`,
      });
    }
    seenEventIds.add(event.eventId);

    if (seenEventSequences.has(event.sequence)) {
      issues.push({
        code: "DUPLICATE_EVENT_SEQUENCE",
        field: `events.sequence[${event.sequence}]`,
        message: `The normalized event sequence ${event.sequence} is not unique.`,
      });
    }
    seenEventSequences.add(event.sequence);
  }

  return issues.sort(
    (left, right) =>
      left.field.localeCompare(right.field) || left.code.localeCompare(right.code),
  );
}
