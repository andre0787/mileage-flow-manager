import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { API_SETUP, registerUser, waitForStable } from "./helpers";

interface SeedIds {
  oid: string;
  pid: string;
  aid: string;
  cid: string;
}

type SaleSeed = Record<string, unknown>;

/**
 * Vendas — novos fluxos (custos dinâmicos, recebimento parcial, edição de recebida).
 * Cobertura real contra Supabase com usuário efêmero (REGRA #24).
 * Issue #533: editar venda recebida deve permitir alterar custos (submit habilitado).
 */
test.describe.configure({ mode: "serial" });

const today = () => new Date().toISOString().split("T")[0];

async function seedBase(page: Page): Promise<SeedIds> {
  const ids = (await page.evaluate(
    `(async () => {
      ${API_SETUP}
      const oid = crypto.randomUUID();
      const pid = crypto.randomUUID();
      const aid = crypto.randomUUID();
      const cid = crypto.randomUUID();
      const put = async (table, body) => {
        const r = await post(table, body);
        if (!r.ok) throw new Error(table + " " + r.status + " " + (await r.text()));
      };
      await put("owners", { id: oid, name: "Dono E2E" });
      await put("programs", { id: pid, name: "Smiles E2E", type: "milhas" });
      await put("accounts", {
        id: aid, owner_id: oid, program_id: pid, name: "Conta E2E",
        type: "milhas", balance: 100000, average_cost_per_mile: 0.03,
        total_invested: 3000, status: "ativa",
      });
      await put("clients", { id: cid, name: "Cliente E2E", phone: "(11) 99999-9999" });
      return { oid, pid, aid, cid };
    })()`,
  )) as SeedIds;
  return ids;
}

async function insertSale(page: Page, ids: SeedIds, sale: SaleSeed): Promise<void> {
  await page.evaluate(
    `(async ({ ids, sale }) => {
      ${API_SETUP}
      const r = await post("sales", {
        id: crypto.randomUUID(),
        account_id: ids.aid,
        account_name: "Conta E2E",
        owner_name: "Dono E2E",
        program: "Smiles E2E",
        client_id: ids.cid,
        client_name: "Cliente E2E",
        miles_used: 10000,
        sale_value: 500,
        price_per_mile: 0.05,
        cost_per_mile: 0.03,
        passengers: [],
        date: "${today()}",
        ...sale,
      });
      if (!r.ok) throw new Error("sales " + r.status + " " + (await r.text()));
    })(${JSON.stringify({ ids, sale })})`,
  );
}

test.beforeEach(async ({ page }) => {
  await registerUser(page);
  await seedBase(page);
  await page.goto("/vendas");
  await waitForStable(page);
});

test("TC-VEND-N1: criar venda com 2 custos adicionais dinâmicos", async ({ page }) => {
  await page.getByRole("button", { name: "Nova Venda" }).first().click();
  const drawer = page.locator("[role='dialog']").first();
  await expect(drawer).toBeVisible({ timeout: 10_000 });

  const combos = drawer.locator("[role=combobox]");
  await combos.nth(0).click();
  await page.getByRole("option", { name: "Dono E2E" }).click();
  await combos.nth(1).click();
  await page.getByRole("option", { name: /Conta E2E/ }).click();
  await combos.nth(2).click();
  await page.getByRole("option", { name: "Cliente E2E" }).click();

  await drawer.getByPlaceholder("Ex: 50000").fill("10000");
  await drawer.getByPlaceholder("Ex: 0.03").fill("0.05");
  await expect(drawer.getByPlaceholder("Ex: 300.00")).toHaveValue("500.00");
  await drawer.getByPlaceholder("Ex: ABC123").fill("E2ENOV1");

  await drawer.getByRole("button", { name: /Adicionar custo/ }).click();
  await drawer.getByLabel("Valor do custo adicional 1").fill("50");
  await drawer.getByLabel("Descrição do custo adicional 1").fill("Taxa E2E");
  await drawer.getByLabel("Valor do custo adicional 2").fill("30");
  await drawer.getByLabel("Descrição do custo adicional 2").fill("Embarque E2E");

  await expect(drawer.getByText("Total adicional: R$ 80.00")).toBeVisible();
  await expect(drawer.getByText("R$ 120.00")).toBeVisible();
  await expect(drawer.getByText("24.0%")).toBeVisible();

  await drawer.getByRole("button", { name: "Registrar Venda" }).click();
  await expect(drawer).toBeHidden({ timeout: 15_000 });

  const row = page.locator("table tbody tr", { hasText: "E2ENOV1" });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.locator("td").nth(4)).toContainText("R$ 500");
  await expect(row.locator("td").nth(5)).toContainText("R$ 500");
  await expect(row.getByText("R$ 120")).toBeVisible();
});

test("TC-VEND-N2: recebimento parcial exibe pendente e quita", async ({ page }) => {
  const ids = await seedBase(page);
  await insertSale(page, ids, {
    ticket_locator: "E2ENOV2",
    additional_cost: 80,
    additional_cost_desc: "Taxa E2E: 50; Embarque E2E: 30",
    additional_costs: [
      { desc: "Taxa E2E", amount: 50 },
      { desc: "Embarque E2E", amount: 30 },
    ],
    amount_received: 0,
    profit: 120,
    profit_margin: 24,
    status: "pendente",
  });
  await page.reload({ waitUntil: "networkidle" });

  const row = page.locator("table tbody tr", { hasText: "E2ENOV2" });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Receber" }).click();

  const rdlg = page.locator("[role='dialog']", { hasText: "Registrar recebimento" });
  await expect(rdlg).toBeVisible({ timeout: 10_000 });
  await expect(rdlg.locator('input[type="number"]')).toHaveValue("500.00");
  await rdlg.locator('input[type="number"]').fill("200");
  await rdlg.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "Pendente: R$ 300.00" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText("R$ 300")).toBeVisible({ timeout: 15_000 });

  await row.getByRole("button", { name: "Receber" }).click();
  const rdlg2 = page.locator("[role='dialog']", { hasText: "Registrar recebimento" });
  await expect(rdlg2.locator('input[type="number"]')).toHaveValue("300.00");
  await rdlg2.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "Recebimento total registrado." }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText("—", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(row.getByRole("button", { name: "Receber" })).toHaveCount(0);
});

test("TC-VEND-N3: editar custos de venda recebida salva (#533)", async ({ page }) => {
  const ids = await seedBase(page);
  await insertSale(page, ids, {
    ticket_locator: "E2ENOV3",
    additional_cost: 50,
    additional_cost_desc: "Taxa E2E",
    additional_costs: [{ desc: "Taxa E2E", amount: 50 }],
    amount_received: 200,
    profit: 150,
    profit_margin: 30,
    status: "pendente",
  });
  await page.reload({ waitUntil: "networkidle" });

  const row = page.locator("table tbody tr", { hasText: "E2ENOV3" });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Editar" }).click();

  const drawer = page.locator("[role='dialog']", { hasText: "Editar Venda" });
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await expect(drawer.getByLabel("Valor do custo adicional 1")).toHaveValue("50");
  await drawer.getByLabel("Valor do custo adicional 1").fill("90");
  await expect(drawer.getByText("Total adicional: R$ 90.00")).toBeVisible();

  const submit = drawer.getByRole("button", { name: "Atualizar Venda" });
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await submit.click();
  await expect(drawer).toBeHidden({ timeout: 15_000 });
  await expect(row.getByText("R$ 110")).toBeVisible({ timeout: 15_000 });

  await page.getByPlaceholder("Buscar venda...").fill("E2ENOV3");
  const row2 = page.locator("table tbody tr", { hasText: "E2ENOV3" });
  await row2.getByRole("button", { name: "Editar" }).click();
  const drawer2 = page.locator("[role='dialog']", { hasText: "Editar Venda" });
  await expect(drawer2.getByLabel("Valor do custo adicional 1")).toHaveValue("90", {
    timeout: 10_000,
  });
});
