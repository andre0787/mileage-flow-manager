# AI Session State - 2026-10-29

## Última Task
- Deploy passou a publicar também em push na `main` (#805), cobrindo merge humano que antes exigia dispatch manual.
- Remote `origin` limpo: PAT embutido removido, push agora autentica via `gh auth git-credential`.
- Produção em `02d5609e`, deploy run `40809293566` disparado por `event=push` sem intervenção manual.

## Estado dos Testes & Qualidade
- `npm run check:fast` verde: typecheck, lint, format, 223 arquivos de teste, verify-docs.
- `tests/unit/workflows-guard.test.ts` com 31 testes (substituída a asserção que proibia gatilho `push`, agora cobre `push` + `concurrency`).
- Jobs `deploy` e `e2e-smoke-prod` success no run automático; `https://mileage-flow-manager.vercel.app` responde 200.

## Arquivos Modificados & Impacto
- `.github/workflows/deploy.yml`: gatilho `push` em `main` com `paths-ignore` para `docs/**`/`**.md` e `concurrency: deploy-prod` (sem cancelar deploy em andamento).
- `tests/unit/workflows-guard.test.ts`: guardas do novo gatilho e da serialização.
- `.git/config`: remote sem credencial embutida (configuração local, não versionada).

## Pendências Imediatas
- `docs/tracking/events.jsonl` segue como append global e conflita em toda PR; o sharding exigiria tocar ~18 leitores (rules 36/38/39, métricas, KPI, UI) — precisa de spec antes.
- Revogar no GitHub o PAT `ghp_...` que estava na URL do remote (estava inválido, mas foi exposto no histórico do shell).
- Nenhuma PR aberta; backlog zerado.

## Governança de Contexto
- Categoria: chore/ci — só `AGENTS.md` carregado.
- Autorização do usuário: "ajusta tudo que conseguir e o que não der pode remover as prs e depois encerrar a sessão".
- O que não era seguro fazer nesta sessão (sharding do log de eventos) foi registrado como pendência em vez de executado sem spec.
