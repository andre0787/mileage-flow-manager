# Relatório de Implementação

> Template acionado via `/report` ao finalizar uma feature/manutenção.
> Gera relatório HTML com antes/depois, benefícios e consumo de tokens.

## Instruções

1. Obtenha o diff da branch: `git diff $(git merge-base HEAD origin/develop)..HEAD`
2. Analise o diff para extrair:

### Before & After (3 linhas no máximo cada)
- **Antes**: o que existia, o que motivou a mudança
- **Depois**: o que foi implementado, como ficou

### Benefícios
Listar em tópicos o que melhorou: menos código, mais performance, menos bugs,
UX melhorado, etc.

### Consumo de Tokens (estimativa)
Calcular a partir do diff:
- `git diff --stat` → arquivos alterados, inserções, deleções
- Estimar tokens: `~ (additions + deletions) * 4 / 3` (média ~¾ token por linha de diff)
- Se houver medição real do session manager, usar esse valor

### Formato de saída

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório — [nome da tarefa]</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #1a1a2e; }
  h1 { border-bottom: 2px solid #5B72C4; padding-bottom: .5rem; }
  .stat { display: inline-block; background: #f0f4ff; padding: .25rem .75rem; border-radius: 6px; font-size: .875rem; }
  .benefits li { margin: .5rem 0; }
  pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: .75rem; font-weight: 600; }
  .badge-green { background: #d4edda; color: #155724; }
  .badge-blue { background: #cce5ff; color: #004085; }
</style>
</head>
<body>
<h1>📋 Relatório: [nome da tarefa]</h1>
<p class="stat">📁 +N arquivos · ➕ N linhas · ➖ N linhas</p>
<p class="stat" style="margin-left: .5rem;">⚡ ~N tokens</p>

<h2>Antes</h2>
<p>...</p>

<h2>Depois</h2>
<p>...</p>

<h2>Benefícios</h2>
<ul class="benefits">
  <li>✅ ...</li>
</ul>

<h2>Detalhes</h2>
<pre>
[trecho relevante do diff stat]
</pre>
</body>
</html>
```

3. Salve o HTML em `docs/reports/<data>-<nome-da-tarefa>.html`
4. Informe o usuário do caminho do arquivo
