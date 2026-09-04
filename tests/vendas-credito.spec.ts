import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { API_SETUP, registerUser, waitForStable } from "./helpers";

/**
 * Vendas — crédito por cliente (Slice B, UI + fluxos).
 * Cobertura real contra Supabase com usuário efêmero (REGRA #24).
 * C0/C1 rodam contra a API atual; C2–C6 exercem o ledger (Worker A).
 */
test.describe.configure({ mode: "serial" });

const today = () => new Date().toISOString().split("T")[0];

interface SeedIds {
  oid: string;
  pid: string;
  aid: string;
  cid: string;
}

type SaleSeed = Record<string, unknown>;

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
        profit: 200,
        profit_margin: 40,
        passengers: [],
        date: "${today()}",
        ...sale,
      });
      if (!r.ok) throw new Error("sales " + r.status + " " + (await r.text()));
    })(${JSON.stringify({ ids, sale })})`,
  );
}

async function receiveViaUI(
  page: Page,
  ticket: string,
  cash: string,
): Promise<ReturnType<typeof page.locator>> {
  const row = page.locator("table tbody tr", { hasText: ticket });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Receber" }).click();
  const dlg = page.locator("[role='dialog']", { hasText: "Registrar recebimento" });
  await expect(dlg).toBeVisible({ timeout: 10_000 });
  await dlg.locator('input[type="number"]').first().fill(cash);
  await dlg.getByRole("button", { name: "Confirmar recebimento" }).click();
  return row;
}

test.beforeEach(async ({ page }) => {
  await registerUser(page);
  await seedBase(page);
  await page.goto("/vendas");
  await waitForStable(page);
});

test("TC-VEND-C0: dialog legado sem saldo quita exato", async ({ page }) => {
  const ids = await seedBase(page);
  await insertSale(page, ids, { ticket_locator: "E2ECRED0", status: "pendente" });
  await page.reload({ waitUntil: "networkidle" });

  const row = page.locator("table tbody tr", { hasText: "E2ECRED0" });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Receber" }).click();

  const dlg = page.locator("[role='dialog']", { hasText: "Registrar recebimento" });
  await expect(dlg).toBeVisible({ timeout: 10_000 });
  // Sem saldo: sem seção de crédito (comportamento legado intacto).
  await expect(dlg.getByText("Usar saldo")).toHaveCount(0);
  await dlg.locator('input[type="number"]').first().fill("500");
  await dlg.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "Recebimento total registrado." }),
  ).toBeVisible({ timeout: 15_000 });
});

test("TC-VEND-C1: excedente gera aviso de crédito e quita", async ({ page }) => {
  const ids = await seedBase(page);
  await insertSale(page, ids, { ticket_locator: "E2ECRED1", status: "pendente" });
  await page.reload({ waitUntil: "networkidle" });

  const row = page.locator("table tbody tr", { hasText: "E2ECRED1" });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Receber" }).click();

  const dlg = page.locator("[role='dialog']", { hasText: "Registrar recebimento" });
  await expect(dlg).toBeVisible({ timeout: 10_000 });
  await dlg.locator('input[type="number"]').first().fill("650");
  await expect(dlg.getByText("Excedente de R$ 150.00")).toBeVisible({ timeout: 5_000 });
  await dlg.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "registrado como crédito" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText("—", { exact: true })).toBeVisible({ timeout: 15_000 });
});

test("TC-VEND-C2: uso manual misto (saldo + dinheiro)", async ({ page }) => {
  const ids = await seedBase(page);
  await insertSale(page, ids, { ticket_locator: "E2ENOV2A", status: "pendente" });
  await insertSale(page, ids, { ticket_locator: "E2ENOV2B", status: "pendente" });
  await page.reload({ waitUntil: "networkidle" });

  // Gera crédito: recebe 650 numa venda de 500 (earn 150).
  await receiveViaUI(page, "E2ENOV2A", "650");
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "registrado como crédito" }),
  ).toBeVisible({ timeout: 15_000 });

  // Usa 100 de saldo + 50 em dinheiro na segunda venda (pendente 500 → 350).
  const row = page.locator("table tbody tr", { hasText: "E2ENOV2B" });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Receber" }).click();
  const dlg = page.locator("[role='dialog']", { hasText: "Registrar recebimento" });
  await expect(dlg.getByText("Crédito de Cliente E2E: R$ 150.00")).toBeVisible({
    timeout: 10_000,
  });
  await dlg.getByLabel("Usar saldo de crédito").fill("100");
  await dlg.locator('input[type="number"]').first().fill("50");
  await expect(dlg.getByText("Usando R$ 100.00 do saldo")).toBeVisible();
  await dlg.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(page.locator("[data-sonner-toast]", { hasText: "Pendente: R$ 350.00" })).toBeVisible(
    { timeout: 15_000 },
  );
  await expect(row.locator("td").nth(5)).toContainText("R$ 350");
});

test("TC-VEND-C3: quitação total só com crédito", async ({ page }) => {
  const ids = await seedBase(page);
  await insertSale(page, ids, { ticket_locator: "E2ENOV3A", status: "pendente" });
  await insertSale(page, ids, { ticket_locator: "E2ENOV3B", status: "pendente" });
  await page.reload({ waitUntil: "networkidle" });

  // Gera crédito: recebe 1000 numa venda de 500 (earn 500).
  await receiveViaUI(page, "E2ENOV3A", "1000");
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "registrado como crédito" }),
  ).toBeVisible({ timeout: 15_000 });

  // Quita a segunda venda só com saldo (dinheiro zero).
  const row = page.locator("table tbody tr", { hasText: "E2ENOV3B" });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Receber" }).click();
  const dlg = page.locator("[role='dialog']", { hasText: "Registrar recebimento" });
  await expect(dlg.getByText("Crédito de Cliente E2E: R$ 500.00")).toBeVisible({
    timeout: 10_000,
  });
  await dlg.locator('input[type="number"]').first().fill("0");
  await dlg.getByLabel("Usar saldo de crédito").fill("500");
  await dlg.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "usando R$ 500.00 do saldo" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText("—", { exact: true })).toBeVisible({ timeout: 15_000 });
});

test("TC-VEND-C4: edição após crédito não corrompe", async ({ page }) => {
  const ids = await seedBase(page);
  await insertSale(page, ids, { ticket_locator: "E2ENOV4", status: "pendente" });
  await page.reload({ waitUntil: "networkidle" });

  // Gera crédito na venda (earn 100) e confirma o indicador.
  await receiveViaUI(page, "E2ENOV4", "600");
  const row = page.locator("table tbody tr", { hasText: "E2ENOV4" });
  await expect(row.getByText("Crédito")).toBeVisible({ timeout: 15_000 });

  // Edita custos: submit habilitado, salva, lucro recalcula, indicador persiste.
  await row.getByRole("button", { name: "Editar" }).click();
  const drawer = page.locator("[role='dialog']", { hasText: "Editar Venda" });
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await drawer.getByLabel("Valor do custo adicional 1").fill("40");
  await drawer.getByLabel("Descrição do custo adicional 1").fill("Taxa E2E");
  const submit = drawer.getByRole("button", { name: "Atualizar Venda" });
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await submit.click();
  await expect(drawer).toBeHidden({ timeout: 15_000 });
  await expect(row.getByText("R$ 160")).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText("Crédito")).toBeVisible({ timeout: 10_000 });
});

test("TC-VEND-C5: cancelamento estorna crédito", async ({ page }) => {
  const ids = await seedBase(page);
  await insertSale(page, ids, { ticket_locator: "E2ENOV5A", status: "pendente" });
  await insertSale(page, ids, { ticket_locator: "E2ENOV5B", status: "pendente" });
  await page.reload({ waitUntil: "networkidle" });

  // Gera crédito na venda A (earn 150) e cancela em seguida.
  await receiveViaUI(page, "E2ENOV5A", "650");
  const rowA = page.locator("table tbody tr", { hasText: "E2ENOV5A" });
  await rowA.getByRole("button", { name: "Cancelar" }).click();
  const alert = page.locator("[role='alertdialog']", { hasText: "Cancelar venda?" });
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await alert.getByRole("button", { name: "Sim, cancelar venda" }).click();
  await expect(rowA.getByRole("button", { name: "Receber" })).toHaveCount(0, {
    timeout: 15_000,
  });

  // Saldo zerado pelo estorno: dialog da venda B não mostra crédito.
  const row = page.locator("table tbody tr", { hasText: "E2ENOV5B" });
  await row.getByRole("button", { name: "Receber" }).click();
  const dlg = page.locator("[role='dialog']", { hasText: "Registrar recebimento" });
  await expect(dlg).toBeVisible({ timeout: 10_000 });
  await expect(dlg.getByText("Usar saldo")).toHaveCount(0);
});

test("TC-VEND-C6: reabertura mostra saldo atualizado", async ({ page }) => {
  const ids = await seedBase(page);
  await insertSale(page, ids, { ticket_locator: "E2ENOV6A", status: "pendente" });
  await insertSale(page, ids, { ticket_locator: "E2ENOV6B", status: "pendente" });
  await page.reload({ waitUntil: "networkidle" });

  // Gera crédito (earn 100) na venda A.
  await receiveViaUI(page, "E2ENOV6A", "600");
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "registrado como crédito" }),
  ).toBeVisible({ timeout: 15_000 });

  // Dialog da venda B já abre exibindo o saldo atual.
  const row = page.locator("table tbody tr", { hasText: "E2ENOV6B" });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Receber" }).click();
  const dlg = page.locator("[role='dialog']", { hasText: "Registrar recebimento" });
  await expect(dlg.getByText("Crédito de Cliente E2E: R$ 100.00")).toBeVisible({
    timeout: 10_000,
  });
});
