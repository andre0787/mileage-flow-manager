import { useState } from "react";
import { Plus, Edit, Trash2, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseOrigemTypeDescription, serializeOrigemTypeDescription } from "@/lib/origemTypes";
import { isTransferencia } from "@/lib/utils";
import type { OrigemType } from "@/types";

interface OrigemTypeSectionProps {
  origemTypes: OrigemType[]
  onAdd: (data: { id: string; name: string; accountType: OrigemType["accountType"]; color: string; description: string | null }) => void
  onUpdate: (data: { id: string; name: string; accountType: OrigemType["accountType"]; color: string; description: string | null }) => void
  onDelete: (id: string) => void
}

export default function OrigemTypeSection({ origemTypes, onAdd, onUpdate, onDelete }: OrigemTypeSectionProps) {
  const milhasTypes = origemTypes.filter(ot => ot.accountType === "milhas" && !isTransferencia(ot));
  const [form, setForm] = useState({ name: "", accountType: "milhas" as OrigemType["accountType"], color: "#10b981", hasRecurrence: false });
  const [editing, setEditing] = useState<OrigemType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const resetDialog = () => {
    setForm({ name: "", accountType: "milhas", color: "#10b981", hasRecurrence: false });
    setEditing(null);
    setError("");
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (!form.name) { setError("Nome é obrigatório"); return; }
    const description = serializeOrigemTypeDescription(form.hasRecurrence);
    const payload = { name: form.name, accountType: form.accountType, color: form.color, description };
    if (editing) {
      onUpdate({ id: editing.id, ...payload });
    } else {
      onAdd({ id: crypto.randomUUID(), ...payload });
    }
    resetDialog();
  };

  const handleEdit = (ot: OrigemType) => {
    setEditing(ot);
    setForm({
      name: ot.name,
      accountType: ot.accountType,
      color: ot.color,
      hasRecurrence: parseOrigemTypeDescription(ot.description).hasRecurrence,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">{milhasTypes.length} tipo(s) de operação cadastrado(s)</p>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else { setForm(f => ({ ...f, accountType: "milhas" })); setIsDialogOpen(true); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto" onClick={() => setForm({ name: "", accountType: "milhas", color: "#10b981", hasRecurrence: false })}>
              <Plus className="h-4 w-4" /> Nova Operação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Operação" : "Nova Operação"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="otName">Nome</Label>
                <Input id="otName" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }} placeholder="Ex: Compra Direta" />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="otColor">Cor</Label>
                <div className="flex gap-2 items-center">
                  <Input id="otColor" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-12 h-10 p-1" />
                  <span className="text-sm text-muted-foreground">{form.color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otRecurrence">Recorrência</Label>
                <Select value={form.hasRecurrence ? "sim" : "nao"} onValueChange={(value) => setForm({ ...form, hasRecurrence: value === "sim" })}>
                  <SelectTrigger id="otRecurrence"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não recorrente</SelectItem>
                    <SelectItem value="sim">Recorrente mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <Palette className="h-5 w-5 text-primary" /> Tipos de Operação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Cor</TableHead>
                  <TableHead className="hidden md:table-cell">Recorrência</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milhasTypes.map((ot) => (
                  <TableRow key={ot.id}>
                    <TableCell className="hidden md:table-cell font-medium">{ot.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: ot.color }} />
                        <span className="text-xs font-mono">{ot.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={parseOrigemTypeDescription(ot.description).hasRecurrence ? "default" : "secondary"}>
                        {parseOrigemTypeDescription(ot.description).hasRecurrence ? "Mensal" : "Avulsa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="px-3 min-h-[44px] min-w-[44px]" onClick={() => handleEdit(ot)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="px-3 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive" onClick={() => onDelete(ot.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile */}
          <div className="md:hidden space-y-3 mt-4">
            {milhasTypes.map((ot) => (
              <div key={ot.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base truncate">{ot.name}</p>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: ot.color }} />
                    <span className="text-xs font-mono text-muted-foreground">{ot.color}</span>
                  </div>
                </div>
                <Badge variant={parseOrigemTypeDescription(ot.description).hasRecurrence ? "default" : "secondary"} className="w-fit">
                  {parseOrigemTypeDescription(ot.description).hasRecurrence ? "Recorrente mensal" : "Avulsa"}
                </Badge>
                <div className="flex gap-2 pt-1 border-t">
                  <Button size="sm" variant="outline" className="flex-1 gap-2 min-h-[44px]" onClick={() => handleEdit(ot)}><Edit className="h-4 w-4" /> Editar</Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-2 min-h-[44px] text-destructive hover:text-destructive" onClick={() => onDelete(ot.id)}><Trash2 className="h-4 w-4" /> Excluir</Button>
                </div>
              </div>
            ))}
          </div>
          {milhasTypes.length === 0 && (
            <div className="text-center py-8">
              <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum tipo de origem cadastrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
