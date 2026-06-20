import { useState } from "react";
import { Plus, TrendingDown, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";

interface Sale {
  id: number;
  ownerName: string;
  accountName: string;
  program: string;
  clientId: string;
  clientName: string;
  milesUsed: number;
  saleValue: number;
  costPerMile: number;
  profit: number;
  profitMargin: number;
  status: "pendente" | "pago" | "concluido";
  ticketLocator: string;
  passengers: { name: string; cpf: string }[];
  date: string;
}

interface StockInfo {
  ownerName: string;
  program: string;
  availableMiles: number;
  averageCostPerMile: number;
}

export default function Vendas() {
  const { clients } = useData();

  const [sales, setSales] = useState<Sale[]>([
    {
      id: 1,
      ownerName: "João Silva",
      accountName: "Conta Principal LATAM",
      program: "LATAM Pass",
      clientId: "1",
      clientName: "Carlos Mendes",
      milesUsed: 50000,
      saleValue: 300,
      costPerMile: 0.0045,
      profit: 75,
      profitMargin: 25,
      status: "concluido",
      ticketLocator: "ABC123",
      passengers: [{ name: "Carlos Mendes", cpf: "123.456.789-00" }],
      date: "2024-01-20"
    }
  ]);

  const [stockInfo] = useState<StockInfo[]>([
    { ownerName: "João Silva", program: "LATAM Pass", availableMiles: 400000, averageCostPerMile: 0.0045 },
    { ownerName: "Maria Santos", program: "Smiles", availableMiles: 64000, averageCostPerMile: 0.005625 },
    { ownerName: "João Silva", program: "Livelo", availableMiles: 80000, averageCostPerMile: 0.005 }
  ]);

  const [newSale, setNewSale] = useState({
    ownerName: "",
    accountName: "",
    program: "",
    clientId: "",
    clientName: "",
    milesUsed: "",
    saleValue: "",
    ticketLocator: "",
    passengers: [{ name: "", cpf: "" }]
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const owners = [...new Set(stockInfo.map(s => s.ownerName))];
  const selectedOwnerStock = stockInfo.filter(s => s.ownerName === newSale.ownerName);
  const selectedProgramStock = stockInfo.find(s => 
    s.ownerName === newSale.ownerName && s.program === newSale.program
  );

  const handleCreateSale = () => {
    if (newSale.ownerName && newSale.program && newSale.clientId && newSale.milesUsed && newSale.saleValue) {
      const milesUsed = parseFloat(newSale.milesUsed);
      const saleValue = parseFloat(newSale.saleValue);
      const costPerMile = selectedProgramStock?.averageCostPerMile || 0;
      const totalCost = milesUsed * costPerMile;
      const profit = saleValue - totalCost;
      const profitMargin = (profit / saleValue) * 100;

      const sale: Sale = {
        id: Date.now(),
        ownerName: newSale.ownerName,
        accountName: newSale.accountName,
        program: newSale.program,
        clientId: newSale.clientId,
        clientName: newSale.clientName,
        milesUsed,
        saleValue,
        costPerMile,
        profit,
        profitMargin,
        status: "pendente",
        ticketLocator: newSale.ticketLocator,
        passengers: newSale.passengers.filter(p => p.name && p.cpf),
        date: new Date().toISOString().split('T')[0]
      };

      setSales([...sales, sale]);
      setNewSale({
        ownerName: "",
        accountName: "",
        program: "",
        clientId: "",
        clientName: "",
        milesUsed: "",
        saleValue: "",
        ticketLocator: "",
        passengers: [{ name: "", cpf: "" }]
      });
      setIsCreateDialogOpen(false);
    }
  };

  const addPassenger = () => {
    setNewSale({
      ...newSale,
      passengers: [...newSale.passengers, { name: "", cpf: "" }]
    });
  };

  const updatePassenger = (index: number, field: string, value: string) => {
    const updatedPassengers = newSale.passengers.map((passenger, i) => 
      i === index ? { ...passenger, [field]: value } : passenger
    );
    setNewSale({ ...newSale, passengers: updatedPassengers });
  };

  const removePassenger = (index: number) => {
    if (newSale.passengers.length > 1) {
      setNewSale({
        ...newSale,
        passengers: newSale.passengers.filter((_, i) => i !== index)
      });
    }
  };

  const updateSaleStatus = (id: number, status: Sale['status']) => {
    setSales(sales.map(sale => 
      sale.id === id ? { ...sale, status } : sale
    ));
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.saleValue, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalMilesSold = sales.reduce((sum, sale) => sum + sale.milesUsed, 0);
  const averageProfitMargin = sales.length > 0 ? 
    sales.reduce((sum, sale) => sum + sale.profitMargin, 0) / sales.length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendas de Milhas</h1>
          <p className="text-muted-foreground">
            Gerencie as vendas de milhas e controle de estoque por dono
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Nova Venda</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner">Dono da Conta</Label>
                  <Select value={newSale.ownerName} onValueChange={(value) => setNewSale({...newSale, ownerName: value, program: ""})}>
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

                <div className="space-y-2">
                  <Label htmlFor="program">Programa</Label>
                  <Select 
                    value={newSale.program} 
                    onValueChange={(value) => setNewSale({...newSale, program: value})}
                    disabled={!newSale.ownerName}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o programa" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedOwnerStock.map((stock) => (
                        <SelectItem key={stock.program} value={stock.program}>
                          {stock.program} ({stock.availableMiles.toLocaleString('pt-BR')} milhas)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedProgramStock && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Informações do Estoque:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Milhas disponíveis:</span>
                      <p className="font-semibold">{selectedProgramStock.availableMiles.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Custo médio por milha:</span>
                      <p className="font-semibold">R$ {selectedProgramStock.averageCostPerMile.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select
                    value={newSale.clientId}
                    onValueChange={(value) => {
                      const client = clients.find(c => c.id === value);
                      setNewSale({
                        ...newSale,
                        clientId: value,
                        clientName: client?.name || ""
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locator">Localizador do Bilhete</Label>
                  <Input
                    id="locator"
                    value={newSale.ticketLocator}
                    onChange={(e) => setNewSale({...newSale, ticketLocator: e.target.value})}
                    placeholder="Ex: ABC123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="miles">Milhas Utilizadas</Label>
                  <Input
                    id="miles"
                    type="number"
                    value={newSale.milesUsed}
                    onChange={(e) => setNewSale({...newSale, milesUsed: e.target.value})}
                    placeholder="Ex: 50000"
                    max={selectedProgramStock?.availableMiles}
                  />
                  {newSale.milesUsed && selectedProgramStock && parseFloat(newSale.milesUsed) > selectedProgramStock.availableMiles && (
                    <p className="text-xs text-destructive">Quantidade superior ao estoque disponível</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Valor da Venda (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={newSale.saleValue}
                    onChange={(e) => setNewSale({...newSale, saleValue: e.target.value})}
                    placeholder="Ex: 300.00"
                  />
                </div>
              </div>

              {newSale.milesUsed && newSale.saleValue && selectedProgramStock && (
                <div className="p-3 bg-success-light rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Cálculo de Lucro:</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Custo total:</span>
                      <p className="font-semibold">R$ {(parseFloat(newSale.milesUsed) * selectedProgramStock.averageCostPerMile).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lucro:</span>
                      <p className="font-semibold text-success">R$ {(parseFloat(newSale.saleValue) - (parseFloat(newSale.milesUsed) * selectedProgramStock.averageCostPerMile)).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margem:</span>
                      <p className="font-semibold">{(((parseFloat(newSale.saleValue) - (parseFloat(newSale.milesUsed) * selectedProgramStock.averageCostPerMile)) / parseFloat(newSale.saleValue)) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Passageiros no Bilhete</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addPassenger}>
                    Adicionar
                  </Button>
                </div>
                {newSale.passengers.map((passenger, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nome completo"
                      value={passenger.name}
                      onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="CPF"
                        value={passenger.cpf}
                        onChange={(e) => updatePassenger(index, 'cpf', e.target.value)}
                      />
                      {newSale.passengers.length > 1 && (
                        <Button type="button" size="sm" variant="outline" onClick={() => removePassenger(index)}>
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateSale} 
                className="bg-gradient-primary hover:opacity-90"
                disabled={!newSale.milesUsed || !selectedProgramStock || parseFloat(newSale.milesUsed) > selectedProgramStock.availableMiles}
              >
                Registrar Venda
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ {totalRevenue.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ {totalProfit.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Milhas Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalMilesSold.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{averageProfitMargin.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Histórico de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Dono/Programa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Milhas</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{sale.ownerName}</p>
                      <p className="text-xs text-muted-foreground">{sale.program}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{sale.clientName}</p>
                      <p className="text-xs text-muted-foreground">{sale.ticketLocator}</p>
                    </div>
                  </TableCell>
                  <TableCell>{sale.milesUsed.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>R$ {sale.saleValue.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className={`font-semibold ${sale.profit < 0 ? 'text-destructive' : 'text-success'}`}>
                    R$ {sale.profit.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{sale.profitMargin.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Select 
                      value={sale.status} 
                      onValueChange={(value) => updateSaleStatus(sale.id, value as Sale['status'])}
                    >
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
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{sale.passengers.length} pax</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}