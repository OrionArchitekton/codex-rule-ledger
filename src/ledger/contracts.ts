export type ProvenanceLevel = "LOCAL_CAPTURE_UNATTESTED";
export type NonEmpty<T> = readonly [T, ...T[]];

export type InstructionCandidate =
  | {
      candidateId: string;
      filename: string;
      status: "PRESENT";
      content: string;
      sha256: string;
    }
  | {
      candidateId: string;
      filename: string;
      status: "EMPTY";
      content: "";
    }
  | {
      candidateId: string;
      filename: string;
      status: "ABSENT";
    };

export interface InstructionScope {
  kind: "GLOBAL" | "PROJECT";
  directory: string;
  candidates: readonly InstructionCandidate[];
}

export interface CaptureBundleV1 {
  schemaVersion: "1";
  captureId: string;
  provenance: {
    level: ProvenanceLevel;
    capturedAt: string;
  };
  codex: {
    version: string;
    home: string;
    projectRoot: string;
    launchWorkingDirectory: string;
    fallbackFilenames: readonly string[];
    projectDocMaxBytes: number;
  };
  instructionScopes: readonly InstructionScope[];
  task: { text: string };
  changedPaths: readonly string[];
  events: readonly NormalizedEvent[];
  validations: readonly unknown[];
}

export type NormalizedEvent =
  | {
      eventId: string;
      sequence: number;
      kind: "COMMAND_FINISHED";
      command: string;
      exitCode: number;
    }
  | {
      eventId: string;
      sequence: number;
      kind: "COMPLETION_CLAIM";
      text: string;
    };

export type SemanticProposal =
  | {
      kind: "EVALUABLE";
      proposalId: string;
      sourceIds: NonEmpty<string>;
      normalizedRule: string;
      trigger:
        | { kind: "ALWAYS" }
        | { kind: "CHANGED_PATH_MATCHES"; exactPath: string };
      assertion:
        | {
            kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION";
            exactCommand: string;
          }
        | {
            kind: "NO_COMPLETION_AFTER_COMMAND_FAILED";
            exactCommand: string;
          };
    }
  | {
      kind: "DECLINE";
      proposalId: string;
      sourceIds: NonEmpty<string>;
      reason: "SUBJECTIVE" | "UNBOUNDED" | "NON_OBSERVABLE";
    }
  | {
      kind: "HUMAN_REVIEW";
      proposalId: string;
      sourceIds: NonEmpty<string>;
      reason: "AMBIGUOUS" | "CONFLICTING";
    };

export interface SemanticAnalysis {
  proposals: readonly SemanticProposal[];
  sourceCoverage: readonly {
    sourceId: string;
    contentSha256: string;
    proposalIds: readonly string[];
    quotes: readonly { proposalId: string; quote: string }[];
  }[];
  metadata: {
    mode: "RECORDED" | "LIVE";
    promptVersion: string;
    inputDigest: string;
    model?: "gpt-5.6";
    responseId?: string;
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface SemanticAnalyzer {
  readonly id: string;
  analyze(input: SemanticAnalysisInput): Promise<SemanticAnalysis>;
}

export interface ReconstructedInstruction {
  sourceId: string;
  scope: "GLOBAL" | "PROJECT";
  directory: string;
  filename: string;
  content: string;
  contentSha256: string;
  originalBytes: number;
  includedBytes: number;
  truncated: boolean;
}

export type DiscoveryDecision =
  | {
      candidateId: string;
      decision: "SELECTED";
      includedBytes: number;
      truncated: boolean;
    }
  | {
      candidateId: string;
      decision: "EXCLUDED";
      reason:
        | "ABSENT"
        | "EMPTY"
        | "LOWER_PRECEDENCE"
        | "BYTE_LIMIT_REACHED";
    };

export interface SemanticAnalysisInput {
  captureId: string;
  chain: readonly ReconstructedInstruction[];
  task: CaptureBundleV1["task"];
  changedPaths: CaptureBundleV1["changedPaths"];
  events: CaptureBundleV1["events"];
  validations: CaptureBundleV1["validations"];
}

export interface SourceLink {
  sourceId: string;
  filename: string;
  directory: string;
  quote: string;
}

export type EvidenceLink =
  | {
      kind: "EVENT";
      evidenceId: string;
      sequence: number;
      label: string;
    }
  | {
      kind: "CHANGED_PATH_SET";
      evidenceId: "changed-paths";
      paths: readonly string[];
      label: string;
    };

export interface ObservableObligation {
  proposalId: string;
  normalizedRule: string;
  source: NonEmpty<SourceLink>;
  trigger: Extract<SemanticProposal, { kind: "EVALUABLE" }>["trigger"];
  assertion: Extract<SemanticProposal, { kind: "EVALUABLE" }>["assertion"];
}

export interface EvidenceSearchSummary {
  sequenceRange: { first: number | null; last: number | null };
  evidenceKindsSearched: NonEmpty<NormalizedEvent["kind"]>;
  explanation: string;
  limitation: "ABSENCE_IS_NOT_PROOF_OF_NON_ACTION";
}

export type EvaluatedFinding =
  | { result: "SUPPORTED"; supporting: NonEmpty<EvidenceLink> }
  | { result: "CONTRADICTED"; contradicting: NonEmpty<EvidenceLink> }
  | { result: "NOT_APPLICABLE"; nonTrigger: NonEmpty<EvidenceLink> }
  | { result: "NOT_EVIDENCED"; search: EvidenceSearchSummary };

export type ObligationRecord =
  | {
      disposition: "EVALUATED";
      obligation: ObservableObligation;
      finding: EvaluatedFinding;
    }
  | {
      disposition: "DECLINED_NON_OBSERVABLE";
      proposalId: string;
      source: NonEmpty<SourceLink>;
      reason: "SUBJECTIVE" | "UNBOUNDED" | "NON_OBSERVABLE";
    }
  | {
      disposition: "HUMAN_REVIEW_REQUIRED";
      proposalId: string;
      source: NonEmpty<SourceLink>;
      reason: "AMBIGUOUS" | "CONFLICTING";
    };

export interface EvidenceLedger {
  schemaVersion: "1";
  captureId: string;
  captureDigest: string;
  capturedAt: string;
  provenance: {
    level: ProvenanceLevel;
    warning: string;
  };
  codexVersion: string;
  chain: readonly {
    sourceId: string;
    scope: "GLOBAL" | "PROJECT";
    displayPath: string;
    contentSha256: string;
    includedBytes: number;
    originalBytes: number;
    truncated: boolean;
  }[];
  discovery: readonly DiscoveryDecision[];
  records: readonly ObligationRecord[];
  analyzer: SemanticAnalysis["metadata"] & { id: string };
  inputHashes: {
    eventCatalog: string;
    changedPaths: string;
    semanticAnalysis: string;
  };
}

export interface InputIssue {
  code:
    | "MISSING_LAUNCH_WORKING_DIRECTORY"
    | "LAUNCH_DIRECTORY_OUTSIDE_PROJECT_ROOT"
    | "MISSING_INSTRUCTION_SCOPE"
    | "DUPLICATE_INSTRUCTION_SCOPE"
    | "DUPLICATE_CANDIDATE_ID"
    | "DUPLICATE_EVENT_ID"
    | "DUPLICATE_EVENT_SEQUENCE"
    | "UNSUPPORTED_CODEX_VERSION"
    | "UNSUPPORTED_PATH_PLATFORM"
    | "INCOMPLETE_CANDIDATE_INVENTORY"
    | "CONTENT_HASH_MISMATCH";
  field: string;
  message: string;
}

export type AuditOutcome =
  | {
      inputState: "READY";
      provenance: ProvenanceLevel;
      chain: readonly ReconstructedInstruction[];
      discovery: readonly DiscoveryDecision[];
      records: readonly ObligationRecord[];
      analyzer: SemanticAnalysis["metadata"] & { id: string };
      ledger: EvidenceLedger;
      ledgerDigest: string;
    }
  | {
      inputState: "INSUFFICIENT_INPUT";
      provenance: ProvenanceLevel;
      issues: readonly InputIssue[];
    };

export type AuditExecution =
  | { execution: "COMPLETED"; audit: AuditOutcome }
  | {
      execution: "FAILED";
      error: {
        code: "ANALYZER_FAILURE" | "INVALID_ANALYZER_OUTPUT";
        message: string;
      };
    };
