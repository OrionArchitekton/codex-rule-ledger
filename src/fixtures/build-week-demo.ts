import captureManifest from "../../fixtures/build-week-demo-v1/capture-manifest.json";
import diff from "../../fixtures/build-week-demo-v1/diff.json";
import semanticAnalysis from "../../fixtures/build-week-demo-v1/semantic-analysis.json";
import session from "../../fixtures/build-week-demo-v1/session.json";
import type { CaptureBundleV1, SemanticAnalysis } from "../ledger";
import {
  captureBundleSchema,
  parseSemanticAnalysis,
} from "../ledger/schemas";

export interface BuildWeekDemoFixture {
  bundle: CaptureBundleV1;
  analysis: SemanticAnalysis;
}

export function loadBuildWeekDemoFixture(): BuildWeekDemoFixture {
  const bundle: CaptureBundleV1 = captureBundleSchema.parse({
    ...captureManifest,
    ...diff,
    ...session,
  });
  const analysis: SemanticAnalysis = parseSemanticAnalysis(semanticAnalysis);

  return { bundle, analysis };
}
