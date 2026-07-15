import { runAuditBundleCli } from "../src/cli/audit-bundle";

async function main(): Promise<void> {
  const result = await runAuditBundleCli(process.argv.slice(2));
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}

void main().catch(() => {
  process.stderr.write("internal CLI failure\n");
  process.exitCode = 1;
});
