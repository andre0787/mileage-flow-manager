import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDrawer } from "@/components/FormDrawer";
import { formatCPF } from "@/lib/utils";
import { calcProfit, calcProfitMargin } from "@/lib/metrics";
import type { Account, Owner, Program, Client, Sale } from "@/types";

export interface SaleFormData {
  ownerName: string;
  accountId: string;
  accountName: string;
  program: string;
  clientId: string;
  clientName: string;
  milesUsed: string;
  pricePerMile: string;
  saleValue: string;
  additionalCost: string;
  additionalCostDesc: string;
  ticketLocator: string;
  passengers: { name: string; passengerId: string; cpf: string; clientId?: string }[];
  /** Preenchido automaticamente no submit a partir do averageCostPerMile da conta */
  costPerMile?: number;
}

interface NewClientData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  telegram: string;
}

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  owners: Owner[];
  programs: Program[];
  clients: Client[];
  sales: Sale[];
  onSubmit: (data: SaleFormData) => void;
  onCreateClient: (data: NewClientData & { id: string }) => Promise<void>;
  mode?: "create" | "edit";
  initialData?: SaleFormData;
}

const emptyPassenger = () => ({
  name: "",
  passengerId: crypto.randomUUID(),
  cpf: "",
  clientId: undefined as string | undefined,
});

const emptyForm: SaleFormData = {
  ownerName: "",
  accountId: "",
  accountName: "",
  program: "",
  clientId: "",
  clientName: "",
  milesUsed: "",
  pricePerMile: "",
  saleValue: "",
  additionalCost: "",
  additionalCostDesc: "",
  ticketLocator: "",
  passengers: [emptyPassenger()],
};

export function SaleForm({
  open,
  onOpenChange,
  accounts,
  owners,
  programs,
  clients,
  sales,
  onSubmit,
  onCreateClient,
  mode = "create",
  initialData,
}: SaleFormProps) {
  const [form, setForm] = useState<SaleFormData>({ ...emptyForm, ...initialData });
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<NewClientData>({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    telegram: "",
  });
  const [clientErrors, setClientErrors] = useState<Partial<Record<string, string>>>({});

  // Derived data
  const stockInfo = useMemo(
    () =>
      accounts
        .filter((a) => a.type === "milhas" && a.status === "ativa")
        .map((a) => ({
          accountId: a.id,
          ownerId: a.ownerId,
          ownerName: owners.find((o) => o.id === a.ownerId)?.name ?? "",
          accountName: a.name,
          programId: a.programId,
          program: programs.find((p) => p.id === a.programId)?.name ?? "",
          availableMiles: a.balance,
          averageCostPerMile: a.averageCostPerMile ?? 0,
        })),
    [accounts, owners, programs],
  );

  const ownersList = useMemo(() => [...new Set(stockInfo.map((s) => s.ownerName))], [stockInfo]);
  const selectedOwnerStock = useMemo(
    () => stockInfo.filter((s) => s.ownerName === form.ownerName),
    [stockInfo, form.ownerName],
  );
  const selectedProgramStock = useMemo(
    () => stockInfo.find((s) => s.accountId === form.accountId),
    [stockInfo, form.accountId],
  );
  const programConfig = useMemo(
    () => programs.find((p) => p.id === selectedProgramStock?.programId),
    [programs, selectedProgramStock],
  );

  // Passenger cycle validation
  const usedPassengersInCycle = useMemo(() => {
    if (!programConfig?.passengerCycleType || !programConfig?.maxPassengers) return 0;
    let relevant = sales.filter((s) => s.program === form.program);
    if (programConfig.passengerCycleType === "anual") {
      const year = new Date().getFullYear();
      relevant = relevant.filter((s) => new Date(s.date).getFullYear() === year);
    } else if (programConfig.passengerCycleType === "dias" && programConfig.passengerCycleDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - programConfig.passengerCycleDays);
      cutoff.setHours(0, 0, 0, 0);
      relevant = relevant.filter((s) => new Date(s.date) >= cutoff);
    }
    return relevant.reduce((sum, s) => sum + s.passengers.length, 0);
  }, [sales, form.program, programConfig]);

  // Profit preview usando calcProfit / calcProfitMargin
  const profitPreview = useMemo(() => {
    if (!form.milesUsed || !form.saleValue || !selectedProgramStock) return null;
    const miles = parseFloat(form.milesUsed);
    const val = parseFloat(form.saleValue);
    const addCost = parseFloat(form.additionalCost || "0");
    const costPM = selectedProgramStock.averageCostPerMile;
    const profit = calcProfit(val, miles, costPM, addCost);
    return { costTotal: miles * costPM, profit, margin: calcProfitMargin(profit, val) };
  }, [form.milesUsed, form.saleValue, form.additionalCost, selectedProgramStock]);

  const update = (partial: Partial<SaleFormData>) => setForm((prev) => ({ ...prev, ...partial }));

  const handleSubmit = () => {
    // Preenche costPerMile automaticamente do estoque selecionado
    onSubmit({ ...form, costPerMile: selectedProgramStock?.averageCostPerMile ?? 0 });
    setForm(emptyForm);
  };

  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      setClientErrors({ name: "Nome é obrigatório" });
      return;
    }
    const id = crypto.randomUUID();
    await onCreateClient({ id, ...newClient });
    update({ clientId: id, clientName: newClient.name.trim() });
    setNewClient({ name: "", cpf: "", email: "", phone: "", telegram: "" });
    setClientErrors({});
    setIsClientDialogOpen(false);
  };

  const canSubmit =
    form.ownerName &&
    form.accountId &&
    form.program &&
    form.clientId &&
    form.milesUsed &&
    form.saleValue &&
    (!selectedProgramStock || parseFloat(form.milesUsed) <= selectedProgramStock.availableMiles);

  const passengerLimitExceeded =
    programConfig?.maxPassengers &&
    usedPassengersInCycle + form.passengers.filter((p) => p.name.trim()).length >
      programConfig.maxPassengers;

  return (
    <>
      <FormDrawer
        open={open}
        onOpenChange={(open) => {
          if (!open) setForm(emptyForm);
          onOpenChange(open);
        }}
        title={mode === "edit" ? "Editar Venda" : "Registrar Nova Venda"}
      >
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Owner + Account */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dono da Conta</Label>
              <Select
                value={form.ownerName}
                onValueChange={(v) =>
                  update({ ownerName: v, accountId: "", accountName: "", program: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dono" />
                </SelectTrigger>
                <SelectContent>
                  {ownersList.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta / Programa</Label>
              <Select
                value={form.accountId}
                onValueChange={(v) => {
                  const s = selectedOwnerStock.find((x) => x.accountId === v);
                  update({
                    accountId: v,
                    accountName: s?.accountName ?? "",
                    program: s?.program ?? "",
                  });
                }}
                disabled={!form.ownerName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {selectedOwnerStock.map((s) => (
                    <SelectItem key={s.accountId} value={s.accountId}>
                      {s.program} — {s.accountName} ({s.availableMiles.toLocaleString("pt-BR")}{" "}
                      milhas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock info */}
          {selectedProgramStock && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Informações do Estoque:</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Milhas disponíveis:</span>
                  <p className="font-semibold">
                    {selectedProgramStock.availableMiles.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Custo médio por milha:</span>
                  <p className="font-semibold">
                    R$ {selectedProgramStock.averageCostPerMile.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Client + Locator */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={form.clientId}
                    onValueChange={(v) => {
                      const c = clients.find((x) => x.id === v);
                      update({ clientId: v, clientName: c?.name || "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsClientDialogOpen(true)}
                  title="Novo cliente"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localizador do Bilhete</Label>
              <Input
                value={form.ticketLocator}
                onChange={(e) => update({ ticketLocator: e.target.value })}
                placeholder="Ex: ABC123"
              />
            </div>
          </div>

          {/* Miles + Price + Value (grid 3 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Milhas Utilizadas</Label>
              <Input
                type="number"
                value={form.milesUsed}
                onChange={(e) => {
                  const v = e.target.value;
                  update(
                    v && form.pricePerMile
                      ? {
                          milesUsed: v,
                          saleValue: (parseFloat(v) * parseFloat(form.pricePerMile)).toFixed(2),
                        }
                      : { milesUsed: v },
                  );
                }}
                placeholder="Ex: 50000"
                max={selectedProgramStock?.availableMiles}
              />
              {selectedProgramStock && (
                <p className="text-xs text-muted-foreground">
                  Estoque: {selectedProgramStock.availableMiles.toLocaleString("pt-BR")} milhas
                </p>
              )}
              {form.milesUsed &&
                selectedProgramStock &&
                parseFloat(form.milesUsed) > selectedProgramStock.availableMiles && (
                  <p className="text-xs text-destructive">
                    Quantidade superior ao estoque disponível
                  </p>
                )}
            </div>
            <div className="space-y-2">
              <Label>Valor por Milha (R$)</Label>
              <Input
                type="number"
                step="0.0001"
                value={form.pricePerMile}
                onChange={(e) => {
                  const v = e.target.value;
                  update(
                    v && form.milesUsed
                      ? {
                          pricePerMile: v,
                          saleValue: (parseFloat(v) * parseFloat(form.milesUsed)).toFixed(2),
                        }
                      : { pricePerMile: v },
                  );
                }}
                placeholder="Ex: 0.03"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor da Venda (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.saleValue}
                onChange={(e) => update({ saleValue: e.target.value })}
                placeholder="Ex: 300.00"
              />
              {form.pricePerMile && form.milesUsed && (
                <p className="text-xs text-muted-foreground">
                  {parseFloat(form.milesUsed).toLocaleString("pt-BR")} × R${" "}
                  {parseFloat(form.pricePerMile).toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Additional Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Custo Adicional (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.additionalCost}
                onChange={(e) => update({ additionalCost: e.target.value })}
                placeholder="Ex: 50.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Observação do Custo</Label>
              <Input
                value={form.additionalCostDesc}
                onChange={(e) => update({ additionalCostDesc: e.target.value })}
                placeholder="Ex: Taxa de embarque"
              />
            </div>
          </div>

          {/* Profit Preview via calcProfit / calcProfitMargin (DRY) */}
          {profitPreview && (
            <div className="p-3 bg-success-light rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Cálculo de Lucro:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Custo total:</span>
                  <p className="font-semibold">R$ {profitPreview.costTotal.toFixed(2)}</p>
                </div>
                {form.additionalCost && parseFloat(form.additionalCost) > 0 && (
                  <div>
                    <span className="text-muted-foreground">Custo adicional:</span>
                    <p className="font-semibold text-destructive">
                      R$ {parseFloat(form.additionalCost).toFixed(2)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Lucro:</span>
                  <p className="font-semibold text-success">R$ {profitPreview.profit.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Margem:</span>
                  <p className="font-semibold">{profitPreview.margin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Passengers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Passageiros no Bilhete</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-[44px]"
                onClick={() => update({ passengers: [...form.passengers, emptyPassenger()] })}
              >
                Adicionar
              </Button>
            </div>
            {form.passengers.map((p, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2">
                <Select
                  value={p.clientId ?? ""}
                  onValueChange={(v) => {
                    if (v === "__manual__") {
                      const upd = form.passengers.map((x, j) =>
                        j === i ? { ...x, clientId: undefined, name: "", cpf: "" } : x,
                      );
                      update({ passengers: upd });
                    } else {
                      const client = clients.find((c) => c.id === v);
                      if (client) {
                        const upd = form.passengers.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                clientId: client.id,
                                name: client.name,
                                cpf: client.cpf ?? x.cpf,
                              }
                            : x,
                        );
                        update({ passengers: upd });
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-24 text-xs">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__manual__">— Manual —</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Nome completo"
                  value={p.name}
                  onChange={(e) =>
                    update({
                      passengers: form.passengers.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    })
                  }
                />
                <Input
                  placeholder="ID Passageiro"
                  value={p.passengerId}
                  disabled
                  className="bg-muted/30 text-muted-foreground text-xs"
                />
                <Input
                  placeholder="CPF"
                  value={p.cpf}
                  onChange={(e) =>
                    update({
                      passengers: form.passengers.map((x, j) =>
                        j === i ? { ...x, cpf: e.target.value } : x,
                      ),
                    })
                  }
                />
                {form.passengers.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] min-w-[44px]"
                    onClick={() =>
                      update({ passengers: form.passengers.filter((_, j) => j !== i) })
                    }
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>

          {passengerLimitExceeded && (
            <p className="text-xs text-destructive">
              Limite de {programConfig!.maxPassengers} passageiros excedido para este ciclo. Usados:{" "}
              {usedPassengersInCycle} + {form.passengers.filter((p) => p.name.trim()).length}{" "}
              novo(s) ={" "}
              {usedPassengersInCycle + form.passengers.filter((p) => p.name.trim()).length}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-primary hover:opacity-90"
            disabled={!canSubmit || !!passengerLimitExceeded}
          >
            {mode === "edit" ? "Atualizar Venda" : "Registrar Venda"}
          </Button>
        </div>
      </FormDrawer>

      {/* Client creation dialog */}
      <FormDrawer
        open={isClientDialogOpen}
        onOpenChange={(open) => {
          setIsClientDialogOpen(open);
          if (!open) setClientErrors({});
        }}
        title="Novo Cliente"
      >
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
          <Button
            variant="outline"
            onClick={() => {
              setIsClientDialogOpen(false);
              setClientErrors({});
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreateClient} className="bg-gradient-primary hover:opacity-90">
            Cadastrar
          </Button>
        </div>
      </FormDrawer>
    </>
  );
}
