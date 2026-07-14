import { executeBuildWeekLiveProof } from "../src/ledger/live-proof";

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY is required. Run this command only through the admitted dedicated secret scope.",
  );
}

const proof = await executeBuildWeekLiveProof({ apiKey });
process.stdout.write(`${JSON.stringify(proof, null, 2)}\n`);
