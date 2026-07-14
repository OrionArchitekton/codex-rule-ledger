import { createHash } from "node:crypto";

import { canonicalJson } from "./canonical-ledger";
import type {
  CaptureBundleV1,
  ReconstructedInstruction,
  SemanticAnalysisInput,
} from "./contracts";

export function buildSemanticAnalysisInput(
  bundle: CaptureBundleV1,
  chain: readonly ReconstructedInstruction[],
): SemanticAnalysisInput {
  return {
    captureId: bundle.captureId,
    chain,
    task: bundle.task,
    changedPaths: bundle.changedPaths,
    events: bundle.events,
    validations: bundle.validations,
  };
}

export function digestSemanticAnalysisInput(
  input: SemanticAnalysisInput,
): string {
  return createHash("sha256")
    .update(canonicalJson(input), "utf8")
    .digest("hex");
}
