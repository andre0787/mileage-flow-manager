# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fluxo-completo.spec.ts >> Fluxo completo de experiência
- Location: tests/fluxo-completo.spec.ts:18:1

# Error details

```
Test timeout of 300000ms exceeded.
```

```
Error: page.evaluate: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - generic:
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - img
                      - generic:
                        - heading [level=2]: MilesControl
                        - paragraph: Gestão de Milhas
                  - generic:
                    - generic: Navegação
                    - generic:
                      - list:
                        - listitem:
                          - link:
                            - /url: /
                            - img
                            - generic: Dashboard
                        - listitem:
                          - link:
                            - /url: /contas
                            - img
                            - generic: Contas
                        - listitem:
                          - link:
                            - /url: /clientes
                            - img
                            - generic: Clientes
                        - listitem:
                          - link:
                            - /url: /entradas
                            - img
                            - generic: Entradas
                        - listitem:
                          - link:
                            - /url: /vendas
                            - img
                            - generic: Vendas
                        - listitem:
                          - link:
                            - /url: /cpf
                            - img
                            - generic: Controle CPF
                        - listitem:
                          - link:
                            - /url: /relatorios
                            - img
                            - generic: Relatórios
                  - generic:
                    - generic:
                      - generic: Tema
                      - button:
                        - img
                        - generic: Toggle theme
                    - list:
                      - listitem:
                        - link:
                          - /url: /perfil
                          - img
                          - generic: Perfil
                      - listitem:
                        - link:
                          - /url: /configuracoes
                          - img
                          - generic: Configurações
                      - listitem:
                        - button:
                          - img
                          - generic: Sair
        - generic:
          - banner:
            - button:
              - img
              - generic: Toggle Sidebar
            - generic:
              - heading [level=2]: MilesControl
          - main:
            - generic:
              - generic:
                - generic:
                  - generic:
                    - heading [level=1]: Entradas
                    - paragraph: Gerencie aquisição de pontos e milhas
                  - generic:
                    - generic:
                      - img
                      - textbox:
                        - /placeholder: Buscar entrada...
                    - button:
                      - img
                      - text: Transferir
                    - button:
                      - img
                      - text: Nova Entrada
                - generic:
                  - tablist:
                    - tab:
                      - img
                      - text: Pontos
                    - tab [selected]:
                      - img
                      - text: Milhas
                  - tabpanel:
                    - generic:
                      - generic:
                        - generic:
                          - heading [level=3]: Total de Milhas
                        - generic:
                          - generic: "0"
                      - generic:
                        - generic:
                          - heading [level=3]: Valor Investido
                        - generic:
                          - generic: R$ 0
                      - generic:
                        - generic:
                          - heading [level=3]: Custo Médio/Milha
                        - generic:
                          - generic: R$ 0.0000
                    - generic:
                      - generic:
                        - heading [level=3]:
                          - img
                          - text: Histórico de Entradas - Milhas
                      - generic:
                        - generic:
                          - generic:
                            - table:
                              - rowgroup:
                                - row:
                                  - columnheader: Data
                                  - columnheader: Conta
                                  - columnheader: Origem
                                  - columnheader: Milhas Geradas
                                  - columnheader: Valor Pago
                                  - columnheader: Custo/Milha
                                  - columnheader: Ações
                              - rowgroup:
                                - row:
                                  - cell:
                                    - generic:
                                      - generic:
                                        - img
                                      - heading [level=3]: Nenhuma entrada de milhas
                                      - paragraph: Registre sua primeira aquisição de milhas ou use a busca para filtrar.
  - dialog:
    - generic:
      - heading [level=2]: Registrar Nova Entrada - Milhas
    - generic:
      - generic:
        - text: Conta
        - combobox [expanded]:
          - generic: Selecione a conta
          - img
      - generic:
        - text: Tipo de Origem
        - generic:
          - generic:
            - combobox:
              - generic: Selecione o tipo
              - img
          - button:
            - img
      - generic:
        - generic:
          - text: Milhas Adquiridas
          - spinbutton
        - generic:
          - text: Valor Pago (R$)
          - spinbutton
    - generic:
      - button: Cancelar
      - button: Registrar Entrada
    - button:
      - img
      - generic: Close
  - listbox [ref=e2]:
    - option "Latam Pass (João Dono)" [active] [ref=e3]:
      - generic [ref=e5]: Latam Pass (João Dono)
```

# Test source

```ts
  223 |     await page.fill("#amountPaid", "200");
  224 | 
  225 |     const bonus = page.locator('input[placeholder*="Ex: 100"]');
  226 |     if (await bonus.isVisible()) await bonus.fill("50");
  227 | 
  228 |     await page.getByRole("button", { name: /registrar/i }).click();
  229 |     await page.waitForTimeout(2000);
  230 |     pass("Transferência de 20.000 com 50% bônus registrada");
  231 | 
  232 |     // ═══ 7. VERIFICAR SALDOS ═══
  233 |     await page.goto("/contas", { waitUntil: "domcontentloaded" });
  234 |     await page.waitForTimeout(2000);
  235 | 
  236 |     // Smiles: 50.000 + 10.000 - 20.000 (transferidos) = 40.000
  237 |     const saldoUm = page.locator("text=40.000").first();
  238 |     const saldoUmOk = await saldoUm.isVisible({ timeout: 5000 }).catch(() => false);
  239 |     if (saldoUmOk) pass("Saldo Smiles = 40.000 (60k - 20k)");
  240 |     else fail("Saldo Smiles incorreto");
  241 | 
  242 |     // Latam: 30.000 (20.000 + 50% bonus)
  243 |     const saldoDois = page.locator("text=30.000").first();
  244 |     const saldoDoisOk = await saldoDois.isVisible({ timeout: 3000 }).catch(() => false);
  245 |     if (saldoDoisOk) pass("Saldo Latam Pass = 30.000 (20k + 50%)");
  246 |     else fail("Saldo Latam Pass incorreto");
  247 | 
  248 |     await save("07-saldos");
  249 | 
  250 |     // ═══ 8. DASHBOARD ═══
  251 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  252 |     await page.waitForTimeout(3000);
  253 |     await expect(page.locator("text=Entradas/mês")).toBeVisible({ timeout: 5000 });
  254 |     pass("Dashboard carregado");
  255 |     await save("08-dashboard");
  256 | 
  257 |     // ═══ 9. CLIENTE + VENDA ═══
  258 |     await page.goto("/clientes", { waitUntil: "domcontentloaded" });
  259 |     await page.waitForTimeout(2000);
  260 |     await page.getByRole("button", { name: /novo cliente/i }).click();
  261 |     await page.waitForTimeout(500);
  262 |     await page.fill('input[placeholder*="Nome"]', "Maria Silva");
  263 |     const phone = page.locator('#phone, input[placeholder*="Telefone"]');
  264 |     if (await phone.isVisible()) await phone.fill("11999999999");
  265 |     await page.getByRole("button", { name: /salvar|cadastrar|criar/i }).click();
  266 |     await page.waitForTimeout(2000);
  267 |     pass("Cliente Maria Silva criado");
  268 | 
  269 |     await page.goto("/vendas", { waitUntil: "domcontentloaded" });
  270 |     await page.waitForTimeout(2000);
  271 |     await page.getByRole("button", { name: /nova venda/i }).click();
  272 |     await page.waitForTimeout(500);
  273 |     let vCmb = page.locator("[role=combobox]");
  274 |     await vCmb.nth(0).click();
  275 |     await page.getByRole("option", { name: /maria/i }).click();
  276 |     await vCmb.nth(1).click();
  277 |     await page.getByRole("option", { name: /latam/i }).click();
  278 |     await page.fill("#miles", "10000");
  279 |     await page.fill("#price", "2500");
  280 |     await page.getByRole("button", { name: /registrar/i }).click();
  281 |     await page.waitForTimeout(2000);
  282 |     pass("Venda de 10.000 milhas registrada");
  283 |     await save("09-venda");
  284 | 
  285 |     // ═══ 10. RELATÓRIOS ═══
  286 |     await page.goto("/relatorios", { waitUntil: "domcontentloaded" });
  287 |     await page.waitForTimeout(3000);
  288 |     await expect(page.locator("text=Relatórios")).toBeVisible({ timeout: 5000 });
  289 |     pass("Relatórios carregado");
  290 |     await save("10-relatorios");
  291 | 
  292 |     // ═══ 11. MOBILE ═══
  293 |     await page.setViewportSize({ width: 375, height: 812 });
  294 |     await page.goto("/entradas", { waitUntil: "domcontentloaded" });
  295 |     await page.waitForTimeout(3000);
  296 |     const bodyW = await page.evaluate(() => document.body.scrollWidth);
  297 |     const vpW = await page.evaluate(() => window.innerWidth);
  298 |     if (bodyW <= vpW + 2) pass(`Sem overflow mobile (${bodyW}px ≤ ${vpW}px)`);
  299 |     else fail(`Overflow mobile: ${bodyW}px > ${vpW}px`);
  300 |     await save("11-mobile");
  301 |     await page.setViewportSize({ width: 1280, height: 900 });
  302 | 
  303 |     // ═══ 12. LOGOUT/LOGIN ═══
  304 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  305 |     await page.waitForTimeout(2000);
  306 |     const logoutBtn = page.getByRole("button", { name: /sair|logout/i });
  307 |     if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  308 |       await logoutBtn.click();
  309 |       await page.waitForURL("/login", { timeout: 10000 });
  310 |       pass("Logout OK");
  311 |       await page.fill("#email", email);
  312 |       await page.fill("#password", PASSWORD);
  313 |       await page.click("button[type='submit']");
  314 |       await page.waitForURL(/dashboard|\//, { timeout: 30000 });
  315 |       pass("Re-login OK");
  316 |     } else {
  317 |       fail("Logout não encontrado");
  318 |     }
  319 | 
  320 |     pass(" Fluxo completo!");
  321 |   } catch (e) {
  322 |     fail(`Erro: ${e instanceof Error ? e.message : String(e)}`);
> 323 |     const html = await page.evaluate(() => document.querySelector("table")?.outerHTML?.substring(0, 2000) || "no table");
      |                             ^ Error: page.evaluate: Target page, context or browser has been closed
  324 |     log("Table HTML capture:", html.substring(0, 500));
  325 |     throw e;
  326 |   } finally {
  327 |     writeFileSync(REPORT_PATH, report.join("\n"), "utf-8");
  328 |     console.log(`\n📄 Relatório: ${REPORT_PATH}`);
  329 |   }
  330 | });
  331 | 
```