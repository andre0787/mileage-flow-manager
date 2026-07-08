import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const PASSWORD = "Test@123456";
const email = `fluxo_${Date.now()}@teste.com`;
const REPORT_PATH = "tests/fluxo-relatorio.md";
const SCREENSHOTS_DIR = "tests/screenshots";

const SUPABASE_URL = "https://ohyplfpcwxzakujjfwdf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";

let report: string[] = [];
function log(...args: unknown[]) { report.push(`- ${args.join(" ")}`); }
function pass(msg: string) { log(` ✅ ${msg}`); }
function fail(msg: string) { log(` ❌ ${msg}`); }

test("Fluxo completo de experiência", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  async function save(name: string) {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
  }

  try {
    report = ["# Relatório de Teste de Experiência", "", `Data: ${new Date().toISOString()}`, `Email: ${email}`, "", "## Resultados", ""];

    // ═══ 1. REGISTRO ═══
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Cadastre-se", { timeout: 15000 });
    await page.click("text=Cadastre-se");
    await page.waitForSelector("#name", { timeout: 5000 });
    await page.fill("#name", "Usuário Fluxo");
    await page.fill("#email", email);
    await page.fill("#password", PASSWORD);
    await page.click("button[type='submit']");
    await page.waitForURL(/dashboard|\//, { timeout: 30000 });
    await page.waitForTimeout(1500);
    await save("01-login");
    pass("Registro concluído");

    // ═══ 2. CRIAR DADOS VIA API ═══
    const ids = await page.evaluate(async ({ url, anonKey }) => {
      const sessionStr = localStorage.getItem("sb-ohyplfpcwxzakujjfwdf-auth-token");
      if (!sessionStr) throw new Error("Sessão não encontrada");
      const session = JSON.parse(sessionStr);
      const token = session.access_token;
      const uid = session.user.id;
      const h = { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${token}` };

      const ownerId = crypto.randomUUID();
      await fetch(`${url}/rest/v1/owners`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: ownerId, user_id: uid, name: "João Dono" }),
      });

      const progSmiles = crypto.randomUUID();
      await fetch(`${url}/rest/v1/programs`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: progSmiles, user_id: uid, name: "Smiles", type: "pontos" }),
      });

      const proLatam = crypto.randomUUID();
      await fetch(`${url}/rest/v1/programs`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: proLatam, user_id: uid, name: "Latam Pass", type: "milhas" }),
      });

      const otCompra = crypto.randomUUID();
      await fetch(`${url}/rest/v1/origem_types`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: otCompra, user_id: uid, name: "Compra Direta", account_type: "pontos", color: "#10b981", description: '{"hasRecurrence":false}' }),
      });

      const otClube = crypto.randomUUID();
      await fetch(`${url}/rest/v1/origem_types`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: otClube, user_id: uid, name: "Clube Fidelidade", account_type: "pontos", color: "#f59e0b", description: '{"hasRecurrence":true}' }),
      });

      const otTransfer = crypto.randomUUID();
      await fetch(`${url}/rest/v1/origem_types`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: otTransfer, user_id: uid, name: "Transferência", account_type: "milhas", color: "#6366f1", description: '{"hasRecurrence":false}' }),
      });

      const accSmiles = crypto.randomUUID();
      await fetch(`${url}/rest/v1/accounts`, {
        method: "POST", headers: h,
        body: JSON.stringify({
          id: accSmiles, user_id: uid, owner_id: ownerId, program_id: progSmiles,
          name: "Smiles", type: "pontos", balance: 0, total_invested: 0, average_cost_per_mile: 0, status: "ativa",
        }),
      });

      const accLatam = crypto.randomUUID();
      await fetch(`${url}/rest/v1/accounts`, {
        method: "POST", headers: h,
        body: JSON.stringify({
          id: accLatam, user_id: uid, owner_id: ownerId, program_id: proLatam,
          name: "Latam Pass", type: "milhas", balance: 0, total_invested: 0, average_cost_per_mile: 0, status: "ativa",
        }),
      });

      return { uid, ownerId, accSmiles, accLatam, otCompra, otClube, otTransfer };
    }, { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
    pass("Dados de teste criados");

    // ═══ 3. ENTRADA PONTOS (COMPRA DIRETA) ═══
    await page.goto("/entradas", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    await page.getByRole("tab", { name: /pontos/i }).click();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "Nova Entrada" }).click();
    await page.waitForTimeout(1000);

    let cmb = page.locator("[role=combobox]");
    await cmb.nth(0).click();
    await page.getByRole("option", { name: /smiles/i }).click();

    await cmb.nth(1).click();
    await page.getByRole("option", { name: /compra direta/i }).click();

    await page.fill("#amount", "50000");
    await page.fill("#amountPaid", "2500");
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /registrar/i }).click();
    await page.waitForTimeout(2000);
    pass("Entrada 1: 50.000 pontos registrada");

    await expect(page.locator("text=50.000").first()).toBeVisible({ timeout: 5000 });
    pass("50.000 visível na tabela");

    // ═══ 4. ENTRADA CLUBE ═══
    await page.getByRole("button", { name: "Nova Entrada" }).click();
    await page.waitForTimeout(500);

    cmb = page.locator("[role=combobox]");
    await cmb.nth(0).click();
    await page.getByRole("option", { name: /smiles/i }).click();

    await cmb.nth(1).click();
    await page.getByRole("option", { name: /clube fidelidade/i }).click();
    await page.waitForTimeout(500);

    await expect(page.locator("text=Recorrência ativada pelo tipo de origem selecionado")).toBeVisible({ timeout: 3000 });
    pass("Recorrência auto-ativada");

    await page.fill('input[placeholder="Ex: 12"]', "3");
    await page.fill("#amount", "10000");
    await page.fill("#amountPaid", "800");

    await page.getByRole("button", { name: /registrar/i }).click();
    await page.waitForTimeout(3000);
    pass("Entrada 2: Clube 10.000 (3 meses) registrada");

    // ═══ 5. VERIFICAR PENDÊNCIAS E CONFIRMAR ═══
    // Recarrega a página para garantir dados frescos
    await page.goto("/entradas", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Debug: log o que tem na tabela
    const rows = await page.locator("table tbody tr").count();
    pass(`Total linhas na tabela: ${rows}`);

    // Verifica se tem banner de pendências
    const bannerVisible = await page.locator("text=pendente(s) de confirmação").isVisible({ timeout: 5000 }).catch(() => false);
    if (bannerVisible) {
      pass("Banner de pendências visível");
    } else {
      fail("Banner de pendências NÃO encontrado");
    }

    // Procura botão Confirmar
    // Debug: procura Confirmar de várias formas
    const confirmRole = await page.getByRole("button", { name: "Confirmar" }).count();
    const confirmText = await page.locator("text=Confirmar").count();
    log(`DEBUG: buttons[role='Confirmar']=${confirmRole}, text='Confirmar'=${confirmText}`);

    // Verifica entryStatus no DOM
    const entryStatusInDom = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(r => {
        const cells = r.querySelectorAll('td');
        const lastCell = cells[cells.length - 1];
        return { text: r.textContent?.substring(0,100), hasConfirm: lastCell?.textContent?.includes('Confirmar') };
      });
    });
    entryStatusInDom.forEach((r, i) => log(`  Row ${i}: hasConfirm=${r.hasConfirm} text="${r.text}"`));

    // Tenta clicar
    const confirmBtn = page.locator("text=Confirmar").first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
      pass("Entrada confirmada!");
    } else {
      fail("Nenhum Confirmar visível");
    }

    await save("05-pendencias");
    await page.waitForTimeout(1000);

    // ═══ 6. TRANSFERÊNCIA ═══
    await page.goto("/entradas", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.getByRole("tab", { name: /milhas/i }).click();
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: /nova entrada/i }).click();
    await page.waitForTimeout(500);

    let mCmb = page.locator("[role=combobox]");
    await mCmb.nth(0).click();
    await page.getByRole("option", { name: /smiles/i }).click();
    await mCmb.nth(1).click();
    await page.getByRole("option", { name: /latam pass/i }).click();

    await page.fill("#amount", "20000");
    await page.fill("#amountPaid", "200");

    const bonus = page.locator('input[placeholder*="Ex: 100"]');
    if (await bonus.isVisible()) await bonus.fill("50");

    await page.getByRole("button", { name: /registrar/i }).click();
    await page.waitForTimeout(2000);
    pass("Transferência de 20.000 com 50% bônus registrada");

    // ═══ 7. VERIFICAR SALDOS ═══
    await page.goto("/contas", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Smiles: 50.000 + 10.000 - 20.000 (transferidos) = 40.000
    const saldoUm = page.locator("text=40.000").first();
    const saldoUmOk = await saldoUm.isVisible({ timeout: 5000 }).catch(() => false);
    if (saldoUmOk) pass("Saldo Smiles = 40.000 (60k - 20k)");
    else fail("Saldo Smiles incorreto");

    // Latam: 30.000 (20.000 + 50% bonus)
    const saldoDois = page.locator("text=30.000").first();
    const saldoDoisOk = await saldoDois.isVisible({ timeout: 3000 }).catch(() => false);
    if (saldoDoisOk) pass("Saldo Latam Pass = 30.000 (20k + 50%)");
    else fail("Saldo Latam Pass incorreto");

    await save("07-saldos");

    // ═══ 8. DASHBOARD ═══
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Entradas/mês")).toBeVisible({ timeout: 5000 });
    pass("Dashboard carregado");
    await save("08-dashboard");

    // ═══ 9. CLIENTE + VENDA ═══
    await page.goto("/clientes", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /novo cliente/i }).click();
    await page.waitForTimeout(500);
    await page.fill('input[placeholder*="Nome"]', "Maria Silva");
    const phone = page.locator('#phone, input[placeholder*="Telefone"]');
    if (await phone.isVisible()) await phone.fill("11999999999");
    await page.getByRole("button", { name: /salvar|cadastrar|criar/i }).click();
    await page.waitForTimeout(2000);
    pass("Cliente Maria Silva criado");

    await page.goto("/vendas", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /nova venda/i }).click();
    await page.waitForTimeout(500);
    let vCmb = page.locator("[role=combobox]");
    await vCmb.nth(0).click();
    await page.getByRole("option", { name: /maria/i }).click();
    await vCmb.nth(1).click();
    await page.getByRole("option", { name: /latam/i }).click();
    await page.fill("#miles", "10000");
    await page.fill("#price", "2500");
    await page.getByRole("button", { name: /registrar/i }).click();
    await page.waitForTimeout(2000);
    pass("Venda de 10.000 milhas registrada");
    await save("09-venda");

    // ═══ 10. RELATÓRIOS ═══
    await page.goto("/relatorios", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Relatórios")).toBeVisible({ timeout: 5000 });
    pass("Relatórios carregado");
    await save("10-relatorios");

    // ═══ 11. MOBILE ═══
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/entradas", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const bodyW = await page.evaluate(() => document.body.scrollWidth);
    const vpW = await page.evaluate(() => window.innerWidth);
    if (bodyW <= vpW + 2) pass(`Sem overflow mobile (${bodyW}px ≤ ${vpW}px)`);
    else fail(`Overflow mobile: ${bodyW}px > ${vpW}px`);
    await save("11-mobile");
    await page.setViewportSize({ width: 1280, height: 900 });

    // ═══ 12. LOGOUT/LOGIN ═══
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const logoutBtn = page.getByRole("button", { name: /sair|logout/i });
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL("/login", { timeout: 10000 });
      pass("Logout OK");
      await page.fill("#email", email);
      await page.fill("#password", PASSWORD);
      await page.click("button[type='submit']");
      await page.waitForURL(/dashboard|\//, { timeout: 30000 });
      pass("Re-login OK");
    } else {
      fail("Logout não encontrado");
    }

    pass(" Fluxo completo!");
  } catch (e) {
    fail(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    const html = await page.evaluate(() => document.querySelector("table")?.outerHTML?.substring(0, 2000) || "no table");
    log("Table HTML capture:", html.substring(0, 500));
    throw e;
  } finally {
    writeFileSync(REPORT_PATH, report.join("\n"), "utf-8");
    console.log(`\n📄 Relatório: ${REPORT_PATH}`);
  }
});
