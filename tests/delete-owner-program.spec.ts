import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";

test("Deleção de dono e programa via Configuracoes atualiza UI automaticamente", async ({
  page,
}) => {
  const email = `test_delete_${Date.now()}@teste.com`;

  // 1. Registrar novo usuário
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5_000 });

  await page.fill("#name", "Usuário Teste E2E Delete");
  await page.fill("#email", email);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");

  await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");

  // 2. Criar owner e program via API
  const supabaseUrl = "https://ohyplfpcwxzakujjfwdf.supabase.co";
  const supabaseAnonKey = "sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";

  await page.evaluate(
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

      // Cria owner
      const ownerRes = await fetch(`${url}/rest/v1/owners`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id: crypto.randomUUID(), user_id: userId, name: "Dono Para Deletar", cpf: "", phone: "" }),
      });
      if (!ownerRes.ok) throw new Error("Falha ao criar owner: " + (await ownerRes.text()));

      // Cria program
      const programRes = await fetch(`${url}/rest/v1/programs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id: crypto.randomUUID(), user_id: userId, name: "Programa Para Deletar", type: "milhas" }),
      });
      if (!programRes.ok) throw new Error("Falha ao criar program: " + (await programRes.text()));
    },
    { url: supabaseUrl, anonKey: supabaseAnonKey },
  );

  // 3. Ir para Configuracoes
  await page.goto("/configuracoes");
  await page.waitForSelector("text=Configurações", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");

  // 4. Verificar que dono aparece na lista
  await expect(page.getByText("Dono Para Deletar").first()).toBeVisible({ timeout: 5_000 });

  // 5. Deletar o dono
  // Usa seletor direto: <tr> que contém "Dono Para Deletar", dentro acha o svg.lucide-trash-2
  const ownerRow = page.locator("tr").filter({ hasText: "Dono Para Deletar" }).first();
  await expect(ownerRow).toBeVisible({ timeout: 3_000 });

  // Acha o botão de deletar dentro da linha (svg com classe lucide-trash-2)
  const deleteBtn = ownerRow.locator("button").filter({ has: page.locator("svg") }).nth(1);
  await deleteBtn.click();

  // Confirma deleção no AlertDialog
  await expect(page.getByText("Excluir dono?")).toBeVisible({ timeout: 3_000 });
  await page.getByRole("button", { name: "Excluir dono" }).click();

  // 6. Verificar que o dono foi removido da lista
  await expect(page.getByText("Dono Para Deletar").first()).not.toBeVisible({ timeout: 10_000 });

  // 7. Alternar para aba Programas e deletar programa
  await page.getByRole("tab", { name: "Programas" }).click();
  await page.waitForTimeout(500);

  await expect(page.getByText("Programa Para Deletar").first()).toBeVisible({ timeout: 5_000 });

  // Deleta o programa
  const programRow = page.locator("tr").filter({ hasText: "Programa Para Deletar" }).first();
  await expect(programRow).toBeVisible({ timeout: 3_000 });
  const programDeleteBtn = programRow.locator("button").filter({ has: page.locator("svg") }).nth(1);
  await programDeleteBtn.click();

  // Confirma deleção
  await expect(page.getByText("Excluir programa?")).toBeVisible({ timeout: 3_000 });
  await page.getByRole("button", { name: "Excluir programa" }).click();

  // 8. Verificar que o programa foi removido da lista
  await expect(page.getByText("Programa Para Deletar").first()).not.toBeVisible({ timeout: 10_000 });
});