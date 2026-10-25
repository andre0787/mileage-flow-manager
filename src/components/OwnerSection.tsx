import { useState, useMemo } from "react";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OwnerDialog, type OwnerFormData } from "@/components/owners/OwnerDialog";
import { OwnerTableRow } from "@/components/owners/OwnerTableRow";
import { OwnerMobileCard } from "@/components/owners/OwnerMobileCard";
import type { Owner, Account } from "@/types";

interface OwnerSectionProps {
  owners: Owner[];
  accounts: Account[];
  onAdd: (data: OwnerFormData) => void;
  onUpdate: (data: OwnerFormData) => void;
  onDelete: (id: string) => void;
}

export default function OwnerSection({
  owners,
  accounts,
  onAdd,
  onUpdate,
  onDelete,
}: OwnerSectionProps) {
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const accountCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const account of accounts) {
      counts[account.ownerId] = (counts[account.ownerId] || 0) + 1;
    }
    return counts;
  }, [accounts]);

  const resetDialog = () => {
    setEditingOwner(null);
    setIsDialogOpen(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog();
      return;
    }
    setIsDialogOpen(true);
  };

  const handleEdit = (owner: Owner) => {
    setEditingOwner(owner);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">{owners.length} dono(s) cadastrado(s)</p>
        <OwnerDialog
          isOpen={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          editingOwner={editingOwner}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onClose={resetDialog}
        />
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
                  <OwnerTableRow
                    key={owner.id}
                    owner={owner}
                    accountCount={accountCounts[owner.id] || 0}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile */}
          <div className="md:hidden space-y-3 mt-4">
            {owners.map((owner) => (
              <OwnerMobileCard
                key={owner.id}
                owner={owner}
                accountCount={accountCounts[owner.id] || 0}
                onEdit={handleEdit}
                onDelete={onDelete}
              />
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
