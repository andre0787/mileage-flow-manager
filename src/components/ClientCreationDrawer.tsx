import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/FormDrawer";
import { formatCPF } from "@/lib/utils";

export interface NewClientData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  telegram: string;
}

export interface ClientCreationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateClient: (data: NewClientData & { id: string }) => Promise<void>;
  onClientCreated: (client: { id: string; name: string }) => void;
}

const emptyNewClient: NewClientData = {
  name: "",
  cpf: "",
  email: "",
  phone: "",
  telegram: "",
};

export function ClientCreationDrawer({
  open,
  onOpenChange,
  onCreateClient,
  onClientCreated,
}: ClientCreationDrawerProps) {
  const [newClient, setNewClient] = useState<NewClientData>(emptyNewClient);
  const [clientErrors, setClientErrors] = useState<Partial<Record<string, string>>>({});

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setClientErrors({});
      setNewClient(emptyNewClient);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      setClientErrors({ name: "Nome é obrigatório" });
      return;
    }
    const id = crypto.randomUUID();
    const clientName = newClient.name.trim();
    await onCreateClient({ id, ...newClient, name: clientName });
    onClientCreated({ id, name: clientName });
    setNewClient(emptyNewClient);
    setClientErrors({});
    handleOpenChange(false);
  };

  return (
    <FormDrawer open={open} onOpenChange={handleOpenChange} title="Novo Cliente">
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Nome Completo</Label>
          <Input
            value={newClient.name}
            onChange={(e) => {
              setNewClient((p) => ({ ...p, name: e.target.value }));
              setClientErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="Digite o nome completo"
          />
          {clientErrors.name && <p className="text-xs text-destructive">{clientErrors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label>CPF</Label>
          <Input
            value={newClient.cpf}
            onChange={(e) =>
              setNewClient((p) => ({
                ...p,
                cpf: formatCPF(e.target.value.replace(/\D/g, "").slice(0, 11)),
              }))
            }
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input
            type="email"
            value={newClient.email}
            onChange={(e) => setNewClient((p) => ({ ...p, email: e.target.value }))}
            placeholder="cliente@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            value={newClient.phone}
            onChange={(e) => setNewClient((p) => ({ ...p, phone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="space-y-2">
          <Label>Contato Telegram</Label>
          <Input
            value={newClient.telegram}
            onChange={(e) => setNewClient((p) => ({ ...p, telegram: e.target.value }))}
            placeholder="@usuario"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleCreateClient}
          className="bg-gradient-primary hover:opacity-90"
        >
          Cadastrar
        </Button>
      </div>
    </FormDrawer>
  );
}
