import type {
  SemanticAnalysis,
  SemanticAnalysisInput,
} from "./contracts";

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
    if (!selectedSourceIds.has(coverage.sourceId)) {
      issues.push(`Semantic coverage references unknown source: ${coverage.sourceId}`);
    }
  }

  for (const proposal of analysis.proposals) {
    if (proposalIds.has(proposal.proposalId)) {
      issues.push(`Duplicate semantic proposal ID: ${proposal.proposalId}`);
    }
    proposalIds.add(proposal.proposalId);

    for (const sourceId of proposal.sourceIds) {
      if (!selectedSourceIds.has(sourceId)) {
        issues.push(`Semantic proposal references unknown source: ${sourceId}`);
      } else {
        coveredSourceIds.add(sourceId);
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

  return issues.sort((left, right) => left.localeCompare(right));
}
