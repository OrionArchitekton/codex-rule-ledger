import { loadBuildWeekDemoFixture } from "../fixtures/build-week-demo";
import { runLedgerAudit } from "./index";
import { reconstructInstructionChain } from "./reconstruct-chain";
import {
  OpenAIResponsesAnalyzer,
  createOpenAIResponsesAnalyzer,
  type ResponsesParseClient,
} from "./analyzers/openai-responses";
import {
  buildSemanticAnalysisInput,
  digestSemanticAnalysisInput,
} from "./semantic-input";

export interface LiveGptProof {
  schemaVersion: "1";
  generatedAt: string;
  fixtureId: "build-week-demo-v1";
  model: "gpt-5.6";
  promptVersion: string;
  inputDigest: string;
  responseId: string;
  inputTokens: number;
  outputTokens: number;
  proposalCount: number;
  sourceCoverageCount: number;
  semanticAnalysisDigest: string;
  ledgerDigest: string;
  storageRequested: false;
  toolsEnabled: false;
  automaticRetries: 0;
}

export async function executeBuildWeekLiveProof(options: {
  apiKey: string;
  client?: ResponsesParseClient;
  now?: () => Date;
}): Promise<LiveGptProof> {
  const fixture = loadBuildWeekDemoFixture();
  const reconstruction = reconstructInstructionChain(fixture.bundle);
  const semanticInput = buildSemanticAnalysisInput(
    fixture.bundle,
    reconstruction.chain,
  );
  const inputDigest = digestSemanticAnalysisInput(semanticInput);
  const analyzer = options.client
    ? new OpenAIResponsesAnalyzer({
        client: options.client,
        allowedInputDigest: inputDigest,
      })
    : createOpenAIResponsesAnalyzer({
        apiKey: options.apiKey,
        allowedInputDigest: inputDigest,
      });
  const execution = await runLedgerAudit(fixture.bundle, analyzer);

  if (
    execution.execution !== "COMPLETED" ||
    execution.audit.inputState !== "READY"
  ) {
    const reason =
      execution.execution === "FAILED"
        ? execution.error.message
        : "The allowlisted fixture was structurally insufficient.";
    throw new Error(`GPT-5.6 live proof failed closed: ${reason}`);
  }

  const metadata = execution.audit.analyzer;
  if (
    metadata.mode !== "LIVE" ||
    metadata.model !== "gpt-5.6" ||
    !metadata.responseId ||
    metadata.inputTokens === undefined ||
    metadata.outputTokens === undefined
  ) {
    throw new Error("GPT-5.6 live proof is missing required response metadata.");
  }

  return {
    schemaVersion: "1",
    generatedAt: (options.now ?? (() => new Date()))().toISOString(),
    fixtureId: "build-week-demo-v1",
    model: metadata.model,
    promptVersion: metadata.promptVersion,
    inputDigest,
    responseId: metadata.responseId,
    inputTokens: metadata.inputTokens,
    outputTokens: metadata.outputTokens,
    proposalCount: execution.audit.records.length,
    sourceCoverageCount: execution.audit.ledger.chain.length,
    semanticAnalysisDigest:
      execution.audit.ledger.inputHashes.semanticAnalysis,
    ledgerDigest: execution.audit.ledgerDigest,
    storageRequested: false,
    toolsEnabled: false,
    automaticRetries: 0,
  };
}
