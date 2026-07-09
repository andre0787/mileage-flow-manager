import { useState } from "react";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCPF } from "@/lib/utils";
import type { Owner, Account } from "@/types";

interface OwnerSectionProps {
  owners: Owner[]
  accounts: Account[]
  onAdd: (data: { id: string; name: string; cpf: string; phone: string }) => void
  onUpdate: (data: { id: string; name: string; cpf: string; phone: string }) => void
  onDelete: (id: string) => void
}

export default function OwnerSection({ owners, accounts, onAdd, onUpdate, onDelete }: OwnerSectionProps) {
  const [newOwner, setNewOwner] = useState({ name: "", cpf: "", phone: "" });
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const resetDialog = () => {
    setNewOwner({ name: "", cpf: "", phone: "" });
    setEditingOwner(null);
    setError("");
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (!newOwner.name) {
      setError("Nome é obrigatório");
      return;
    }
    if (editingOwner) {
      onUpdate({ id: editingOwner.id, ...newOwner });
    } else {
      onAdd({ id: crypto.randomUUID(), ...newOwner });
    }
    resetDialog();
  };

  const handleEdit = (owner: Owner) => {
    setEditingOwner(owner);
    setNewOwner({ name: owner.name, cpf: owner.cpf ?? "", phone: owner.phone ?? "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">{owners.length} dono(s) cadastrado(s)</p>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Novo Dono
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingOwner ? "Editar Dono" : "Novo Dono"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Nome Completo</Label>
                <Input id="ownerName" value={newOwner.name} onChange={(e) => { setNewOwner({ ...newOwner, name: e.target.value }); setError(""); }} placeholder="Nome do dono" />
                {error && <p className="text-xs text-destructive">{error}</p>}
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
              <Button variant="outline" onClick={resetDialog}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">{editingOwner ? "Salvar Alterações" : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Donos das Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Nome</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Contas</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell className="hidden md:table-cell font-medium">{owner.name}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono">{owner.cpf}</TableCell>
                    <TableCell className="hidden md:table-cell">{owner.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {accounts.filter(a => a.ownerId === owner.id).length}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="px-3 min-h-[44px] min-w-[44px]" onClick={() => handleEdit(owner)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="px-3 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive" onClick={() => onDelete(owner.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile */}
          <div className="md:hidden space-y-3 mt-4">
            {owners.map((owner) => (
              <div key={owner.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base truncate">{owner.name}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary shrink-0 ml-2">
                    {accounts.filter(a => a.ownerId === owner.id).length} conta(s)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs">CPF</span><p className="font-mono truncate">{owner.cpf || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Telefone</span><p className="truncate">{owner.phone || "—"}</p></div>
                </div>
                <div className="flex gap-2 pt-1 border-t">
                  <Button size="sm" variant="outline" className="flex-1 gap-2 min-h-[44px]" onClick={() => handleEdit(owner)}><Edit className="h-4 w-4" /> Editar</Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-2 min-h-[44px] text-destructive hover:text-destructive" onClick={() => onDelete(owner.id)}><Trash2 className="h-4 w-4" /> Excluir</Button>
                </div>
              </div>
            ))}
          </div>
          {owners.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum dono cadastrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
