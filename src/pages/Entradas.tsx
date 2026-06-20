import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import type { Program, OrigemType } from "@/types";

export default function Entradas() {
  const { entries, accounts, owners, programs, origemTypes, addEntry, deleteEntry } = useData();

  const [activeTab, setActiveTab] = useState<"pontos" | "milhas">("pontos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    accountId: "",
    origemTypeId: "",
    amount: "",
    amountPaid: "",
    conversionRate: "",
  });
  const [entryErrors, setEntryErrors] = useState<Partial<Record<"accountId" | "origemTypeId" | "amount" | "amountPaid", string>>>({});

  const milhasOrigemTypes = origemTypes.filter(ot => ot.accountType === "milhas");
  const currentOrigemTypes = activeTab === "pontos"
    ? programs.filter(p => p.type === "pontos")
    : milhasOrigemTypes;
  const availableAccounts = accounts.filter(a => a.type === activeTab && a.status === "ativa");

  const entriesFiltered = entries.filter(e => {
    const account = accounts.find(a => a.id === e.accountId);
    return account?.type === activeTab;
  });

  const selectedAccount = accounts.find(a => a.id === newEntry.accountId);
  const selectedOrigemType = origemTypes.find(ot => ot.id === newEntry.origemTypeId);

  const ownerName = (id: string) => owners.find(o => o.id === id)?.name ?? id;
  const programName = (id: string) => programs.find(p => p.id === id)?.name ?? id;
  const origemTypeName = (id: string) => origemTypes.find(ot => ot.id === id)?.name ?? id;

  const resetForm = () => {
    setNewEntry({ accountId: "", origemTypeId: "", amount: "", amountPaid: "", conversionRate: "" });
    setEntryErrors({});
  };

  const validateEntry = () => {
    const errors: typeof entryErrors = {};
    if (!newEntry.accountId) errors.accountId = "Selecione uma conta";
    if (!newEntry.origemTypeId) errors.origemTypeId = "Selecione o tipo de origem";
    if (!newEntry.amount || parseFloat(newEntry.amount) <= 0) errors.amount = "Informe a quantidade";
    if (!newEntry.amountPaid || parseFloat(newEntry.amountPaid) <= 0) errors.amountPaid = "Informe o valor pago";
    setEntryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateEntry = () => {
    if (!validateEntry()) return;
      const amount = parseFloat(newEntry.amount);
      const amountPaid = parseFloat(newEntry.amountPaid);
      const conversionRate = parseFloat(newEntry.conversionRate || "1");
      const costPerThousand = (amountPaid / amount) * 1000;
      const milesGenerated = amount * conversionRate;
      const costPerMile = amountPaid / milesGenerated;

      addEntry({
        accountId: newEntry.accountId,
        origemTypeId: newEntry.origemTypeId,
        amount,
        amountPaid,
        costPerThousand,
        conversionRate: activeTab === "milhas" ? undefined : conversionRate,
        milesGenerated: activeTab === "milhas" ? amount : milesGenerated,
        costPerMile,
        date: new Date().toISOString().split('T')[0],
      });

      resetForm();
      setEntryErrors({});
      setIsCreateDialogOpen(false);
  };

  const totalAmount = entriesFiltered.reduce((s, e) => s + e.amount, 0);
  const totalAmountPaid = entriesFiltered.reduce((s, e) => s + e.amountPaid, 0);
  const totalMilesGenerated = entriesFiltered.reduce((s, e) => s + (e.milesGenerated ?? e.amount), 0);
  const averageCostPerMile = totalMilesGenerated > 0 ? totalAmountPaid / totalMilesGenerated : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entradas</h1>
          <p className="text-muted-foreground">
            Gerencie aquisição de pontos e milhas
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsCreateDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4" />
              Nova Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nova Entrada - {activeTab === "pontos" ? "Pontos" : "Milhas"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="entryAccount">Conta</Label>
                <Select value={newEntry.accountId} onValueChange={(value) => { setNewEntry({...newEntry, accountId: value}); setEntryErrors(prev => ({...prev, accountId: ""})); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({ownerName(acc.ownerId)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {entryErrors.accountId && <p className="text-xs text-destructive">{entryErrors.accountId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryType">Tipo de Origem</Label>
                <Select value={newEntry.origemTypeId} onValueChange={(value) => { setNewEntry({...newEntry, origemTypeId: value}); setEntryErrors(prev => ({...prev, origemTypeId: ""})); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentOrigemTypes.map((item) => {
                      if (activeTab === "pontos") {
                        const p = item as Program;
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        );
                      }
                      const ot = item as OrigemType;
                      return (
                        <SelectItem key={ot.id} value={ot.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ot.color }} />
                            {ot.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {entryErrors.origemTypeId && <p className="text-xs text-destructive">{entryErrors.origemTypeId}</p>}
              </div>

              {selectedAccount && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">Programa: </span>
                  <span className="font-medium">{programName(selectedAccount.programId)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{activeTab === "pontos" ? "Pontos Adquiridos" : "Milhas Adquiridas"}</Label>
                  <Input id="amount" type="number" value={newEntry.amount} onChange={(e) => { setNewEntry({...newEntry, amount: e.target.value}); setEntryErrors(prev => ({...prev, amount: ""})); }} placeholder="Ex: 100000" />
                  {entryErrors.amount && <p className="text-xs text-destructive">{entryErrors.amount}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amountPaid">Valor Pago (R$)</Label>
                  <Input id="amountPaid" type="number" step="0.01" value={newEntry.amountPaid} onChange={(e) => { setNewEntry({...newEntry, amountPaid: e.target.value}); setEntryErrors(prev => ({...prev, amountPaid: ""})); }} placeholder="Ex: 450.00" />
                  {entryErrors.amountPaid && <p className="text-xs text-destructive">{entryErrors.amountPaid}</p>}
                </div>
              </div>

              {activeTab === "pontos" && (
                <div className="space-y-2">
                  <Label htmlFor="conversion">Taxa de Conversão (Pontos → Milhas)</Label>
                  <Input id="conversion" type="number" step="0.01" value={newEntry.conversionRate} onChange={(e) => setNewEntry({...newEntry, conversionRate: e.target.value})} placeholder="Ex: 1.0" />
                </div>
              )}

              {newEntry.amount && newEntry.amountPaid && (activeTab === "milhas" || newEntry.conversionRate) && (
                <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
                  <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Custo por milhar:</span>
                      <p className="font-semibold">R$ {((parseFloat(newEntry.amountPaid) / parseFloat(newEntry.amount)) * 1000).toFixed(2)}</p>
                    </div>
                    {activeTab === "pontos" && (
                      <div>
                        <span className="text-muted-foreground">Milhas geradas:</span>
                        <p className="font-semibold">{(parseFloat(newEntry.amount) * parseFloat(newEntry.conversionRate || "1")).toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Custo por {(activeTab === "milhas" ? "milha" : "milha gerada")}:</span>
                      <p className="font-semibold">R$ {(parseFloat(newEntry.amountPaid) / (parseFloat(newEntry.amount) * parseFloat(newEntry.conversionRate || "1"))).toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false); }}>Cancelar</Button>
              <Button onClick={handleCreateEntry} className="bg-gradient-primary hover:opacity-90">Registrar Entrada</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sub-abas Pontos / Milhas */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pontos" | "milhas")}>
        <TabsList>
          <TabsTrigger value="pontos" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Pontos
          </TabsTrigger>
          <TabsTrigger value="milhas" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Milhas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pontos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pontos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalAmount.toLocaleString('pt-BR')}</div>
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

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Histórico de Entradas - Pontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Taxa Conv.</TableHead>
                    <TableHead>Milhas</TableHead>
                    <TableHead>Custo/Milha</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesFiltered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <p className="font-medium">{accounts.find(a => a.id === entry.accountId)?.name}</p>
                        <p className="text-xs text-muted-foreground">{ownerName(accounts.find(a => a.id === entry.accountId)?.ownerId ?? "")}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {programs.find(p => p.id === entry.origemTypeId)?.name ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.amount.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>R$ {entry.amountPaid.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{entry.conversionRate ?? "-"}</TableCell>
                      <TableCell className="font-semibold text-success">
                        {(entry.milesGenerated ?? entry.amount).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>R$ {entry.costPerMile.toFixed(4)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="px-2 text-destructive" onClick={() => deleteEntry(entry.id)}>
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milhas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Milhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalAmount.toLocaleString('pt-BR')}</div>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Custo Médio/Milha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">R$ {averageCostPerMile.toFixed(4)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                Histórico de Entradas - Milhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Milhas</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Custo/Milha</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesFiltered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <p className="font-medium">{accounts.find(a => a.id === entry.accountId)?.name}</p>
                        <p className="text-xs text-muted-foreground">{ownerName(accounts.find(a => a.id === entry.accountId)?.ownerId ?? "")}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: origemTypes.find(ot => ot.id === entry.origemTypeId)?.color }} />
                          {origemTypeName(entry.origemTypeId)}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.amount.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>R$ {entry.amountPaid.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>R$ {entry.costPerMile.toFixed(4)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="px-2 text-destructive" onClick={() => deleteEntry(entry.id)}>
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
