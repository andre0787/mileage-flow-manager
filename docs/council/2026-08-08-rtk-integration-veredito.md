# Veredito — Council: Integração do RTK (github.com/rtk-ai/rtk) no workflow

> **Data:** 2026-08-08
> **Sessão:** feature — avaliar benefícios de integrar rtk no workflow; se benéfico, implementar com scripts de validação
> **Topico:** tooling/dev-experience — proxy de CLI que reduz consumo de tokens do agente

---

## Solicitação

Avaliar se existem benefícios em integrar https://github.com/rtk-ai/rtk ao workflow do MilesControl.
Se sim, implementar com todos os scripts de validação necessários.

## Evidências coletadas (evidência antes de opinião)

| Item | Evidência |
|------|-----------|
| O que é | RTK: CLI proxy em Rust (binário único, zero deps, Apache-2.0, ~75k stars) que reduz 60-90% do bash output lido pelo agente LLM; <10ms overhead; 100+ comandos suportados |
| Versão | v0.45.0 (2026-08-08); extensão Pi exige `rtk >= 0.23.0` |
| Integração Pi | `rtk init --agent pi` cria `.pi/extensions/rtk.ts` (local) ou `~/.pi/agent/extensions/rtk.ts` (global); pi auto-descobre extensões no startup |
| Compatibilidade pi 0.84.1 | `ExtensionAPI` expõe `pi.exec` (`dist/core/extensions/types.d.ts:944`), `pi.on("tool_call")` e `isToolCallEventType` — API da extensão RTK é compatível |
| Comandos cobertos (relevantes) | `git status` 75-93%, `git log` 80-92%, `git diff/show` 70%, `npm test` (falhas only), `vitest` 94-99%, `playwright test` 90%, `next build` 80%, `ls` 80%, `grep/rg`, `cat/read`, `gh` |
| Fail-open | Extensão nunca bloqueia: rtk ausente/velho → warning + pass-through; erro no handler → pass-through; bypass por `RTK_DISABLED=1` ou `exclude_commands` no `~/.config/rtk/config.toml` |
| Telemetria | Desabilitada por padrão (opt-in explícito durante `rtk init`); `RTK_TELEMETRY_DISABLED=1` |
| Tee system | Em falha, salva output completo em arquivo local e imprime o path (recuperável) |
| Versionamento | `.pi/extensions/` NÃO está no `.gitignore` (só `.pi/packages`, `.pi/npm`, `.pi/sessions`, `.pi/git/`) → extensão é versionável no repo |
| Instalação | Máquina sem brew; `cargo` disponível (`~/.cargo/bin/cargo`); quick install via `curl ... install.sh` → `~/.local/bin`; binário pré-compilado linux musl ~4.4MB |
| Workflow do projeto | Toda regra imutável tem script de validação em `scripts/rules/`; pre-pr roda `scripts/rules/*.mjs` automaticamente; rule-16 exige atalho npm; rule-24 exige testes reais; rule-29 prompt versioning se AGENTS.md mudar |
| CI | `check-pr` roda no GitHub Actions — RTK é local-only; validação não pode falhar no CI sem rtk instalado |
| Riscos mitigados | Scripts do projeto rodam via `execSync` do node (não passam pelo hook de bash tool call do pi); `npm run pre-pr`/`npm run session:end` não têm rewrite RTK → pass-through |

## Advisors

### Advisor: The Contrarian
**Análise:** O que vai falhar? (a) **Rewrite pode esconder output que o agente precisa** — `rtk git diff` corta headers/contexto; este projeto lida com dados financeiros (saldos, inversões), onde contexto reduzido pode levar a decisão errada numa auditoria. Mitigações existem: tee salva output completo em falha, `RTK_DISABLED=1` para bypass pontual, e o rewrite só ocorre para comandos cobertos (pass-through caso contrário). (b) **CI**: se a validação da regra exigir rtk instalado, todo PR falha no Actions sem o binário — precisa de guard explícito (skip não-falho quando ausente/CI). (c) **Falsa economia**: os percentuais medem redução de bash output, não da fatura — diluem em input tokens (bash output é 1 contribuinte entre prompt, histórico e output tokens). (d) **Extensão de terceiros no ambiente do agente**: um bug na extensão pode interferir com o fluxo de `tool_call` de outras extensões (pi drena eventos antes de executar). (e) **Silêncio perigoso**: se o dev não instala rtk, a extensão passa-through silenciosamente — a promessa de economia some sem aviso claro.
**Veredito:** Faça, com ressalvas: guard de CI obrigatório, `RTK_DISABLED`/tee documentados para auditoria financeira, validação de versão mínima na regra, e mensagem clara quando rtk ausente.

### Advisor: First Principles Thinker
**Análise:** Princípio: o trabalho do agente é ler output e agir — cada token de bash output lido é custo sem valor agregado se for ruído. Este projeto é explícita e obsessivamente token-conscious (ponytail mode, caveman mode, `docs/CONTEXT-MANAGEMENT.md`, handoff comprimido, lazy loading de docs): RTK é a mesma filosofia aplicada no nível mais baixo — o comando shell. O workflow roda dezenas de comandos por sessão (`git status/log/diff`, `npm test`, `check:fast`, `pre-pr`); `git status` 75-93% menor e `npm test` só com falhas são material em sessões longas. O princípio "evidência antes de opinião" do Fable exige economia medível: `rtk gain` fornece dashboard real. A integração é reversível: desinstalar = remover 1 arquivo + 1 regra.
**Veredito:** Faça. Prioridades: medir com `rtk gain`, guard de CI, extensão versionada, regra de validação simples.

### Advisor: The Expansionist
**Análise:** Oportunidades: (a) economia de tokens em TODAS as sessões futuras (efeito composto — cada sessão com check:fast, pre-pr, git diff lê menos); (b) `rtk gain` gera dashboard de economia que o `npm run retro` pode citar como métrica de eficiência; (c) cobre vitest/playwright — o `check:pr` roda build+test, exatamente o que RTK comprime; (d) a extensão versionada documenta o setup do dev (onboarding mais fácil); (e) ecossistema saudável: 75k stars, Apache-2.0, manutenção ativa — risco de abandono baixo; (f) alinhamento com a regra do projeto de reduzir consumo de tokens em todo o fluxo.
**Veredito:** Faça. Sugere incorporar métrica de economia ao retro como benefício secundário (não bloqueante).

### Advisor: The Outsider
**Análise:** Perguntas óbvias: (a) precisa instalar algo na máquina? Sim — é tooling de dev local; o repo só recebe a extensão `.ts` (~70 linhas, thin delegating). (b) quebra os scripts do projeto (pre-pr, session:end)? Os scripts rodam via `execSync` do node — NÃO passam pelo hook do pi (o hook reescreve apenas bash tool calls do agente); e `npm run pre-pr` não é comando coberto pelo `rtk rewrite` → pass-through garantido. (c) e se o agente precisar do output completo? `RTK_DISABLED=1 <cmd>` ou ler o tee file. (d) custo de manutenção? Uma regra de validação (~40 linhas) + doc + testes. Baixo. (e) por que agora? Porque a extensão oficial para Pi existe (`rtk init --agent pi`) e o projeto já vive no ecossistema pi com extensões (`pi-package-webui`).
**Veredito:** Faça.

### Advisor: The Executor
**Análise:** Esforço: (a) instalar rtk na máquina (~2min: `curl install.sh` ou `cargo install --git`); (b) `rtk init --agent pi` → gera `.pi/extensions/rtk.ts` (versionar no repo); (c) `scripts/rules/rule-37-rtk.mjs`: valida `rtk --version >= 0.23.0`, extensão presente, e **skip não-falho** quando ausente ou em CI (para não quebrar `check-pr`); (d) atalho npm `rule:37` (rule-16); (e) docs: CONVENTIONS.md + AGENTS.md regra #37 + `npm run prompt:manifest` (rule-29); (f) testes unitários reais da regra (rule-24/25); (g) pre-pr → PR. Nenhum toque em código de negócio — risco baixíssimo.
**Veredito:** Faça. Ordem: install → extension → rule-37 → testes → doc → pre-pr → PR.

## Peer Review

- **Contrarian** reforça: o guard de CI é inegociável — sem ele, todo PR falha no Actions. Concorda com tee + `RTK_DISABLED` como escape hatch para auditorias financeiras.
- **First Principles** ajusta: a validação deve tratar "rtk ausente" como WARN não-falho em máquinas locais sem rtk, mas exigir versão mínima quando instalado (fail-fast na máquina com rtk velho).
- **Expansionist** concorda: `rtk gain` como sugestão de métrica no retro, sem bloquear o PR.
- **Outsider** confirma: scripts node (execSync) não passam pelo hook — zero risco para pre-pr/session:end.
- **Executor** confirma: regra nova segue o padrão rule-NN; testes unitários com fixture simulando ausência/versão velha/CI.

## Síntese do Chairman

**Consenso:** Faça. Integrar RTK ao workflow: instalar rtk (local, fora do repo), gerar extensão Pi versionada em `.pi/extensions/rtk.ts`, criar `scripts/rules/rule-37-rtk.mjs` validando versão mínima + extensão presente, com skip não-falho em CI/ausência; atalho npm `rule:37`; documentar em CONVENTIONS.md e AGENTS.md (regra #37); testes unitários; pre-pr → PR.

**Veredito Final:** Faça

**Próximos Passos:** Superpowers — brainstorming (spec em `docs/superpowers/specs/`) → branch `feat/rtk-workflow` → TDD (teste da rule-37) → implementação → pre-pr → PR

**Extended Thinking Usado:** não (decisão de tooling de baixo risco, reversível, sem tocar em dados financeiros; escopo bem definido)
