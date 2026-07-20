import { test } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";
const email = `debug_${Date.now()}@teste.com`;

test("check entradas page error with auth", async ({ page }) => {
  page.on("console", msg => console.log("[console]", msg.type(), msg.text()));
  page.on("pageerror", err => console.log("[PAGE ERROR]", err.message));
  
  // Register new user
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5_000 });

  await page.fill("#name", "Debug User");
  await page.fill("#email", email);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");

  await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");

  // Now go to entradas
  await page.goto("/entradas");
  await page.waitForSelector("text=Entradas", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
  
  // Check for error indicators
  const bodyText = await page.textContent("body");
  if (bodyText && (bodyText.includes("erro") || bodyText.includes("Error") || bodyText.includes("undefined") || bodyText.includes("null"))) {
    console.log("[CONTENT ISSUE]", bodyText.substring(0, 2000));
  }
  
  console.log("[URL]", page.url());
  console.log("[TITLE]", await page.title());
});

// Cleanup
test.afterAll(async () => {
  // no cleanup needed for debug
});
