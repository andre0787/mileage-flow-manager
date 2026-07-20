# Task Card — Skill repo-local small-model-execution

| Campo | Valor |
|-------|-------|
| `id` | P1-12 |
| `categoria` | feat |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | implementing |
| `origem` | veredito 2026-07-17, item #12 |
| `dependeDe` | [P1-08, P1-09, P1-11] |

## Objetivo
Criar uma skill repo-local curta, `.pi/skills/small-model-execution/SKILL.md`,
que aponta para comandos (task:validate, context:pack, task:state) sem repetir a
documentação inteira.

## Não objetivos
- Instalar várias skills externas (veredito: "não instalar mais skills agora").
- Recriar Superpowers (já existe).

## Contexto
O veredito (The Contrarian, Revisão D) diz: skill adicional só após o contrato
estar estabilizado, e deve ser repo-local (não symlink absoluto, que quebra em
outro ambiente).

## Arquivos permitidos
- `.pi/skills/small-model-execution/*` (novo)
- `scripts/rules/rule-23*` (validar existência da skill)
- `scripts/rules/rule-scope.mjs` (mock card isolation)
- `tests/unit/scripts-rules.test.ts` (atualizar teste de card ativo)

## Critérios de aceite
- [ ] SKILL.md existe, é curto e aponta para comandos versionados.
- [ ] Não usa symlink absoluto para fora do repo.
- [ ] `rule-23` confirma a skill como presente e portátil.

## Riscos / Invariantes
- Não duplicar conteúdo de WORKFLOW-MANIFEST.md (apontar, não repetir).

## Testes obrigatórios
- `npm run pre-pr` (rule-23)
- leitura humana do SKILL.md por um "agente novo".

## Evidência de pronto
- SKILL.md + saída de rule-23.
