import { defineConfig } from "@playwright/test";

// data-testid mapping (future: add to React components as flakiness factor)
// ═══════════════════════════════════════════════════════════════════════════
// login:       #email, #password, button[type='submit']
// cadastro:    #name, #email, #password, button[type='submit']
// combobox:    [role='combobox'], [role='option']
// dialog:      [role='dialog'], [role='alertdialog']
// tabs:        button[role='tab']
// tabelas:     table, th, td
// toast:       [data-sonner-toast]
// file inputs: input[type='file'], #photo
// ═══════════════════════════════════════════════════════════════════════════

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const IS_PRODUCTION_TEST = !!process.env.BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  timeout: 60_000,
  workers: process.env.CI ? 2 : undefined,
  // retries=2: absorve flaky transiente (rate-limit por IP do runner GitHub →
  // Supabase compartilhado); nightly roda serial com --workers=1
  retries: 2,
  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 900 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // Só inicia servidor local se não estiver testando contra produção
  ...(IS_PRODUCTION_TEST
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:8080",
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
      }),
});
