import { useState } from "react";
import { Plus, TrendingUp, Calculator, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PointEntry {
  id: number;
  ownerName: string;
  entryType: "compra_direta" | "transferencia" | "clube_pontos" | "promocao" | "cartao_credito";
  pointsAcquired: number;
  amountPaid: number;
  costPerThousand: number;
  conversionRate: number; // pontos para milhas
  milesGenerated: number;
  costPerMile: number;
  date: string;
  program: string;
  accountName: string;
}

interface Owner {
  id: number;
  name: string;
  accounts: string[];
}

export default function Entradas() {
  const [entries, setEntries] = useState<PointEntry[]>([
    {
      id: 1,
      ownerName: "João Silva",
      entryType: "compra_direta",
      pointsAcquired: 100000,
      amountPaid: 450,
      costPerThousand: 4.5,
      conversionRate: 1.0,
      milesGenerated: 100000,
      costPerMile: 0.0045,
      date: "2024-01-15",
      program: "LATAM Pass",
      accountName: "Conta Principal LATAM"
    },
    {
      id: 2,
      ownerName: "Maria Santos",
      entryType: "clube_pontos",
      pointsAcquired: 80000,
      amountPaid: 360,
      costPerThousand: 4.5,
      conversionRate: 0.8,
      milesGenerated: 64000,
      costPerMile: 0.005625,
      date: "2024-01-16",
      program: "Smiles",
      accountName: "Smiles Premium"
    }
  ]);

  const [owners] = useState<Owner[]>([
    { id: 1, name: "João Silva", accounts: ["Conta Principal LATAM", "Livelo Gold"] },
    { id: 2, name: "Maria Santos", accounts: ["Smiles Premium"] },
    { id: 3, name: "Pedro Costa", accounts: ["Esfera Black"] }
  ]);

  const [newEntry, setNewEntry] = useState({
    ownerName: "",
    entryType: "",
    pointsAcquired: "",
    amountPaid: "",
    conversionRate: "",
    program: "",
    accountName: ""
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const entryTypes = [
    { value: "compra_direta", label: "Compra Direta" },
    { value: "transferencia", label: "Transferência entre Programas" },
    { value: "clube_pontos", label: "Clube de Pontos" },
    { value: "promocao", label: "Promoção de Compra" },
    { value: "cartao_credito", label: "Cartão de Crédito" }
  ];

  const programs = ["LATAM Pass", "Smiles", "Livelo", "Esfera"];

  const selectedOwner = owners.find(owner => owner.name === newEntry.ownerName);

  const handleCreateEntry = () => {
    if (newEntry.ownerName && newEntry.entryType && newEntry.pointsAcquired && newEntry.amountPaid && newEntry.conversionRate) {
      const pointsAcquired = parseFloat(newEntry.pointsAcquired);
      const amountPaid = parseFloat(newEntry.amountPaid);
      const conversionRate = parseFloat(newEntry.conversionRate);
      
      const costPerThousand = (amountPaid / pointsAcquired) * 1000;
      const milesGenerated = pointsAcquired * conversionRate;
      const costPerMile = amountPaid / milesGenerated;

      const entry: PointEntry = {
        id: Date.now(),
        ownerName: newEntry.ownerName,
        entryType: newEntry.entryType as any,
        pointsAcquired,
        amountPaid,
        costPerThousand,
        conversionRate,
        milesGenerated,
        costPerMile,
        date: new Date().toISOString().split('T')[0],
        program: newEntry.program,
        accountName: newEntry.accountName
      };

      setEntries([...entries, entry]);
      setNewEntry({
        ownerName: "",
        entryType: "",
        pointsAcquired: "",
        amountPaid: "",
        conversionRate: "",
        program: "",
        accountName: ""
      });
      setIsCreateDialogOpen(false);
    }
  };

  const totalPointsAcquired = entries.reduce((sum, entry) => sum + entry.pointsAcquired, 0);
  const totalAmountPaid = entries.reduce((sum, entry) => sum + entry.amountPaid, 0);
  const totalMilesGenerated = entries.reduce((sum, entry) => sum + entry.milesGenerated, 0);
  const averageCostPerMile = totalAmountPaid / totalMilesGenerated;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entradas de Pontos</h1>
          <p className="text-muted-foreground">
            Gerencie a aquisição de pontos e conversão em milhas por dono
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4" />
              Nova Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nova Entrada de Pontos</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner">Dono da Conta</Label>
                  <Select value={newEntry.ownerName} onValueChange={(value) => setNewEntry({...newEntry, ownerName: value, accountName: ""})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dono" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.name}>{owner.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Conta</Label>
                  <Select 
                    value={newEntry.accountName} 
                    onValueChange={(value) => setNewEntry({...newEntry, accountName: value})}
                    disabled={!selectedOwner}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedOwner?.accounts.map((account) => (
                        <SelectItem key={account} value={account}>{account}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryType">Tipo de Entrada</Label>
                  <Select value={newEntry.entryType} onValueChange={(value) => setNewEntry({...newEntry, entryType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {entryTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Programa</Label>
                  <Select value={newEntry.program} onValueChange={(value) => setNewEntry({...newEntry, program: value})}>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Pontos Adquiridos</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newEntry.pointsAcquired}
                    onChange={(e) => setNewEntry({...newEntry, pointsAcquired: e.target.value})}
                    placeholder="Ex: 100000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor Pago (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newEntry.amountPaid}
                    onChange={(e) => setNewEntry({...newEntry, amountPaid: e.target.value})}
                    placeholder="Ex: 450.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversion">Taxa de Conversão (Pontos → Milhas)</Label>
                <Input
                  id="conversion"
                  type="number"
                  step="0.01"
                  value={newEntry.conversionRate}
                  onChange={(e) => setNewEntry({...newEntry, conversionRate: e.target.value})}
                  placeholder="Ex: 1.0 (1 ponto = 1 milha) ou 0.8"
                />
              </div>

              {newEntry.pointsAcquired && newEntry.amountPaid && newEntry.conversionRate && (
                <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
                  <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Custo por milhar de pontos:</span>
                      <p className="font-semibold">R$ {((parseFloat(newEntry.amountPaid) / parseFloat(newEntry.pointsAcquired)) * 1000).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Milhas geradas:</span>
                      <p className="font-semibold">{(parseFloat(newEntry.pointsAcquired) * parseFloat(newEntry.conversionRate)).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Custo por milha:</span>
                      <p className="font-semibold">R$ {(parseFloat(newEntry.amountPaid) / (parseFloat(newEntry.pointsAcquired) * parseFloat(newEntry.conversionRate))).toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateEntry} className="bg-gradient-primary hover:opacity-90">
                Registrar Entrada
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pontos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalPointsAcquired.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Investido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ {totalAmountPaid.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Milhas Geradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalMilesGenerated.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Médio/Milha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ {averageCostPerMile.toFixed(4)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Entries Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Histórico de Entradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Dono/Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Taxa Conv.</TableHead>
                <TableHead>Milhas</TableHead>
                <TableHead>Custo/Milha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{entry.ownerName}</p>
                      <p className="text-xs text-muted-foreground">{entry.accountName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.entryType === 'compra_direta' && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {entryTypes.find(t => t.value === entry.entryType)?.label}
                      </Badge>
                    )}
                    {entry.entryType === 'transferencia' && (
                      <Badge variant="secondary">
                        {entryTypes.find(t => t.value === entry.entryType)?.label}
                      </Badge>
                    )}
                    {entry.entryType === 'clube_pontos' && (
                      <Badge variant="default">
                        {entryTypes.find(t => t.value === entry.entryType)?.label}
                      </Badge>
                    )}
                    {entry.entryType === 'promocao' && (
                      <Badge variant="outline">
                        {entryTypes.find(t => t.value === entry.entryType)?.label}
                      </Badge>
                    )}
                    {entry.entryType === 'cartao_credito' && (
                      <Badge variant="outline" className="hover:bg-accent">
                        {entryTypes.find(t => t.value === entry.entryType)?.label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{entry.pointsAcquired.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>R$ {entry.amountPaid.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{entry.conversionRate}</TableCell>
                  <TableCell className="font-semibold text-success">
                    {entry.milesGenerated.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>R$ {entry.costPerMile.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}