import { z } from "zod";

import type { NonEmpty, SemanticAnalysis } from "./contracts";

const shortText = z.string().min(1).max(8_192);
const identifier = z.string().min(1).max(128);
const capturedPath = z.string().min(1).max(1_024);
const digest = z.string().regex(/^[a-f0-9]{64}$/);

const instructionCandidateSchema = z.discriminatedUnion("status", [
  z
    .object({
      candidateId: identifier,
      filename: z.string().min(1).max(255),
      status: z.literal("PRESENT"),
      content: z.string().min(1).max(65_536),
      sha256: digest,
    })
    .strict(),
  z
    .object({
      candidateId: identifier,
      filename: z.string().min(1).max(255),
      status: z.literal("EMPTY"),
      content: z.literal(""),
    })
    .strict(),
  z
    .object({
      candidateId: identifier,
      filename: z.string().min(1).max(255),
      status: z.literal("ABSENT"),
    })
    .strict(),
]);

const instructionScopeSchema = z
  .object({
    kind: z.enum(["GLOBAL", "PROJECT"]),
    directory: capturedPath,
    candidates: z.array(instructionCandidateSchema).max(16),
  })
  .strict();

const normalizedEventSchema = z.discriminatedUnion("kind", [
  z
    .object({
      eventId: identifier,
      sequence: z.number().int().nonnegative(),
      kind: z.literal("COMMAND_FINISHED"),
      command: z.string().min(1).max(1_024),
      exitCode: z.number().int(),
    })
    .strict(),
  z
    .object({
      eventId: identifier,
      sequence: z.number().int().nonnegative(),
      kind: z.literal("COMPLETION_CLAIM"),
      text: shortText,
    })
    .strict(),
]);

export const captureBundleSchema = z
  .object({
    schemaVersion: z.literal("1"),
    captureId: identifier,
    provenance: z
      .object({
        level: z.literal("LOCAL_CAPTURE_UNATTESTED"),
        capturedAt: z.string().datetime({ offset: true }),
      })
      .strict(),
    codex: z
      .object({
        version: z.string().min(1).max(64),
        home: capturedPath,
        projectRoot: capturedPath,
        launchWorkingDirectory: z.string().max(1_024),
        fallbackFilenames: z.array(z.string().min(1).max(255)).max(8),
        projectDocMaxBytes: z.number().int().nonnegative().max(1_048_576),
      })
      .strict(),
    instructionScopes: z.array(instructionScopeSchema).max(64),
    task: z.object({ text: shortText }).strict(),
    changedPaths: z.array(capturedPath).max(1_000),
    events: z.array(normalizedEventSchema).max(500),
    validations: z.array(z.unknown()).max(100),
  })
  .strict();

const sourceIds = z.array(identifier).min(1).max(8);
const evaluableProposalSchema = z
  .object({
    kind: z.literal("EVALUABLE"),
    proposalId: identifier,
    sourceIds,
    normalizedRule: shortText,
    trigger: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("ALWAYS") }).strict(),
      z
        .object({
          kind: z.literal("CHANGED_PATH_MATCHES"),
          exactPath: capturedPath,
        })
        .strict(),
    ]),
    assertion: z.discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("COMMAND_SUCCEEDED_BEFORE_COMPLETION"),
          exactCommand: z.string().min(1).max(1_024),
        })
        .strict(),
      z
        .object({
          kind: z.literal("NO_COMPLETION_AFTER_COMMAND_FAILED"),
          exactCommand: z.string().min(1).max(1_024),
        })
        .strict(),
    ]),
  })
  .strict();

const semanticProposalSchema = z.discriminatedUnion("kind", [
  evaluableProposalSchema,
  z
    .object({
      kind: z.literal("DECLINE"),
      proposalId: identifier,
      sourceIds,
      reason: z.enum(["SUBJECTIVE", "UNBOUNDED", "NON_OBSERVABLE"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("HUMAN_REVIEW"),
      proposalId: identifier,
      sourceIds,
      reason: z.enum(["AMBIGUOUS", "CONFLICTING"]),
    })
    .strict(),
]);

export const semanticProposalBatchSchema = z
  .object({
    proposals: z.array(semanticProposalSchema).max(128),
    sourceCoverage: z
      .array(
        z
          .object({
            sourceId: identifier,
            contentSha256: digest,
            proposalIds: z.array(identifier).max(128),
            quotes: z
              .array(
                z
                  .object({
                    proposalId: identifier,
                    quote: shortText,
                  })
                  .strict(),
              )
              .max(128),
          })
          .strict(),
      )
      .max(64),
  })
  .strict();

export const semanticAnalysisSchema = semanticProposalBatchSchema
  .extend({
    metadata: z
      .object({
        mode: z.enum(["RECORDED", "LIVE"]),
        promptVersion: identifier,
        inputDigest: digest,
        model: z.literal("gpt-5.6").optional(),
        responseId: identifier.optional(),
        inputTokens: z.number().int().nonnegative().optional(),
        outputTokens: z.number().int().nonnegative().optional(),
      })
      .strict(),
  })
  .strict();

function nonEmpty(values: string[]): NonEmpty<string> {
  const [first, ...rest] = values;
  if (first === undefined) {
    throw new Error("Semantic proposal must contain at least one source ID");
  }
  return [first, ...rest];
}

export function parseSemanticAnalysis(input: unknown): SemanticAnalysis {
  const parsed = semanticAnalysisSchema.parse(input);
  return {
    ...parsed,
    proposals: parsed.proposals.map((proposal) => ({
      ...proposal,
      sourceIds: nonEmpty(proposal.sourceIds),
    })),
  };
}
