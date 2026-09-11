import { useActionState, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDrawer } from "@/components/FormDrawer";
import { ClientCreationDrawer, type NewClientData } from "@/components/ClientCreationDrawer";
import { isValidISODate, todayISODate } from "@/lib/dateUtils";
import { calcProfit, calcProfitMargin } from "@/lib/metrics";
import { countPassengersInCycle } from "@/lib/passengerCycle";
import type { Account, Owner, Program, Client, Sale, SaleKind, ServiceType } from "@/types";

export type { NewClientData };

export interface AdditionalCostItem {
  desc: string;
  amount: string;
}

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
  /** Lista dinâmica de custos adicionais (novo) — soma vai para additionalCost por compat */
  additionalCosts?: AdditionalCostItem[];
  /** Discriminador milhas|servico (modo do formulário) */
  kind: SaleKind;
  /** Tipo de serviço — só no modo servico */
  serviceType?: string;
  /** Observações livres — só no modo servico */
  observations?: string;
  /** Data da venda (YYYY-MM-DD) — obrigatória nos dois modos, default hoje */
  date: string;
  ticketLocator: string;
  passengers: { name: string; passengerId: string; cpf: string; clientId?: string }[];
  /** Preenchido automaticamente no submit a partir do averageCostPerMile da conta */
  costPerMile?: number;
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
  /** ID da venda em edição — excluída do cálculo do ciclo de passageiros (dupla contagem) */
  editingSaleId?: string;
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
  additionalCosts: [{ desc: "", amount: "" }],
  kind: "milhas",
  serviceType: "",
  observations: "",
  date: todayISODate(),
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
  editingSaleId,
}: SaleFormProps) {
  const [form, setForm] = useState<SaleFormData>(() => {
    const base = { ...emptyForm, ...initialData };
    // Normaliza lista dinâmica a partir do legado (um custo) quando necessário
    if (!base.additionalCosts || base.additionalCosts.length === 0) {
      base.additionalCosts =
        base.additionalCost || base.additionalCostDesc
          ? [{ amount: base.additionalCost, desc: base.additionalCostDesc }]
          : [{ desc: "", amount: "" }];
    }
    return base;
  });
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

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
  // Edição: as milhas da própria venda já foram debitadas do estoque —
  // devolve-as ao limite de validação quando a conta não foi trocada.
  // Venda cancelada não teve milhas debitadas (reversal) — sem add-back.
  const editingOriginalSale = useMemo(
    () =>
      mode === "edit" && editingSaleId ? sales.find((s) => s.id === editingSaleId) : undefined,
    [mode, editingSaleId, sales],
  );
  const effectiveAvailableMiles = useMemo(() => {
    const base = selectedProgramStock?.availableMiles ?? 0;
    if (
      mode === "edit" &&
      editingOriginalSale &&
      editingOriginalSale.status !== "cancelado" &&
      form.accountId &&
      form.accountId === editingOriginalSale.accountId
    ) {
      return base + editingOriginalSale.milesUsed;
    }
    return base;
  }, [mode, editingOriginalSale, form.accountId, selectedProgramStock]);
  const programConfig = useMemo(
    () => programs.find((p) => p.id === selectedProgramStock?.programId),
    [programs, selectedProgramStock],
  );

  // Passenger cycle validation (limite por dono: vendas de outros donos não somam)
  const usedPassengersInCycle = useMemo(() => {
    if (!programConfig?.passengerCycleType || !programConfig?.maxPassengers) return 0;
    return countPassengersInCycle(sales, {
      program: form.program,
      ownerName: form.ownerName,
      editingSaleId,
      cycleType: programConfig.passengerCycleType,
      cycleDays: programConfig.passengerCycleDays,
    });
  }, [sales, form.program, form.ownerName, programConfig, editingSaleId]);

  // Soma dos custos adicionais dinâmicos (fallback para o campo legado)
  const additionalCostsTotal = useMemo(() => {
    if (form.additionalCosts && form.additionalCosts.length > 0) {
      const sum = form.additionalCosts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
      // Se a lista está vazia/zerada, respeita o legado para compat
      if (sum > 0) return sum;
    }
    return parseFloat(form.additionalCost || "0") || 0;
  }, [form.additionalCosts, form.additionalCost]);

  // Profit preview usando calcProfit / calcProfitMargin
  // Serviço: receita pura (lucro = valor, margem 100%).
  const profitPreview = useMemo(() => {
    if (form.kind === "servico") {
      const val = parseFloat(form.saleValue);
      if (!val || val <= 0) return null;
      return { costTotal: 0, profit: val, margin: 100 };
    }
    if (!form.milesUsed || !form.saleValue || !selectedProgramStock) return null;
    const miles = parseFloat(form.milesUsed);
    const val = parseFloat(form.saleValue);
    const addCost = additionalCostsTotal;
    const costPM = selectedProgramStock.averageCostPerMile;
    const profit = calcProfit(val, miles, costPM, addCost);
    return { costTotal: miles * costPM, profit, margin: calcProfitMargin(profit, val) };
  }, [form.milesUsed, form.saleValue, additionalCostsTotal, selectedProgramStock]);

  const update = (partial: Partial<SaleFormData>) => setForm((prev) => ({ ...prev, ...partial }));

  const isServico = form.kind === "servico";

  // Troca de modo limpa os campos do outro modo (evita payload misto).
  // No modo edit o toggle é desabilitado (kind é imutável — server rejeita).
  const switchKind = (kind: SaleKind) => {
    if (kind === "servico") {
      update({
        kind,
        ownerName: "",
        accountId: "",
        accountName: "",
        program: "",
        milesUsed: "",
        pricePerMile: "",
        additionalCost: "",
        additionalCostDesc: "",
        additionalCosts: [],
        ticketLocator: "",
        passengers: [],
      });
    } else {
      update({ kind, serviceType: "", observations: "" });
    }
  };

  // React 19 form action (rule-45): submit via <form action> — o botão deriva
  // pending de useFormStatus, sem estado de carregamento manual.
  const [, formAction] = useActionState(
    async () => {
      // Sincroniza legado (soma) para compat com API antiga + envia lista dinâmica
      const costs = (form.additionalCosts ?? []).filter(
        (c) => (c.desc.trim() || c.amount.trim()) && parseFloat(c.amount) > 0,
      );
      const total = costs.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
      onSubmit({
        ...form,
        observations: (form.observations ?? "").trim(),
        additionalCosts: form.kind === "servico" ? [] : costs,
        additionalCost: total ? total.toFixed(2) : "",
        additionalCostDesc: costs[0]?.desc ?? "",
        costPerMile: selectedProgramStock?.averageCostPerMile ?? 0,
      });
      setForm({ ...emptyForm, date: todayISODate() });
      return { ok: true };
    },
    { ok: false },
  );


  const hasValidDate = isValidISODate(form.date);
  const canSubmitServico =
    form.clientId && form.serviceType && parseFloat(form.saleValue) > 0 && hasValidDate;
  const canSubmitMiles =
    form.ownerName &&
    form.accountId &&
    form.program &&
    form.clientId &&
    form.milesUsed &&
    form.saleValue &&
    hasValidDate &&
    (!selectedProgramStock || parseFloat(form.milesUsed) <= effectiveAvailableMiles);
  const canSubmit = form.kind === "servico" ? canSubmitServico : canSubmitMiles;

  const passengerLimitExceeded =
    programConfig?.maxPassengers &&
    usedPassengersInCycle + form.passengers.filter((p) => p.name.trim()).length >
      programConfig.maxPassengers;

  return (
    <>
      <FormDrawer
        open={open}
        onOpenChange={(open) => {
          if (!open) setForm({ ...emptyForm, date: todayISODate() });
          onOpenChange(open);
        }}
        title={mode === "edit" ? "Editar Venda" : "Registrar Nova Venda"}
      >
        <form className="grid gap-4 py-4" action={formAction}>
          {/* Tipo da venda: Milhas | Serviço (imutável no edit) */}
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo da venda">
            {(
              [
                { value: "milhas", label: "Milhas" },
                { value: "servico", label: "Serviço" },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={form.kind === opt.value ? "default" : "outline"}
                className="min-h-[44px]"
                disabled={mode === "edit"}
                title={mode === "edit" ? "Tipo da venda não pode ser alterado" : undefined}
                onClick={() => switchKind(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          {/* Owner + Account (só milhas) */}
          {!isServico && (
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
          )}

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
                  aria-label="Novo cliente"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {!isServico && (
              <div className="space-y-2">
                <Label>Localizador do Bilhete</Label>
                <Input
                  value={form.ticketLocator}
                  onChange={(e) => update({ ticketLocator: e.target.value })}
                  placeholder="Ex: ABC123"
                />
              </div>
            )}
          </div>

          {/* Data da venda (obrigatória nos dois modos) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da venda</Label>
              <Input
                type="date"
                required
                value={form.date}
                max={todayISODate()}
                onChange={(e) => update({ date: e.target.value })}
                aria-label="Data da venda"
              />
              {form.date.trim() !== "" && !isValidISODate(form.date) && (
                <p className="text-xs text-destructive">Informe uma data válida.</p>
              )}
            </div>
          </div>

          {/* Miles + Price + Value (só milhas) */}
          {!isServico && (
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
                  max={selectedProgramStock ? effectiveAvailableMiles : undefined}
                />
                {selectedProgramStock && (
                  <p className="text-xs text-muted-foreground">
                    Estoque: {selectedProgramStock.availableMiles.toLocaleString("pt-BR")} milhas
                  </p>
                )}
                {form.milesUsed &&
                  selectedProgramStock &&
                  parseFloat(form.milesUsed) > effectiveAvailableMiles && (
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
          )}

          {/* Custos Adicionais dinâmicos (só milhas) */}
          {!isServico && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Custos Adicionais</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() =>
                    update({
                      additionalCosts: [...(form.additionalCosts ?? []), { desc: "", amount: "" }],
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar custo
                </Button>
              </div>
              {(form.additionalCosts ?? []).map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={c.amount}
                    onChange={(e) =>
                      update({
                        additionalCosts: (form.additionalCosts ?? []).map((x, j) =>
                          j === i ? { ...x, amount: e.target.value } : x,
                        ),
                      })
                    }
                    placeholder="Ex: 50.00"
                    aria-label={`Valor do custo adicional ${i + 1}`}
                  />
                  <Input
                    value={c.desc}
                    onChange={(e) =>
                      update({
                        additionalCosts: (form.additionalCosts ?? []).map((x, j) =>
                          j === i ? { ...x, desc: e.target.value } : x,
                        ),
                      })
                    }
                    placeholder="Ex: Taxa de embarque"
                    aria-label={`Descrição do custo adicional ${i + 1}`}
                  />
                  {(form.additionalCosts ?? []).length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] min-w-[44px]"
                      onClick={() =>
                        update({
                          additionalCosts: (form.additionalCosts ?? []).filter((_, j) => j !== i),
                        })
                      }
                      aria-label={`Remover custo adicional ${i + 1}`}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {additionalCostsTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total adicional: R$ {additionalCostsTotal.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Serviço: tipo + valor + observações */}
          {isServico && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de serviço</Label>
                  <Select
                    value={form.serviceType}
                    onValueChange={(v) => update({ serviceType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultoria">Consultoria</SelectItem>
                      <SelectItem value="taxa">Taxa de embarque</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.saleValue}
                    onChange={(e) => update({ saleValue: e.target.value })}
                    placeholder="Ex: 500.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={form.observations}
                  onChange={(e) => update({ observations: e.target.value.slice(0, 500) })}
                  placeholder="Ex: Sessão de consultoria de 2h sobre..."
                  maxLength={500}
                />
              </div>
            </>
          )}

          {/* Profit Preview via calcProfit / calcProfitMargin (DRY) */}
          {profitPreview && (
            <div className="p-3 bg-success-light rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Cálculo de Lucro:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Custo total:</span>
                  <p className="font-semibold">R$ {profitPreview.costTotal.toFixed(2)}</p>
                </div>
                {additionalCostsTotal > 0 && (
                  <div>
                    <span className="text-muted-foreground">Custos adicionais:</span>
                    <p className="font-semibold text-destructive">
                      R$ {additionalCostsTotal.toFixed(2)}
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

          {/* Passengers (só milhas) */}
          {!isServico && (
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
          )}

          {passengerLimitExceeded && (
            <p className="text-xs text-destructive">
              Limite de {programConfig!.maxPassengers} passageiros excedido para este ciclo. Usados:{" "}
              {usedPassengersInCycle} + {form.passengers.filter((p) => p.name.trim()).length}{" "}
              novo(s) ={" "}
              {usedPassengersInCycle + form.passengers.filter((p) => p.name.trim()).length}
            </p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <FormSubmitButton
              className="bg-gradient-primary hover:opacity-90"
              disabled={!canSubmit || !!passengerLimitExceeded}
            >
              {mode === "edit" ? "Atualizar Venda" : "Registrar Venda"}
            </FormSubmitButton>
          </div>
        </form>
      </FormDrawer>

      {/* Client creation dialog */}
      <ClientCreationDrawer
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        onCreateClient={onCreateClient}
        onClientCreated={({ id, name }) => update({ clientId: id, clientName: name })}
      />
    </>
  );
}
