import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SaleFormData } from "@/types";

export interface StockInfoItem {
  accountId: string;
  ownerId: string;
  ownerName: string;
  accountName: string;
  programId: string;
  program: string;
  availableMiles: number;
  averageCostPerMile: number;
}

interface SaleFormOwnerAccountProps {
  form: SaleFormData;
  update: (partial: Partial<SaleFormData>) => void;
  ownersList: string[];
  selectedOwnerStock: StockInfoItem[];
  selectedProgramStock?: StockInfoItem;
}

export function SaleFormOwnerAccount({
  form,
  update,
  ownersList,
  selectedOwnerStock,
  selectedProgramStock,
}: SaleFormOwnerAccountProps) {
  return (
    <>
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
                  {s.program} — {s.accountName} ({s.availableMiles.toLocaleString("pt-BR")} milhas)
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
    </>
  );
}
