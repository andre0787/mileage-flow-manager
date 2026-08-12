import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  useAccountAlerts,
  useAddAccountAlertMutation,
  useToggleAccountAlertMutation,
} from "@/hooks/useDatabase";
import { formatDateBR } from "@/lib/dateUtils";
import type { Account } from "@/types";

interface AccountAlertsDialogProps {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountAlertsDialog({ account, open, onOpenChange }: AccountAlertsDialogProps) {
  const { data: alertas = [] } = useAccountAlerts();
  const addAlertM = useAddAccountAlertMutation();
  const toggleAlertM = useToggleAccountAlertMutation();

  const [date, setDate] = useState("");
  const [observation, setObservation] = useState("");

  const accountAlerts = alertas.filter((a) => a.accountId === account.id);

  const handleAdd = () => {
    if (!date || !observation.trim()) return;
    addAlertM.mutate(
      { accountId: account.id, date, observation: observation.trim() },
      {
        onSuccess: () => {
          setDate("");
          setObservation("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Alertas — {account.name}
          </DialogTitle>
          <DialogDescription>Registre lembretes personalizados para esta conta.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2">
            <label htmlFor="alert-date" className="text-sm font-medium">
              Data
            </label>
            <Input
              id="alert-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="alert-observation" className="text-sm font-medium">
              Observação
            </label>
            <Textarea
              id="alert-observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Renovar clube no dia 15"
              rows={3}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={!date || !observation.trim() || addAlertM.isPending}
            className="w-full"
          >
            Adicionar alerta
          </Button>
        </div>

        <div className="space-y-2 pt-2 border-t">
          {accountAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum alerta para esta conta.
            </p>
          ) : (
            accountAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{formatDateBR(alert.date)}</p>
                  <p className="text-sm text-muted-foreground">{alert.observation}</p>
                  <Badge variant={alert.read ? "secondary" : "default"}>
                    {alert.read ? "Lida" : "Não lido"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Lida</span>
                  <Switch
                    checked={alert.read}
                    onCheckedChange={(checked) =>
                      toggleAlertM.mutate({ id: alert.id, read: checked })
                    }
                    aria-label={`Marcar alerta como ${alert.read ? "não lida" : "lida"}`}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
