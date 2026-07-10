# Relatório de Teste de Experiência

Data: 2026-07-10T11:25:29.516Z
Email: fluxo_1783682729396@teste.com

## Resultados

-  ✅ Registro concluído
-  ✅ Dados de teste criados
-  ❌ Erro: locator.click: Error: strict mode violation: getByRole('button', { name: 'Nova Entrada' }) resolved to 2 elements:
    1) <button data-lov-name="Button" data-component-line="241" data-component-name="Button" data-component-file="Entradas.tsx" data-lov-id="src/pages/Entradas.tsx:241:10" data-component-path="src/pages/Entradas.tsx" data-component-content="%7B%22text%22%3A%22Nova%20Entrada%22%2C%22className%22%3A%22gap-2%20shrink-0%22%7D" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:…>…</button> aka getByRole('button', { name: 'Nova Entrada' }).first()
    2) <button data-lov-name="Button" data-component-line="51" data-component-name="Button" data-component-content="%7B%7D" data-component-file="EmptyState.tsx" data-lov-id="src/components/EmptyState.tsx:51:8" data-component-path="src/components/EmptyState.tsx" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disa…>Nova Entrada</button> aka getByLabel('Pontos').getByRole('button', { name: 'Nova Entrada' })

Call log:
[2m  - waiting for getByRole('button', { name: 'Nova Entrada' })[22m

- Table HTML capture: <table data-lov-id="src/components/EntryTable.tsx:161:8" data-lov-name="Table" data-component-path="src/components/EntryTable.tsx" data-component-line="161" data-component-file="EntryTable.tsx" data-component-name="Table" data-component-content="%7B%7D" class="w-full caption-bottom text-sm"><thead data-lov-id="src/components/EntryTable.tsx:162:10" data-lov-name="TableHeader" data-component-path="src/components/EntryTable.tsx" data-component-line="162" data-component-file="EntryTable.tsx" data-co