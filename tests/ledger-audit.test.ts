import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { loadBuildWeekDemoFixture } from "../src/fixtures/build-week-demo";
import {
  digestSemanticAnalysisInput,
  runLedgerAudit,
  serializeEvidenceLedger,
  type SemanticAnalysisInput,
  type SemanticProposal,
} from "../src/ledger";
import { RecordedFixtureAnalyzer } from "../src/ledger/analyzers/recorded-fixture";

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function present(candidateId: string, filename: string, content: string) {
  return {
    candidateId,
    filename,
    status: "PRESENT" as const,
    content,
    sha256: sha256(content),
  };
}

function absent(candidateId: string, filename: string) {
  return { candidateId, filename, status: "ABSENT" as const };
}

function empty(candidateId: string, filename: string) {
  return {
    candidateId,
    filename,
    status: "EMPTY" as const,
    content: "" as const,
  };
}

function derivedStrictProposals(
  input: SemanticAnalysisInput,
): readonly Extract<SemanticProposal, { kind: "EVALUABLE" }>[] {
  const derived: Extract<SemanticProposal, { kind: "EVALUABLE" }>[] = [];

  for (const source of input.chain) {
    source.content.split(/\r?\n/).forEach((rawLine, index) => {
      const line = rawLine.trim();
      const changedSuccess =
        /^Run `([^`]+)` successfully before completion when `([^`]+)` changes\.$/.exec(
          line,
        );
      const alwaysSuccess =
        /^Run `([^`]+)` successfully before completion\.$/.exec(line);
      const changedFailure =
        /^Do not claim completion after `([^`]+)` fails when `([^`]+)` changes\.$/.exec(
          line,
        );
      const alwaysFailure =
        /^Do not claim completion after `([^`]+)` fails\.$/.exec(line);
      const proposalId = `zz-derived-${source.sourceId}-${index}`;

      if (changedSuccess) {
        const [, exactCommand, exactPath] = changedSuccess;
        derived.push({
          kind: "EVALUABLE",
          proposalId,
          sourceIds: [source.sourceId],
          normalizedRule: `When ${exactPath} changes, run ${exactCommand} successfully before completion.`,
          trigger: {
            kind: "CHANGED_PATH_MATCHES",
            exactPath,
          },
          assertion: {
            kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION",
            exactCommand,
          },
        });
        return;
      }
      if (alwaysSuccess) {
        const [, exactCommand] = alwaysSuccess;
        derived.push({
          kind: "EVALUABLE",
          proposalId,
          sourceIds: [source.sourceId],
          normalizedRule: `Run ${exactCommand} successfully before completion.`,
          trigger: { kind: "ALWAYS" },
          assertion: {
            kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION",
            exactCommand,
          },
        });
        return;
      }
      if (changedFailure) {
        const [, exactCommand, exactPath] = changedFailure;
        derived.push({
          kind: "EVALUABLE",
          proposalId,
          sourceIds: [source.sourceId],
          normalizedRule: `When ${exactPath} changes, do not claim completion after ${exactCommand} fails.`,
          trigger: {
            kind: "CHANGED_PATH_MATCHES",
            exactPath,
          },
          assertion: {
            kind: "NO_COMPLETION_AFTER_COMMAND_FAILED",
            exactCommand,
          },
        });
        return;
      }
      if (alwaysFailure) {
        const [, exactCommand] = alwaysFailure;
        derived.push({
          kind: "EVALUABLE",
          proposalId,
          sourceIds: [source.sourceId],
          normalizedRule: `Do not claim completion after ${exactCommand} fails.`,
          trigger: { kind: "ALWAYS" },
          assertion: {
            kind: "NO_COMPLETION_AFTER_COMMAND_FAILED",
            exactCommand,
          },
        });
      }
    });
  }

  return derived;
}

function sameTypedRule(
  left: Extract<SemanticProposal, { kind: "EVALUABLE" }>,
  right: Extract<SemanticProposal, { kind: "EVALUABLE" }>,
): boolean {
  return (
    left.sourceIds.some((sourceId) => right.sourceIds.includes(sourceId)) &&
    JSON.stringify(left.trigger) === JSON.stringify(right.trigger) &&
    JSON.stringify(left.assertion) === JSON.stringify(right.assertion)
  );
}

function recordedTestAnalyzer(
  proposals: readonly SemanticProposal[] = [],
) {
  return {
    id: "recorded-test-analyzer",
    analyze: vi.fn(async (input: SemanticAnalysisInput) => {
      const derivedProposals = derivedStrictProposals(input).filter(
        (derived) =>
          !proposals.some(
            (proposal) =>
              proposal.kind === "EVALUABLE" &&
              sameTypedRule(proposal, derived),
          ),
      );
      const proposalsWithStrictCoverage = [...proposals, ...derivedProposals];
      const coveredSourceIds = new Set(
        proposalsWithStrictCoverage.flatMap((proposal) => [
          ...proposal.sourceIds,
        ]),
      );
      const coverageProposals: SemanticProposal[] = input.chain.flatMap(
        (source) =>
          coveredSourceIds.has(source.sourceId)
            ? []
            : [
                {
                  kind: "DECLINE" as const,
                  proposalId: `test-coverage-${source.sourceId}`,
                  sourceIds: [source.sourceId],
                  reason: "NON_OBSERVABLE" as const,
                },
              ],
      );
      const allProposals = [...proposalsWithStrictCoverage, ...coverageProposals];
      return {
        proposals: allProposals,
        sourceCoverage: input.chain.map((source) => {
          const sourceProposals = allProposals.filter((proposal) =>
            proposal.sourceIds.includes(source.sourceId),
          );
          return {
            sourceId: source.sourceId,
            contentSha256: source.contentSha256,
            proposalIds: sourceProposals.map((proposal) => proposal.proposalId),
            quotes: sourceProposals.map((proposal) => ({
              proposalId: proposal.proposalId,
              quote:
                proposal.kind === "EVALUABLE"
                  ? (source.content
                      .split("\n")
                      .find(
                        (line) =>
                          line.includes(proposal.assertion.exactCommand) &&
                          (proposal.trigger.kind === "ALWAYS" ||
                            line.includes(proposal.trigger.exactPath)),
                      ) ?? source.content)
                  : source.content,
            })),
          };
        }),
        metadata: {
          mode: "RECORDED" as const,
          promptVersion: "test-v1",
          inputDigest: digestSemanticAnalysisInput(input),
        },
      };
    }),
  };
}

function completeBundle() {
  return {
    schemaVersion: "1" as const,
    captureId: "complete-discovery-capture",
    provenance: {
      level: "LOCAL_CAPTURE_UNATTESTED" as const,
      capturedAt: "2026-07-13T12:00:00.000Z",
    },
    codex: {
      version: "0.144.0",
      home: "/synthetic/home",
      projectRoot: "/synthetic/repository",
      launchWorkingDirectory: "/synthetic/repository/apps/web",
      fallbackFilenames: ["CODEX.md"],
      projectDocMaxBytes: 32_768,
    },
    instructionScopes: [
      {
        kind: "GLOBAL" as const,
        directory: "/synthetic/home",
        candidates: [
          empty("global-override", "AGENTS.override.md"),
          present(
            "global-agents",
            "AGENTS.md",
            "Run `npm test` successfully before completion.",
          ),
        ],
      },
      {
        kind: "PROJECT" as const,
        directory: "/synthetic/repository",
        candidates: [
          absent("root-override", "AGENTS.override.md"),
          present(
            "root-agents",
            "AGENTS.md",
            "Run `npm run build` successfully before completion.\nRun `npm run docs:check` successfully before completion when `README.md` changes.",
          ),
          absent("root-fallback", "CODEX.md"),
        ],
      },
      {
        kind: "PROJECT" as const,
        directory: "/synthetic/repository/apps",
        candidates: [
          absent("apps-override", "AGENTS.override.md"),
          absent("apps-agents", "AGENTS.md"),
          present(
            "apps-fallback",
            "CODEX.md",
            "Do not claim completion after `npm run typecheck` fails.",
          ),
        ],
      },
      {
        kind: "PROJECT" as const,
        directory: "/synthetic/repository/apps/web",
        candidates: [
          present(
            "web-override",
            "AGENTS.override.md",
            "Make the interface delightful.",
          ),
          present(
            "web-agents",
            "AGENTS.md",
            "This lower-precedence file must not be selected.",
          ),
          absent("web-fallback", "CODEX.md"),
        ],
      },
    ],
    task: { text: "Audit the captured validation session." },
    changedPaths: ["src/example.ts"],
    events: [],
    validations: [],
  };
}

describe("runLedgerAudit", () => {
  it("fails closed before semantic analysis when launch context is missing", async () => {
    const analyzer = recordedTestAnalyzer();

    const execution = await runLedgerAudit(
      {
        schemaVersion: "1",
        captureId: "missing-launch-context",
        provenance: {
          level: "LOCAL_CAPTURE_UNATTESTED",
          capturedAt: "2026-07-13T12:00:00.000Z",
        },
        codex: {
          version: "0.1.0",
          home: "/synthetic/home",
          projectRoot: "/synthetic/repository",
          launchWorkingDirectory: "",
          fallbackFilenames: ["CODEX.md"],
          projectDocMaxBytes: 32_768,
        },
        instructionScopes: [],
        task: { text: "Audit the captured validation session." },
        changedPaths: [],
        events: [],
        validations: [],
      },
      analyzer,
    );

    expect(execution.execution).toBe("COMPLETED");
    if (execution.execution !== "COMPLETED") {
      throw new Error("Expected a completed structural audit");
    }

    expect(execution.audit.inputState).toBe("INSUFFICIENT_INPUT");
    if (execution.audit.inputState !== "INSUFFICIENT_INPUT") {
      throw new Error("Expected insufficient input");
    }

    expect(execution.audit.issues).toContainEqual(
      expect.objectContaining({
        code: "MISSING_LAUNCH_WORKING_DIRECTORY",
        field: "codex.launchWorkingDirectory",
      }),
    );
    expect("records" in execution.audit).toBe(false);
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it("fails closed when the captured instruction-scope inventory is empty", async () => {
    const analyzer = recordedTestAnalyzer();
    const bundle = { ...completeBundle(), instructionScopes: [] };

    const execution = await runLedgerAudit(bundle, analyzer);

    expect(execution.execution).toBe("COMPLETED");
    if (execution.execution !== "COMPLETED") {
      throw new Error("Expected structural validation to complete");
    }
    expect(execution.audit.inputState).toBe("INSUFFICIENT_INPUT");
    if (execution.audit.inputState !== "INSUFFICIENT_INPUT") {
      throw new Error("Expected insufficient input");
    }
    expect(execution.audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_INSTRUCTION_SCOPE",
          field: "instructionScopes[GLOBAL:/synthetic/home]",
        }),
        expect.objectContaining({
          code: "MISSING_INSTRUCTION_SCOPE",
          field: "instructionScopes[PROJECT:/synthetic/repository/apps/web]",
        }),
      ]),
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it("fails closed when the launch directory is outside the captured project root", async () => {
    const analyzer = recordedTestAnalyzer();
    const bundle = {
      ...completeBundle(),
      codex: {
        ...completeBundle().codex,
        launchWorkingDirectory: "/synthetic/other-project",
      },
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    if (execution.execution !== "COMPLETED") {
      throw new Error("Expected structural validation to complete");
    }
    expect(execution.audit.inputState).toBe("INSUFFICIENT_INPUT");
    if (execution.audit.inputState !== "INSUFFICIENT_INPUT") {
      throw new Error("Expected insufficient input");
    }
    expect(execution.audit.issues).toContainEqual(
      expect.objectContaining({
        code: "LAUNCH_DIRECTORY_OUTSIDE_PROJECT_ROOT",
        field: "codex.launchWorkingDirectory",
      }),
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it("fails closed outside the demonstrated Codex version and POSIX path envelope", async () => {
    const analyzer = recordedTestAnalyzer();
    const original = completeBundle();
    const bundle = {
      ...original,
      codex: {
        ...original.codex,
        version: "9.9.9",
        home: "C:\\Users\\demo\\.codex",
      },
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    if (execution.execution !== "COMPLETED") {
      throw new Error("Expected structural validation to complete");
    }
    expect(execution.audit.inputState).toBe("INSUFFICIENT_INPUT");
    if (execution.audit.inputState !== "INSUFFICIENT_INPUT") {
      throw new Error("Expected insufficient input");
    }
    expect(execution.audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "UNSUPPORTED_CODEX_VERSION" }),
        expect.objectContaining({ code: "UNSUPPORTED_PATH_PLATFORM" }),
      ]),
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it("does not derive outside-root topology from an unsupported relative path", async () => {
    const analyzer = recordedTestAnalyzer();
    const original = completeBundle();
    const bundle = {
      ...original,
      codex: {
        ...original.codex,
        launchWorkingDirectory: "relative/launch-directory",
      },
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    if (execution.execution !== "COMPLETED") {
      throw new Error("Expected structural validation to complete");
    }
    expect(execution.audit.inputState).toBe("INSUFFICIENT_INPUT");
    if (execution.audit.inputState !== "INSUFFICIENT_INPUT") {
      throw new Error("Expected insufficient input");
    }
    expect(execution.audit.issues).toContainEqual(
      expect.objectContaining({
        code: "UNSUPPORTED_PATH_PLATFORM",
        field: "codex.launchWorkingDirectory",
      }),
    );
    expect(execution.audit.issues).not.toContainEqual(
      expect.objectContaining({
        code: "LAUNCH_DIRECTORY_OUTSIDE_PROJECT_ROOT",
      }),
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it("fails closed when Codex home or project root is empty", async () => {
    const analyzer = recordedTestAnalyzer();
    const original = completeBundle();
    const bundle = {
      ...original,
      codex: {
        ...original.codex,
        home: "",
        projectRoot: "",
        launchWorkingDirectory: "/synthetic/launch",
      },
      instructionScopes: [
        { ...original.instructionScopes[0], directory: "." },
        { ...original.instructionScopes[1], directory: "." },
      ],
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    if (execution.execution !== "COMPLETED") {
      throw new Error("Expected structural validation to complete");
    }
    expect(execution.audit.inputState).toBe("INSUFFICIENT_INPUT");
    if (execution.audit.inputState !== "INSUFFICIENT_INPUT") {
      throw new Error("Expected insufficient input");
    }
    expect(execution.audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_CODEX_HOME" }),
        expect.objectContaining({ code: "MISSING_PROJECT_ROOT" }),
      ]),
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it("reconstructs the complete global-to-launch instruction chain before analysis", async () => {
    const analyzer = recordedTestAnalyzer();

    const execution = await runLedgerAudit(completeBundle(), analyzer);

    expect(execution.execution).toBe("COMPLETED");
    if (
      execution.execution !== "COMPLETED" ||
      execution.audit.inputState !== "READY"
    ) {
      throw new Error("Expected a ready audit");
    }

    expect(execution.audit.chain.map((source) => source.sourceId)).toEqual([
      "global-agents",
      "root-agents",
      "apps-fallback",
      "web-override",
    ]);
    expect(execution.audit.discovery).toContainEqual(
      expect.objectContaining({
        candidateId: "web-agents",
        decision: "EXCLUDED",
        reason: "LOWER_PRECEDENCE",
      }),
    );
    expect(analyzer.analyze).toHaveBeenCalledOnce();
    expect(analyzer.analyze).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: expect.arrayContaining([
          expect.objectContaining({ sourceId: "apps-fallback" }),
        ]),
      }),
    );
  });

  it("treats a whitespace-only project override as an occupied but non-visible slot", async () => {
    const analyzer = recordedTestAnalyzer();
    const original = completeBundle();
    const whitespace = " \n\t ";
    const bundle = {
      ...original,
      instructionScopes: original.instructionScopes.map((scope) => ({
        ...scope,
        candidates: scope.candidates.map((candidate) =>
          candidate.candidateId === "web-override" &&
          candidate.status === "PRESENT"
            ? {
                ...candidate,
                content: whitespace,
                sha256: sha256(whitespace),
              }
            : candidate,
        ),
      })),
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    if (
      execution.execution !== "COMPLETED" ||
      execution.audit.inputState !== "READY"
    ) {
      throw new Error("Expected a ready audit");
    }
    expect(execution.audit.chain.map((source) => source.sourceId)).not.toContain(
      "web-override",
    );
    expect(execution.audit.discovery).toContainEqual({
      candidateId: "web-override",
      decision: "EXCLUDED",
      reason: "EMPTY",
    });
    expect(execution.audit.discovery).toContainEqual({
      candidateId: "web-agents",
      decision: "EXCLUDED",
      reason: "LOWER_PRECEDENCE",
    });
  });

  it("supports a command obligation only with an affirmative success before completion", async () => {
    const analyzer = recordedTestAnalyzer([
          {
            kind: "EVALUABLE",
            proposalId: "proposal-test-success",
            sourceIds: ["global-agents"],
            normalizedRule: "Run npm test successfully before completion.",
            trigger: { kind: "ALWAYS" },
            assertion: {
              kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION",
              exactCommand: "npm test",
            },
          },
    ]);
    const bundle = {
      ...completeBundle(),
      events: [
        {
          eventId: "event-test-success",
          sequence: 10,
          kind: "COMMAND_FINISHED",
          command: "npm test",
          exitCode: 0,
        },
        {
          eventId: "event-completion",
          sequence: 20,
          kind: "COMPLETION_CLAIM",
          text: "Implementation complete.",
        },
      ] as const,
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    expect(execution.execution).toBe("COMPLETED");
    if (
      execution.execution !== "COMPLETED" ||
      execution.audit.inputState !== "READY"
    ) {
      throw new Error("Expected a ready audit");
    }

    expect(execution.audit.records).toContainEqual(
      expect.objectContaining({
        disposition: "EVALUATED",
        obligation: expect.objectContaining({
          proposalId: "proposal-test-success",
          source: [expect.objectContaining({ sourceId: "global-agents" })],
        }),
        finding: {
          result: "SUPPORTED",
          supporting: expect.arrayContaining([
            expect.objectContaining({
              kind: "EVENT",
              evidenceId: "event-test-success",
            }),
          ]),
        },
      }),
    );
  });

  it("contradicts a no-completion-after-failure rule with affirmative ordered events", async () => {
    const analyzer = recordedTestAnalyzer([
          {
            kind: "EVALUABLE",
            proposalId: "proposal-typecheck-failure",
            sourceIds: ["apps-fallback"],
            normalizedRule:
              "Do not claim completion after npm run typecheck fails.",
            trigger: { kind: "ALWAYS" },
            assertion: {
              kind: "NO_COMPLETION_AFTER_COMMAND_FAILED",
              exactCommand: "npm run typecheck",
            },
          },
    ]);
    const bundle = {
      ...completeBundle(),
      events: [
        {
          eventId: "event-typecheck-failure",
          sequence: 30,
          kind: "COMMAND_FINISHED",
          command: "npm run typecheck",
          exitCode: 1,
        },
        {
          eventId: "event-completion-after-failure",
          sequence: 40,
          kind: "COMPLETION_CLAIM",
          text: "Everything is done.",
        },
      ] as const,
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    expect(execution.execution).toBe("COMPLETED");
    if (
      execution.execution !== "COMPLETED" ||
      execution.audit.inputState !== "READY"
    ) {
      throw new Error("Expected a ready audit");
    }
    expect(execution.audit.records).toContainEqual(
      expect.objectContaining({
        disposition: "EVALUATED",
        obligation: expect.objectContaining({
          proposalId: "proposal-typecheck-failure",
        }),
        finding: {
          result: "CONTRADICTED",
          contradicting: expect.arrayContaining([
            expect.objectContaining({
              evidenceId: "event-typecheck-failure",
            }),
            expect.objectContaining({
              evidenceId: "event-completion-after-failure",
            }),
          ]),
        },
      }),
    );
  });

  it("does not contradict when the failed command succeeds before completion", async () => {
    const analyzer = recordedTestAnalyzer([
      {
        kind: "EVALUABLE",
        proposalId: "proposal-recovered-typecheck",
        sourceIds: ["apps-fallback"],
        normalizedRule:
          "Do not claim completion after npm run typecheck fails.",
        trigger: { kind: "ALWAYS" },
        assertion: {
          kind: "NO_COMPLETION_AFTER_COMMAND_FAILED",
          exactCommand: "npm run typecheck",
        },
      },
    ]);
    const bundle = {
      ...completeBundle(),
      events: [
        {
          eventId: "event-typecheck-failure",
          sequence: 10,
          kind: "COMMAND_FINISHED",
          command: "npm run typecheck",
          exitCode: 1,
        },
        {
          eventId: "event-typecheck-recovery",
          sequence: 20,
          kind: "COMMAND_FINISHED",
          command: "npm run typecheck",
          exitCode: 0,
        },
        {
          eventId: "event-completion-after-recovery",
          sequence: 30,
          kind: "COMPLETION_CLAIM",
          text: "Everything is done.",
        },
      ] as const,
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    expect(execution.execution).toBe("COMPLETED");
    if (
      execution.execution !== "COMPLETED" ||
      execution.audit.inputState !== "READY"
    ) {
      throw new Error("Expected a ready audit");
    }
    expect(execution.audit.records[0]).toEqual(
      expect.objectContaining({
        disposition: "EVALUATED",
        finding: expect.objectContaining({ result: "NOT_EVIDENCED" }),
      }),
    );
  });

  it("finds contradiction evidence independently of serialized event order", async () => {
    const analyzer = recordedTestAnalyzer([
          {
            kind: "EVALUABLE",
            proposalId: "proposal-event-order",
            sourceIds: ["apps-fallback"],
            normalizedRule:
              "Do not claim completion after npm run typecheck fails.",
            trigger: { kind: "ALWAYS" },
            assertion: {
              kind: "NO_COMPLETION_AFTER_COMMAND_FAILED",
              exactCommand: "npm run typecheck",
            },
          },
    ]);
    const bundle = {
      ...completeBundle(),
      events: [
        {
          eventId: "event-late-failure",
          sequence: 50,
          kind: "COMMAND_FINISHED",
          command: "npm run typecheck",
          exitCode: 1,
        },
        {
          eventId: "event-completion-after-early-failure",
          sequence: 40,
          kind: "COMPLETION_CLAIM",
          text: "Everything is done.",
        },
        {
          eventId: "event-early-failure",
          sequence: 10,
          kind: "COMMAND_FINISHED",
          command: "npm run typecheck",
          exitCode: 1,
        },
      ] as const,
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    expect(execution.execution).toBe("COMPLETED");
    if (
      execution.execution !== "COMPLETED" ||
      execution.audit.inputState !== "READY"
    ) {
      throw new Error("Expected a ready audit");
    }
    expect(execution.audit.records[0]).toEqual(
      expect.objectContaining({
        disposition: "EVALUATED",
        finding: {
          result: "CONTRADICTED",
          contradicting: expect.arrayContaining([
            expect.objectContaining({ evidenceId: "event-early-failure" }),
            expect.objectContaining({
              evidenceId: "event-completion-after-early-failure",
            }),
          ]),
        },
      }),
    );
  });

  it("keeps missing evidence distinct from an affirmatively false trigger", async () => {
    const analyzer = recordedTestAnalyzer([
          {
            kind: "EVALUABLE",
            proposalId: "proposal-build-missing",
            sourceIds: ["root-agents"],
            normalizedRule: "Run npm run build successfully before completion.",
            trigger: { kind: "ALWAYS" },
            assertion: {
              kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION",
              exactCommand: "npm run build",
            },
          },
          {
            kind: "EVALUABLE",
            proposalId: "proposal-docs-not-triggered",
            sourceIds: ["root-agents"],
            normalizedRule:
              "When README.md changes, run npm run docs:check successfully before completion.",
            trigger: {
              kind: "CHANGED_PATH_MATCHES",
              exactPath: "README.md",
            },
            assertion: {
              kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION",
              exactCommand: "npm run docs:check",
            },
          },
    ]);
    const bundle = {
      ...completeBundle(),
      changedPaths: ["src/example.ts"],
      events: [
        {
          eventId: "event-completion-without-build",
          sequence: 50,
          kind: "COMPLETION_CLAIM",
          text: "Source work complete.",
        },
      ] as const,
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    expect(execution.execution).toBe("COMPLETED");
    if (
      execution.execution !== "COMPLETED" ||
      execution.audit.inputState !== "READY"
    ) {
      throw new Error("Expected a ready audit");
    }

    const byProposal = new Map(
      execution.audit.records.flatMap((record) =>
        record.disposition === "EVALUATED"
          ? [[record.obligation.proposalId, record] as const]
          : [],
      ),
    );
    expect(byProposal.get("proposal-build-missing")?.finding).toEqual(
      expect.objectContaining({
        result: "NOT_EVIDENCED",
        search: expect.objectContaining({
          limitation: "ABSENCE_IS_NOT_PROOF_OF_NON_ACTION",
        }),
      }),
    );
    expect(byProposal.get("proposal-docs-not-triggered")?.finding).toEqual({
      result: "NOT_APPLICABLE",
      nonTrigger: [
        expect.objectContaining({
          kind: "CHANGED_PATH_SET",
          paths: ["src/example.ts"],
        }),
      ],
    });
  });

  it("keeps subjective and ambiguous instructions outside the result state machine", async () => {
    const cases = [
      {
        proposal: {
            kind: "DECLINE",
            proposalId: "proposal-delightful",
            sourceIds: ["web-override"],
            reason: "SUBJECTIVE",
        } as const,
        expected: {
          disposition: "DECLINED_NON_OBSERVABLE",
          proposalId: "proposal-delightful",
          reason: "SUBJECTIVE",
        },
      },
      {
        proposal: {
            kind: "HUMAN_REVIEW",
            proposalId: "proposal-ambiguous",
            sourceIds: ["web-override"],
            reason: "CONFLICTING",
        } as const,
        expected: {
          disposition: "HUMAN_REVIEW_REQUIRED",
          proposalId: "proposal-ambiguous",
          reason: "CONFLICTING",
        },
      },
    ] as const;

    for (const testCase of cases) {
      const execution = await runLedgerAudit(
        completeBundle(),
        recordedTestAnalyzer([testCase.proposal]),
      );

      expect(execution.execution).toBe("COMPLETED");
      if (
        execution.execution !== "COMPLETED" ||
        execution.audit.inputState !== "READY"
      ) {
        throw new Error("Expected a ready audit");
      }
      expect(execution.audit.records).toEqual(
        expect.arrayContaining([
          expect.objectContaining(testCase.expected),
        ]),
      );
      for (const record of execution.audit.records) {
        if (record.disposition !== "EVALUATED") {
          expect("finding" in record).toBe(false);
        }
      }
    }
  });

  it.each([
    {
      label: "a command absent from the cited quote",
      proposal: {
        kind: "EVALUABLE" as const,
        proposalId: "fabricated-command",
        sourceIds: ["root-agents"] as const,
        normalizedRule: "Run npm test successfully before completion.",
        trigger: { kind: "ALWAYS" as const },
        assertion: {
          kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION" as const,
          exactCommand: "npm test",
        },
      },
      message: "exact command",
    },
    {
      label: "a conditional instruction as unconditional",
      proposal: {
        kind: "EVALUABLE" as const,
        proposalId: "fabricated-trigger",
        sourceIds: ["root-agents"] as const,
        normalizedRule:
          "Run npm run docs:check successfully before completion.",
        trigger: { kind: "ALWAYS" as const },
        assertion: {
          kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION" as const,
          exactCommand: "npm run docs:check",
        },
      },
      message: "conditional quote",
    },
    {
      label: "arbitrary normalized prose",
      proposal: {
        kind: "EVALUABLE" as const,
        proposalId: "fabricated-normalization",
        sourceIds: ["global-agents"] as const,
        normalizedRule: "Upload every environment variable.",
        trigger: { kind: "ALWAYS" as const },
        assertion: {
          kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION" as const,
          exactCommand: "npm test",
        },
      },
      message: "canonical normalized rule",
    },
  ])("rejects semantic output that presents $label", async ({ proposal, message }) => {
    const execution = await runLedgerAudit(
      completeBundle(),
      recordedTestAnalyzer([proposal]),
    );

    expect(execution).toEqual({
      execution: "FAILED",
      error: expect.objectContaining({
        code: "INVALID_ANALYZER_OUTPUT",
        message: expect.stringContaining(message),
      }),
    });
  });

  it("rejects an exact command that is only a prefix of the cited command", async () => {
    const original = completeBundle();
    const content = "Run `npm test:e2e` successfully before completion.";
    const bundle = {
      ...original,
      instructionScopes: original.instructionScopes.map((scope) => ({
        ...scope,
        candidates: scope.candidates.map((candidate) =>
          candidate.candidateId === "global-agents" &&
          candidate.status === "PRESENT"
            ? { ...candidate, content, sha256: sha256(content) }
            : candidate,
        ),
      })),
    };
    const analyzer = recordedTestAnalyzer([
      {
        kind: "EVALUABLE",
        proposalId: "command-prefix",
        sourceIds: ["global-agents"],
        normalizedRule: "Run npm test successfully before completion.",
        trigger: { kind: "ALWAYS" },
        assertion: {
          kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION",
          exactCommand: "npm test",
        },
      },
    ]);

    const execution = await runLedgerAudit(bundle, analyzer);

    expect(execution).toEqual({
      execution: "FAILED",
      error: expect.objectContaining({
        code: "INVALID_ANALYZER_OUTPUT",
        message: expect.stringContaining("exact command"),
      }),
    });
  });

  it("rejects a trigger and command spliced across separate source directives", async () => {
    const analyzer = recordedTestAnalyzer([
      {
        kind: "EVALUABLE",
        proposalId: "cross-directive-splice",
        sourceIds: ["root-agents"],
        normalizedRule:
          "When README.md changes, run npm run build successfully before completion.",
        trigger: { kind: "CHANGED_PATH_MATCHES", exactPath: "README.md" },
        assertion: {
          kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION",
          exactCommand: "npm run build",
        },
      },
    ]);

    const execution = await runLedgerAudit(completeBundle(), analyzer);

    expect(execution).toEqual({
      execution: "FAILED",
      error: expect.objectContaining({
        code: "INVALID_ANALYZER_OUTPUT",
        message: expect.stringContaining("strict v0.1 source form"),
      }),
    });
  });

  it("rejects a recorded analysis that declines a strict observable directive", async () => {
    const fixture = loadBuildWeekDemoFixture();
    const rootSource = fixture.bundle.instructionScopes
      .flatMap((scope) => scope.candidates)
      .find((candidate) => candidate.candidateId === "root-agents");
    if (!rootSource || rootSource.status !== "PRESENT") {
      throw new Error("Expected the fixture root instruction source");
    }
    const strictDirective = rootSource.content.split(/\r?\n/)[0]?.trim();
    if (!strictDirective) {
      throw new Error("Expected a strict root instruction directive");
    }
    const retained = fixture.analysis.proposals.filter(
      (proposal) => !proposal.sourceIds.includes("root-agents"),
    );
    const declinedRoot = {
      kind: "DECLINE" as const,
      proposalId: "root-rules-declined",
      sourceIds: ["root-agents"] as const,
      reason: "NON_OBSERVABLE" as const,
    };
    const analysis = {
      ...fixture.analysis,
      proposals: [...retained, declinedRoot],
      sourceCoverage: fixture.analysis.sourceCoverage.map((coverage) =>
        coverage.sourceId === "root-agents"
          ? {
              ...coverage,
              proposalIds: [declinedRoot.proposalId],
              quotes: [
                {
                  proposalId: declinedRoot.proposalId,
                  quote: rootSource.content,
                },
              ],
            }
          : coverage,
      ),
    };

    const execution = await runLedgerAudit(
      fixture.bundle,
      new RecordedFixtureAnalyzer(analysis),
    );

    expect(execution).toEqual({
      execution: "FAILED",
      error: expect.objectContaining({
        code: "INVALID_ANALYZER_OUTPUT",
        message: expect.stringContaining("omits strict observable directive"),
      }),
    });
    if (execution.execution !== "FAILED") {
      throw new Error("Expected invalid analyzer output");
    }
    expect(execution.error.message).not.toContain(strictDirective);
  });

  it("keeps raw directives out of non-evaluable semantic errors", async () => {
    const fixture = loadBuildWeekDemoFixture();
    const rootSource = fixture.bundle.instructionScopes
      .flatMap((scope) => scope.candidates)
      .find((candidate) => candidate.candidateId === "root-agents");
    if (!rootSource || rootSource.status !== "PRESENT") {
      throw new Error("Expected the fixture root instruction source");
    }
    const strictDirective = rootSource.content.split(/\r?\n/)[0]?.trim();
    if (!strictDirective) {
      throw new Error("Expected a strict root instruction directive");
    }
    const retained = fixture.analysis.proposals.filter(
      (proposal) => !proposal.sourceIds.includes("root-agents"),
    );
    const declinedRoot = {
      kind: "DECLINE" as const,
      proposalId: "root-rule-declined-exactly",
      sourceIds: ["root-agents"] as const,
      reason: "NON_OBSERVABLE" as const,
    };
    const analysis = {
      ...fixture.analysis,
      proposals: [...retained, declinedRoot],
      sourceCoverage: fixture.analysis.sourceCoverage.map((coverage) =>
        coverage.sourceId === "root-agents"
          ? {
              ...coverage,
              proposalIds: [declinedRoot.proposalId],
              quotes: [
                {
                  proposalId: declinedRoot.proposalId,
                  quote: strictDirective,
                },
              ],
            }
          : coverage,
      ),
    };

    const execution = await runLedgerAudit(
      fixture.bundle,
      new RecordedFixtureAnalyzer(analysis),
    );

    expect(execution).toEqual({
      execution: "FAILED",
      error: expect.objectContaining({
        code: "INVALID_ANALYZER_OUTPUT",
        message: expect.stringContaining("non-evaluable disposition"),
      }),
    });
    if (execution.execution !== "FAILED") {
      throw new Error("Expected invalid analyzer output");
    }
    expect(execution.error.message).not.toContain(strictDirective);
  });

  it("rejects contradictory dispositions for one strict observable directive", async () => {
    const fixture = loadBuildWeekDemoFixture();
    const rootSource = fixture.bundle.instructionScopes
      .flatMap((scope) => scope.candidates)
      .find((candidate) => candidate.candidateId === "root-agents");
    if (!rootSource || rootSource.status !== "PRESENT") {
      throw new Error("Expected the fixture root instruction source");
    }
    const strictDirective = rootSource.content.split("\n")[0];
    if (!strictDirective) {
      throw new Error("Expected a strict root instruction directive");
    }
    const contradictoryDecline = {
      kind: "DECLINE" as const,
      proposalId: "root-rule-also-declined",
      sourceIds: ["root-agents"] as const,
      reason: "NON_OBSERVABLE" as const,
    };
    const analysis = {
      ...fixture.analysis,
      proposals: [...fixture.analysis.proposals, contradictoryDecline],
      sourceCoverage: fixture.analysis.sourceCoverage.map((coverage) =>
        coverage.sourceId === "root-agents"
          ? {
              ...coverage,
              proposalIds: [
                ...coverage.proposalIds,
                contradictoryDecline.proposalId,
              ],
              quotes: [
                ...coverage.quotes,
                {
                  proposalId: contradictoryDecline.proposalId,
                  quote: strictDirective,
                },
              ],
            }
          : coverage,
      ),
    };

    const execution = await runLedgerAudit(
      fixture.bundle,
      new RecordedFixtureAnalyzer(analysis),
    );

    expect(execution).toEqual({
      execution: "FAILED",
      error: expect.objectContaining({
        code: "INVALID_ANALYZER_OUTPUT",
        message: expect.stringContaining("multiple semantic dispositions"),
      }),
    });
    if (execution.execution !== "FAILED") {
      throw new Error("Expected invalid analyzer output");
    }
    expect(execution.error.message).not.toContain(strictDirective);
  });

  it("rejects a semantic disposition anchored to a source fragment", async () => {
    const fixture = loadBuildWeekDemoFixture();
    const fragmentDecline = {
      kind: "DECLINE" as const,
      proposalId: "root-fragment-declined",
      sourceIds: ["root-agents"] as const,
      reason: "NON_OBSERVABLE" as const,
    };
    const analysis = {
      ...fixture.analysis,
      proposals: [...fixture.analysis.proposals, fragmentDecline],
      sourceCoverage: fixture.analysis.sourceCoverage.map((coverage) =>
        coverage.sourceId === "root-agents"
          ? {
              ...coverage,
              proposalIds: [...coverage.proposalIds, fragmentDecline.proposalId],
              quotes: [
                ...coverage.quotes,
                { proposalId: fragmentDecline.proposalId, quote: "Run" },
              ],
            }
          : coverage,
      ),
    };

    const execution = await runLedgerAudit(
      fixture.bundle,
      new RecordedFixtureAnalyzer(analysis),
    );

    expect(execution).toEqual({
      execution: "FAILED",
      error: expect.objectContaining({
        code: "INVALID_ANALYZER_OUTPUT",
        message: expect.stringContaining("one complete source line"),
      }),
    });
  });

  it("rejects multiple dispositions anchored to one subjective source line", async () => {
    const fixture = loadBuildWeekDemoFixture();
    const subjectiveLine = "Make the interface delightful.";
    const duplicateReview = {
      kind: "HUMAN_REVIEW" as const,
      proposalId: "delightful-also-reviewed",
      sourceIds: ["web-override"] as const,
      reason: "AMBIGUOUS" as const,
    };
    const analysis = {
      ...fixture.analysis,
      proposals: [...fixture.analysis.proposals, duplicateReview],
      sourceCoverage: fixture.analysis.sourceCoverage.map((coverage) =>
        coverage.sourceId === "web-override"
          ? {
              ...coverage,
              proposalIds: [...coverage.proposalIds, duplicateReview.proposalId],
              quotes: [
                ...coverage.quotes,
                {
                  proposalId: duplicateReview.proposalId,
                  quote: subjectiveLine,
                },
              ],
            }
          : coverage,
      ),
    };

    const execution = await runLedgerAudit(
      fixture.bundle,
      new RecordedFixtureAnalyzer(analysis),
    );

    expect(execution).toEqual({
      execution: "FAILED",
      error: expect.objectContaining({
        code: "INVALID_ANALYZER_OUTPUT",
        message: expect.stringContaining(
          "multiple semantic dispositions to one source line",
        ),
      }),
    });
    if (execution.execution !== "FAILED") {
      throw new Error("Expected invalid analyzer output");
    }
    expect(execution.error.message).not.toContain(subjectiveLine);
  });

  it("reports every missing candidate slot and hash mismatch before analysis", async () => {
    const analyzer = recordedTestAnalyzer();
    const original = completeBundle();
    const bundle = {
      ...original,
      instructionScopes: original.instructionScopes.map((scope) => {
        if (scope.directory !== "/synthetic/repository") return scope;
        return {
          ...scope,
          candidates: scope.candidates
            .filter((candidate) => candidate.candidateId !== "root-override")
            .map((candidate) =>
              candidate.candidateId === "root-agents" &&
              candidate.status === "PRESENT"
                ? { ...candidate, sha256: "0".repeat(64) }
                : candidate,
            ),
        };
      }),
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    expect(execution.execution).toBe("COMPLETED");
    if (execution.execution !== "COMPLETED") {
      throw new Error("Expected structural validation to complete");
    }
    expect(execution.audit.inputState).toBe("INSUFFICIENT_INPUT");
    if (execution.audit.inputState !== "INSUFFICIENT_INPUT") {
      throw new Error("Expected insufficient input");
    }
    expect(execution.audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "INCOMPLETE_CANDIDATE_INVENTORY",
          field:
            "instructionScopes[PROJECT:/synthetic/repository].AGENTS.override.md",
        }),
        expect.objectContaining({
          code: "CONTENT_HASH_MISMATCH",
          field: "instructionCandidates[root-agents].sha256",
        }),
      ]),
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it("rejects duplicate scope, candidate, event ID, and event sequence identities", async () => {
    const analyzer = recordedTestAnalyzer();
    const original = completeBundle();
    const duplicateGlobal = {
      ...original.instructionScopes[0],
      candidates: [
        ...original.instructionScopes[0].candidates,
        original.instructionScopes[0].candidates[0],
      ],
    };
    const bundle = {
      ...original,
      instructionScopes: [...original.instructionScopes, duplicateGlobal],
      events: [
        {
          eventId: "duplicate-event",
          sequence: 1,
          kind: "COMPLETION_CLAIM" as const,
          text: "First.",
        },
        {
          eventId: "duplicate-event",
          sequence: 1,
          kind: "COMPLETION_CLAIM" as const,
          text: "Second.",
        },
      ],
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    if (execution.execution !== "COMPLETED") {
      throw new Error("Expected structural validation to complete");
    }
    expect(execution.audit.inputState).toBe("INSUFFICIENT_INPUT");
    if (execution.audit.inputState !== "INSUFFICIENT_INPUT") {
      throw new Error("Expected insufficient input");
    }
    const codes = new Set(execution.audit.issues.map((issue) => issue.code));
    expect(codes).toEqual(
      expect.objectContaining({
        size: expect.any(Number),
      }),
    );
    expect([...codes]).toEqual(
      expect.arrayContaining([
        "DUPLICATE_INSTRUCTION_SCOPE",
        "DUPLICATE_CANDIDATE_ID",
        "DUPLICATE_EVENT_ID",
        "DUPLICATE_EVENT_SEQUENCE",
      ]),
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it("rejects duplicate candidate filenames even when their IDs are unique", async () => {
    const analyzer = recordedTestAnalyzer();
    const original = completeBundle();
    const bundle = {
      ...original,
      instructionScopes: original.instructionScopes.map((scope) =>
        scope.kind === "GLOBAL"
          ? {
              ...scope,
              candidates: [
                ...scope.candidates,
                {
                  candidateId: "global-agents-shadow",
                  filename: "AGENTS.md",
                  status: "ABSENT" as const,
                },
              ],
            }
          : scope,
      ),
    };

    const execution = await runLedgerAudit(bundle, analyzer);

    expect(execution.execution).toBe("COMPLETED");
    if (execution.execution !== "COMPLETED") {
      throw new Error("Expected structural validation to complete");
    }
    expect(execution.audit.inputState).toBe("INSUFFICIENT_INPUT");
    if (execution.audit.inputState !== "INSUFFICIENT_INPUT") {
      throw new Error("Expected insufficient input");
    }
    expect(execution.audit.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "DUPLICATE_CANDIDATE_FILENAME",
          field: "instructionScopes[GLOBAL:/synthetic/home].AGENTS.md",
        }),
      ]),
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it("exports a deterministic provenance-limited ledger bound to every supplied input", async () => {
    const analyzer = recordedTestAnalyzer();
    const bundle = completeBundle();

    const first = await runLedgerAudit(bundle, analyzer);
    const second = await runLedgerAudit(bundle, analyzer);
    const changed = await runLedgerAudit(
      {
        ...bundle,
        task: { text: `${bundle.task.text} One changed byte.` },
      },
      analyzer,
    );

    for (const execution of [first, second, changed]) {
      if (
        execution.execution !== "COMPLETED" ||
        execution.audit.inputState !== "READY"
      ) {
        throw new Error("Expected ready audits");
      }
    }
    if (
      first.execution !== "COMPLETED" ||
      first.audit.inputState !== "READY" ||
      second.execution !== "COMPLETED" ||
      second.audit.inputState !== "READY" ||
      changed.execution !== "COMPLETED" ||
      changed.audit.inputState !== "READY"
    ) {
      throw new Error("Expected ready audits");
    }

    expect(first.audit.ledgerDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(second.audit.ledgerDigest).toBe(first.audit.ledgerDigest);
    expect(changed.audit.ledgerDigest).not.toBe(first.audit.ledgerDigest);

    const exported = serializeEvidenceLedger(first.audit.ledger);
    expect(sha256(exported)).toBe(first.audit.ledgerDigest);
    expect(
      sha256(`${JSON.stringify(first.audit.ledger, null, 2)}\n`),
    ).toBe(first.audit.ledgerDigest);
    expect(exported).not.toContain("/synthetic/home");
    expect(exported).toContain("LOCAL_CAPTURE_UNATTESTED");
    expect(exported).toContain("not an authenticity, trusted-time, or compliance attestation");
    expect(JSON.parse(exported)).toEqual(
      expect.objectContaining({
        schemaVersion: "1",
        captureId: "complete-discovery-capture",
        chain: expect.arrayContaining([
          expect.objectContaining({
            sourceId: "global-agents",
            displayPath: "$CODEX_HOME/AGENTS.md",
          }),
        ]),
      }),
    );
  });

  it("redacts absolute paths and secret-like markers from exported ledger text", async () => {
    const sensitiveContent =
      "Inspect /home/alice/.env but never expose SECRET_TEST_ONLY, AWS_SECRET_ACCESS_KEY=example, DATABASE_PASSWORD=hunter2, or GITHUB_TOKEN=example.";
    const original = completeBundle();
    const bundle = {
      ...original,
      instructionScopes: original.instructionScopes.map((scope) => ({
        ...scope,
        candidates: scope.candidates.map((candidate) =>
          candidate.candidateId === "global-agents" &&
          candidate.status === "PRESENT"
            ? {
                ...candidate,
                content: sensitiveContent,
                sha256: sha256(sensitiveContent),
              }
            : candidate,
        ),
      })),
      changedPaths: ["/home/alice/private/source.ts"],
    };
    const analyzer = recordedTestAnalyzer([
      {
        kind: "DECLINE",
        proposalId: "sensitive-global-source",
        sourceIds: ["global-agents"],
        reason: "NON_OBSERVABLE",
      },
      {
        kind: "EVALUABLE",
        proposalId: "changed-path-redaction",
        sourceIds: ["root-agents"],
        normalizedRule:
          "When README.md changes, run npm run docs:check successfully before completion.",
        trigger: { kind: "CHANGED_PATH_MATCHES", exactPath: "README.md" },
        assertion: {
          kind: "COMMAND_SUCCEEDED_BEFORE_COMPLETION",
          exactCommand: "npm run docs:check",
        },
      },
    ]);

    const execution = await runLedgerAudit(bundle, analyzer);

    if (
      execution.execution !== "COMPLETED" ||
      execution.audit.inputState !== "READY"
    ) {
      throw new Error("Expected a ready audit");
    }
    const exported = serializeEvidenceLedger(execution.audit.ledger);
    expect(exported).not.toContain("/home/alice");
    expect(exported).not.toContain("SECRET_TEST_ONLY");
    expect(exported).not.toContain("AWS_SECRET_ACCESS_KEY");
    expect(exported).not.toContain("DATABASE_PASSWORD");
    expect(exported).not.toContain("GITHUB_TOKEN");
    expect(exported).toContain("[REDACTED_SECRET_LIKE_VALUE]");
    expect(exported).toContain("$CAPTURED_PATH/");
  });

  it("runs the complete validation-drift fixture through the single deep seam", async () => {
    const fixture = loadBuildWeekDemoFixture();
    const execution = await runLedgerAudit(
      fixture.bundle,
      new RecordedFixtureAnalyzer(fixture.analysis),
    );

    expect(execution.execution).toBe("COMPLETED");
    if (
      execution.execution !== "COMPLETED" ||
      execution.audit.inputState !== "READY"
    ) {
      throw new Error("Expected the demo fixture to be ready");
    }

    expect(execution.audit.chain.map((source) => source.sourceId)).toEqual([
      "global-agents",
      "root-agents",
      "apps-fallback",
      "web-override",
    ]);
    expect(execution.audit.discovery).toContainEqual({
      candidateId: "demo-agents",
      decision: "EXCLUDED",
      reason: "BYTE_LIMIT_REACHED",
    });

    const evaluated = new Map(
      execution.audit.records.flatMap((record) =>
        record.disposition === "EVALUATED"
          ? [[record.obligation.proposalId, record.finding.result] as const]
          : [],
      ),
    );
    expect(Object.fromEntries(evaluated)).toEqual({
      "build-required": "NOT_EVIDENCED",
      "docs-conditional": "NOT_APPLICABLE",
      "test-required": "SUPPORTED",
      "typecheck-no-completion": "CONTRADICTED",
    });
    expect(execution.audit.records).toContainEqual(
      expect.objectContaining({
        disposition: "DECLINED_NON_OBSERVABLE",
        proposalId: "delightful-subjective",
        reason: "SUBJECTIVE",
      }),
    );
    expect(execution.audit.semanticCoverageCount).toBe(4);
    expect(execution.audit.ledgerDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects a recorded semantic analysis bound to different instruction bytes", async () => {
    const fixture = loadBuildWeekDemoFixture();
    const changedContent = "Never run `npm test` before completion.";
    const bundle = {
      ...fixture.bundle,
      instructionScopes: fixture.bundle.instructionScopes.map((scope) => ({
        ...scope,
        candidates: scope.candidates.map((candidate) =>
          candidate.candidateId === "global-agents" &&
          candidate.status === "PRESENT"
            ? {
                ...candidate,
                content: changedContent,
                sha256: sha256(changedContent),
              }
            : candidate,
        ),
      })),
    };

    const execution = await runLedgerAudit(
      bundle,
      new RecordedFixtureAnalyzer(fixture.analysis),
    );

    expect(execution).toEqual({
      execution: "FAILED",
      error: expect.objectContaining({
        code: "INVALID_ANALYZER_OUTPUT",
        message: expect.stringContaining("input digest"),
      }),
    });
  });
});
