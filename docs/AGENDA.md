# 📋 Agenda — MilesControl

> Sprint board do projeto. Mantenha atualizado: toda tarefa nova vira checkbox,
> toda finalizada é movida pra ✅.

---

## ✅ Sprint #3 — Completa (PR #54 merged em 2026-07-09)

### Entregues
- [x] #6 — Entradas.tsx → componentes extraídos
- [x] #7 — Vendas.tsx → componentes extraídos
- [x] #8 — useDatabase.ts → split em 10 módulos
- [x] #9 — strictNullChecks ativado
- [x] #10 — 33 testes unitários (metrics.ts)
- [x] #11 — Lint errors corrigidos
- [x] #12 — Centralizar formatação
- [x] #13 — Helpers de teste
- [x] #14 — Vitest na bateria pré-deploy
- [x] #15 — Prettier configurado
- [x] #16 — Configuracoes.tsx → seções extraídas

---

## 🔄 Sprint #4 — Em Andamento (PR #55 aberta)

### Entregues
- [x] CSV export em Vendas.tsx (botão "Exportar")
- [x] Playwright retries (retries: 1)
- [x] Dashboard com gráficos (já existia — PieChart + BarChart via recharts)

### Pendentes
- [ ] Merge PR #55 → main
- [ ] Corrigir teste origem-tipo (bug: isClube não setado ao criar tipo)
- [ ] Investigar teste fluxo-completo (Supabase 409)

---

## 📌 Backlog Futuro

- [ ] Exportação PDF dos relatórios
- [ ] Notificações push para confirmação de entradas
- [ ] Modo offline com sincronização
- [ ] Multi-idioma (i18n)
- [ ] Code splitting (recharts é 163kB — lazy load)
