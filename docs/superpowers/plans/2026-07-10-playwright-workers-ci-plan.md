# Plano — Playwright workers no CI

1. Atualizar `playwright.config.ts` para usar 2 workers quando `CI=true`.
2. Rodar um subset de E2E local com `--workers=2` para checar estabilidade.
3. Atualizar `docs/reports/PR75-2026-07-10-playwright-workers-ci.html`.
4. Atualizar `HANDOFF.md`.
5. Abrir PR e acompanhar o CI até concluir.
