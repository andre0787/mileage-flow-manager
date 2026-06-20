# MilesControl - Instruções para Agentes

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router v6
- TanStack React Query
- Recharts
- react-hook-form + zod

## Padrões
- Componentes em `src/components/`
- Páginas em `src/pages/`
- Utilitários em `src/lib/`
- Hooks em `src/hooks/`
- Componentes UI (shadcn) em `src/components/ui/`
- Import paths: `@/` aponta para `src/`
- Nomes de arquivos: PascalCase para componentes, camelCase para utils
- Interface em português (pt-BR)

## Estado Atual
- Todos os dados são mock (hardcoded) - sem backend
- Sem testes
- Sem camada de dados compartilhada entre páginas
- Design system definido em CSS vars HSL no index.css

## Comandos
- `npm run dev` - servidor dev
- `npm run build` - build produção
- `npm run lint` - ESLint

## Observações
- Não adicionar dependências sem necessidade
- Seguir padrão do shadcn/ui para novos componentes
- Manter consistência do design system (cores, sombras, animações)
