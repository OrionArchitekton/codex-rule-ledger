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

test("a reviewer switches between truthful recorded cases without stale state", async ({
  page,
}) => {
  await page.goto("/");

  const caseOne = page.getByRole("button", {
    name: /Case 001.*Validation drift/i,
  });
  const caseTwo = page.getByRole("button", {
    name: /Case 002.*Retry recovery/i,
  });

  await expect(caseOne).toHaveAttribute("aria-pressed", "true");
  const masthead = page.locator("header.masthead");
  await expect(masthead.getByText("Case 001", { exact: true })).toBeVisible();
  await expect(masthead.getByText("Validation drift", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Exceptions" }).click();
  await expect(page.getByRole("button", { name: "Exceptions" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await caseTwo.click();

  await expect(caseTwo).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("SYNTHETIC_SANITIZED", { exact: true })).toBeVisible();
  await expect(page.getByText(/not a captured real session/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "All" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByText("3 sources", { exact: true })).toBeVisible();
  await expect(page.getByText("6 extracted", { exact: true })).toBeVisible();

  const recoveredTypecheck = page.getByRole("button", {
    name: /Do not claim completion after npm run typecheck fails/i,
  });
  await expect(recoveredTypecheck).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("region", { name: "Evidence inspector" }),
  ).toContainText("typecheck-recovery");
  await expect(page.getByText("$PROJECT_ROOT/apps/web/demo/AGENTS.md")).toHaveCount(
    0,
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export ledger" }).click();
  const download = await downloadPromise;
  const downloadedPath = await download.path();
  if (!downloadedPath) throw new Error("Expected a local download path");
  const downloadedBytes = await readFile(downloadedPath);
  const downloadedDigest = createHash("sha256")
    .update(downloadedBytes)
    .digest("hex");
  expect(download.suggestedFilename()).toBe(
    `codex-rule-ledger-${downloadedDigest.slice(0, 12)}.json`,
  );

  await caseOne.click();

  await expect(caseOne).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "All" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("button", {
      name: /Do not claim completion after npm run typecheck fails/i,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("region", { name: "Evidence inspector" }),
  ).toContainText("event-completion");
});

test("the three-step judge tour follows the selected case story", async ({
  page,
}) => {
  await page.goto("/");

  const tour = page.getByRole("region", { name: "Three-step judge tour" });
  await expect(tour.getByRole("heading", { name: "Judge it in 60 seconds" })).toBeVisible();
  await expect(tour.getByRole("listitem")).toHaveCount(3);
  await expect(tour).toContainText("Read the reconstructed instruction chain");
  await expect(tour).toContainText("Open the contradicted typecheck rule");
  await expect(tour).toContainText("Export the digest-bound ledger");

  await page
    .getByRole("button", { name: /Case 002.*Retry recovery/i })
    .click();

  await expect(tour.getByRole("listitem")).toHaveCount(3);
  await expect(tour).toContainText(
    "Inspect retry recovery without a false contradiction",
  );
  await expect(tour).not.toContainText("Open the contradicted typecheck rule");
});

test("the outcome legend separates missing evidence from a verdict", async ({
  page,
}) => {
  await page.goto("/");

  const legend = page.getByRole("region", { name: "Outcome legend" });
  await expect(legend).toContainText("Supported");
  await expect(legend).toContainText("Contradicted");
  await expect(legend).toContainText("Not evidenced");
  await expect(legend).toContainText("Not applicable");
  await expect(legend).toContainText(
    "Neither failure nor compliance; the supplied evidence cannot support either verdict.",
  );
});

test("the recorded-case explorer remains usable at a mobile width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const caseTwo = page.getByRole("button", {
    name: /Case 002.*Retry recovery/i,
  });
  await expect(caseTwo).toBeVisible();
  await caseTwo.click();

  await expect(page.getByText("SYNTHETIC_SANITIZED", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Three-step judge tour" }),
  ).toContainText("Inspect retry recovery without a false contradiction");
  await expect(
    page.getByRole("region", { name: "Outcome legend" }),
  ).toContainText("Neither failure nor compliance");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
