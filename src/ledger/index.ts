import type {
  AuditExecution,
  CaptureBundleV1,
  SemanticAnalyzer,
} from "./contracts";
import {
  adjudicate,
  InvalidSemanticAnalysisError,
} from "./adjudicate";
import {
  buildEvidenceLedger,
  serializeEvidenceLedger,
} from "./canonical-ledger";
import { reconstructInstructionChain } from "./reconstruct-chain";
import { semanticCoverageIssues } from "./semantic-coverage";
import {
  buildSemanticAnalysisInput,
  digestSemanticAnalysisInput,
} from "./semantic-input";
import { validateCaptureBundle } from "./validate-bundle";

export type * from "./contracts";
export {
  buildSemanticAnalysisInput,
  digestSemanticAnalysisInput,
  serializeEvidenceLedger,
};

export async function runLedgerAudit(
  bundle: CaptureBundleV1,
  analyzer: SemanticAnalyzer,
): Promise<AuditExecution> {
  const issues = validateCaptureBundle(bundle);
  if (issues.length > 0) {
    return {
      execution: "COMPLETED",
      audit: {
        inputState: "INSUFFICIENT_INPUT",
        provenance: bundle.provenance.level,
        issues,
      },
    };
  }

  const reconstruction = reconstructInstructionChain(bundle);

  try {
    const semanticInput = buildSemanticAnalysisInput(
      bundle,
      reconstruction.chain,
    );
    const analysis = await analyzer.analyze(semanticInput);
    const expectedInputDigest = digestSemanticAnalysisInput(semanticInput);
    if (analysis.metadata.inputDigest !== expectedInputDigest) {
      throw new InvalidSemanticAnalysisError(
        "Semantic analysis input digest does not match the reconstructed audit input.",
      );
    }
    const coverageIssues = semanticCoverageIssues(semanticInput, analysis);
    if (coverageIssues.length > 0) {
      throw new InvalidSemanticAnalysisError(coverageIssues.join("; "));
    }
    const records = adjudicate(bundle, reconstruction.chain, analysis);
    const analyzerMetadata = { id: analyzer.id, ...analysis.metadata };
    const { ledger, ledgerDigest } = buildEvidenceLedger(
      bundle,
      reconstruction.chain,
      reconstruction.discovery,
      records,
      analyzerMetadata,
      analysis,
    );

    return {
      execution: "COMPLETED",
      audit: {
        inputState: "READY",
        provenance: bundle.provenance.level,
        chain: reconstruction.chain,
        discovery: reconstruction.discovery,
        records,
        analyzer: analyzerMetadata,
        ledger,
        ledgerDigest,
      },
    };
  } catch (error) {
    return {
      execution: "FAILED",
      error: {
        code:
          error instanceof InvalidSemanticAnalysisError
            ? "INVALID_ANALYZER_OUTPUT"
            : "ANALYZER_FAILURE",
        message: error instanceof Error ? error.message : "Semantic analysis failed",
      },
    };
  }
}
