# Spec: Code Splitting para Recharts

**Data:** 2026-07-09
**Feature:** Lazy load do recharts para melhorar performance do bundle

## Problema

O bundle principal `index.js` tem ~1MB, com recharts contribuindo com ~163kB (gzip: 53kB). Isso causa:
- Tempo de carregamento inicial lento em mobile
- warnings no build sobre chunks > 500kB
- Experiência ruim em conexões lentas

## Solução

Implementar lazy loading do recharts, carregando-o apenas quando necessário (Dashboard e Relatórios).

## Abordagens

### Abordagem 1: Lazy load do componente DashboardCharts (Recomendada)

**Como:**
1. Tornar `DashboardCharts.tsx` um lazy component
2. Usar `React.lazy()` + `Suspense` no Dashboard.tsx
3. Recharts será carregado apenas quando Dashboard for acessado

**Prós:**
- Simples de implementar (2-3 horas)
- Não muda arquitetura
- Recharts só carrega quando necessário

**Contras:**
- Recharts ainda é carregado junto com Dashboard
- Não resolve se Dashboard é a primeira página

### Abordagem 2: Manual chunk para recharts

**Como:**
1. Adicionar recharts ao `manualChunks` no vite.config.ts
2. Criar chunk separado `recharts.js`
3. Será carregado quando qualquer componente que usa recharts for acessado

**Prós:**
- Chunk separado, cache eficiente
- Recharts não bloqueia carregamento inicial

**Contras:**
- Recharts ainda é carregado quando Dashboard é acessado
- Mais complexo que Abordagem 1

### Abordagem 3: Lazy load por rota (Mais complexa)

**Como:**
1. Tornar Dashboard uma rota lazy
2. Usar `React.lazy()` na rota `/`
3. Todo o bundle do Dashboard (incluindo recharts) será carregado sob demanda

**Prós:**
- Bundle inicial ainda menor
- Dashboard só carrega quando usuário acessa

**Contras:**
- Dashboard é a página inicial, então sempre será carregada
- Mais complexo, menor benefício

## Recomendação

**Abordagem 1** - Lazy load do componente DashboardCharts.

**Razão:**
- Menor esforço (2-3 horas)
- Resolve o problema principal (recharts não carrega no bundle inicial)
- Dashboard é a primeira página, mas recharts só é necessário quando gráficos são renderizados
- Pode ser expandido para Abordagem 2 depois se necessário

## Métricas de Sucesso

1. **Bundle size:** index.js deve diminuir de ~1MB para ~850kB
2. **Vendor chunk:** recharts deve aparecer como chunk separado (~163kB)
3. **Performance:** Lighthouse score deve melhorar em 5-10 pontos
4. **Testes:** Todos os 8 E2E devem continuar passando

## Implementação

### Passo 1: Criar lazy component

```tsx
// src/components/DashboardCharts.tsx
import { lazy, Suspense } from 'react';

const DashboardChartsContent = lazy(() => import('./DashboardChartsContent'));

export function DashboardCharts(props) {
  return (
    <Suspense fallback={<div>Carregando gráficos...</div>}>
      <DashboardChartsContent {...props} />
    </Suspense>
  );
}
```

### Passo 2: Mover conteúdo para DashboardChartsContent.tsx

Mover todo o conteúdo atual de DashboardCharts.tsx para DashboardChartsContent.tsx.

### Passo 3: Atualizar vite.config.ts (opcional)

Adicionar recharts ao manualChunks para melhorar cache:

```ts
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
  charts: ['recharts'],
},
```

## Riscos

1. **Suspense fallback pode parecer lento** - Mitigação: usar skeleton loader
2. **Recharts pode ter problemas com lazy loading** - Mitigação: testar thoroughly
3. **Build pode quebrar** - Mitigação: testar build antes de commit

## Prioridade

**Alta** - Resolve problema real para todos os usuários, menor esforço.
