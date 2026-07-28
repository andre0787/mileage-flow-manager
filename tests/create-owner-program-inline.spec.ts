import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";

test("Criação inline de dono e programa ao registrar entrada @smoke-prod", async ({ page }) => {
  const email = `test_owner_program_${Date.now()}@teste.com`;

  // 1. Registrar novo usuário
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5_000 });

  await page.fill("#name", "Usuário Teste E2E");
  await page.fill("#email", email);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");

  // Aguarda dashboard
  await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");

  // 2. Criar dados de teste mínimos via API (só origem_type, sem owner/program)
  const supabaseUrl = "https://ohyplfpcwxzakujjfwdf.supabase.co";
  const supabaseAnonKey = "sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";

  const { otId } = await page.evaluate(
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

      const otId = crypto.randomUUID();

      // Só cria origem_type — owner e program serão criados inline
      const otRes = await fetch(`${url}/rest/v1/origem_types`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: otId,
          user_id: userId,
          name: "Compra Direta",
          account_type: "milhas",
          color: "#10b981",
          description: '{"hasRecurrence":false}',
        }),
      });
      if (!otRes.ok) throw new Error("Falha ao criar origem_type: " + (await otRes.text()));

      return { otId };
    },
    { url: supabaseUrl, anonKey: supabaseAnonKey },
  );

  // 3. Navegar para Entradas
  await page.goto("/entradas");
  await page.waitForSelector("text=Entradas", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");

  // Alterna para aba Milhas
  await page.locator("button[role='tab']:has-text('Milhas')").click();
  await expect(
    page.locator("button[role='tab'][aria-selected='true']:has-text('Milhas')"),
  ).toBeVisible({ timeout: 5_000 });

  // 4. Clicar em "Nova Entrada"
  await page.getByRole("button", { name: "Nova Entrada" }).first().click();

  const entryDrawer = page.getByRole("dialog").first();
  await expect(entryDrawer).toBeVisible({ timeout: 5_000 });

  // 5. Clicar no botão "+" de Conta (primeiro botão + dentro do drawer)
  await entryDrawer.locator('button svg.lucide-plus').locator('..').first().click();

  // 6. Criar DONO inline
  await expect(page.getByText("Nome da Conta")).toBeVisible({ timeout: 3_000 });

  // Clica no "+" ao lado de Dono (primeiro botão + dentro do drawer de conta)
  const accountDrawer = page.getByRole("dialog", { name: "Nova Conta" });
  await expect(accountDrawer).toBeVisible({ timeout: 3_000 });
  await accountDrawer.locator('button svg.lucide-plus').locator('..').first().click();

  // Preenche formulário do novo dono
  await expect(page.getByText("Novo Dono")).toBeVisible({ timeout: 3_000 });
  const ownerDrawer = page.getByRole("dialog").last();
  await ownerDrawer.getByPlaceholder("Ex: João Silva").fill("Dono Criado Inline");

  // Clica em Cadastrar
  await ownerDrawer.getByRole("button", { name: "Cadastrar" }).click();

  // Verifica que o dono foi auto-selecionado
  await expect(accountDrawer.getByText("Dono Criado Inline")).toBeVisible({ timeout: 5_000 });

  // 7. Criar PROGRAMA inline
  await accountDrawer.locator('button svg.lucide-plus').locator('..').last().click();

  await expect(page.getByText("Novo Programa")).toBeVisible({ timeout: 3_000 });
  const programDrawer = page.getByRole("dialog").last();
  await programDrawer.getByPlaceholder("Ex: LATAM Pass").fill("Programa Criado Inline");

  // Seleciona tipo Milhas
  await programDrawer.getByText("Pontos").click();
  await page.getByRole("option", { name: "Milhas" }).click();

  // Clica em Cadastrar
  await programDrawer.getByRole("button", { name: "Cadastrar" }).click();

  // Verifica que o programa foi auto-selecionado e tipo deduzido
  await expect(accountDrawer.getByText("Programa Criado Inline")).toBeVisible({ timeout: 5_000 });
  await expect(accountDrawer.getByText("Tipo da conta: Milhas")).toBeVisible({ timeout: 3_000 });

  // 8. Preencher nome da conta e cadastrar
  await accountDrawer
    .getByPlaceholder("Ex: Conta Principal LATAM")
    .fill("Conta Completa Inline");
  await accountDrawer.getByRole("button", { name: "Cadastrar" }).click();

  // 9. Verificar que a conta foi auto-selecionada
  await expect(entryDrawer.getByText("Conta Completa Inline")).toBeVisible({ timeout: 5_000 });

  // 10. Preencher restante da entrada
  await page.fill("#entryDate", new Date().toISOString().split("T")[0]);

  await page.getByText("Selecione o tipo").click();
  await page.getByRole("option", { name: "Compra Direta" }).click();

  await page.fill("#amount", "50000");
  await page.fill("#amountPaid", "3000.00");

  // 11. Salvar entrada
  await entryDrawer.getByRole("button", { name: "Registrar Entrada" }).click({ force: true });

  // 12. Verificar entrada na tabela
  await expect(page.getByText("50.000").first()).toBeVisible({ timeout: 5_000 });

  // 13. Verificar que o nome do dono aparece na tabela de entradas
  // O nome do dono fica abaixo do nome da conta, em texto secundário na coluna desktop
  await expect(
    page
      .locator("table")
      .getByText("Dono Criado Inline")
      .first()
  ).toBeVisible({ timeout: 5_000 });

  // 14. Verificar dono e programa criados na página de configurações
  await page.goto("/configuracoes");
  await page.waitForSelector("text=Configurações", { timeout: 15_000 });
  await expect(page.getByText("Dono Criado Inline").first()).toBeVisible({ timeout: 5_000 });

  // Alterna para aba Programas
  await page.getByRole("tab", { name: "Programas" }).click();
  await expect(page.getByText("Programa Criado Inline").first()).toBeVisible({ timeout: 5_000 });
});
