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

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  timeout: 60_000,
  workers: process.env.CI ? 2 : undefined,
  retries: 1,
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
    viewport: { width: 1280, height: 900 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
