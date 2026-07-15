import type {
  SemanticAnalysis,
  SemanticAnalyzer,
} from "../contracts";
import { parseSemanticAnalysis } from "../schemas";

export class RecordedFixtureAnalyzer implements SemanticAnalyzer {
  readonly id: string;
  readonly #analysis: SemanticAnalysis;

  constructor(
    analysis: unknown,
    id = "recorded:build-week-demo-v1",
  ) {
    this.#analysis = parseSemanticAnalysis(analysis);
    this.id = id;
  }

  async analyze(): Promise<SemanticAnalysis> {
    return structuredClone(this.#analysis);
  }
}
