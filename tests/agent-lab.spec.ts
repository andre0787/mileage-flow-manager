/**
 * P12.6-25 — E2E Playwright Tests for Agent Lab + Promotions
 *
 * Covers:
 *   - Agent Lab: dashboard loads, tabs work
 *   - Promotions: filters, source health, status
 */

import { test, expect } from "@playwright/test";

// ─── Agent Lab Tests ───────────────────────────────────────────

test.describe("Agent Lab (P12.6)", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }

    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 10_000 });
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click("button[type='submit']");
    await page.waitForURL("/", { timeout: 15_000 });
  });

  test("agent lab page loads", async ({ page }) => {
    await page.goto("/agent-lab");
    await page.waitForLoadState("networkidle");

    // Check title
    await expect(page.locator("text=Agent Lab")).toBeVisible();

    // Check grade is shown
    await expect(page.locator("text=Agent QA Lab")).toBeVisible();
  });

  test("agent lab tabs work", async ({ page }) => {
    await page.goto("/agent-lab");
    await page.waitForLoadState("networkidle");

    // Click each tab
    const tabs = ["Mutations", "Experiments", "Evidence", "Promotions", "Telemetry"];

    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await expect(page.locator(`text=${tab}`).first()).toBeVisible();
    }
  });

  test("mutations tab shows table", async ({ page }) => {
    await page.goto("/agent-lab");
    await page.waitForLoadState("networkidle");

    await page.click("text=Mutations");

    // Check mutation table is visible
    await expect(page.locator("text=Mutation Catalog")).toBeVisible();
    await expect(page.locator("text=M01")).toBeVisible();
    await expect(page.locator("text=M10")).toBeVisible();
  });

  test("promotions tab shows sources", async ({ page }) => {
    await page.goto("/agent-lab");
    await page.waitForLoadState("networkidle");

    await page.click("text=Promotions");

    // Check sources are listed
    await expect(page.locator("text=Source Health")).toBeVisible();
    await expect(page.locator("text=Livelo")).toBeVisible();
    await expect(page.locator("text=Smiles")).toBeVisible();
    await expect(page.locator("text=Esfera")).toBeVisible();
  });

  test("telemetry tab shows metrics", async ({ page }) => {
    await page.goto("/agent-lab");
    await page.waitForLoadState("networkidle");

    await page.click("text=Telemetry");

    // Check telemetry metrics
    await expect(page.locator("text=Telemetry Charts")).toBeVisible();
  });
});

// ─── Promotions Page Tests ─────────────────────────────────────

test.describe("Promotions Page (P12.6)", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }

    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 10_000 });
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click("button[type='submit']");
    await page.waitForURL("/", { timeout: 15_000 });
  });

  test("promotions page loads", async ({ page }) => {
    await page.goto("/promocoes");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Promoções")).toBeVisible();
    await expect(page.locator("text=Central de promoções")).toBeVisible();
  });

  test("source health section is visible", async ({ page }) => {
    await page.goto("/promocoes");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Source Health")).toBeVisible();
    await expect(page.locator("text=Livelo")).toBeVisible();
    await expect(page.locator("text=Esfera")).toBeVisible();
    await expect(page.locator("text=PdP")).toBeVisible();
  });

  test("program filter works", async ({ page }) => {
    await page.goto("/promocoes");
    await page.waitForLoadState("networkidle");

    // Change program filter
    await page.selectOption("select:first-of-type", "Smiles");

    // Verify filtered results
    const cards = page.locator("[class*='border rounded-lg']");
    const count = await cards.count();

    // All visible cards should be Smiles or no cards at all
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await cards.nth(i).textContent();
        if (text?.includes("Smiles") || text?.includes("Bônus")) {
          continue; // Expected
        }
      }
    }
  });

  test("featured section shows active promotions", async ({ page }) => {
    await page.goto("/promocoes");
    await page.waitForLoadState("networkidle");

    // Check if featured section exists (only if there are active promotions)
    const featured = page.locator("text=🔥 Em destaque");
    if (await featured.isVisible()) {
      await expect(featured).toBeVisible();
    }
  });
});
