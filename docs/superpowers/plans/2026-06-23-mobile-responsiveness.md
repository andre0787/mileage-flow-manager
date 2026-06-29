# Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve mobile UX (<768px) with bottom tab navigation, drawer forms, and card-style lists. Desktop unchanged.

**Architecture:** Add a `FormDrawer` component wrapper that switches between shadcn `Dialog` (desktop) and `Drawer` (mobile). Add a bottom tab bar component that replaces sidebar navigation on mobile. Convert `<Table>` rows to stacked cards via responsive CSS classes.

**Tech Stack:** React 18, Tailwind CSS, shadcn/ui (Dialog, Drawer/vaul), lucide-react, React Router v6

---

### Task 0: Create feature branch

**Files:** N/A

- [ ] **Step 1: Create and switch to feature branch**

Run: `git checkout -b feature/mobile-responsiveness develop`

Expected: Switched to new branch `feature/mobile-responsiveness`

---

### Task 1: Create FormDrawer wrapper component

**Files:**
- Create: `src/components/FormDrawer.tsx`
- Reference: `src/hooks/use-mobile.tsx`

- [ ] **Step 1: Create FormDrawer.tsx**

```tsx
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

interface FormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
}

export function FormDrawer({ open, onOpenChange, title, description, children }: FormDrawerProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{children}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Run linter to verify**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

Run: `git add src/components/FormDrawer.tsx && git commit -m "feat: add FormDrawer wrapper (Dialog/Desktop, Drawer/Mobile)"`

---

### Task 2: Add bottom tab navigation for mobile

**Files:**
- Create: `src/components/BottomTabBar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Create BottomTabBar component**

```tsx
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TabItem {
  title: string
  url: string
  icon: LucideIcon
}

const tabs: TabItem[] = [
  { title: "Resumo", url: "/", icon: LayoutDashboard },
  { title: "Entradas", url: "/entradas", icon: TrendingUp },
  { title: "Vendas", url: "/vendas", icon: TrendingDown },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Ajustes", url: "/configuracoes", icon: Settings },
]

export function BottomTabBar() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 h-16 bg-background border-t flex items-center justify-around md:hidden safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.url
        return (
          <NavLink
            key={tab.url}
            to={tab.url}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-3 py-1 rounded-lg transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">{tab.title}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Integrate BottomTabBar into AppLayout (App.tsx)**

Modify `App.tsx`:

```tsx
// Add import:
import { BottomTabBar } from "@/components/BottomTabBar";
// Add to the use-mobile imports or add it inline

// Inside AppLayout, after the main closing tag, before </div>:
// Add: <BottomTabBar />
//
// And add pb-16 on main for mobile:
// <main className="flex-1 p-4 md:p-6 pb-16 md:pb-6 bg-background">
```

Full edit:

```tsx
// Change main className:
// From: <main className="flex-1 p-4 md:p-6 bg-background">
// To:   <main className="flex-1 p-4 md:p-6 pb-16 md:pb-6 bg-background">

// Add BottomTabBar before the closing </div> of the flex wrapper:
// After: </main>
// Add:   <BottomTabBar />
```

The AppLayout should become:

```tsx
const AppLayout = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center border-b bg-background px-6">
          <SidebarTrigger />
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-foreground">MilesControl</h2>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 pb-16 md:pb-6 bg-background">
          <DataProvider>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contas" element={<Contas />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/entradas" element={<Entradas />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/cpf" element={<ControleCPF />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </main>
        <BottomTabBar />
      </div>
    </div>
  </SidebarProvider>
);
```

- [ ] **Step 3: Update AppSidebar to hide sidebar on mobile**

In `AppSidebar.tsx`, wrap the sidebar content with a container that hides on mobile:

```tsx
// Wrap the return in:
<div className="hidden md:block">
  <Sidebar collapsible="icon">
    ... existing content ...
  </Sidebar>
</div>
```

This keeps the sidebar as-is on desktop but hides it on mobile where the bottom tab bar takes over.

- [ ] **Step 4: Ensure hamburger opens Sheet on mobile (already working)**

The existing `SidebarTrigger` + shadcn `Sidebar` already handles this — on mobile it renders as a Sheet. No changes needed.

- [ ] **Step 5: Run linter to verify**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 6: Commit**

Run: `git add src/components/BottomTabBar.tsx src/App.tsx src/components/AppSidebar.tsx && git commit -m "feat: add bottom tab navigation on mobile, hide sidebar"`

---

### Task 3: Convert Entradas table to cards on mobile

**Files:**
- Modify: `src/pages/Entradas.tsx`

- [ ] **Step 1: Wrap tables with overflow-x-auto and add mobile card rows**

For each `<Table>` in Entradas.tsx (there are 2 — one for Pontos, one for Milhas), wrap with `overflow-x-auto` and add a card version.

Add this card row component after the table (or inline):

For the Pontos table section (around line 467-511):

```tsx
<CardContent>
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden md:table-cell">Data</TableHead>
          <TableHead className="hidden md:table-cell">Conta</TableHead>
          <TableHead className="hidden md:table-cell">Origem</TableHead>
          <TableHead className="hidden md:table-cell">Pontos</TableHead>
          <TableHead className="hidden md:table-cell">Valor Pago</TableHead>
          <TableHead className="hidden md:table-cell">Taxa Conv.</TableHead>
          <TableHead className="hidden md:table-cell">Milhas</TableHead>
          <TableHead className="hidden md:table-cell">Custo/Milha</TableHead>
          <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entriesFiltered.map((entry) => (
          <TableRow key={entry.id}>
            {/* Desktop columns */}
            <TableCell className="hidden md:table-cell">{new Date(entry.date).toLocaleDateString('pt-BR')}</TableCell>
            <TableCell className="hidden md:table-cell">
              <p className="font-medium">{accounts.find(a => a.id === entry.accountId)?.name}</p>
              <p className="text-xs text-muted-foreground">{ownerName(accounts.find(a => a.id === entry.accountId)?.ownerId ?? "")}</p>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="outline" className="gap-1">
                {programs.find(p => p.id === entry.origemTypeId)?.name ?? "-"}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">{entry.amount.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="hidden md:table-cell">R$ {entry.amountPaid.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="hidden md:table-cell">{entry.conversionRate ?? "-"}</TableCell>
            <TableCell className="hidden md:table-cell font-semibold text-success">
              {(entry.milesGenerated ?? entry.amount).toLocaleString('pt-BR')}
            </TableCell>
            <TableCell className="hidden md:table-cell">R$ {entry.costPerMile.toFixed(4)}</TableCell>
            <TableCell className="hidden md:table-cell text-right">
              <Button size="sm" variant="outline" className="px-2 text-destructive min-w-[44px] min-h-[44px]" onClick={() => deleteEntry(entry.id)}>
                Excluir
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  {/* Mobile card list */}
  <div className="md:hidden space-y-3 mt-4">
    {entriesFiltered.map((entry) => (
      <div key={entry.id} className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{programs.find(p => p.id === entry.origemTypeId)?.name ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
          </div>
          <Badge variant="outline">{accounts.find(a => a.id === entry.accountId)?.name}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Pontos:</span>
            <p className="font-semibold">{entry.amount.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Valor Pago:</span>
            <p className="font-semibold">R$ {entry.amountPaid.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Milhas Geradas:</span>
            <p className="font-semibold text-success">{(entry.milesGenerated ?? entry.amount).toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Custo/Milha:</span>
            <p className="font-semibold">R$ {entry.costPerMile.toFixed(4)}</p>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <Button size="sm" variant="outline" className="px-3 text-destructive min-h-[44px]" onClick={() => deleteEntry(entry.id)}>
            Excluir
          </Button>
        </div>
      </div>
    ))}
  </div>
</CardContent>
```

Apply the same pattern to the Milhas table section (around line 549-589), adapting the columns:
- Milhas columns: Data, Conta, Origem, Milhas, Valor Pago, Custo/Milha, Ações

- [ ] **Step 2: Run linter to verify**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

Run: `git add src/pages/Entradas.tsx && git commit -m "feat: add mobile card list to Entradas table"`

---

### Task 4: Convert Vendas table to cards on mobile

**Files:**
- Modify: `src/pages/Vendas.tsx`

- [ ] **Step 1: Wrap Vendas table with overflow-x-auto and mobile cards**

Same pattern as Task 3. Around line 676-738:

```tsx
<CardContent>
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden md:table-cell">Data</TableHead>
          <TableHead className="hidden md:table-cell">Dono/Programa</TableHead>
          <TableHead className="hidden md:table-cell">Cliente</TableHead>
          <TableHead className="hidden md:table-cell">Milhas</TableHead>
          <TableHead className="hidden md:table-cell">Valor</TableHead>
          <TableHead className="hidden md:table-cell">Lucro</TableHead>
          <TableHead className="hidden md:table-cell">Margem</TableHead>
          <TableHead className="hidden md:table-cell">Status</TableHead>
          <TableHead className="hidden md:table-cell">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell className="hidden md:table-cell">{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
            <TableCell className="hidden md:table-cell">
              <div>
                <p className="font-medium">{sale.ownerName}</p>
                <p className="text-xs text-muted-foreground">{sale.program}</p>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div>
                <p className="font-medium">{sale.clientName}</p>
                <p className="text-xs text-muted-foreground">{sale.ticketLocator}</p>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">{sale.milesUsed.toLocaleString('pt-BR')}</TableCell>
            <TableCell className="hidden md:table-cell">R$ {sale.saleValue.toLocaleString('pt-BR')}</TableCell>
            <TableCell className={`hidden md:table-cell font-semibold ${sale.profit < 0 ? 'text-destructive' : 'text-success'}`}>
              R$ {sale.profit.toLocaleString('pt-BR')}
            </TableCell>
            <TableCell className="hidden md:table-cell">{sale.profitMargin.toFixed(1)}%</TableCell>
            <TableCell className="hidden md:table-cell">
              <Select value={sale.status} onValueChange={(value) => updateSaleStatus(sale.id, value as "pendente" | "pago" | "concluido")}>
                <SelectTrigger className="w-28">
                  <span className={`h-2 w-2 rounded-full ${sale.status === 'pendente' ? 'bg-warning' : sale.status === 'pago' ? 'bg-primary' : 'bg-success'}`} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{sale.passengers.length} pax</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  {/* Mobile card list */}
  <div className="md:hidden space-y-3 mt-4">
    {sales.map((sale) => (
      <div key={sale.id} className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{sale.program}</p>
            <p className="text-xs text-muted-foreground">{sale.ownerName} • {new Date(sale.date).toLocaleDateString('pt-BR')}</p>
          </div>
          <Badge variant="outline" className={sale.status === 'pendente' ? 'text-warning border-warning' : sale.status === 'pago' ? 'text-primary border-primary' : 'text-success border-success'}>
            {sale.status === 'pendente' ? 'Pendente' : sale.status === 'pago' ? 'Pago' : 'Concluído'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Cliente:</span>
            <p className="font-semibold">{sale.clientName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Milhas:</span>
            <p className="font-semibold">{sale.milesUsed.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Valor:</span>
            <p className="font-semibold">R$ {sale.saleValue.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Lucro:</span>
            <p className={`font-semibold ${sale.profit < 0 ? 'text-destructive' : 'text-success'}`}>
              R$ {sale.profit.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        {sale.ticketLocator && (
          <p className="text-xs text-muted-foreground">Localizador: {sale.ticketLocator}</p>
        )}
        <div className="flex justify-end pt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{sale.passengers.length} pax</span>
          </div>
        </div>
      </div>
    ))}
  </div>
</CardContent>
```

- [ ] **Step 2: Run linter to verify**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

Run: `git add src/pages/Vendas.tsx && git commit -m "feat: add mobile card list to Vendas table"`

---

### Task 5: Convert Clientes table to cards on mobile

**Files:**
- Modify: `src/pages/Clientes.tsx`

- [ ] **Step 1: Wrap Clientes table with overflow-x-auto and mobile cards**

Around line 336-407, apply the same pattern. Clientes columns: Cliente, CPF, Contato, Compras, Histórico de Uso, Ações.

```tsx
<CardContent>
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden md:table-cell">Cliente</TableHead>
          <TableHead className="hidden md:table-cell">CPF</TableHead>
          <TableHead className="hidden md:table-cell">Contato</TableHead>
          <TableHead className="hidden md:table-cell">Compras</TableHead>
          <TableHead className="hidden md:table-cell">Histórico de Uso</TableHead>
          <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredClients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="hidden md:table-cell">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.email ?? "-"}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell font-mono">{client.cpf ?? "-"}</TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.phone}</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="outline">{client.totalPurchases} compras</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex flex-wrap gap-1">
                {client.usageHistory.map((usage, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {usage.program}: {usage.count}x
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell text-right">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" className="px-2 min-w-[44px] min-h-[44px]" onClick={() => handleEditClient(client)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="px-2 text-destructive hover:text-destructive min-w-[44px] min-h-[44px]" onClick={() => handleDeleteClient(client.id, client.name)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  {/* Mobile card list */}
  <div className="md:hidden space-y-3 mt-4">
    {filteredClients.map((client) => (
      <div key={client.id} className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{client.name}</p>
              <p className="text-xs text-muted-foreground">{client.email ?? "-"}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">CPF:</span>
            <p className="font-mono text-xs">{client.cpf ?? "-"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Telefone:</span>
            <p>{client.phone}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline">{client.totalPurchases} compras</Badge>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="px-2 min-h-[44px] min-w-[44px]" onClick={() => handleEditClient(client)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="px-2 text-destructive hover:text-destructive min-h-[44px] min-w-[44px]" onClick={() => handleDeleteClient(client.id, client.name)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    ))}
  </div>

  {filteredClients.length === 0 && (
    <div className="text-center py-8">
      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">
        {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
      </p>
    </div>
  )}
</CardContent>
```

- [ ] **Step 2: Run linter to verify**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

Run: `git add src/pages/Clientes.tsx && git commit -m "feat: add mobile card list to Clientes table"`

---

### Task 6: Replace Dialogs with FormDrawer in Entradas

**Files:**
- Modify: `src/pages/Entradas.tsx`

- [ ] **Step 1: Add FormDrawer import and replace Dialogs**

Add import:
```tsx
import { FormDrawer } from "@/components/FormDrawer";
```

Replace the entry creation Dialog (around line 172-406):

```tsx
// Replace:
// <Dialog open={isCreateDialogOpen} onOpenChange={...}>
//   <DialogTrigger asChild>
//     ...
//   </DialogTrigger>
//   <DialogContent className="sm:max-w-[500px]">
//     ...
//   </DialogContent>
// </Dialog>

// With:
<DialogTrigger asChild>
  <Button variant="outline" className="gap-2">
    <Plus className="h-4 w-4" />
    Nova Entrada
  </Button>
</DialogTrigger>
<FormDrawer
  open={isCreateDialogOpen}
  onOpenChange={(open) => {
    if (!open) resetForm();
    setIsCreateDialogOpen(open);
  }}
  title={`Registrar Nova Entrada - ${activeTab === "pontos" ? "Pontos" : "Milhas"}`}
>
  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
    ... same content as before ...
  </div>
  <div className="flex justify-end gap-2 mt-4">
    <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false); }}>Cancelar</Button>
    <Button onClick={handleCreateEntry} className="bg-gradient-primary hover:opacity-90">Registrar Entrada</Button>
  </div>
</FormDrawer>
```

Similarly replace the OrigemType dialog (around line 236-278):

```tsx
<FormDrawer
  open={isOrigemTypeDialogOpen}
  onOpenChange={(open) => { setIsOrigemTypeDialogOpen(open); if (!open) setOrigemTypeErrors({}); }}
  title="Novo Tipo de Origem"
>
  <div className="grid gap-4 py-4">
    ...
  </div>
  <div className="flex justify-end gap-2 mt-4">
    <Button variant="outline" onClick={() => { setIsOrigemTypeDialogOpen(false); setOrigemTypeErrors({}); }}>
      Cancelar
    </Button>
    <Button onClick={handleCreateOrigemType} className="bg-gradient-primary hover:opacity-90">
      Cadastrar
    </Button>
  </div>
</FormDrawer>
```

Note: Remove the `Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger` imports that are no longer needed if all dialogs are replaced. Keep `DialogTrigger` since it's still used by the "Nova Entrada" button (or replace with a regular Button + onClick handler).

For the "Nova Entrada" button, change from `DialogTrigger asChild` to a regular Button that sets `setIsCreateDialogOpen(true)`:

```tsx
<Button variant="outline" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
  <Plus className="h-4 w-4" />
  Nova Entrada
</Button>
```

- [ ] **Step 2: Run linter to verify**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

Run: `git add src/pages/Entradas.tsx && git commit -m "feat: use FormDrawer for entry dialogs in Entradas"`

---

### Task 7: Replace Dialogs with FormDrawer in Vendas

**Files:**
- Modify: `src/pages/Vendas.tsx`

- [ ] **Step 1: Replace sale creation dialog and client dialog with FormDrawer**

Add import:
```tsx
import { FormDrawer } from "@/components/FormDrawer";
```

Replace the sale creation Dialog (around line 236-555) with FormDrawer.

Replace the client creation Dialog (around line 558-625) with FormDrawer.

- [ ] **Step 2: Run linter to verify**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

Run: `git add src/pages/Vendas.tsx && git commit -m "feat: use FormDrawer for sale dialogs in Vendas"`

---

### Task 8: Replace Dialogs with FormDrawer in Clientes

**Files:**
- Modify: `src/pages/Clientes.tsx`

- [ ] **Step 1: Replace client create/edit dialogs with FormDrawer**

Add import:
```tsx
import { FormDrawer } from "@/components/FormDrawer";
```

Replace the create Dialog (around line 129-203) and edit Dialog (around line 205-277) with FormDrawer.

- [ ] **Step 2: Run linter to verify**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

Run: `git add src/pages/Clientes.tsx && git commit -m "feat: use FormDrawer for client dialogs"`

---

### Task 9: Sticky search bar on Clientes (quick win)

**Files:**
- Modify: `src/pages/Clientes.tsx`

- [ ] **Step 1: Add sticky positioning to search bar**

```tsx
{/* Search - sticky on mobile */}
<div className="sticky top-0 z-10 bg-background py-2 -mx-4 px-4 md:static md:mx-0 md:px-0">
  <div className="flex items-center gap-4">
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome, CPF ou e-mail..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

Run: `git add src/pages/Clientes.tsx && git commit -m "feat: sticky search bar on mobile for Clientes"`

---

### Task 10: Final verification

**Files:** N/A

- [ ] **Step 1: Run lint and build**

Run: `npm run lint && npm run build`
Expected: No errors

- [ ] **Step 2: Push branch**

Run: `git push origin feature/mobile-responsiveness`
Expected: Branch pushed

- [ ] **Step 3: Create TODO for PR review**

Note: User should create PR from `feature/mobile-responsiveness` → `develop`, test, then merge to main.
