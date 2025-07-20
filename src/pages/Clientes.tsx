import { useState } from "react";
import { Plus, Users, Search, Edit, Trash2, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Client {
  id: number;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  totalPurchases: number;
  usageHistory: {
    program: string;
    count: number;
    year: number;
  }[];
}

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: "João Silva",
      cpf: "123.456.789-00",
      email: "joao.silva@email.com",
      phone: "(11) 99999-9999",
      totalPurchases: 5,
      usageHistory: [
        { program: "LATAM Pass", count: 3, year: 2024 },
        { program: "Smiles", count: 2, year: 2024 }
      ]
    },
    {
      id: 2,
      name: "Maria Santos",
      cpf: "987.654.321-00",
      email: "maria.santos@email.com",
      phone: "(11) 88888-8888",
      totalPurchases: 8,
      usageHistory: [
        { program: "LATAM Pass", count: 4, year: 2024 },
        { program: "Livelo", count: 3, year: 2024 },
        { program: "Smiles", count: 1, year: 2024 }
      ]
    },
    {
      id: 3,
      name: "Pedro Costa",
      cpf: "456.789.123-00",
      email: "pedro.costa@email.com",
      phone: "(11) 77777-7777",
      totalPurchases: 3,
      usageHistory: [
        { program: "Livelo", count: 2, year: 2024 },
        { program: "Esfera", count: 1, year: 2024 }
      ]
    }
  ]);

  const [newClient, setNewClient] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: ""
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = () => {
    if (newClient.name && newClient.cpf && newClient.email) {
      const client: Client = {
        id: Date.now(),
        ...newClient,
        totalPurchases: 0,
        usageHistory: []
      };
      setClients([...clients, client]);
      setNewClient({ name: "", cpf: "", email: "", phone: "" });
      setIsCreateDialogOpen(false);
    }
  };

  const deleteClient = (id: number) => {
    setClients(clients.filter(client => client.id !== id));
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const handleCPFChange = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, "");
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    // Aplica a formatação
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
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
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
                      <Button size="sm" variant="outline" className="px-3">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="px-3 text-destructive hover:text-destructive"
                        onClick={() => deleteClient(client.id)}
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
    </div>
  );
}