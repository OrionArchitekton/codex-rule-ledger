import type {
  SemanticAnalysis,
  SemanticAnalysisInput,
  SemanticProposal,
} from "./contracts";

type EvaluableProposal = Extract<SemanticProposal, { kind: "EVALUABLE" }>;

export function canonicalNormalizedRule(proposal: EvaluableProposal): string {
  const triggerPrefix =
    proposal.trigger.kind === "CHANGED_PATH_MATCHES"
      ? `When ${proposal.trigger.exactPath} changes, `
      : "";
  if (proposal.assertion.kind === "COMMAND_SUCCEEDED_BEFORE_COMPLETION") {
    const verb = triggerPrefix === "" ? "Run" : "run";
    return `${triggerPrefix}${verb} ${proposal.assertion.exactCommand} successfully before completion.`;
  }
  const verb = triggerPrefix === "" ? "Do" : "do";
  return `${triggerPrefix}${verb} not claim completion after ${proposal.assertion.exactCommand} fails.`;
}

function canonicalSourceQuote(proposal: EvaluableProposal): string {
  const condition =
    proposal.trigger.kind === "CHANGED_PATH_MATCHES"
      ? ` when \`${proposal.trigger.exactPath}\` changes`
      : "";
  if (proposal.assertion.kind === "COMMAND_SUCCEEDED_BEFORE_COMPLETION") {
    return `Run \`${proposal.assertion.exactCommand}\` successfully before completion${condition}.`;
  }
  return `Do not claim completion after \`${proposal.assertion.exactCommand}\` fails${condition}.`;
}

function isStrictObservableDirective(line: string): boolean {
  return [
    /^Run `[^`\r\n]+` successfully before completion\.$/,
    /^Run `[^`\r\n]+` successfully before completion when `[^`\r\n]+` changes\.$/,
    /^Do not claim completion after `[^`\r\n]+` fails\.$/,
    /^Do not claim completion after `[^`\r\n]+` fails when `[^`\r\n]+` changes\.$/,
  ].some((pattern) => pattern.test(line));
}

function quoteEntailmentIssues(
  proposal: EvaluableProposal,
  sourceId: string,
  quote: string,
): readonly string[] {
  const issues: string[] = [];
  const location = `${sourceId}/${proposal.proposalId}`;
  const conditional =
    /\b(?:if|when|whenever)\b/i.test(quote) ||
    /\bafter\b[^.\n]*\bchanges?\b/i.test(quote);

  if (!quote.includes(`\`${proposal.assertion.exactCommand}\``)) {
    issues.push(`Semantic exact command is absent from cited quote: ${location}`);
  }

  if (proposal.trigger.kind === "CHANGED_PATH_MATCHES") {
    if (!quote.includes(`\`${proposal.trigger.exactPath}\``)) {
      issues.push(`Semantic exact path is absent from cited quote: ${location}`);
    }
    if (!conditional) {
      issues.push(`Semantic path trigger lacks an explicit condition in cited quote: ${location}`);
    }
  } else if (conditional) {
    issues.push(`Semantic ALWAYS trigger cites a conditional quote: ${location}`);
  }

  if (quote !== canonicalSourceQuote(proposal)) {
    issues.push(
      `Semantic proposal does not match a strict v0.1 source form: ${location}`,
    );
  }

  return issues;
}

export function semanticCoverageIssues(
  input: SemanticAnalysisInput,
  analysis: SemanticAnalysis,
): readonly string[] {
  const issues: string[] = [];
  const selectedSourceIds = new Set(
    input.chain.map((source) => source.sourceId),
  );
  const coveredSourceIds = new Set<string>();
  const proposalIds = new Set<string>();
  const sourceById = new Map(
    input.chain.map((source) => [source.sourceId, source]),
  );
  const coverageBySource = new Map<string, SemanticAnalysis["sourceCoverage"][number]>();

  for (const coverage of analysis.sourceCoverage) {
    if (coverageBySource.has(coverage.sourceId)) {
      issues.push(`Duplicate semantic source coverage: ${coverage.sourceId}`);
    }
    coverageBySource.set(coverage.sourceId, coverage);
    if (new Set(coverage.proposalIds).size !== coverage.proposalIds.length) {
      issues.push(`Duplicate semantic coverage proposal ID: ${coverage.sourceId}`);
    }
    const quoteProposalIds = coverage.quotes.map((quote) => quote.proposalId);
    if (new Set(quoteProposalIds).size !== quoteProposalIds.length) {
      issues.push(`Duplicate semantic source quote: ${coverage.sourceId}`);
    }
    if (!selectedSourceIds.has(coverage.sourceId)) {
      issues.push(`Semantic coverage references unknown source: ${coverage.sourceId}`);
    }
  }

  for (const proposal of analysis.proposals) {
    if (proposalIds.has(proposal.proposalId)) {
      issues.push(`Duplicate semantic proposal ID: ${proposal.proposalId}`);
    }
    proposalIds.add(proposal.proposalId);
    if (new Set(proposal.sourceIds).size !== proposal.sourceIds.length) {
      issues.push(`Duplicate semantic proposal source ID: ${proposal.proposalId}`);
    }

    for (const sourceId of proposal.sourceIds) {
      if (!selectedSourceIds.has(sourceId)) {
        issues.push(`Semantic proposal references unknown source: ${sourceId}`);
      } else {
        coveredSourceIds.add(sourceId);
      }
    }
  }

  for (const source of input.chain) {
    const coverage = coverageBySource.get(source.sourceId);
    if (!coverage) continue;
    const strictDirectives = source.content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(isStrictObservableDirective);
    for (const directive of strictDirectives) {
      const matchingProposalCount = analysis.proposals.filter(
        (proposal) =>
          proposal.kind === "EVALUABLE" &&
          proposal.sourceIds.includes(source.sourceId) &&
          coverage.quotes.some(
            (quote) =>
              quote.proposalId === proposal.proposalId &&
              quote.quote === directive,
          ),
      ).length;
      if (matchingProposalCount !== 1) {
        issues.push(
          `Semantic analysis omits strict observable directive: ${source.sourceId}/${directive}`,
        );
      }
    }
  }

  for (const sourceId of selectedSourceIds) {
    if (!coveredSourceIds.has(sourceId)) {
      issues.push(
        `Semantic analysis does not cover selected instruction source: ${sourceId}`,
      );
    }

    const coverage = coverageBySource.get(sourceId);
    const source = sourceById.get(sourceId);
    if (!coverage || !source) {
      issues.push(`Semantic analysis has no source coverage receipt: ${sourceId}`);
      continue;
    }
    if (coverage.contentSha256 !== source.contentSha256) {
      issues.push(`Semantic source coverage digest does not match: ${sourceId}`);
    }

    const expectedProposalIds = analysis.proposals
      .filter((proposal) => proposal.sourceIds.includes(sourceId))
      .map((proposal) => proposal.proposalId)
      .sort();
    const suppliedProposalIds = [...new Set(coverage.proposalIds)].sort();
    if (JSON.stringify(expectedProposalIds) !== JSON.stringify(suppliedProposalIds)) {
      issues.push(`Semantic source coverage proposal IDs do not match: ${sourceId}`);
    }

    const quoteByProposal = new Map(
      coverage.quotes.map((quote) => [quote.proposalId, quote.quote]),
    );
    for (const proposalId of expectedProposalIds) {
      const quote = quoteByProposal.get(proposalId);
      if (!quote || quote.trim() === "" || !source.content.includes(quote)) {
        issues.push(
          `Semantic source quote is not an exact source span: ${sourceId}/${proposalId}`,
        );
      }
    }
  }

  for (const proposal of analysis.proposals) {
    if (proposal.kind !== "EVALUABLE") continue;
    if (proposal.normalizedRule !== canonicalNormalizedRule(proposal)) {
      issues.push(
        `Semantic proposal does not use the canonical normalized rule: ${proposal.proposalId}`,
      );
    }
    for (const sourceId of proposal.sourceIds) {
      const quote = coverageBySource
        .get(sourceId)
        ?.quotes.find((entry) => entry.proposalId === proposal.proposalId)?.quote;
      if (!quote) continue;
      issues.push(...quoteEntailmentIssues(proposal, sourceId, quote));
    }
  }

  return issues.sort((left, right) => left.localeCompare(right));
}
