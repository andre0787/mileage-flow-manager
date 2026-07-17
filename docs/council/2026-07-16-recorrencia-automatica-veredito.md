# Veredito do Council — recorrência automática por tipo de origem

## Solicitação

Corrigir a falha E2E em que selecionar um tipo de origem configurado como recorrente não exibe “Recorrência ativada pelo tipo de origem selecionado”.

### Advisor: Contrarian
**Análise:** A falha pode ser um teste frágil, mas o código confirma que `EntryForm` nunca lê `OrigemType.description`; portanto, um tipo marcado como recorrente não altera o formulário. Corrigir apenas o texto no teste esconderia uma quebra funcional.

Também é necessário verificar a inicialização de estado: a seleção acontece depois da montagem do formulário, então a recorrência precisa ser derivada no `onValueChange` e limpar os campos quando o tipo não for recorrente.

**Veredito:** Faça, corrigindo o fluxo de UI e mantendo o teste como aceitação.

### Advisor: First Principles
**Análise:** O tipo de origem é a fonte de configuração (`hasRecurrence` serializado em `description`). O formulário deve transformar essa configuração em estado de edição (`isRecurrent`, datas e parcelas). Hoje existe o parser centralizado, mas ele só é usado na tela de configurações.

A menor correção é importar `parseOrigemTypeDescription`, localizar o tipo selecionado e aplicar `isRecurrent: true` quando `hasRecurrence` for verdadeiro. A regra do formulário exige pelo menos duas parcelas e uma data inicial, então esses valores também devem receber defaults válidos.

**Veredito:** Faça no `EntryForm`, reutilizando o parser existente.

### Advisor: Expansionist
**Análise:** Corrigir no componente melhora tanto a aceitação E2E quanto a experiência real: novos tipos recorrentes criados nas configurações passam a funcionar sem configuração manual. O comportamento deve continuar compatível com tipos sem recorrência e com o modo de edição.

Não é necessário alterar banco, mutation ou modelo de dados. A configuração já existe e deve ser consumida no ponto em que o usuário seleciona o tipo.

**Veredito:** Faça, com cobertura para seleção recorrente e não recorrente.

### Advisor: Outsider
**Análise:** Para o usuário, “Clube Fidelidade” é reconhecido como uma operação mensal; exigir que ele marque recorrência novamente contradiz a configuração que ele acabou de cadastrar. O texto esperado é uma consequência visível da seleção, não uma obrigação do teste.

A aceitação deve selecionar um tipo recorrente e verificar o aviso, o checkbox ativo e a possibilidade de informar parcelas. Também deve garantir que “Compra Direta” não fique recorrente por herança de estado.

**Veredito:** Faça e preserve o reset ao trocar para tipo avulso.

### Advisor: Executor
**Análise:** A implementação é pequena: importar `parseOrigemTypeDescription`, criar um handler para `origemTypeId`, encontrar o objeto selecionado, extrair `hasRecurrence` e atualizar o estado em uma única chamada. O texto de aviso provavelmente já existe em outra parte do componente ou precisa ser adicionado junto do estado.

Depois, rodar o teste E2E específico, unitários, build e pre-pr. O novo veredito deve ser referenciado no MAP para satisfazer a validação de documentos.

**Veredito:** Faça no menor diff possível, sem nova abstração.

## Peer Review

- **Contrarian:** concorda com o diagnóstico no componente e rejeita alterar apenas o teste.
- **First Principles:** reforça que o parser existente deve ser a única fonte da interpretação de `description`.
- **Expansionist:** aceita limitar o escopo ao formulário; não há necessidade de migration ou mutation.
- **Outsider:** exige que a troca entre tipos recorrente e avulso não deixe o checkbox preso.
- **Executor:** confirma que a correção pode ser validada pelo próprio E2E existente e por um teste unitário simples do parser/estado, se necessário.

## Síntese do Chairman

**Consenso:** A falha é real: `EntryForm` não consome `OrigemType.description`, embora o sistema já salve e interprete `hasRecurrence` na configuração. O teste expõe uma lacuna funcional, não apenas instabilidade.

**Veredito Final:** Faça.

**Próximos Passos:**
1. Reutilizar `parseOrigemTypeDescription` em `EntryForm`.
2. Derivar a recorrência ao selecionar o tipo de origem.
3. Resetar recorrência ao selecionar tipo avulso.
4. Rodar o E2E específico e a suíte completa.
5. Atualizar relatório, handoff e PR #150.
