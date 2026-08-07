import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";

test.describe("Alertas por conta", () => {
  const email = `test_alerts_${Date.now()}@teste.com`;
  const accountName = `Conta Alerta ${Date.now()}`;

  test("cria alerta, badge de não lido, marca lido e persiste", async ({ page }) => {
    test.setTimeout(180000);

    // ═══════════════════════════════════════
    // 1. Registrar novo usuário
    // ═══════════════════════════════════════
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Cadastre-se", { timeout: 15000 });
    await page.click("text=Cadastre-se");
    await page.waitForSelector("#name", { timeout: 5000 });

    await page.fill("#name", "Teste Alertas");
    await page.fill("#email", email);
    await page.fill("#password", TEST_PASSWORD);
    await page.click("button[type='submit']");
    await page.waitForFunction(() => location.pathname === "/", { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // ═══════════════════════════════════════
    // 2. Criar dados de teste via Supabase JS client
    // ═══════════════════════════════════════
    const supabaseUrl = "https://ohyplfpcwxzakujjfwdf.supabase.co";
    const supabaseAnonKey = "sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";

    const testData = await page.evaluate(
      async ({ url, anonKey, accountName }) => {
        const sessionStr = localStorage.getItem("sb-ohyplfpcwxzakujjfwdf-auth-token");
        if (!sessionStr) throw new Error("Sessão não encontrada no localStorage");
        const session = JSON.parse(sessionStr);
        const accessToken = session.access_token;
        const userId = session.user.id;

        const headers = {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        };

        const ownerId = crypto.randomUUID();
        const programId = crypto.randomUUID();
        const accountId = crypto.randomUUID();

        const ownerRes = await fetch(`${url}/rest/v1/owners`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            id: ownerId,
            user_id: userId,
            name: "Dono Alerta",
            cpf: "123.456.789-00",
            phone: "(11) 99999-8888",
          }),
        });
        if (!ownerRes.ok) throw new Error("Falha ao criar owner: " + (await ownerRes.text()));

        const progRes = await fetch(`${url}/rest/v1/programs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            id: programId,
            user_id: userId,
            name: "Programa Alerta",
            type: "milhas",
          }),
        });
        if (!progRes.ok) throw new Error("Falha ao criar program: " + (await progRes.text()));

        const accRes = await fetch(`${url}/rest/v1/accounts`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            id: accountId,
            user_id: userId,
            owner_id: ownerId,
            program_id: programId,
            name: accountName,
            type: "milhas",
            balance: 50000,
            total_invested: 3500,
            average_cost_per_mile: 0.07,
            status: "ativa",
          }),
        });
        if (!accRes.ok) throw new Error("Falha ao criar conta: " + (await accRes.text()));

        return { accountId };
      },
      { url: supabaseUrl, anonKey: supabaseAnonKey, accountName },
    );

    // ═══════════════════════════════════════
    // 3. Navegar para Contas e abrir o Bell do card
    // ═══════════════════════════════════════
    await page.goto("/contas", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: `Alertas de ${accountName}` }).first().click();
    await expect(page.getByText(`Alertas — ${accountName}`)).toBeVisible({ timeout: 5_000 });

    // ═══════════════════════════════════════
    // 4. Criar alerta (data + observação)
    // ═══════════════════════════════════════
    await page.fill("#alert-date", "2026-08-15");
    await page.fill("#alert-observation", "Renovar clube fidelidade");
    await page.click("button:has-text('Adicionar alerta')");

    await expect(page.getByText("Renovar clube fidelidade")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Não lido")).toBeVisible({ timeout: 5_000 });

    // Fechar dialog
    await page.keyboard.press("Escape");
    await expect(page.getByText(`Alertas — ${accountName}`)).toBeHidden({ timeout: 5_000 });

    // ═══════════════════════════════════════
    // 5. Badge de não lido no card
    // ═══════════════════════════════════════
    const bellButton = page
      .locator(".shadow-card", { hasText: accountName })
      .getByRole("button", { name: `Alertas de ${accountName}` });
    await expect(bellButton.locator("span").filter({ hasText: "1" })).toBeVisible({
      timeout: 5_000,
    });

    // ═══════════════════════════════════════
    // 6. Marcar como lida
    // ═══════════════════════════════════════
    await bellButton.click();
    await expect(page.getByText(`Alertas — ${accountName}`)).toBeVisible({ timeout: 5_000 });
    await page.getByRole("switch").first().click();
    await expect(page.getByText("Lida")).toBeVisible({ timeout: 5_000 });

    // Fechar → badge some
    await page.keyboard.press("Escape");
    await expect(bellButton.locator("span").filter({ hasText: "1" })).toBeHidden({
      timeout: 5_000,
    });

    // ═══════════════════════════════════════
    // 7. Reload → alerta persiste com "Lida"
    // ═══════════════════════════════════════
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const bellAfterReload = page
      .locator(".shadow-card", { hasText: accountName })
      .getByRole("button", { name: `Alertas de ${accountName}` });
    await bellAfterReload.click();
    await expect(page.getByText("Renovar clube fidelidade")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Lida").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Não lido")).toBeHidden({ timeout: 5_000 });
  });
});
