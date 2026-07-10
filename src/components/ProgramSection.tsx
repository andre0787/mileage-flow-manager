import { useState } from "react";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Program } from "@/types";

interface ProgramSectionProps {
  programs: Program[]
  onAdd: (data: { id: string; name: string; type: Program["type"]; maxPassengers?: number; passengerCycleType?: "anual" | "dias"; passengerCycleDays?: number }) => void
  onUpdate: (data: { id: string; name: string; type: Program["type"]; maxPassengers?: number; passengerCycleType?: "anual" | "dias"; passengerCycleDays?: number }) => void
  onDelete: (id: string) => void
}

export default function ProgramSection({ programs, onAdd, onUpdate, onDelete }: ProgramSectionProps) {
  const [form, setForm] = useState({ name: "", type: "milhas" as Program["type"], maxPassengers: "", passengerCycleType: "none" as "none" | "anual" | "dias", passengerCycleDays: "" });
  const [editing, setEditing] = useState<Program | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const resetDialog = () => {
    setForm({ name: "", type: "milhas", maxPassengers: "", passengerCycleType: "none", passengerCycleDays: "" });
    setEditing(null);
    setError("");
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (!form.name) { setError("Nome é obrigatório"); return; }
    if (form.passengerCycleType !== "none" && !form.maxPassengers) { setError("Máx. Passageiros é obrigatório para controle ativo"); return; }
    if (form.passengerCycleType === "dias" && !form.passengerCycleDays) { setError("Janela em dias é obrigatória para ciclo por dias"); return; }
    const data = {
      name: form.name,
      type: form.type,
      maxPassengers: form.passengerCycleType !== "none" && form.maxPassengers ? parseInt(form.maxPassengers) : undefined,
      passengerCycleType: form.passengerCycleType !== "none" ? form.passengerCycleType : undefined,
      passengerCycleDays: form.passengerCycleType === "dias" && form.passengerCycleDays ? parseInt(form.passengerCycleDays) : undefined,
    };
    if (editing) {
      onUpdate({ id: editing.id, ...data });
    } else {
      onAdd({ id: crypto.randomUUID(), ...data });
    }
    resetDialog();
  };

  const handleEdit = (program: Program) => {
    setEditing(program);
    setForm({
      name: program.name,
      type: program.type,
      maxPassengers: program.maxPassengers?.toString() ?? "",
      passengerCycleType: program.passengerCycleType ?? "none",
      passengerCycleDays: program.passengerCycleDays?.toString() ?? "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">{programs.length} programa(s) cadastrado(s)</p>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Novo Programa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Programa" : "Novo Programa"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="programName">Nome do Programa</Label>
                <Input id="programName" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }} placeholder="Ex: LATAM Pass" />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="programType">Tipo</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as Program["type"] })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pontos">Programa de Pontos</SelectItem>
                    <SelectItem value="milhas">Programa de Milhas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="programCycle">Controle de Passageiros</Label>
                <Select value={form.passengerCycleType} onValueChange={(value) => setForm({ ...form, passengerCycleType: value as "none" | "anual" | "dias" })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o controle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não Controlar</SelectItem>
                    <SelectItem value="anual">Ciclo Anual</SelectItem>
                    <SelectItem value="dias">Ciclo por Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.passengerCycleType !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="programMaxPassengers">Máx. Passageiros por Ciclo</Label>
                  <Input id="programMaxPassengers" type="number" min="1" value={form.maxPassengers} onChange={(e) => setForm({ ...form, maxPassengers: e.target.value })} placeholder="Ex: 5" />
                </div>
              )}
              {form.passengerCycleType === "dias" && (
                <div className="space-y-2">
                  <Label htmlFor="programCycleDays">Janela (dias)</Label>
                  <Input id="programCycleDays" type="number" min="1" value={form.passengerCycleDays} onChange={(e) => setForm({ ...form, passengerCycleDays: e.target.value })} placeholder="Ex: 365" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetDialog}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">{editing ? "Salvar Alterações" : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Programas de Fidelidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Programa</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Controle</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="hidden md:table-cell font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {program.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={program.type === "pontos" ? "secondary" : "default"}>{program.type === "pontos" ? "Pontos" : "Milhas"}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {program.passengerCycleType ? (
                        <Badge variant="outline">
                          {program.passengerCycleType === "anual" ? `Anual — ${program.maxPassengers ?? "?"} pax/ano` : `${program.maxPassengers ?? "?"} pax/${program.passengerCycleDays ?? "?"}d`}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="px-3 min-h-[44px] min-w-[44px]" onClick={() => handleEdit(program)}><Edit className="h-4 w-4" /></Button>
                        <DeleteConfirmDialog
                          trigger={<Button size="sm" variant="outline" className="px-3 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                          title="Excluir programa?"
                          description={`Tem certeza que deseja excluir o programa "${program.name}"? Esta ação não pode ser desfeita.`}
                          confirmLabel="Excluir programa"
                          onConfirm={() => onDelete(program.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile */}
          <div className="md:hidden space-y-3 mt-4">
            {programs.map((program) => (
              <div key={program.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base truncate">{program.name}</p>
                  <Badge variant={program.type === "pontos" ? "secondary" : "default"} className="shrink-0 ml-2">{program.type === "pontos" ? "Pontos" : "Milhas"}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Controle</span>
                    <p className="truncate">{program.passengerCycleType ? (program.passengerCycleType === "anual" ? `Anual — ${program.maxPassengers ?? "?"} pax/ano` : `${program.maxPassengers ?? "?"} pax/${program.passengerCycleDays ?? "?"}d`) : "—"}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1 border-t">
                  <Button size="sm" variant="outline" className="flex-1 gap-2 min-h-[44px]" onClick={() => handleEdit(program)}><Edit className="h-4 w-4" /> Editar</Button>
                  <DeleteConfirmDialog
                    trigger={<Button size="sm" variant="outline" className="flex-1 gap-2 min-h-[44px] text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Excluir</Button>}
                    title="Excluir programa?"
                    description={`Tem certeza que deseja excluir o programa "${program.name}"? Esta ação não pode ser desfeita.`}
                    confirmLabel="Excluir programa"
                    onConfirm={() => onDelete(program.id)}
                  />
                </div>
              </div>
            ))}
          </div>
          {programs.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum programa cadastrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
