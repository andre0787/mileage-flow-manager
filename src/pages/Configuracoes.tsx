import { useState } from "react";
import { Plus, Edit, Trash2, User, Building2, Settings, Palette, RotateCcw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { isTransferencia } from "@/lib/utils";
import { useAddOwnerMutation, useUpdateOwnerMutation, useDeleteOwnerMutation } from "@/hooks/useDatabase";
import { useAddProgramMutation, useUpdateProgramMutation, useDeleteProgramMutation } from "@/hooks/useDatabase";
import { useAddOrigemTypeMutation, useUpdateOrigemTypeMutation, useDeleteOrigemTypeMutation } from "@/hooks/useDatabase";
import { formatCPF } from "@/lib/utils";
import type { Owner, Program, OrigemType } from "@/types";

export default function Configuracoes() {
  const { owners, programs, origemTypes, accounts, clearCache, clearAccountData } = useData();

  const addOwnerM = useAddOwnerMutation();
  const updateOwnerM = useUpdateOwnerMutation();
  const deleteOwnerM = useDeleteOwnerMutation();

  const addProgramM = useAddProgramMutation();
  const updateProgramM = useUpdateProgramMutation();
  const deleteProgramM = useDeleteProgramMutation();

  const addOrigemTypeM = useAddOrigemTypeMutation();
  const updateOrigemTypeM = useUpdateOrigemTypeMutation();
  const deleteOrigemTypeM = useDeleteOrigemTypeMutation();

  // Owner CRUD state
  const [newOwner, setNewOwner] = useState({ name: "", cpf: "", phone: "" });
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const [ownerError, setOwnerError] = useState("");

  // Program CRUD state
  const [newProgram, setNewProgram] = useState({ name: "", type: "milhas" as Program["type"], maxPassengers: "", passengerCycleType: "none" as "none" | "anual" | "dias", passengerCycleDays: "" });
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [programError, setProgramError] = useState("");

  // OrigemType CRUD state
  const [newOrigemType, setNewOrigemType] = useState({ name: "", accountType: "pontos" as OrigemType["accountType"], color: "#3b82f6" });
  const [editingOrigemType, setEditingOrigemType] = useState<OrigemType | null>(null);
  const [isOrigemTypeDialogOpen, setIsOrigemTypeDialogOpen] = useState(false);
  const [origemTypeError, setOrigemTypeError] = useState("");


  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const resetOwnerDialog = () => {
    setNewOwner({ name: "", cpf: "", phone: "" });
    setEditingOwner(null);
    setOwnerError("");
    setIsOwnerDialogOpen(false);
  };

  const handleSaveOwner = () => {
    if (!newOwner.name) {
      setOwnerError("Nome é obrigatório");
      return;
    }
    if (editingOwner) {
      updateOwnerM.mutate({ id: editingOwner.id, ...newOwner });
    } else {
      addOwnerM.mutate({ id: crypto.randomUUID(), ...newOwner });
    }
    resetOwnerDialog();
  };

  const handleEditOwner = (owner: Owner) => {
    setEditingOwner(owner);
    setNewOwner({ name: owner.name, cpf: owner.cpf, phone: owner.phone });
    setIsOwnerDialogOpen(true);
  };

  const resetProgramDialog = () => {
    setNewProgram({ name: "", type: "milhas", maxPassengers: "", passengerCycleType: "none", passengerCycleDays: "" });
    setEditingProgram(null);
    setProgramError("");
    setIsProgramDialogOpen(false);
  };

  const handleSaveProgram = () => {
    if (!newProgram.name) {
      setProgramError("Nome é obrigatório");
      return;
    }
    if (newProgram.passengerCycleType !== "none" && !newProgram.maxPassengers) {
      setProgramError("Máx. Passageiros é obrigatório para controle ativo");
      return;
    }
    if (newProgram.passengerCycleType === "dias" && !newProgram.passengerCycleDays) {
      setProgramError("Janela em dias é obrigatória para ciclo por dias");
      return;
    }
    const programData = {
      name: newProgram.name,
      type: newProgram.type,
      maxPassengers: newProgram.passengerCycleType !== "none" && newProgram.maxPassengers ? parseInt(newProgram.maxPassengers) : undefined,
      passengerCycleType: newProgram.passengerCycleType !== "none" ? newProgram.passengerCycleType : undefined,
      passengerCycleDays: newProgram.passengerCycleType === "dias" && newProgram.passengerCycleDays ? parseInt(newProgram.passengerCycleDays) : undefined,
    };
    if (editingProgram) {
      updateProgramM.mutate({ id: editingProgram.id, ...programData });
    } else {
      addProgramM.mutate({ id: crypto.randomUUID(), ...programData });
    }
    resetProgramDialog();
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setNewProgram({
      name: program.name,
      type: program.type,
      maxPassengers: program.maxPassengers?.toString() ?? "",
      passengerCycleType: program.passengerCycleType ?? "none",
      passengerCycleDays: program.passengerCycleDays?.toString() ?? "",
    });
    setIsProgramDialogOpen(true);
  };

  const resetOrigemTypeDialog = () => {
    setNewOrigemType({ name: "", accountType: "pontos", color: "#3b82f6" });
    setEditingOrigemType(null);
    setOrigemTypeError("");
    setIsOrigemTypeDialogOpen(false);
  };

  const handleSaveOrigemType = () => {
    if (!newOrigemType.name) {
      setOrigemTypeError("Nome é obrigatório");
      return;
    }
    if (editingOrigemType) {
      updateOrigemTypeM.mutate({ id: editingOrigemType.id, ...newOrigemType });
    } else {
      addOrigemTypeM.mutate({ id: crypto.randomUUID(), ...newOrigemType });
    }
    resetOrigemTypeDialog();
  };

  const handleEditOrigemType = (ot: OrigemType) => {
    setEditingOrigemType(ot);
    setNewOrigemType({ name: ot.name, accountType: ot.accountType, color: ot.color });
    setIsOrigemTypeDialogOpen(true);
  };

  const milhasTypes = origemTypes.filter(ot => ot.accountType === "milhas" && !isTransferencia(ot));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie donos, programas e tipos de operação
          </p>
        </div>
      </div>

      <Tabs defaultValue="owners" className="space-y-6">
        <TabsList>
          <TabsTrigger value="owners" className="gap-2">
            <User className="h-4 w-4" />
            Donos
          </TabsTrigger>
          <TabsTrigger value="programs" className="gap-2">
            <Building2 className="h-4 w-4" />
            Programas
          </TabsTrigger>
          <TabsTrigger value="origem-milhas" className="gap-2">
            <Palette className="h-4 w-4" />
            Tipo de Operação
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            Preferências
          </TabsTrigger>
        </TabsList>

        {/* Donos Tab */}
        <TabsContent value="owners" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {owners.length} dono(s) cadastrado(s)
            </p>
            <Dialog open={isOwnerDialogOpen} onOpenChange={(open) => {
              if (!open) resetOwnerDialog();
              else setIsOwnerDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4" />
                  Novo Dono
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingOwner ? "Editar Dono" : "Novo Dono"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Nome Completo</Label>
                    <Input id="ownerName" value={newOwner.name} onChange={(e) => { setNewOwner({ ...newOwner, name: e.target.value }); setOwnerError(""); }} placeholder="Nome do dono" />
                    {ownerError && <p className="text-xs text-destructive">{ownerError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerCpf">CPF</Label>
                    <Input id="ownerCpf" value={newOwner.cpf} onChange={(e) => setNewOwner({ ...newOwner, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">Telefone</Label>
                    <Input id="ownerPhone" value={newOwner.phone} onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })} placeholder="(11) 99999-9999" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetOwnerDialog}>Cancelar</Button>
                  <Button onClick={handleSaveOwner} className="bg-gradient-primary hover:opacity-90">
                    {editingOwner ? "Salvar Alterações" : "Cadastrar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Donos das Contas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Contas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="font-medium">{owner.name}</TableCell>
                      <TableCell className="font-mono">{owner.cpf}</TableCell>
                      <TableCell>{owner.phone}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {accounts.filter(a => a.ownerId === owner.id).length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="px-3" onClick={() => handleEditOwner(owner)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="px-3 text-destructive hover:text-destructive" onClick={() => deleteOwnerM.mutate(owner.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {owners.length === 0 && (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum dono cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programas Tab */}
        <TabsContent value="programs" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {programs.length} programa(s) cadastrado(s)
            </p>
            <Dialog open={isProgramDialogOpen} onOpenChange={(open) => {
              if (!open) resetProgramDialog();
              else setIsProgramDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4" />
                  Novo Programa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingProgram ? "Editar Programa" : "Novo Programa"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="programName">Nome do Programa</Label>
                    <Input id="programName" value={newProgram.name} onChange={(e) => { setNewProgram({ ...newProgram, name: e.target.value }); setProgramError(""); }} placeholder="Ex: LATAM Pass" />
                    {programError && <p className="text-xs text-destructive">{programError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="programType">Tipo</Label>
                    <Select value={newProgram.type} onValueChange={(value) => setNewProgram({ ...newProgram, type: value as Program["type"] })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pontos">Programa de Pontos</SelectItem>
                        <SelectItem value="milhas">Programa de Milhas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="programCycle">Controle de Passageiros</Label>
                    <Select
                      value={newProgram.passengerCycleType}
                      onValueChange={(value) => setNewProgram({ ...newProgram, passengerCycleType: value as "none" | "anual" | "dias" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o controle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não Controlar</SelectItem>
                        <SelectItem value="anual">Ciclo Anual</SelectItem>
                        <SelectItem value="dias">Ciclo por Dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newProgram.passengerCycleType !== "none" && (
                    <div className="space-y-2">
                      <Label htmlFor="programMaxPassengers">Máx. Passageiros por Ciclo</Label>
                      <Input
                        id="programMaxPassengers"
                        type="number"
                        min="1"
                        value={newProgram.maxPassengers}
                        onChange={(e) => setNewProgram({ ...newProgram, maxPassengers: e.target.value })}
                        placeholder="Ex: 5"
                      />
                    </div>
                  )}

                  {newProgram.passengerCycleType === "dias" && (
                    <div className="space-y-2">
                      <Label htmlFor="programCycleDays">Janela (dias)</Label>
                      <Input
                        id="programCycleDays"
                        type="number"
                        min="1"
                        value={newProgram.passengerCycleDays}
                        onChange={(e) => setNewProgram({ ...newProgram, passengerCycleDays: e.target.value })}
                        placeholder="Ex: 365"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetProgramDialog}>Cancelar</Button>
                  <Button onClick={handleSaveProgram} className="bg-gradient-primary hover:opacity-90">
                    {editingProgram ? "Salvar Alterações" : "Cadastrar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Programas de Fidelidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Controle</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          {program.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={program.type === "pontos" ? "secondary" : "default"}>
                          {program.type === "pontos" ? "Pontos" : "Milhas"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {program.passengerCycleType ? (
                          <Badge variant="outline">
                            {program.passengerCycleType === "anual"
                              ? `Anual — ${program.maxPassengers ?? "?"} pax/ano`
                              : `${program.maxPassengers ?? "?"} pax/${program.passengerCycleDays ?? "?"}d`}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="px-3" onClick={() => handleEditProgram(program)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="px-3 text-destructive hover:text-destructive" onClick={() => deleteProgramM.mutate(program.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {programs.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum programa cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tipos de Milhas Tab */}
        <TabsContent value="origem-milhas" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {milhasTypes.length} tipo(s) de operação cadastrado(s)
            </p>
            <Dialog open={isOrigemTypeDialogOpen && newOrigemType.accountType === "milhas"} onOpenChange={(open) => {
              if (!open) resetOrigemTypeDialog();
              else { setNewOrigemType(prev => ({ ...prev, accountType: "milhas" })); setIsOrigemTypeDialogOpen(true); }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-primary hover:opacity-90" onClick={() => setNewOrigemType({ name: "", accountType: "milhas", color: "#10b981" })}>
                  <Plus className="h-4 w-4" />
                  Nova Operação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingOrigemType ? "Editar Operação" : "Nova Operação"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="otNameMilhas">Nome</Label>
                    <Input id="otNameMilhas" value={newOrigemType.name} onChange={(e) => { setNewOrigemType({ ...newOrigemType, name: e.target.value }); setOrigemTypeError(""); }} placeholder="Ex: Compra Direta" />
                    {origemTypeError && <p className="text-xs text-destructive">{origemTypeError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otColorMilhas">Cor</Label>
                    <div className="flex gap-2 items-center">
                      <Input id="otColorMilhas" type="color" value={newOrigemType.color} onChange={(e) => setNewOrigemType({ ...newOrigemType, color: e.target.value })} className="w-12 h-10 p-1" />
                      <span className="text-sm text-muted-foreground">{newOrigemType.color}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetOrigemTypeDialog}>Cancelar</Button>
                  <Button onClick={handleSaveOrigemType} className="bg-gradient-primary hover:opacity-90">
                    {editingOrigemType ? "Salvar Alterações" : "Cadastrar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Tipos de Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milhasTypes.map((ot) => (
                    <TableRow key={ot.id}>
                      <TableCell className="font-medium">{ot.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: ot.color }} />
                          <span className="text-xs font-mono">{ot.color}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="px-3" onClick={() => { setNewOrigemType({ name: ot.name, accountType: "milhas", color: ot.color }); setEditingOrigemType(ot); setIsOrigemTypeDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="px-3 text-destructive hover:text-destructive" onClick={() => deleteOrigemTypeM.mutate(ot.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {milhasTypes.length === 0 && (
                <div className="text-center py-8">
                  <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum tipo de origem cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferências Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="shadow-card border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Gerenciamento de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ações de manutenção dos dados da sua conta.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2" onClick={clearCache}>
                  <RotateCcw className="h-4 w-4" />
                  Limpar Cache
                </Button>
                <Button variant="destructive" className="gap-2" onClick={() => setShowClearConfirm(true)}>
                  <Trash2 className="h-4 w-4" />
                  Limpar Conta
                </Button>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Limpar Conta
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-foreground">
                  Tem certeza que deseja limpar todos os dados da sua conta?
                </p>
                <p className="text-sm text-muted-foreground">
                  Esta ação irá remover permanentemente todas as contas, entradas, vendas, clientes, donos, programas e tipos de operação. O tipo "Transferência" será preservado. Esta operação não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancelar</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowClearConfirm(false);
                    clearAccountData();
                  }}
                >
                  Sim, limpar tudo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
