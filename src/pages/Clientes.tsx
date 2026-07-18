import { useState, useMemo } from "react";
import { Plus, Users, Search, Edit, Trash2, Phone, AlertTriangle, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/FormDrawer";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { SkeletonMetricCard, SkeletonTable } from "@/components/SkeletonLoader";
import { useDebounce } from "@/hooks/useDebounce";
import { useData } from "@/contexts/DataContext";
import {
  useAddClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "@/hooks/useDatabase";
import { formatCPF } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

export default function Clientes() {
  const { clients, sales, isLoading } = useData();

  const addClientM = useAddClientMutation();
  const updateClientM = useUpdateClientMutation();
  const deleteClientM = useDeleteClientMutation();

  const [newClient, setNewClient] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    telegram: "",
  });

  const [editClientData, setEditClientData] = useState<{
    id: string;
    name: string;
    cpf: string;
    email: string;
    phone: string;
    telegram: string;
  } | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [deleteBlocked, setDeleteBlocked] = useState<{
    open: boolean;
    clientName: string;
    relatedSales: { id: string; ticketLocator: string; date: string; milesUsed: number }[];
  }>({ open: false, clientName: "", relatedSales: [] });

  const filteredClients = useMemo(() => {
    if (!debouncedSearch) return clients;
    const q = debouncedSearch.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        (client.cpf && client.cpf.includes(q)) ||
        (client.email && client.email.toLowerCase().includes(q)),
    );
  }, [clients, debouncedSearch]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleCreateClient = () => {
    if (newClient.name) {
      addClientM.mutate({
        id: crypto.randomUUID(),
        name: newClient.name,
        cpf: newClient.cpf,
        email: newClient.email,
        phone: newClient.phone,
        telegram: newClient.telegram,
        totalPurchases: 0,
        usageHistory: [],
      });
      setNewClient({ name: "", cpf: "", email: "", phone: "", telegram: "" });
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditClient = (client: (typeof clients)[number]) => {
    setEditClientData({
      id: client.id,
      name: client.name,
      cpf: client.cpf ?? "",
      email: client.email ?? "",
      phone: client.phone,
      telegram: client.telegram ?? "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editClientData && editClientData.name) {
      updateClientM.mutate({
        id: editClientData.id,
        name: editClientData.name,
        cpf: editClientData.cpf,
        email: editClientData.email,
        phone: editClientData.phone,
        telegram: editClientData.telegram,
      });
      setEditClientData(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteClient = (id: string, name: string) => {
    const relatedSales = sales
      .filter((sale) => sale.clientId === id)
      .map((sale) => ({
        id: sale.id,
        ticketLocator: sale.ticketLocator,
        date: sale.date,
        milesUsed: sale.milesUsed,
      }));

    if (relatedSales.length > 0) {
      setDeleteBlocked({ open: true, clientName: name, relatedSales });
    } else {
      deleteClientM.mutate(id);
    }
  };

  const handleCPFChange = (value: string) => {
    setNewClient({ ...newClient, cpf: formatCPF(value) });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-appear">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <SkeletonTable rows={4} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-appear">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus clientes e acompanhe o histórico de utilização
          </p>
        </div>

        <Button
          className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <FormDrawer
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Cadastrar Novo Cliente"
      >
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              placeholder="Digite o nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={newClient.cpf}
              onChange={(e) => handleCPFChange(e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram">Contato Telegram</Label>
            <Input
              id="telegram"
              value={newClient.telegram}
              onChange={(e) => setNewClient({ ...newClient, telegram: e.target.value })}
              placeholder="@usuario"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateClient} className="bg-gradient-primary hover:opacity-90">
            Cadastrar
          </Button>
        </div>
      </FormDrawer>
      {/* Edit Dialog */}
      <FormDrawer
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditClientData(null);
        }}
        title="Editar Cliente"
      >
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome Completo</Label>
            <Input
              id="edit-name"
              value={editClientData?.name ?? ""}
              onChange={(e) =>
                setEditClientData((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
              placeholder="Digite o nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cpf">CPF</Label>
            <Input
              id="edit-cpf"
              value={editClientData?.cpf ?? ""}
              onChange={(e) => {
                const formatted = formatCPF(e.target.value);
                setEditClientData((prev) => (prev ? { ...prev, cpf: formatted } : null));
              }}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input
              id="edit-email"
              type="email"
              value={editClientData?.email ?? ""}
              onChange={(e) =>
                setEditClientData((prev) => (prev ? { ...prev, email: e.target.value } : null))
              }
              placeholder="cliente@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input
              id="edit-phone"
              value={editClientData?.phone ?? ""}
              onChange={(e) =>
                setEditClientData((prev) => (prev ? { ...prev, phone: e.target.value } : null))
              }
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-telegram">Contato Telegram</Label>
            <Input
              id="edit-telegram"
              value={editClientData?.telegram ?? ""}
              onChange={(e) =>
                setEditClientData((prev) => (prev ? { ...prev, telegram: e.target.value } : null))
              }
              placeholder="@usuario"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditDialogOpen(false);
              setEditClientData(null);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSaveEdit} className="bg-gradient-primary hover:opacity-90">
            Salvar
          </Button>
        </div>
      </FormDrawer>

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

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-300">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{clients.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {clients.filter((c) => c.totalPurchases > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {clients.reduce((sum, client) => sum + client.totalPurchases, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Lista de Clientes
          </CardTitle>
        </CardHeader>
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
                  <TableRow key={client.id} className="transition-colors">
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email ?? "-"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono">
                      {client.cpf ?? "-"}
                    </TableCell>
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2 min-w-[44px] min-h-[44px]"
                          onClick={() => handleEditClient(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2 text-destructive hover:text-destructive min-w-[44px] min-h-[44px]"
                          onClick={() => handleDeleteClient(client.id, client.name)}
                        >
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
            {paginatedClients.map((client) => (
              <div key={client.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-2 min-h-[44px] min-w-[44px]"
                      onClick={() => handleEditClient(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-2 text-destructive hover:text-destructive min-h-[44px] min-w-[44px]"
                      onClick={() => handleDeleteClient(client.id, client.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredClients.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} de{" "}
                {filteredClients.length}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {filteredClients.length === 0 && (
            <div className="py-8">
              <EmptyState
                icon={searchTerm ? Search : UserPlus}
                title={searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                description={
                  searchTerm
                    ? "Tente alterar o termo ou limpar a busca."
                    : "Clientes são o coração do negócio. Cadastre o primeiro e comece a vender."
                }
                action={
                  searchTerm
                    ? undefined
                    : { label: "Cadastrar Cliente", onClick: () => setIsCreateDialogOpen(true) }
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Blocked Alert */}
      <AlertDialog
        open={deleteBlocked.open}
        onOpenChange={(open) => setDeleteBlocked((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Exclusão não permitida
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <span>
                  O cliente <strong>{deleteBlocked.clientName}</strong> possui vendas associadas e
                  não pode ser excluído.
                </span>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Vendas vinculadas:</p>
                  {deleteBlocked.relatedSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                    >
                      <span className="text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="font-mono text-xs">{sale.ticketLocator}</span>
                      <span className="font-medium">
                        {sale.milesUsed.toLocaleString("pt-BR")} milhas
                      </span>
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  Remova as vendas vinculadas antes de excluir este cliente.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
