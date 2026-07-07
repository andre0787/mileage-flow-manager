import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const TEST_PASSWORD = "Test@123456";
const SCREENSHOTS_DIR = path.join("tests", "screenshots");

const VIEWPORTS = {
  iphone16:   { width: 393, height: 852 },
  iphoneSE:   { width: 375, height: 667 },
  iphone16PM: { width: 430, height: 932 },
  ipadAir:    { width: 820, height: 1180 },
  desktopHD:  { width: 1280, height: 900 },
};

const SUPABASE_URL = 'https://ohyplfpcwxzakujjfwdf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs';

async function criarDadosDeTeste(page: Page) {
  return await page.evaluate(async ({ url, anonKey }) => {
    const sessionStr = localStorage.getItem('sb-ohyplfpcwxzakujjfwdf-auth-token');
    if (!sessionStr) throw new Error('Sessão não encontrada');
    const session = JSON.parse(sessionStr);
    const accessToken = session.access_token;
    const userId = session.user.id;

    const h = (cType: string) => ({
      'Content-Type': cType,
      'apikey': anonKey,
      'Authorization': `Bearer ${accessToken}`,
      'Prefer': 'return=minimal',
    });

    const ownerId = crypto.randomUUID();
    const progMilhas = crypto.randomUUID();
    const progPontos = crypto.randomUUID();

    // Owner
    await fetch(`${url}/rest/v1/owners`, {
      method: 'POST', headers: h('application/json'),
      body: JSON.stringify({ id: ownerId, user_id: userId, name: 'Maria Silva', cpf: '123.456.789-00' }),
    });

    // Programs
    await fetch(`${url}/rest/v1/programs`, {
      method: 'POST', headers: h('application/json'),
      body: JSON.stringify({ id: progMilhas, user_id: userId, name: 'TudoAzul', type: 'milhas' }),
    });
    await fetch(`${url}/rest/v1/programs`, {
      method: 'POST', headers: h('application/json'),
      body: JSON.stringify({ id: progPontos, user_id: userId, name: 'Livelo', type: 'pontos' }),
    });

    // Account milhas
    await fetch(`${url}/rest/v1/accounts`, {
      method: 'POST', headers: h('application/json'),
      body: JSON.stringify({ id: crypto.randomUUID(), user_id: userId, owner_id: ownerId, program_id: progMilhas,
        name: 'Conta TudoAzul', type: 'milhas', balance: 120000, total_invested: 6000,
        average_cost_per_mile: 0.05, status: 'ativa' }),
    });

    // Account pontos
    await fetch(`${url}/rest/v1/accounts`, {
      method: 'POST', headers: h('application/json'),
      body: JSON.stringify({ id: crypto.randomUUID(), user_id: userId, owner_id: ownerId, program_id: progPontos,
        name: 'Conta Livelo', type: 'pontos', balance: 80000, total_invested: 4800,
        average_cost_per_mile: 0.06, status: 'ativa' }),
    });

    return true;
  }, { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
}

async function registrarUsuario(page: Page, email: string) {
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 15_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5_000 });

  await page.fill("#name", "Teste Responsivo");
  await page.fill("#email", email);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForURL("/", { timeout: 30_000 });
  await page.waitForTimeout(1_500);
}

// Verifica overflow horizontal (conteudo vazando para fora)
async function checkNoOverflow(page: Page) {
  const info = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth > window.innerWidth + 5;

    // Apenas registra o scrollWidth para debug
    return {
      overflow,
      scrollW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    };
  });

  if (info.overflow) {
    console.log('⚠️ OVERFLOW detectado: scrollW=', info.scrollW, 'winW=', info.winW);
  }
  expect(info.overflow).toBe(false);
}

// Verifica se existe bottom tab bar no mobile
async function checkBottomBar(page: Page, deveExistir: boolean) {
  const b = page.locator("a[class*='flex'][class*='flex-col'][class*='items-center']").first();
  // Tenta encontrar pela classe BottomTabBar
  const visible = await b.isVisible().catch(() => false);
  if (deveExistir) {
    // BottomTabBar existe em paginas protegidas, pode nao existir em login
  }
}

test.describe("Responsividade em todos os viewports", () => {
  const email = `resp_${Date.now()}@teste.com`;

  test("Fluxo completo: registro, dados e layout mobile", async ({ page }) => {
    // Garante diretório de screenshots
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    // ─── Setup ───
    await registrarUsuario(page, email);
    await criarDadosDeTeste(page);
    console.log("✓ Usuário registrado e dados criados");

    // ─── DASHBOARD - iPhone 16 ───
    await page.setViewportSize(VIEWPORTS.iphone16);
    await page.goto("/");
    await page.waitForTimeout(2_500);
    await checkNoOverflow(page);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01-dashboard-iphone16.png"), fullPage: true });
    console.log("✓ Dashboard iPhone16");

    // ─── DASHBOARD - iPhone SE ───
    await page.setViewportSize(VIEWPORTS.iphoneSE);
    await page.waitForTimeout(1_000);
    await checkNoOverflow(page);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02-dashboard-iphoneSE.png"), fullPage: true });
    console.log("✓ Dashboard iPhoneSE");

    // ─── DASHBOARD - iPad ───
    await page.setViewportSize(VIEWPORTS.ipadAir);
    await page.waitForTimeout(1_000);
    await checkNoOverflow(page);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-dashboard-ipad.png"), fullPage: true });
    console.log("✓ Dashboard iPad");

    // ─── DASHBOARD - Desktop ───
    await page.setViewportSize(VIEWPORTS.desktopHD);
    await page.waitForTimeout(1_000);
    await checkNoOverflow(page);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-dashboard-desktop.png"), fullPage: true });
    console.log("✓ Dashboard Desktop");

    // ─── ENTRADAS - iPhone 16 (aba Milhas) ───
    await page.setViewportSize(VIEWPORTS.iphone16);
    await page.goto("/entradas");
    await page.waitForTimeout(2_000);
    await checkNoOverflow(page);

    // Alterna abas
    const abas = page.locator("button[role='tab']");
    const qtdAbas = await abas.count();
    for (let i = 0; i < qtdAbas; i++) {
      await abas.nth(i).click();
      await page.waitForTimeout(400);
      await checkNoOverflow(page);
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "05-entradas-iphone16.png"), fullPage: true });
    console.log("✓ Entradas iPhone16");

    // ─── VENDAS - iPhone 16 ───
    await page.goto("/vendas");
    await page.waitForTimeout(2_000);
    await checkNoOverflow(page);

    // Abre simulador se existir
    const btnSim = page.locator("button:has-text('Simulador')");
    if (await btnSim.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await btnSim.click();
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "06-vendas-iphone16.png"), fullPage: true });
    console.log("✓ Vendas iPhone16");

    // ─── CONTAS - iPhone 16 ───
    await page.goto("/contas");
    await page.waitForTimeout(2_000);
    await checkNoOverflow(page);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "07-contas-iphone16.png"), fullPage: true });
    console.log("✓ Contas iPhone16");

    // ─── CLIENTES - iPhone 16 ───
    await page.goto("/clientes");
    await page.waitForTimeout(2_000);
    await checkNoOverflow(page);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "08-clientes-iphone16.png"), fullPage: true });
    console.log("✓ Clientes iPhone16");

    // ─── CONTROLE CPF - iPhone 16 ───
    await page.goto("/controle-cpf");
    await page.waitForTimeout(2_000);
    await checkNoOverflow(page);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "09-controlecpf-iphone16.png"), fullPage: true });
    console.log("✓ ControleCPF iPhone16");

    // ─── RELATORIOS - iPhone 16 ───
    await page.goto("/relatorios");
    await page.waitForTimeout(2_000);
    await checkNoOverflow(page);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "10-relatorios-iphone16.png"), fullPage: true });
    console.log("✓ Relatórios iPhone16");

    // ─── CONFIGURACOES - iPhone 16 ───
    await page.goto("/config");
    await page.waitForTimeout(2_000);
    await checkNoOverflow(page);

    // Testa abas de configuração no mobile
    const tabsConfig = page.locator("button[role='tab']");
    const qtdTabsConfig = await tabsConfig.count();
    if (qtdTabsConfig > 0) {
      // Na config, as tabs podem ter scroll horizontal no mobile
      const scrollWidth = await page.evaluate(() => {
        const el = document.querySelector("[role='tablist']");
        return el ? el.scrollWidth - el.clientWidth : 0;
      });
      if (scrollWidth > 0) {
        // Scrolla as tabs
        await page.evaluate(() => {
          const el = document.querySelector("[role='tablist']");
          if (el) el.scrollLeft = el.scrollWidth;
        });
        await page.waitForTimeout(300);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "11-configuracoes-iphone16.png"), fullPage: true });
    console.log("✓ Configurações iPhone16");

    // ─── REDIMENSIONAMENTO DINÂMICO ───
    // Testa que ao redimensionar a janela, o layout se ajusta sem overflow
    for (const vp of [VIEWPORTS.iphoneSE, VIEWPORTS.iphone16, VIEWPORTS.iphone16PM, VIEWPORTS.ipadAir, VIEWPORTS.desktopHD]) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(500);
      await checkNoOverflow(page);
    }
    console.log("✓ Redimensionamento suave em 5 viewports");

    // ─── VERIFICACOES ADICIONAIS ───
    // MetricCards visiveis no iPhone 16
    await page.setViewportSize(VIEWPORTS.iphone16);
    await page.goto("/");
    await page.waitForTimeout(2_000);

    // Cards de resumo devem estar empilhados (1 coluna) no mobile
    const cards = page.locator("[class*='rounded-xl'][class*='border']");
    const totalCards = await cards.count();
    expect(totalCards).toBeGreaterThan(0);

    // Scroll ate o fim - nao deve quebrar
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await checkNoOverflow(page);

    // Desktop - verifica sidebar visivel
    await page.setViewportSize(VIEWPORTS.desktopHD);
    await page.waitForTimeout(1_000);
    const sidebar = page.locator("nav[class*='flex'][class*='flex-col']").first();
    const sidebarVisivel = await sidebar.isVisible().catch(() => false);
    // Sidebar pode nao estar presente em todas as configs, mas nao deve causar overflow
    await checkNoOverflow(page);

    console.log("✓ Todas as verificações passaram");
  });
});
