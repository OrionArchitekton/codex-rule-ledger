import type {
  CaptureBundleV1,
  EvidenceLink,
  NonEmpty,
  ObligationRecord,
  ReconstructedInstruction,
  SemanticAnalysis,
  SourceLink,
} from "./contracts";
import { canonicalNormalizedRule } from "./semantic-coverage";

export class InvalidSemanticAnalysisError extends Error {}

function asNonEmpty<T>(values: readonly T[], message: string): NonEmpty<T> {
  if (values.length === 0) {
    throw new InvalidSemanticAnalysisError(message);
  }
  return values as NonEmpty<T>;
}

function sourceLinks(
  sourceIds: NonEmpty<string>,
  sourceById: ReadonlyMap<string, ReconstructedInstruction>,
  proposalId: string,
  analysis: SemanticAnalysis,
): NonEmpty<SourceLink> {
  return asNonEmpty(
    sourceIds.map((sourceId) => {
      const source = sourceById.get(sourceId);
      if (!source) {
        throw new InvalidSemanticAnalysisError(
          `Analyzer referenced unknown instruction source: ${sourceId}`,
        );
      }
      const quote = analysis.sourceCoverage
        .find((coverage) => coverage.sourceId === sourceId)
        ?.quotes.find((entry) => entry.proposalId === proposalId)?.quote;
      if (!quote) {
        throw new InvalidSemanticAnalysisError(
          `Analyzer supplied no exact source quote for ${proposalId}/${sourceId}`,
        );
      }
      return {
        sourceId,
        filename: source.filename,
        directory: source.directory,
        quote,
      };
    }),
    "Analyzer proposal has no source anchors",
  );
}

export function adjudicate(
  bundle: CaptureBundleV1,
  chain: readonly ReconstructedInstruction[],
  analysis: SemanticAnalysis,
): readonly ObligationRecord[] {
  const sourceById = new Map(chain.map((source) => [source.sourceId, source]));
  const orderedEvents = [...bundle.events].sort(
    (left, right) =>
      left.sequence - right.sequence || left.eventId.localeCompare(right.eventId),
  );
  const completions = orderedEvents.filter(
    (
      event,
    ): event is Extract<
      (typeof bundle.events)[number],
      { kind: "COMPLETION_CLAIM" }
    > => event.kind === "COMPLETION_CLAIM",
  );

  return [...analysis.proposals]
    .sort((left, right) => left.proposalId.localeCompare(right.proposalId))
    .map((proposal): ObligationRecord => {
      const source = sourceLinks(
        proposal.sourceIds,
        sourceById,
        proposal.proposalId,
        analysis,
      );
      if (proposal.kind === "DECLINE") {
        return {
          disposition: "DECLINED_NON_OBSERVABLE",
          proposalId: proposal.proposalId,
          source,
          reason: proposal.reason,
        };
      }
      if (proposal.kind === "HUMAN_REVIEW") {
        return {
          disposition: "HUMAN_REVIEW_REQUIRED",
          proposalId: proposal.proposalId,
          source,
          reason: proposal.reason,
        };
      }

      const obligation = {
        proposalId: proposal.proposalId,
        normalizedRule: canonicalNormalizedRule(proposal),
        source,
        trigger: proposal.trigger,
        assertion: proposal.assertion,
      };

      if (
        proposal.trigger.kind === "CHANGED_PATH_MATCHES" &&
        !bundle.changedPaths.includes(proposal.trigger.exactPath)
      ) {
        const nonTrigger: NonEmpty<EvidenceLink> = [
          {
            kind: "CHANGED_PATH_SET",
            evidenceId: "changed-paths",
            paths: [...bundle.changedPaths].sort(),
            label: `${proposal.trigger.exactPath} is absent from the captured changed-path set`,
          },
        ];
        return {
          disposition: "EVALUATED",
          obligation,
          finding: { result: "NOT_APPLICABLE", nonTrigger },
        };
      }

      if (proposal.assertion.kind === "NO_COMPLETION_AFTER_COMMAND_FAILED") {
        const failure = orderedEvents.find(
          (
            event,
          ): event is Extract<
            (typeof bundle.events)[number],
            { kind: "COMMAND_FINISHED" }
          > => {
            if (
              event.kind !== "COMMAND_FINISHED" ||
              event.command !== proposal.assertion.exactCommand ||
              event.exitCode === 0
            ) {
              return false;
            }
            const nextCompletion = completions.find(
              (completion) => completion.sequence > event.sequence,
            );
            if (!nextCompletion) return false;
            return !orderedEvents.some(
              (candidate) =>
                candidate.kind === "COMMAND_FINISHED" &&
                candidate.command === proposal.assertion.exactCommand &&
                candidate.exitCode === 0 &&
                candidate.sequence > event.sequence &&
                candidate.sequence < nextCompletion.sequence,
            );
          },
        );
        const completion = failure
          ? completions.find((event) => event.sequence > failure.sequence)
          : undefined;

        if (failure && completion) {
          const evidence: NonEmpty<EvidenceLink> = [
            {
              kind: "EVENT",
              evidenceId: failure.eventId,
              sequence: failure.sequence,
              label: `${failure.command} exited ${failure.exitCode}`,
            },
            {
              kind: "EVENT",
              evidenceId: completion.eventId,
              sequence: completion.sequence,
              label: "Completion was claimed after the failed command",
            },
          ];
          return {
            disposition: "EVALUATED",
            obligation,
            finding: { result: "CONTRADICTED", contradicting: evidence },
          };
        }

        const sequences = orderedEvents.map((event) => event.sequence);
        return {
          disposition: "EVALUATED",
          obligation,
          finding: {
            result: "NOT_EVIDENCED",
            search: {
              sequenceRange: {
                first: sequences.length === 0 ? null : Math.min(...sequences),
                last: sequences.length === 0 ? null : Math.max(...sequences),
              },
              evidenceKindsSearched: [
                "COMMAND_FINISHED",
                "COMPLETION_CLAIM",
              ],
              explanation: `The supplied events do not affirm a failed ${proposal.assertion.exactCommand} command followed by completion without an intervening successful retry.`,
              limitation: "ABSENCE_IS_NOT_PROOF_OF_NON_ACTION",
            },
          },
        };
      }

      const success = orderedEvents.find(
        (
          event,
        ): event is Extract<
          (typeof bundle.events)[number],
          { kind: "COMMAND_FINISHED" }
        > =>
          event.kind === "COMMAND_FINISHED" &&
          event.command === proposal.assertion.exactCommand &&
          event.exitCode === 0 &&
          completions.some((completion) => completion.sequence > event.sequence),
      );

      if (!success) {
        const sequences = orderedEvents.map((event) => event.sequence);
        return {
          disposition: "EVALUATED",
          obligation,
          finding: {
            result: "NOT_EVIDENCED",
            search: {
              sequenceRange: {
                first: sequences.length === 0 ? null : Math.min(...sequences),
                last: sequences.length === 0 ? null : Math.max(...sequences),
              },
              evidenceKindsSearched: [
                "COMMAND_FINISHED",
                "COMPLETION_CLAIM",
              ],
              explanation: `No affirmative successful ${proposal.assertion.exactCommand} event before a completion claim was supplied.`,
              limitation: "ABSENCE_IS_NOT_PROOF_OF_NON_ACTION",
            },
          },
        };
      }

      const completion = completions.find(
        (event) => event.sequence > success.sequence,
      );
      if (!completion) {
        throw new InvalidSemanticAnalysisError(
          "A matching completion event disappeared during adjudication",
        );
      }

      const evidence: NonEmpty<EvidenceLink> = [
        {
          kind: "EVENT",
          evidenceId: success.eventId,
          sequence: success.sequence,
          label: `${success.command} exited ${success.exitCode}`,
        },
        {
          kind: "EVENT",
          evidenceId: completion.eventId,
          sequence: completion.sequence,
          label: "Completion claim followed the successful command",
        },
      ];

      return {
        disposition: "EVALUATED",
        obligation,
        finding: { result: "SUPPORTED", supporting: evidence },
      };
    });
}
