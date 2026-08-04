import { test, expect, type Page } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";
const SUPABASE_URL = "https://ohyplfpcwxzakujjfwdf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";

async function registerUser(page: Page) {
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5_000 });
  const email = `e2e_ux_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@teste.com`;
  await page.fill("#name", "Usuário UX E2E");
  await page.fill("#email", email);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
}

interface SeedResult {
  ownerAId: string;
  ownerBId: string;
  accountAId: string;
  accountBId: string;
  dates: string[];
}

/**
 * Cria 2 donos, 2 contas (milhas) e 25 entradas (25 na conta A, 1 na conta B)
 * com datas variadas — suficiente para paginação (20/página) e ordenação.
 */
async function seedEntries(page: Page): Promise<SeedResult> {
  return page.evaluate(
    async ({ url, anonKey }) => {
      const sessionStr = localStorage.getItem("sb-ohyplfpcwxzakujjfwdf-auth-token");
      if (!sessionStr) throw new Error("Sessão não encontrada");
      const session = JSON.parse(sessionStr);
      const accessToken = session.access_token;
      const userId = session.user.id;

      const headers = {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      };

      const post = async (table: string, body: Record<string, unknown>) => {
        const res = await fetch(`${url}/rest/v1/${table}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ ...body, user_id: userId }),
        });
        if (!res.ok) throw new Error(`Falha ao criar ${table}: ${await res.text()}`);
      };

      const ownerAId = crypto.randomUUID();
      const ownerBId = crypto.randomUUID();
      const programId = crypto.randomUUID();
      const otId = crypto.randomUUID();
      const accountAId = crypto.randomUUID();
      const accountBId = crypto.randomUUID();

      await post("owners", { id: ownerAId, name: "Dono Alfa", cpf: "111.111.111-11", phone: "(11) 90000-0001" });
      await post("owners", { id: ownerBId, name: "Dono Bravo", cpf: "222.222.222-22", phone: "(11) 90000-0002" });
      await post("programs", { id: programId, name: "Programa Teste", type: "milhas" });
      await post("origem_types", {
        id: otId,
        name: "Compra Direta",
        account_type: "milhas",
        color: "#10b981",
        description: '{"hasRecurrence":false}',
      });
      await post("accounts", {
        id: accountAId, owner_id: ownerAId, program_id: programId,
        name: "Conta Alfa", type: "milhas", balance: 50000, total_invested: 3500,
        average_cost_per_mile: 0.07, status: "ativa",
      });
      await post("accounts", {
        id: accountBId, owner_id: ownerBId, program_id: programId,
        name: "Conta Bravo", type: "milhas", balance: 10000, total_invested: 700,
        average_cost_per_mile: 0.07, status: "ativa",
      });

      // 25 entradas na conta A (datas espaçadas), 1 na conta B (hoje)
      const today = new Date();
      const iso = (offsetDays: number) => {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - offsetDays);
        return d.toISOString().split("T")[0];
      };
      const dates: string[] = [];
      for (let i = 0; i < 25; i++) {
        const date = iso(i * 2); // 0, 2, 4... 48 dias atrás
        dates.push(date);
        const amount = 1000 + i * 100;
        await post("entries", {
          id: crypto.randomUUID(),
          account_id: accountAId,
          origem_type_id: otId,
          date,
          amount,
          amount_paid: amount * 0.07,
          cost_per_mile: 0.07,
          miles_generated: amount,
          description: '{"entryStatus":"confirmada"}',
        });
      }
      await post("entries", {
        id: crypto.randomUUID(),
        account_id: accountBId,
        origem_type_id: otId,
        date: iso(0),
        amount: 999,
        amount_paid: 69.93,
        cost_per_mile: 0.07,
        miles_generated: 999,
        description: '{"entryStatus":"confirmada"}',
      });

      return { ownerAId, ownerBId, accountAId, accountBId, dates };
    },
    { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY },
  );
}

test.describe("UX Entradas/Vendas — regressões", () => {
  test("scroll com wheel do mouse funciona em página longa (regressão overflow-x)", async ({ page }) => {
    await registerUser(page);
    await seedEntries(page);
    await page.goto("/entradas");
    await page.waitForSelector("text=Histórico de Entradas", { timeout: 15_000 });
    await page.getByRole("tab", { name: "Milhas" }).click();
    await page.waitForSelector("tbody tr", { timeout: 10_000 });

    // sanity: scrollbar funciona
    await page.evaluate(() => window.scrollTo(0, 600));
    const viaScrollbar = await page.evaluate(() => window.scrollY);
    expect(viaScrollbar).toBeGreaterThan(0);

    // wheel do mouse deve rolar a viewport (regressão: overflow-x:hidden travava)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(300);
    const viaWheel = await page.evaluate(() => window.scrollY);
    expect(viaWheel).toBeGreaterThan(0);
  });

  test("ordenação por data (default desc) e toggle asc no header", async ({ page }) => {
    await registerUser(page);
    const { dates } = await seedEntries(page);
    await page.goto("/entradas");
    await page.getByRole("tab", { name: "Milhas" }).click();
    await page.waitForSelector("tbody tr", { timeout: 10_000 });

    const fmt = (d: string) => new Date(d).toLocaleDateString("pt-BR"); // mesmo algoritmo do EntryTable
    const firstDates = dates.slice(0, 5).map(fmt);

    // Default: data DESC (mais recente primeiro)
    await expect(page.locator("tbody tr").first()).toContainText(firstDates[0]);

    // Clique em "Data" inverte para ASC (mais antiga primeiro) — itens da página 1
    await page.locator("th", { hasText: "Data" }).first().click();
    await expect(page.locator("tbody tr").first()).toContainText(fmt(dates[24]));
  });

  test("filtro por dono mostra só entradas do dono selecionado", async ({ page }) => {
    await registerUser(page);
    await seedEntries(page);
    await page.goto("/entradas");
    await page.getByRole("tab", { name: "Milhas" }).click();
    await page.waitForSelector("tbody tr", { timeout: 10_000 });

    // Sem filtro: conta Alfa tem 25 entradas (20 na página) + 1 da Bravo
    await expect(page.locator("tbody tr")).toHaveCount(20);

    // Filtra por "Dono Bravo" → só a entrada da conta Bravo (999)
    await page.getByLabel("Filtrar por dono").click();
    await page.getByRole("option", { name: "Dono Bravo" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody")).toContainText("999");
    await expect(page.locator("tbody")).not.toContainText("1.000");
  });

  test("sanitização esconde tipos de origem sujos no formulário de entrada", async ({ page }) => {
    await registerUser(page);
    const seed = await seedEntries(page);
    // cria um tipo de origem "sujo" (teste) além do legítimo
    await page.evaluate(
      async ({ url, anonKey, programId }) => {
        const sessionStr = localStorage.getItem("sb-ohyplfpcwxzakujjfwdf-auth-token");
        if (!sessionStr) throw new Error("Sessão não encontrada");
        const session = JSON.parse(sessionStr);
        const headers = {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${session.access_token}`,
        };
        const res = await fetch(`${url}/rest/v1/origem_types`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            id: crypto.randomUUID(),
            user_id: session.user.id,
            name: "teste",
            account_type: "milhas",
            color: "#ef4444",
            description: '{"hasRecurrence":false}',
          }),
        });
        if (!res.ok) throw new Error(await res.text());
      },
      { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, programId: "" },
    );
    void seed;
    await page.goto("/entradas");
    await page.getByRole("tab", { name: "Milhas" }).click();
    await page.getByRole("button", { name: "Nova Entrada" }).click();
    // abre o select de tipo de origem
    await page.getByText("Selecione o tipo").click();
    // o tipo legítimo aparece; o "teste" não
    await expect(page.getByRole("option", { name: /Compra Direta/ })).toBeVisible();
    await expect(page.getByRole("option", { name: "teste" })).toHaveCount(0);
  });
});