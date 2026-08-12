# Spec — Redesign de UI inspirado nas Apple HIG (skill apple-design)

> **Categoria:** refactor · **Skill:** `.agents/skills/apple-design` (instalada) · **Branch:** `refactor/apple-design-hig`
> **Base:** `main` (ed08688) · **Padrão canônico:** design system token-based existente (`src/index.css`)

## INTENT (rule-33)

- Código atual do design system: tokens HSL semânticos em `src/index.css` (paleta navy `222`, gold `38`, teal `170`, gradientes pesados, glows) + `Plus Jakarta Sans` (Google Fonts) + componentes shadcn com `rounded-md`/bordas retas;
- Testes esperados: nenhuma mudança de comportamento ou texto visível — os 695 testes (unit + e2e) permanecem verdes com as mesmas strings e seletores;
- Esta spec diz: refazer a camada de **apresentação** para os princípios das Apple HIG (paleta neutra iOS system grouped, accent system blue, tipografia SF-like system stack, cantos arredondados, sombras suaves, contraste ≥ 4.5:1, sentence case, touch targets ≥ 44px, reduced-motion), preservando 100% do comportamento, DOM e acessibilidade de texto.

## Objetivo

Aplicar a skill `apple-design` (auditoria HIG) como redesign token-first: os nomes das variáveis de design permanecem idênticos, então **todas as telas herdam o novo visual automaticamente** sem tocar na lógica de negócio. Nenhuma mudança de comportamento, rota, query ou texto.

## Estado atual (levantado no review)

- `src/index.css`: 3 camadas de profundidade (bg `222 15% 92%`, card `0 0% 96%`, border `222 10% 80%`), gradientes hero multi-cor, sombras com glow, radius `0.75rem`.
- Tipografia: `Plus Jakarta Sans` + `JetBrains Mono` via Google Fonts (`index.html`).
- Componentes: `button.tsx` (`rounded-md`, h-10), `input.tsx` (borda, h-10), `card.tsx` (`rounded-xl`), `MetricCard` (barra gradiente + overlay), `AppSidebar` (item ativo com border-left), `BottomTabBar` (ativo com underline).
- Problemas HIG identificados: contraste < 4.5:1 em gold/warning com texto branco, labels MAIÚSCULAS, `text-[10px]` < 11pt mínimo mobile, excesso de gradiente/glow, animações sem `prefers-reduced-motion`.

## Arquitetura alvo

Redesign token-first — **sem criar módulos novos**:

| Camada | Mudança |
|---|---|
| `src/index.css` | Tokens HSL reescritos: paleta neutra iOS (bg `220 15% 96%`, card branco, border sutil), primary **system blue** `211 100% 42%`, dark mode preto `0%`/card `11%`, sombras suaves, gradientes sóbrios, radius `1rem`, `@media (prefers-reduced-motion: reduce)` global |
| `tailwind.config.ts` | Font stack **system SF-like** (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, ...`), mono `ui-monospace`/SF Mono |
| `index.html` | Remove Google Fonts (Plus Jakarta/JetBrains) + `theme-color` novo |
| `ui/button.tsx` | `rounded-full` (pill), h-11 (44px), `active:scale-[0.97]`, shadows sutis |
| `ui/input.tsx` | Filled style iOS: `rounded-xl`, `bg-secondary/60`, h-11 |
| `ui/card.tsx` | `rounded-2xl` |
| `ui/table.tsx` | Headers sentence case (sem `uppercase`) |
| `AppSidebar.tsx` / `BottomTabBar.tsx` | Ativo em **pill** `bg-primary/10 text-primary`; tab bar `backdrop-blur-xl`; labels 11px |
| `MetricCard.tsx` / `AltitudeBar.tsx` | Barra sólida (sem gradiente), cor única |
| `Dashboard.tsx` | Cor do gráfico → primary; labels sentence case; barra hero sóbria |
| `docs/UI-GUIDE.md` | Documenta o novo design system |

**Fora de escopo:** lógica de negócio (`src/lib/`, `src/features/`), textos visíveis, rotas, testes, queries/mutations.

## Verificação

1. `npm run typecheck` — ok;
2. `npm run lint` — 0 erros;
3. `npm run format:check` — ok;
4. `npm test` — suíte completa verde (695 testes);
5. `npx playwright test tests/responsivo.spec.ts tests/smoke.spec.ts` — e2e verde;
6. `npm run build` — ok;
7. `node scripts/verify-docs.mjs --strict` — 0 issues;
8. `npm run pre-pr` — 0 errors (relatório HTML);
9. Code review por subagente (rule-38) + evento `code-review:done` com `subagent:true`;
10. Teste local pelo usuário (`npm run dev` em `http://localhost:8080/`) — **sem deploy** (AUTH gate rule-35 aguarda aprovação do usuário).
