import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

test("a reviewer inspects the contradiction and exports the evidence ledger", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Codex Rule Ledger", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("LOCAL_CAPTURE_UNATTESTED")).toBeVisible();
  await expect(page.getByText("READY", { exact: true })).toBeVisible();
  await expect(page.getByText("Supported", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Contradicted", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Not evidenced", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Not applicable", { exact: true }).first(),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: /Do not claim completion after npm run typecheck fails/i,
    })
    .click();
  const inspector = page.getByRole("region", { name: "Evidence inspector" });
  await expect(inspector).toContainText("event-typecheck-failure");
  await expect(inspector).toContainText("event-completion");
  await expect(inspector).toContainText("apps/CODEX.md");

  await page.getByRole("button", { name: "Exceptions" }).click();
  await expect(
    page.getByRole("button", {
      name: /Run npm test successfully before completion/i,
    }),
  ).toBeHidden();
  await expect(
    page.getByRole("button", {
      name: /Do not claim completion after npm run typecheck fails/i,
    }),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export ledger" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^codex-rule-ledger-[a-f0-9]{12}\.json$/,
  );
  const downloadedPath = await download.path();
  if (!downloadedPath) throw new Error("Expected a local download path");
  const downloadedBytes = await readFile(downloadedPath);
  const downloadedDigest = createHash("sha256")
    .update(downloadedBytes)
    .digest("hex");
  expect(download.suggestedFilename()).toBe(
    `codex-rule-ledger-${downloadedDigest.slice(0, 12)}.json`,
  );
});
