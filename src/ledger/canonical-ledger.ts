import { createHash } from "node:crypto";
import { posix } from "node:path";

import type {
  CaptureBundleV1,
  EvidenceLedger,
  NonEmpty,
  ObligationRecord,
  ReconstructedInstruction,
  SemanticAnalysis,
  SourceLink,
} from "./contracts";
import { redactUntrustedValue } from "./redaction";

const PROVENANCE_WARNING =
  "This ledger is supported by supplied artifacts and is not an authenticity, trusted-time, or compliance attestation.";

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalize(entry)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}

function digest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

function logicalDirectory(
  directory: string,
  bundle: CaptureBundleV1,
): string {
  const normalized = posix.normalize(directory);
  const home = posix.normalize(bundle.codex.home);
  const root = posix.normalize(bundle.codex.projectRoot);

  if (normalized === home) return "$CODEX_HOME";
  if (normalized === root) return "$PROJECT_ROOT";
  const relative = posix.relative(root, normalized);
  if (relative !== "" && relative !== ".." && !relative.startsWith("../")) {
    return `$PROJECT_ROOT/${relative}`;
  }
  return `$CAPTURED_SCOPE/${digest(normalized).slice(0, 12)}`;
}

function sanitizeSourceLink(
  source: SourceLink,
  bundle: CaptureBundleV1,
): SourceLink {
  return {
    ...source,
    directory: logicalDirectory(source.directory, bundle),
  };
}

function mapNonEmpty<T, U>(
  values: NonEmpty<T>,
  transform: (value: T) => U,
): NonEmpty<U> {
  const [first, ...rest] = values;
  return [transform(first), ...rest.map(transform)];
}

function sanitizeRecord(
  record: ObligationRecord,
  bundle: CaptureBundleV1,
): ObligationRecord {
  if (record.disposition === "EVALUATED") {
    return {
      ...record,
      obligation: {
        ...record.obligation,
        source: mapNonEmpty(record.obligation.source, (source) =>
          sanitizeSourceLink(source, bundle),
        ),
      },
    };
  }
  return {
    ...record,
    source: mapNonEmpty(record.source, (source) =>
      sanitizeSourceLink(source, bundle),
    ),
  };
}

export function buildEvidenceLedger(
  bundle: CaptureBundleV1,
  chain: readonly ReconstructedInstruction[],
  discovery: EvidenceLedger["discovery"],
  records: readonly ObligationRecord[],
  analyzer: SemanticAnalysis["metadata"] & { id: string },
  analysis: SemanticAnalysis,
): { ledger: EvidenceLedger; ledgerDigest: string } {
  const rawLedger: EvidenceLedger = {
    schemaVersion: "1",
    captureId: bundle.captureId,
    captureDigest: digest(bundle),
    capturedAt: bundle.provenance.capturedAt,
    provenance: {
      level: bundle.provenance.level,
      warning: PROVENANCE_WARNING,
    },
    codexVersion: bundle.codex.version,
    chain: chain.map((source) => ({
      sourceId: source.sourceId,
      scope: source.scope,
      displayPath: `${logicalDirectory(source.directory, bundle)}/${source.filename}`,
      contentSha256: source.contentSha256,
      includedBytes: source.includedBytes,
      originalBytes: source.originalBytes,
      truncated: source.truncated,
    })),
    discovery,
    records: records.map((record) => sanitizeRecord(record, bundle)),
    analyzer,
    inputHashes: {
      eventCatalog: digest(bundle.events),
      changedPaths: digest(bundle.changedPaths),
      semanticAnalysis: digest(analysis),
    },
  };
  const boundarySafeLedger = redactUntrustedValue(rawLedger, [
    { captured: posix.normalize(bundle.codex.home), replacement: "$CODEX_HOME" },
    {
      captured: posix.normalize(bundle.codex.projectRoot),
      replacement: "$PROJECT_ROOT",
    },
  ]) as EvidenceLedger;

  // Preserve canonical key order in the in-memory value as well as the
  // serialized export so a plain browser JSON download hashes to the digest
  // displayed by the UI.
  const ledger = normalize(boundarySafeLedger) as EvidenceLedger;

  return { ledger, ledgerDigest: digest(ledger) };
}

export function serializeEvidenceLedger(ledger: EvidenceLedger): string {
  return canonicalJson(ledger);
}
