import type {
  SemanticAnalysis,
  SemanticAnalyzer,
} from "../contracts";
import { parseSemanticAnalysis } from "../schemas";

export class RecordedFixtureAnalyzer implements SemanticAnalyzer {
  readonly id = "recorded:build-week-demo-v1";
  readonly #analysis: SemanticAnalysis;

  constructor(analysis: unknown) {
    this.#analysis = parseSemanticAnalysis(analysis);
  }

  async analyze(): Promise<SemanticAnalysis> {
    return structuredClone(this.#analysis);
  }
}
