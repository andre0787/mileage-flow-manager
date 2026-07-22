# Fluxograma do Projeto — MilesControl

> Diagrama geral do ecossistema: desenvolvimento + arquitetura + task system.
> Gerado em 2026-07-22.

## Visão Geral

```mermaid
flowchart TB
    subgraph Ecosistema["🌐 Ecossistema do Projeto"]
        direction TB
        
        subgraph Dev["⚙️ Workflow de Desenvolvimento"]
            direction TB
            SS["npm run session:start
📋 lê handoff.md + snapshot"]
            CAT{"Qual categoria?"}
            CAT -->|feature| F["WORKFLOW.md
+ CONVENTIONS.md
(council → build)"]
            CAT -->|bugfix| BUG["DEBUG.md
+ CONVENTIONS.md
(triagem → fix)"]
            CAT -->|docs| DOCS["só AGENTS.md
(editar → pre-pr)"]
            CAT -->|refactor| REF["CONVENTIONS.md
+ ARCHITECTURE.md
(spec → build)"]
            CAT -->|chore| CHORE["só AGENTS.md
(executar → pre-pr)"]
            
            F --> COUNCIL{"LLM Council?
(trigger se dúvida
design/risco)"}
            COUNCIL -->|decidir| BRAIN["🧠 Brainstorming
→ docs/superpowers/specs/"]
            COUNCIL -->|pular| PLAN["📝 Plano
→ docs/superpowers/plans/"]
            BRAIN --> PLAN
            
            PLAN --> BRANCH["🌿 Branch:
feat|fix|docs|chore/<nome>"]
            BRANCH --> IMPL["👨‍💻 Implementação
Serena-First navigation
TDD (red→green→refactor)"]
            
            IMPL --> PREREP["📊 npm run pre-pr
(relatório HTML automático)
+ git status ZERO"]
            PREREP --> PR["🔀 Pull Request → main
npm run report --write
+ CI (build+test+E2E)"]
            PR --> MERGE["✅ Merge
git squash + handoff"]
            MERGE --> DEPLOY["🚀 Deploy Automático
Vercel
mileage-flow-manager.vercel.app"]
        end

        subgraph Tasks["📋 Sistema de Tasks"]
            direction TB
            ROADMAP["docs/tasks/ROADMAP.md
3 ondas de evolução"]
            
            ROADMAP --> P0["🟠 P0 — Confiança
(8 cards, done ✅)
workflow + CI + git"]
            ROADMAP --> P1A["🔵 P1-A — Contrato
(5 cards, done ✅)
schema + estados + escopo"]
            ROADMAP --> P1B["🔵 P1-B — Testes
(6 cards, done ✅)
typecheck + invariants + e2e"]
            ROADMAP --> P2["🟢 P2 — Feedback
(4 cards, done ✅)
métricas + qualidade"]
            
            P0 --> TC["📄 Cada card =
docs/tasks/P?-NN-*.md
com template canônico
_TEMPLATE.md"]
            P1A --> TC
            P1B --> TC
            P2 --> TC
            
            TC --> ESTADOS{"Estados do card"}
            ESTADOS -->|pending| PLANNED["planned
(branch + plano)"]
            ESTADOS -->|planned| IMPL2["implementing
(código)"]
            ESTADOS -->|implementing| VERIFIED["verified
(testes + pre-pr)"]
            ESTADOS -->|verified| REVIEW["review
(PR aberto)"]
            ESTADOS -->|review| DONE["done
(mergeado main)"]
            ESTADOS -->|blocked| PENDING["pending
(após resolver)"]
        end

        subgraph App["🏗️ Arquitetura da App"]
            direction TB
            
            subgraph Frontend["React + Vite + Tailwind"]
                PAGES["📱 Páginas
Dashboard | Entradas | Vendas
Contas | Clientes | ControleCPF
Relatorios | Configuracoes
Perfil | Login | NotFound"]
                
                COMP["🧩 Componentes
MetricCard | AltitudeBar
FlowMap | FormDrawer
AppSidebar | BottomTabBar
GlobalSearch | ErrorBoundary
EmptyState | DeleteConfirm
SkeletonLoader | OfflineBanner
LanguageSelector"]
                
                CTX["📦 Contextos
AuthContext (auth + sessão)
DataContext (dados + cache)
I18nContext (pt-BR/en)
OnlineContext (conexão)"]
                
                HOOKS["🪝 Hooks
useDatabase (queries/mutations)
useDebounce (300ms)
useHaptic (vibração)
useKeyboardShortcuts"]
                
                LIB["📚 Lib (lógica pura)
accounts.ts | metrics.ts
origemTypes.ts | dates.ts
i18n.ts | utils.ts
logger.ts | supabase.ts"]
                
                UI["🎨 shadcn/ui
19 componentes mantidos"]
            end
            
            subgraph Supabase["☁️ Supabase Backend"]
                AUTH["Auth
email/senha
RLS: user_id"]
                DB["Banco
profiles | owners
programs | origem_types
accounts | entries
clients | sales"]
            end
            
            PAGES --> COMP
            PAGES --> CTX
            PAGES --> HOOKS
            COMP --> HOOKS
            HOOKS --> LIB
            HOOKS --> DB
            CTX --> AUTH
            HOOKS --> SUPABASE_CLIENT["supabase.ts
(client Supabase)"]
            SUPABASE_CLIENT -->|React Query| DB
        end
    end

    %% Conexões entre subsistemas
    DEPLOY -.->|alimenta| App
    IMPL -.->|edita| App
    MERGE -.->|atualiza| ROADMAP
    PREREP -.->|valida| App
```

## Fluxo de Dados na App

```mermaid
flowchart LR
    USER["👤 Usuário"] -->|interage| PAGES["📱 Páginas
(Dashboard, Entradas...)"]
    PAGES --> COMP["🧩 Componentes
(MetricCard, AltitudeBar...)"]
    PAGES --> HOOKS["🪝 useDatabase
(queries + mutations)"]
    HOOKS --> CONTEXT["📦 DataContext
(cache + isLoading)"]
    HOOKS --> QUERY["⚡ React Query
(staleTime 30s)"]
    QUERY --> CLIENT["supabase.ts
(Supabase client)"]
    CLIENT --> SUPABASE["☁️ Supabase
(RLS por user_id)"]
    SUPABASE -->|response| QUERY
    QUERY -->|invalidate| HOOKS
    HOOKS -->|dados| PAGES
    COMP -->|UI| USER

    style USER fill:#e1f5fe
    style SUPABASE fill:#f3e5f5
    style QUERY fill:#fff3e0
```

## Rotas da App

```mermaid
flowchart LR
    LOGIN["/login"]
    FORGOT["/forgot-password"]
    RESET["/reset-password"]
    DASH["/ 
Dashboard"]
    ENT["/entradas
Entradas"]
    VEND["/vendas
Vendas"]
    CONTAS["/contas
Contas"]
    CLI["/clientes
Clientes"]
    CPF["/controle-cpf
ControleCPF"]
    REL["/relatorios
Relatorios"]
    CONF["/configuracoes
Configuracoes"]
    PERF["/perfil
Perfil"]

    LOGIN -->|autenticado| DASH
    DASH --> ENT
    DASH --> VEND
    DASH --> CONTAS
    DASH --> CLI
    DASH --> CPF
    DASH --> REL
    DASH --> CONF
    DASH --> PERF

    style LOGIN fill:#e1f5fe
    style DASH fill:#c8e6c9
```

## Navegação Rápida

| Documento | Conteúdo | Link |
|-----------|----------|------|
| WORKFLOW-MANIFEST.md | Fonte canônica do workflow | [docs/WORKFLOW-MANIFEST.md](WORKFLOW-MANIFEST.md) |
| WORKFLOW.md | Detalhamento council-to-superpowers | [docs/WORKFLOW.md](WORKFLOW.md) |
| ARCHITECTURE.md | Estrutura de pastas e dados | [docs/ARCHITECTURE.md](ARCHITECTURE.md) |
| ROADMAP.md | Task cards por onda | [docs/tasks/ROADMAP.md](tasks/ROADMAP.md) |
| MAP.md | Mapa completo do projeto | [docs/MAP.md](MAP.md) |

---

*Diagrama gerado para visão geral do ecossistema MilesControl.*
