import { useState } from "react";
import { Plus, Users, Search, Edit, Trash2, Phone, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useData } from "@/contexts/DataContext";

export default function Clientes() {
  const { clients, sales, addClient, updateClient, deleteClient } = useData();

  const [newClient, setNewClient] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: ""
  });

  const [editClientData, setEditClientData] = useState<{
    id: string;
    name: string;
    cpf: string;
    email: string;
    phone: string;
  } | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteBlocked, setDeleteBlocked] = useState<{
    open: boolean;
    clientName: string;
    relatedSales: { id: string; ticketLocator: string; date: string; milesUsed: number }[];
  }>({ open: false, clientName: "", relatedSales: [] });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = () => {
    if (newClient.name && newClient.cpf && newClient.email) {
      addClient({
        ...newClient,
        totalPurchases: 0,
        usageHistory: []
      });
      setNewClient({ name: "", cpf: "", email: "", phone: "" });
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditClient = (client: typeof clients[number]) => {
    setEditClientData({
      id: client.id,
      name: client.name,
      cpf: client.cpf,
      email: client.email,
      phone: client.phone
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editClientData && editClientData.name && editClientData.cpf && editClientData.email) {
      updateClient(editClientData.id, {
        name: editClientData.name,
        cpf: editClientData.cpf,
        email: editClientData.email,
        phone: editClientData.phone
      });
      setEditClientData(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteClient = (id: string, name: string) => {
    const relatedSales = sales
      .filter(sale => sale.clientId === id)
      .map(sale => ({
        id: sale.id,
        ticketLocator: sale.ticketLocator,
        date: sale.date,
        milesUsed: sale.milesUsed
      }));

    if (relatedSales.length > 0) {
      setDeleteBlocked({ open: true, clientName: name, relatedSales });
    } else {
      deleteClient(id);
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const handleCPFChange = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const limited = numbers.slice(0, 11);
    const formatted = formatCPF(limited);
    setNewClient({ ...newClient, cpf: formatted });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e acompanhe o histórico de utilização
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
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
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  placeholder="cliente@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateClient} className="bg-gradient-primary hover:opacity-90">
                Cadastrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditClientData(null); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  value={editClientData?.name ?? ""}
                  onChange={(e) => setEditClientData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Digite o nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  value={editClientData?.cpf ?? ""}
                  onChange={(e) => {
                    const numbers = e.target.value.replace(/\D/g, "").slice(0, 11);
                    const formatted = numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                    setEditClientData(prev => prev ? { ...prev, cpf: formatted } : null);
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
                  onChange={(e) => setEditClientData(prev => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="cliente@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editClientData?.phone ?? ""}
                  onChange={(e) => setEditClientData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditClientData(null); }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="bg-gradient-primary hover:opacity-90">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{clients.length}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {clients.filter(c => c.totalPurchases > 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {clients.reduce((sum, client) => sum + client.totalPurchases, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Lista de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Compras</TableHead>
                <TableHead>Histórico de Uso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{client.cpf}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.totalPurchases} compras</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.usageHistory.map((usage, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {usage.program}: {usage.count}x
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="px-3" onClick={() => handleEditClient(client)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="px-3 text-destructive hover:text-destructive"
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
          
          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Blocked Alert */}
      <AlertDialog open={deleteBlocked.open} onOpenChange={(open) => setDeleteBlocked(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Exclusão não permitida
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <span>
                  O cliente <strong>{deleteBlocked.clientName}</strong> possui vendas associadas e não pode ser excluído.
                </span>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Vendas vinculadas:</p>
                  {deleteBlocked.relatedSales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <span className="text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="font-mono text-xs">{sale.ticketLocator}</span>
                      <span className="font-medium">{sale.milesUsed.toLocaleString('pt-BR')} milhas</span>
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
