# Especificação — Conclusão do Roadmap de Refatoração

## Objetivo
Concluir os itens do `docs/ROADMAP-REFACTORY.md` que ainda não possuem evidência explícita de implementação ou validação, sem alterar contratos públicos nem introduzir dados demo na UI.

## Escopo
1. **Telemetria:** expor a integração da API de telemetria com `telemetryQueue`, preservando funções puras e mantendo a fila como única camada com efeitos de persistência.
2. **Validação:** tratar modelos vazios ou compostos apenas por espaços como inválidos; normalizar `success_rate` para o intervalo `0..1`.
3. **Smoke E2E:** tornar a asserção de conta recém-criada específica para o combobox visível, evitando conflito entre `span` e `option`.
4. **Documentação:** marcar A.1–F.2 no roadmap apenas após evidência correspondente de código, testes ou comando executado.

## Abordagem técnica
- Adicionar testes unitários antes das mudanças de comportamento.
- Reutilizar `hasValidModelIdentity` em todos os pontos de validação.
- Implementar clamp defensivo em `computeSuccessRate` e nos defaults de registros.
- Exportar a integração de fila sem criar ciclo de runtime: `telemetryQueue` importa apenas o tipo de `aiTelemetry`.
- Ajustar somente o locator do teste E2E; não modificar o comportamento da aplicação para satisfazer o teste.
- Executar typecheck, lint, format check, testes unitários, build, verify-docs e pre-pr.

## Critérios de aceitação
- Testes cobrem modelo com espaços, taxas abaixo/acima do intervalo e integração pública da fila.
- Smoke E2E não apresenta strict mode violation no locator corrigido.
- `npm run check:pr` e `npm run pre-pr` passam sem erros.
- Roadmap A.1–F.2 marcado com evidências verificáveis.
- PR separado, baseado em `main`, com revisão de subagente e CI aprovado.

## Riscos e mitigação
- **Ciclo de imports:** usar importação apenas de tipo na fila e exportação fina na API.
- **Mudança de semântica de métricas:** clamp somente valores inválidos; valores válidos permanecem iguais.
- **Smoke dependente de dados remotos:** validar o seletor por role/combobox, sem depender de texto duplicado em `option`.
