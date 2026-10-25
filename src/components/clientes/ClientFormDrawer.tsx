import { FormDrawer } from "@/components/FormDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCPF } from "@/lib/utils";

export interface ClientFormData {
  id?: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  telegram: string;
}

interface ClientFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  formData: ClientFormData;
  setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
  onSubmit: () => void;
  submitLabel: string;
}

export function ClientFormDrawer({
  open,
  onOpenChange,
  title,
  formData,
  setFormData,
  onSubmit,
  submitLabel,
}: ClientFormDrawerProps) {
  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title={title}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="client-name">Nome Completo</Label>
          <Input
            id="client-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Digite o nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-cpf">CPF</Label>
          <Input
            id="client-cpf"
            value={formData.cpf}
            onChange={(e) => setFormData((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }))}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-email">E-mail</Label>
          <Input
            id="client-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="cliente@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-phone">Telefone</Label>
          <Input
            id="client-phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-telegram">Contato Telegram</Label>
          <Input
            id="client-telegram"
            value={formData.telegram}
            onChange={(e) => setFormData((prev) => ({ ...prev, telegram: e.target.value }))}
            placeholder="@usuario"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} className="bg-gradient-primary hover:opacity-90">
          {submitLabel}
        </Button>
      </div>
    </FormDrawer>
  );
}
