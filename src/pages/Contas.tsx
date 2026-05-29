import { useState } from "react";
import { Plus, CreditCard, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Account {
  id: number;
  name: string;
  program: string;
  ownerName: string;
  status: "ativa" | "inativa";
  pointsBalance: number;
  milesBalance: number;
  averageCostPerMile: number;
  totalInvested: number;
}

export default function Contas() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, name: "Conta Principal LATAM", program: "LATAM Pass", ownerName: "João Silva", status: "ativa", pointsBalance: 0, milesBalance: 400000, averageCostPerMile: 0.0045, totalInvested: 1800 },
    { id: 2, name: "Smiles Premium", program: "Smiles", ownerName: "Maria Santos", status: "ativa", pointsBalance: 0, milesBalance: 64000, averageCostPerMile: 0.005625, totalInvested: 360 },
    { id: 3, name: "Livelo Gold", program: "Livelo", ownerName: "João Silva", status: "ativa", pointsBalance: 0, milesBalance: 80000, averageCostPerMile: 0.005, totalInvested: 400 },
    { id: 4, name: "Esfera Black", program: "Esfera", ownerName: "Pedro Costa", status: "inativa", pointsBalance: 0, milesBalance: 0, averageCostPerMile: 0.006, totalInvested: 0 },
  ]);

  const [newAccount, setNewAccount] = useState({
    name: "",
    program: "",
    ownerName: "",
    status: "ativa" as "ativa" | "inativa"
  });

  const [owners] = useState(["João Silva", "Maria Santos", "Pedro Costa"]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const programs = ["LATAM Pass", "Smiles", "Livelo", "Esfera", "Cartão de Crédito"];

  const handleCreateAccount = () => {
    if (newAccount.name && newAccount.program && newAccount.ownerName) {
      const account: Account = {
        id: Date.now(),
        ...newAccount,
        pointsBalance: 0,
        milesBalance: 0,
        averageCostPerMile: 0,
        totalInvested: 0
      };
      setAccounts([...accounts, account]);
      setNewAccount({ name: "", program: "", ownerName: "", status: "ativa" });
      setIsCreateDialogOpen(false);
    }
  };

  const toggleAccountStatus = (id: number) => {
    setAccounts(accounts.map(account => 
      account.id === id 
        ? { ...account, status: account.status === "ativa" ? "inativa" : "ativa" }
        : account
    ));
  };

  const deleteAccount = (id: number) => {
    setAccounts(accounts.filter(account => account.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas de programas de fidelidade
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Conta</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  placeholder="Ex: Conta Principal LATAM"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="program">Programa</Label>
                <Select value={newAccount.program} onValueChange={(value) => setNewAccount({...newAccount, program: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program} value={program}>{program}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="owner">Dono da Conta</Label>
                <Select value={newAccount.ownerName} onValueChange={(value) => setNewAccount({...newAccount, ownerName: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dono" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={newAccount.status === "ativa"}
                  onCheckedChange={(checked) => setNewAccount({...newAccount, status: checked ? "ativa" : "inativa"})}
                />
                <Label htmlFor="status">Conta Ativa</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAccount} className="bg-gradient-primary hover:opacity-90">
                Criar Conta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader className="pb-3 bg-gradient-card">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{account.program}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={account.status === "ativa" ? "default" : "secondary"}>
                    {account.status === "ativa" ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Ativa
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inativa
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estoque Milhas:</span>
                  <span className="font-semibold">{account.milesBalance.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Custo/Milha:</span>
                  <span className="font-semibold">R$ {account.averageCostPerMile.toFixed(4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor Investido:</span>
                  <span className="font-semibold text-success">R$ {account.totalInvested.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dono:</span>
                  <span className="text-sm font-medium">{account.ownerName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Utilização de milhas</span>
                  <span className="font-medium">{Math.round((account.milesBalance / 500000) * 100)}%</span>
                </div>
                <Progress value={Math.round((account.milesBalance / 500000) * 100)} className="h-1.5" />
              </div>
              
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleAccountStatus(account.id)}
                  className="flex-1"
                >
                  {account.status === "ativa" ? "Desativar" : "Ativar"}
                </Button>
                <Button size="sm" variant="outline" className="px-3">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="px-3 text-destructive hover:text-destructive"
                  onClick={() => deleteAccount(account.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Resumo das Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              <p className="text-sm text-muted-foreground">Total de Contas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success-light">
              <p className="text-2xl font-bold text-success">{accounts.filter(a => a.status === "ativa").length}</p>
              <p className="text-sm text-muted-foreground">Contas Ativas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-foreground">
                {accounts.reduce((sum, acc) => sum + acc.milesBalance, 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground">Total de Milhas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success-light">
              <p className="text-2xl font-bold text-success">
                R$ {accounts.reduce((sum, acc) => sum + acc.totalInvested, 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground">Total Investido</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}