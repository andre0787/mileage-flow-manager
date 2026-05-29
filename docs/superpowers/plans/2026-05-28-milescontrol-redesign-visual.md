# MilesControl - Redesign Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign completo da interface do MilesControl com dark mode, gráficos, animações e refinamento visual.

**Architecture:** Manter a estrutura existente (componentes/páginas/hooks). Adicionar ThemeProvider no topo da App. Novo componente ThemeToggle na sidebar. Novo componente DashboardCharts para gráficos Recharts. Refinamentos CSS in-place.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS + shadcn/ui + next-themes + recharts

**Files to Modify:**
- `src/index.css` — novas CSS vars, dark mode refinado
- `tailwind.config.ts` — novas animações, chaves de cor
- `src/App.tsx` — ThemeProvider, page transition
- `src/components/AppSidebar.tsx` — toggle tema, refinamento visual
- `src/components/MetricCard.tsx` — sparkline opcional
- `src/pages/Dashboard.tsx` — gráficos, remover duplicata, sparklines
- `src/pages/Contas.tsx` — refinamento visual
- `src/pages/Clientes.tsx` — refinamento visual
- `src/pages/Entradas.tsx` — refinamento visual
- `src/pages/Vendas.tsx` — refinamento visual
- `src/pages/ControleCPF.tsx` — refinamento visual
- `src/pages/Relatorios.tsx` — refinamento visual

**New Files:**
- `src/components/ThemeToggle.tsx` — botão de alternância dark/light
- `src/components/DashboardCharts.tsx` — gráficos Recharts do Dashboard

---

### Task 1: Refinar Design System (cores + animações)

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Atualizar index.css com cores refinadas e dark mode**

Edit `src/index.css`:

```css
:root {
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --primary-light: 221 83% 60%;
  --primary-dark: 221 83% 40%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  --success-light: 142 52% 96%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
  --warning-light: 54 91% 95%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
  --gradient-primary: linear-gradient(135deg, hsl(221 83% 53%), hsl(221 83% 60%));
  --gradient-success: linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 45%));
  --gradient-card: linear-gradient(145deg, hsl(0 0% 100%), hsl(210 40% 98%));
  --shadow-elegant: 0 4px 20px -2px hsl(221 83% 53% / 0.1);
  --shadow-card: 0 2px 10px -2px hsl(222 47% 11% / 0.08);
  --radius: 0.5rem;
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5% 26%;
  --sidebar-primary: 240 6% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 5% 96%;
  --sidebar-accent-foreground: 240 6% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217 91% 60%;
}

.dark {
  --background: 222 47% 6%;
  --foreground: 210 40% 98%;
  --card: 222 47% 10%;
  --card-foreground: 210 40% 98%;
  --popover: 222 47% 10%;
  --popover-foreground: 210 40% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 6%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 217 33% 22%;
  --input: 217 33% 22%;
  --ring: 224 76% 48%;
  --sidebar-background: 240 6% 10%;
  --sidebar-foreground: 240 5% 96%;
  --sidebar-primary: 224 76% 48%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 240 4% 16%;
  --sidebar-accent-foreground: 240 5% 96%;
  --sidebar-border: 240 4% 16%;
  --sidebar-ring: 217 91% 60%;
}
```

- [ ] **Step 2: Adicionar novas animações no tailwind.config.ts**

Edit `tailwind.config.ts` — adicionar nas keyframes existentes:

```ts
'slide-up': {
  '0%': { transform: 'translateY(10px)', opacity: '0' },
  '100%': { transform: 'translateY(0)', opacity: '1' }
},
'slide-down': {
  '0%': { transform: 'translateY(-10px)', opacity: '0' },
  '100%': { transform: 'translateY(0)', opacity: '1' }
},
'hover-lift': {
  '0%': { transform: 'translateY(0)' },
  '100%': { transform: 'translateY(-2px)' }
},
'pulse-soft': {
  '0%, 100%': { opacity: '1' },
  '50%': { opacity: '0.8' }
}
```

E no `animation`:
```ts
'slide-up': 'slide-up 0.3s ease-out',
'slide-down': 'slide-down 0.3s ease-out',
'hover-lift': 'hover-lift 0.2s ease-out',
'pulse-soft': 'pulse-soft 2s infinite'
```

Adicionar no `colors`:
```ts
primary: {
  DEFAULT: 'hsl(var(--primary))',
  foreground: 'hsl(var(--primary-foreground))',
  light: 'hsl(var(--primary-light))',
  dark: 'hsl(var(--primary-dark))'
}
```

- [ ] **Step 3: Build e verificar**

Run: `npm run build`
Expected: Build sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/index.css tailwind.config.ts
git commit -m "feat: refine design system colors and animations"
```

---

### Task 2: Implementar Dark Mode (ThemeProvider + Toggle)

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/ThemeToggle.tsx`
- Modify: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Criar componente ThemeToggle**

Create `src/components/ThemeToggle.tsx`:

```tsx
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-lg"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

- [ ] **Step 2: Adicionar ThemeProvider no App.tsx**

Envolver o conteúdo do App com `ThemeProvider`:

```tsx
import { ThemeProvider } from "next-themes"

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {/* ... existing content ... */}
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
)
```

- [ ] **Step 3: Adicionar ThemeToggle no AppSidebar**

No final do SidebarContent, antes do `</SidebarContent>`, dentro do div `mt-auto p-4 border-t`, adicionar:

```tsx
<div className="flex items-center justify-between px-3 py-2">
  {!collapsed && <span className="text-sm text-muted-foreground">Tema</span>}
  <ThemeToggle />
</div>
```

E importar no topo:
```tsx
import { ThemeToggle } from "./ThemeToggle"
```

- [ ] **Step 4: Adicionar transição de tema no index.css**

Adicionar no `@layer base`:
```css
html {
  transition: color-scheme 0.3s;
}
body {
  @apply bg-background text-foreground;
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

- [ ] **Step 5: Build e verificar**

Run: `npm run build`
Expected: Build sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/ThemeToggle.tsx src/components/AppSidebar.tsx src/index.css
git commit -m "feat: implement dark mode with theme toggle"
```

---

### Task 3: Dashboard com Gráficos Recharts

**Files:**
- Create: `src/components/DashboardCharts.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Criar componente DashboardCharts**

Create `src/components/DashboardCharts.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { PieChartIcon, BarChart3 } from "lucide-react"

const programData = [
  { name: "LATAM Pass", value: 400000, color: "hsl(221 83% 53%)" },
  { name: "Smiles", value: 64000, color: "hsl(142 76% 36%)" },
  { name: "Livelo", value: 80000, color: "hsl(38 92% 50%)" },
]

const monthlySales = [
  { month: "Jan", vendas: 1200, lucro: 200 },
  { month: "Fev", vendas: 1800, lucro: 350 },
  { month: "Mar", vendas: 1400, lucro: 280 },
  { month: "Abr", vendas: 2200, lucro: 450 },
  { month: "Mai", vendas: 1900, lucro: 380 },
  { month: "Jun", vendas: 3120, lucro: 560 },
]

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Milhas por Programa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={programData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {programData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => value.toLocaleString('pt-BR')}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {programData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-medium">{entry.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4 text-primary" />
            Vendas Mensais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="vendas" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Atualizar Dashboard para incluir gráficos e corrigir duplicata**

No `Dashboard.tsx`:
- Importar `DashboardCharts`
- Remover o "Contas Ativas" duplicado do grid principal (linhas 82-86)
- Adicionar `<DashboardCharts />` entre os MetricCards e "Owner Overview"
- Adicionar `animate-fade-in` nos cards do grid secundário

O grid principal passa a ter 4 MetricCards (remove Contas Ativas):

```tsx
import { DashboardCharts } from "@/components/DashboardCharts"

// No JSX, após o grid principal de métricas, antes do secondary metrics grid:
<DashboardCharts />
```

- [ ] **Step 3: Build e verificar**

Run: `npm run build`
Expected: Build sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/DashboardCharts.tsx src/pages/Dashboard.tsx
git commit -m "feat: add charts to dashboard with recharts"
```

---

### Task 4: Refinar MetricCard com Sparkline

**Files:**
- Modify: `src/components/MetricCard.tsx`

- [ ] **Step 1: Adicionar sparkline opcional no MetricCard**

Adicionar suporte a `sparklineData?: number[]` na interface.

Extrair sparkline para um mini componente inline usando SVG (sem recharts para não pesar):

```tsx
interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; isPositive: boolean }
  variant?: "default" | "success" | "warning"
  sparklineData?: number[]
}

// Dentro do CardContent, após trend, adicionar:
{sparklineData && (
  <div className="mt-3 h-8">
    <svg viewBox="0 0 100 30" className="w-full h-full">
      <path
        d={sparklineData.map((val, i) => {
          const x = (i / (sparklineData.length - 1)) * 100
          const y = 30 - (val / Math.max(...sparklineData)) * 25
          return `${i === 0 ? "M" : "L"}${x},${y}`
        }).join(" ")}
        fill="none"
        stroke={variant === "success" ? "hsl(142 76% 36%)" : variant === "warning" ? "hsl(38 92% 50%)" : "hsl(221 83% 53%)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
)}
```

- [ ] **Step 2: Atualizar Dashboard para passar sparklineData**

No `Dashboard.tsx`, nos MetricCards principais, passar:
```tsx
sparklineData={[320, 380, 420, 490, 510, 544]}
```

- [ ] **Step 3: Build e verificar**

Run: `npm run build`
Expected: Build sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/MetricCard.tsx src/pages/Dashboard.tsx
git commit -m "feat: add sparkline support to MetricCard"
```

---

### Task 5: Refinar Páginas (Contas, Clientes, Entradas)

**Files:**
- Modify: `src/pages/Contas.tsx`
- Modify: `src/pages/Clientes.tsx`
- Modify: `src/pages/Entradas.tsx`

- [ ] **Step 1: Refinar Contas.tsx**

Melhorias:
- Adicionar `hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-200` nos cards
- Card header com gradiente sutil (bg-gradient-card)
- Badge de programa com cor do programa
- Adicionar Progress bar de utilização de milhas no card

- [ ] **Step 2: Refinar Clientes.tsx**

Melhorias:
- Avatar com iniciais do cliente (div circular com bg-primary e iniciais)
- Badges do histórico de uso com cor fixa por programa
- Linha de tabela com `hover:bg-muted/50 transition-colors`

- [ ] **Step 3: Refinar Entradas.tsx**

Melhorias:
- Preview de cálculos em tempo real com fundo gradiente (`bg-gradient-success` em vez de `bg-muted/30`)
- Badge de tipo de entrada com cor específica
- Adicionar animação `animate-slide-up` no preview

- [ ] **Step 4: Build e verificar**

Run: `npm run build`
Expected: Build sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Contas.tsx src/pages/Clientes.tsx src/pages/Entradas.tsx
git commit -m "refactor: visual refinement for contas, clientes, entradas pages"
```

---

### Task 6: Refinar Páginas (Vendas, ControleCPF, Relatorios)

**Files:**
- Modify: `src/pages/Vendas.tsx`
- Modify: `src/pages/ControleCPF.tsx`
- Modify: `src/pages/Relatorios.tsx`

- [ ] **Step 1: Refinar Vendas.tsx**

Melhorias:
- Timeline visual de status (bolinhas coloridas conectadas por linha) no Select de status
- Linha de lucro com cor verde para positivo, vermelha para negativo
- Badge de passageiros com ícone

- [ ] **Step 2: Refinar ControleCPF.tsx**

Melhorias:
- Progress bars com gradiente de cor (verde < 80%, amarelo 80-90%, vermelho > 90%)
- Animar progress bars com `transition-all duration-1000`
- Badge de alerta com animação `animate-pulse-soft`

- [ ] **Step 3: Refinar Relatorios.tsx**

Melhorias:
- Cards de insight com gradiente de fundo progressivo
- Badges de insight com ícones temáticos
- Adicionar "performance por programa" com mini barra visual

- [ ] **Step 4: Build e verificar**

Run: `npm run build`
Expected: Build sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Vendas.tsx src/pages/ControleCPF.tsx src/pages/Relatorios.tsx
git commit -m "refactor: visual refinement for vendas, cpf, relatorios pages"
```

---

### Task 7: Ajustes de Responsividade e Refinamentos Finais

**Files:**
- Modify: `src/App.tsx` (transição de página)
- Modify: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Adicionar transição de página nas rotas**

No `App.tsx`, adicionar classe `animate-fade-in` no `<main>`:

```tsx
<main className="flex-1 p-6 bg-background animate-fade-in">
```

- [ ] **Step 2: Refinar AppSidebar com hover-lift nos itens**

Nos `menuItems.map`, adicionar `transition-all duration-200 hover:scale-[1.02]` nos NavLinks.

- [ ] **Step 3: Ajustar responsividade do layout principal**

Garantir que o grid do `p-6` vire `p-4` em mobile:
```tsx
<main className="flex-1 p-4 md:p-6 bg-background animate-fade-in">
```

- [ ] **Step 4: Build e verificar**

Run: `npm run build`
Expected: Build sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/AppSidebar.tsx
git commit -m "refactor: page transitions and responsiveness adjustments"
```

---

### Task 8: Commit Final e Verificação

- [ ] **Step 1: Verificar build final**

Run: `npm run build`
Expected: Build sem erros.

- [ ] **Step 2: Verificar lint**

Run: `npm run lint`
Expected: Sem erros novos (apenas os 4 erros preexistentes do código gerado).

- [ ] **Step 3: Listar arquivos alterados**

```bash
git log --oneline -10
```
