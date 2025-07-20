import { useState } from "react";
import { Plus, CreditCard, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Account {
  id: number;
  name: string;
  program: string;
  owner: string;
  status: "ativa" | "inativa";
  balance: number;
  value: number;
}

export default function Contas() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, name: "Conta Principal LATAM", program: "LATAM Pass", owner: "Próprio", status: "ativa", balance: 450000, value: 2250 },
    { id: 2, name: "Smiles Premium", program: "Smiles", owner: "Próprio", status: "ativa", balance: 320000, value: 1600 },
    { id: 3, name: "Livelo Gold", program: "Livelo", owner: "Terceiro - João", status: "ativa", balance: 180000, value: 900 },
    { id: 4, name: "Esfera Black", program: "Esfera", owner: "Próprio", status: "inativa", balance: 75000, value: 375 },
  ]);

  const [newAccount, setNewAccount] = useState({
    name: "",
    program: "",
    owner: "",
    status: "ativa" as "ativa" | "inativa"
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const programs = ["LATAM Pass", "Smiles", "Livelo", "Esfera", "Cartão de Crédito"];

  const handleCreateAccount = () => {
    if (newAccount.name && newAccount.program && newAccount.owner) {
      const account: Account = {
        id: Date.now(),
        ...newAccount,
        balance: 0,
        value: 0
      };
      setAccounts([...accounts, account]);
      setNewAccount({ name: "", program: "", owner: "", status: "ativa" });
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
                <Input
                  id="owner"
                  value={newAccount.owner}
                  onChange={(e) => setNewAccount({...newAccount, owner: e.target.value})}
                  placeholder="Ex: Próprio ou Terceiro - Nome"
                />
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
          <Card key={account.id} className="shadow-card hover:shadow-elegant transition-all duration-200">
            <CardHeader className="pb-3">
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
                  <span className="text-sm text-muted-foreground">Saldo:</span>
                  <span className="font-semibold">{account.balance.toLocaleString('pt-BR')} milhas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="font-semibold text-success">R$ {account.value.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dono:</span>
                  <span className="text-sm">{account.owner}</span>
                </div>
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
                {accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground">Total de Milhas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success-light">
              <p className="text-2xl font-bold text-success">
                R$ {accounts.reduce((sum, acc) => sum + acc.value, 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}