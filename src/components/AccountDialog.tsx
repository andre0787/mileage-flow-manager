import { useState } from "react";
import { Plus } from "lucide-react";
import { FormDrawer } from "@/components/FormDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useData } from "@/contexts/DataContext";
import {
  useAddOwnerMutation,
  useAddProgramMutation,
  useAddAccountMutation,
  useUpdateAccountMutation,
} from "@/hooks/useDatabase";
import type { Account } from "@/types";

interface AccountDialogProps {
  mode: "create" | "edit";
  account?: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountDialog({ mode, account, open, onOpenChange }: AccountDialogProps) {
  const { owners, programs } = useData();
  const addOwnerM = useAddOwnerMutation();
  const addProgramM = useAddProgramMutation();
  const addAccountM = useAddAccountMutation();
  const updateAccountM = useUpdateAccountMutation();

  const [name, setName] = useState(account?.name ?? "");
  const [ownerId, setOwnerId] = useState(account?.ownerId ?? "");
  const [programId, setProgramId] = useState(account?.programId ?? "");
  const [type, setType] = useState<"pontos" | "milhas">(account?.type ?? "milhas");
  const [balance, setBalance] = useState(account?.balance ?? 0);
  const [averageCostPerMile, setAverageCostPerMile] = useState<number | undefined>(
    account?.averageCostPerMile,
  );
  const [totalInvested, setTotalInvested] = useState<number | undefined>(account?.totalInvested);
  const [status, setStatus] = useState<"ativa" | "inativa">(account?.status ?? "ativa");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Sub-dialogs
  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false);
  const [programDialogOpen, setProgramDialogOpen] = useState(false);

  // Sub-dialog fields
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerCpf, setNewOwnerCpf] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramType, setNewProgramType] = useState<"pontos" | "milhas">("milhas");

  const formKey = mode === "edit" && account ? account.id : "create";

  const validate = () => {
    const errs: Partial<Record<string, string>> = {};
    if (!name.trim()) errs.name = "Nome é obrigatório";
    if (!ownerId) errs.ownerId = "Selecione um dono";
    if (!programId) errs.programId = "Selecione um programa";
    if (balance < 0) errs.balance = "Saldo não pode ser negativo";
    if (averageCostPerMile != null && averageCostPerMile < 0)
      errs.averageCostPerMile = "Custo/milha não pode ser negativo";
    if (totalInvested != null && totalInvested < 0)
      errs.totalInvested = "Valor investido não pode ser negativo";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      name: name.trim(),
      ownerId,
      programId,
      type,
      balance,
      averageCostPerMile,
      totalInvested,
      status,
    };
    if (mode === "create") {
      addAccountM.mutate({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().split("T")[0],
        ...data,
      });
    } else if (account) {
      updateAccountM.mutate({ id: account.id, ...data });
    }
    onOpenChange(false);
  };

  const handleCreateOwner = () => {
    if (!newOwnerName.trim()) return;
    const id = crypto.randomUUID();
    addOwnerM.mutate(
      { id, name: newOwnerName.trim(), cpf: newOwnerCpf, phone: newOwnerPhone },
      { onSuccess: () => setOwnerId(id) },
    );
    setNewOwnerName("");
    setNewOwnerCpf("");
    setNewOwnerPhone("");
    setOwnerDialogOpen(false);
  };

  const handleCreateProgram = () => {
    if (!newProgramName.trim()) return;
    const id = crypto.randomUUID();
    addProgramM.mutate(
      { id, name: newProgramName.trim(), type: newProgramType },
      { onSuccess: () => setProgramId(id) },
    );
    setNewProgramName("");
    setNewProgramType("milhas");
    setProgramDialogOpen(false);
  };

  return (
    <>
      <FormDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={mode === "create" ? "Criar Nova Conta" : "Editar Conta"}
      >
        <div key={formKey} className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="acc-name">Nome da Conta</Label>
              <Input
                id="acc-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="Ex: Conta Principal LATAM"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Programa</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={programId}
                    onValueChange={(v) => {
                      setProgramId(v);
                      const program = programs.find((p) => p.id === v);
                      if (program) setType(program.type);
                      setErrors((p) => ({ ...p, programId: "" }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o programa" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.type === "pontos" ? "Pontos" : "Milhas"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="min-h-[44px] min-w-[44px]"
                  onClick={() => setProgramDialogOpen(true)}
                  title="Novo programa"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.programId && <p className="text-xs text-destructive">{errors.programId}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select value={type} onValueChange={(v) => setType(v as "pontos" | "milhas")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pontos">Pontos</SelectItem>
                  <SelectItem value="milhas">Milhas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Preenchido automaticamente pelo programa. Pode ser alterado manualmente.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Dono</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={ownerId}
                    onValueChange={(v) => {
                      setOwnerId(v);
                      setErrors((p) => ({ ...p, ownerId: "" }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dono" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="min-h-[44px] min-w-[44px]"
                  onClick={() => setOwnerDialogOpen(true)}
                  title="Novo dono"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.ownerId && <p className="text-xs text-destructive">{errors.ownerId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="acc-balance">Saldo Inicial</Label>
              <Input
                id="acc-balance"
                type="number"
                min="0"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
              />
              {errors.balance && <p className="text-xs text-destructive">{errors.balance}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="acc-cost">Custo/Milha (opcional)</Label>
              <Input
                id="acc-cost"
                type="number"
                min="0"
                step="0.0001"
                value={averageCostPerMile ?? ""}
                onChange={(e) =>
                  setAverageCostPerMile(e.target.value ? Number(e.target.value) : undefined)
                }
              />
              {errors.averageCostPerMile && (
                <p className="text-xs text-destructive">{errors.averageCostPerMile}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="acc-invested">Valor Investido (opcional)</Label>
              <Input
                id="acc-invested"
                type="number"
                min="0"
                value={totalInvested ?? ""}
                onChange={(e) =>
                  setTotalInvested(e.target.value ? Number(e.target.value) : undefined)
                }
              />
              {errors.totalInvested && (
                <p className="text-xs text-destructive">{errors.totalInvested}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="acc-status"
                checked={status === "ativa"}
                onCheckedChange={(c) => setStatus(c ? "ativa" : "inativa")}
              />
              <Label htmlFor="acc-status">Conta Ativa</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{mode === "create" ? "Criar Conta" : "Salvar"}</Button>
          </div>
      </FormDrawer>

      <FormDrawer
        open={ownerDialogOpen}
        onOpenChange={setOwnerDialogOpen}
        title="Novo Dono"
      >
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                placeholder="Nome do dono"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={newOwnerCpf}
                onChange={(e) => setNewOwnerCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={newOwnerPhone}
                onChange={(e) => setNewOwnerPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOwnerDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOwner}>Salvar</Button>
          </div>
      </FormDrawer>

      <FormDrawer
        open={programDialogOpen}
        onOpenChange={setProgramDialogOpen}
        title="Novo Programa"
      >
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newProgramName}
                onChange={(e) => setNewProgramName(e.target.value)}
                placeholder="Nome do programa"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newProgramType}
                onValueChange={(v) => setNewProgramType(v as "pontos" | "milhas")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pontos">Pontos</SelectItem>
                  <SelectItem value="milhas">Milhas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProgramDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProgram}>Salvar</Button>
          </div>
      </FormDrawer>
    </>
  );
}
