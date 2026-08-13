#!/usr/bin/env node

/**
 * verify-dark-ui.mjs — Verificação visual do dark mode (buscas e filtros).
 *
 * Sobe o app local (porta 8080, reusa servidor existente), registra um
 * usuário de teste, força o tema dark e audita cada página com filtros:
 *   • Vendas (OwnerFilter + status)
 *   • Relatórios (Período/Dono/Programa)
 *   • Entradas (busca + dono)
 *   • Controle CPF (programa + dono)
 *
 * Para cada combobox/input de busca imprime os estilos computados
 * (background com alpha, cor do texto) e salva screenshots em
 * /tmp/verify-dark/ para inspeção manual.
 *
 * Uso:
 *   npm run verify:dark                 # servidor local (reusa se ativo)
 *   BASE_URL=http://localhost:8080 npm run verify:dark
 *
 * Saída: linhas PASS/FAIL — exit 1 se qualquer checagem falhar.
 */

import { chromium } from "@playwright/test";
import { execSync, spawn } from "child_process";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const SHOTS = "/tmp/verify-dark";

function rgbaOf(color) {
  const m = String(color).match(/[\d.]+/g);
  if (!m) return { r: 0, g: 0, b: 0, a: 1 };
  const n = m.map(Number);
  return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 };
}

function isUp() {
  try {
    execSync(`curl -s -o /dev/null -w '%{http_code}' ${BASE_URL}`, { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

function startServer() {
  if (isUp()) {
    console.log(`ℹ️  Servidor já ativo em ${BASE_URL} — reutilizando`);
    return null;
  }
  console.log(`🚀 Subindo dev server (${BASE_URL})...`);
  const child = spawn("npm", ["run", "dev", "--", "--port", "8080", "--strictPort"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  // Espera até 30s
  for (let i = 0; i < 60; i++) {
    if (isUp()) return child;
    execSync("sleep 0.5");
  }
  throw new Error("Dev server não subiu em 30s");
}

async function registerUser(page) {
  const email = `dark_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@teste.com`;
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 15_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 10_000 });
  await page.fill("#name", "Verificação Dark UI");
  await page.fill("#email", email);
  await page.fill("#password", "Test@123456");
  await page.click("button[type='submit']");
  await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
}

async function ensureDark(page) {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if (!isDark) {
    await page.getByRole("button", { name: "Toggle theme" }).first().click({ force: true });
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"), {
      timeout: 5_000,
    });
    await page.waitForTimeout(450);
  }
}

function auditEl(label, styles) {
  const bg = rgbaOf(styles.bg);
  const fg = rgbaOf(styles.color);
  const translucid = bg.a < 1;
  const notWhite = bg.r + bg.g + bg.b < 650;
  const notBlack = bg.r + bg.g + bg.b > 20;
  const contrast = Math.abs(fg.r - bg.r) + Math.abs(fg.g - bg.g) + Math.abs(fg.b - bg.b) > 100;
  const ok = translucid && notWhite && notBlack && contrast;
  console.log(
    `${ok ? "✅" : "❌"} ${label}\n     bg=${styles.bg} color=${styles.color} blur=${styles.backdrop ? "sim" : "não"} → alpha=${bg.a} contraste=${contrast ? "ok" : "RUIM"}`,
  );
  return ok;
}

async function main() {
  const server = startServer();
  mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    baseURL: BASE_URL,
  });
  let allOk = true;

  try {
    await registerUser(page);
    await ensureDark(page);

    const targets = [
      { path: "/vendas", name: "vendas", combobox: 2 },
      { path: "/relatorios", name: "relatorios", combobox: 3 },
      { path: "/entradas", name: "entradas", combobox: 1 },
      { path: "/controle-cpf", name: "controle-cpf", combobox: 2 },
    ];

    for (const t of targets) {
      console.log(`\n── ${t.path} ──`);
      await page.goto(t.path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(600);

      // Buscas da página (SearchInput)
      const inputs = page.locator("[data-search-input] input");
      const inCount = await inputs.count();
      for (let i = 0; i < inCount; i++) {
        const styles = await inputs.nth(i).evaluate((el) => {
          const cs = window.getComputedStyle(el);
          return {
            bg: cs.backgroundColor,
            color: cs.color,
            backdrop: cs.backdropFilter || cs.webkitBackdropFilter || "",
          };
        });
        allOk = auditEl(`busca #${i}`, styles) && allOk;
      }
      if (inCount === 0) console.log(`⚠️  sem SearchInput em ${t.path}`);

      // Combobox (filtros)
      const combos = page.locator('[role="combobox"]');
      const cbCount = await combos.count();
      for (let i = 0; i < cbCount; i++) {
        const styles = await combos.nth(i).evaluate((el) => {
          const cs = window.getComputedStyle(el);
          return {
            bg: cs.backgroundColor,
            color: cs.color,
            backdrop: cs.backdropFilter || cs.webkitBackdropFilter || "",
          };
        });
        allOk = auditEl(`filtro #${i}`, styles) && allOk;
      }
      if (cbCount === 0) console.log(`⚠️  sem filtros em ${t.path}`);

      await page.screenshot({ path: `${SHOTS}/${t.name}.png`, fullPage: false });
      console.log(`📸 ${SHOTS}/${t.name}.png`);
    }
  } finally {
    await browser.close();
    if (server) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {}
    }
  }

  console.log(
    allOk
      ? "\n✅ Dark mode: filtros e buscas legíveis e translúcidos"
      : "\n❌ Problemas encontrados no dark mode",
  );
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error("❌ Erro na verificação:", e.message);
  process.exit(1);
});
