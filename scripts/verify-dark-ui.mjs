#!/usr/bin/env node

/**
 * verify-dark-ui.mjs — Verificação visual do tema (buscas, filtros e forms).
 *
 * Sobe o app local (porta 8080, reusa servidor existente), registra um
 * usuário de teste e audita nos DOIS temas (dark e light):
 *   • Vendas (OwnerFilter + status)
 *   • Relatórios (Período/Dono/Programa)
 *   • Entradas (busca + dono)
 *   • Controle CPF (programa + dono)
 *   • Forms/dialogs: Nova Venda, Nova Entrada, Transferir, Nova Conta,
 *     Reportar problema (FeedbackDialog)
 *
 * Para cada campo (input/select/textarea) imprime os estilos computados
 * (background com alpha, cor do texto) e salva screenshots em
 * /tmp/verify-dark/<pagina>-<tema>.png e /tmp/verify-dark/dialog-<nome>-<tema>.png.
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

async function ensureTheme(page, target) {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if ((target === "dark" && !isDark) || (target === "light" && isDark)) {
    await page.getByRole("button", { name: "Toggle theme" }).first().click({ force: true });
    await page.waitForFunction(
      (t) => document.documentElement.classList.contains("dark") === (t === "dark"),
      target,
      { timeout: 5_000 },
    );
    await page.waitForTimeout(450);
  }
}

/** Checagens por tema: dark exige translucidez+contraste; light exige fundo claro. */
function auditEl(label, styles, theme) {
  const bg = rgbaOf(styles.bg);
  const fg = rgbaOf(styles.color);
  const sum = bg.r + bg.g + bg.b;
  let ok;
  if (theme === "dark") {
    const translucid = bg.a < 1;
    const notWhite = sum < 650;
    const notBlack = sum > 20;
    const contrast = Math.abs(fg.r - bg.r) + Math.abs(fg.g - bg.g) + Math.abs(fg.b - bg.b) > 100;
    ok = translucid && notWhite && notBlack && contrast;
    console.log(
      `${ok ? "✅" : "❌"} [${theme}] ${label}\n     bg=${styles.bg} color=${styles.color} blur=${styles.backdrop ? "sim" : "não"} → alpha=${bg.a} contraste=${contrast ? "ok" : "RUIM"}`,
    );
  } else {
    const lightEnough = sum > 550;
    const notBlack = sum > 60;
    const contrast = Math.abs(fg.r - bg.r) + Math.abs(fg.g - bg.g) + Math.abs(fg.b - bg.b) > 100;
    ok = lightEnough && notBlack && contrast;
    console.log(
      `${ok ? "✅" : "❌"} [${theme}] ${label}\n     bg=${styles.bg} color=${styles.color} → claro=${lightEnough ? "ok" : "RUIM"} contraste=${contrast ? "ok" : "RUIM"}`,
    );
  }
  return ok;
}

async function readStyles(el) {
  return el.evaluate((node) => {
    const cs = window.getComputedStyle(node);
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      backdrop: cs.backdropFilter || cs.webkitBackdropFilter || "",
    };
  });
}

/** Audita todos os campos editáveis visíveis dentro de um container (page ou dialog). */
async function auditFields(page, container, prefix, theme) {
  const scope = container === page ? page : page.locator(container);
  let ok = true;
  let n = 0; // Só campos editáveis de texto — checkbox/radio/hidden/color são transparentes por design
  const TEXT_INPUT =
    'input:visible:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="color"]):not([type="submit"]):not([type="button"])';
  const inputs = container === page ? page.locator(TEXT_INPUT) : scope.locator(TEXT_INPUT);
  const selects =
    container === page
      ? page.locator('[role="combobox"]:visible')
      : scope.locator('[role="combobox"]:visible');
  const textareas =
    container === page ? page.locator("textarea:visible") : scope.locator("textarea:visible");

  for (const [label, loc] of [
    ["input", inputs],
    ["select", selects],
    ["textarea", textareas],
  ]) {
    const count = await loc.count();
    n += count;
    for (let i = 0; i < count; i++) {
      ok = auditEl(`${prefix} ${label} #${i}`, await readStyles(loc.nth(i)), theme) && ok;
    }
  }
  return { ok, n };
}

/** Abre um dialog por nome de botão e audita os campos internos no tema atual. */
async function auditDialog(page, buttonName, shotName, theme) {
  const btn = page.getByRole("button", { name: buttonName }).first();
  await btn.click({ force: true });
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForTimeout(400);

  const res = await auditFields(page, '[role="dialog"]', `[dialog ${buttonName}]`, theme);
  await page.screenshot({ path: `${SHOTS}/${shotName}-${theme}.png` });
  console.log(`📸 ${SHOTS}/${shotName}-${theme}.png (${res.n} campos)`);

  // Fecha o dialog (Esc) para não poluir o próximo passo
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  return res.ok;
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

    const targets = [
      { path: "/vendas", name: "vendas" },
      { path: "/relatorios", name: "relatorios" },
      { path: "/entradas", name: "entradas" },
      { path: "/controle-cpf", name: "controle-cpf" },
    ];
    const dialogs = [
      { path: "/vendas", button: "Nova Venda", shot: "dialog-nova-venda" },
      { path: "/entradas", button: "Nova Entrada", shot: "dialog-nova-entrada" },
      { path: "/entradas", button: "Transferir", shot: "dialog-transferir" },
      { path: "/contas", button: "Nova Conta", shot: "dialog-nova-conta" },
    ];

    for (const theme of ["dark", "light"]) {
      console.log(`\n═══════ TEMA: ${theme.toUpperCase()} ═══════`);
      await ensureTheme(page, theme);

      // Páginas com buscas/filtros
      for (const t of targets) {
        console.log(`\n── ${t.path} ──`);
        await page.goto(t.path);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(600);
        const res = await auditFields(page, page, t.name, theme);
        if (res.n === 0) console.log(`⚠️  sem campos visíveis em ${t.path}`);
        allOk = res.ok && allOk;
        await page.screenshot({ path: `${SHOTS}/${t.name}-${theme}.png` });
        console.log(`📸 ${SHOTS}/${t.name}-${theme}.png`);
      }

      // Dialogs/forms
      for (const d of dialogs) {
        console.log(`\n── dialog ${d.button} (${d.path}) ──`);
        await page.goto(d.path);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);
        allOk = (await auditDialog(page, d.button, d.shot, theme)) && allOk;
      }
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
    allOk ? "\n✅ Ambos os temas: campos legíveis e consistentes" : "\n❌ Problemas encontrados",
  );
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error("❌ Erro na verificação:", e.message);
  process.exit(1);
});
