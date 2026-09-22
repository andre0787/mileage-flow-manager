import { classifyByText, categoryLabel, categoryColor } from "@/lib/auto-classify";
import type { Account, OrigemType, Program } from "@/types";

interface EntryAccountInfoProps {
  selectedAccount: Account;
  origemTypeId: string;
  origemTypes: OrigemType[];
  programs: Program[];
}

export function EntryAccountInfo({
  selectedAccount,
  origemTypeId,
  origemTypes,
  programs,
}: EntryAccountInfoProps) {
  const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? id;

  const ot = origemTypeId ? origemTypes.find((t) => t.id === origemTypeId) : undefined;
  const classification = ot ? classifyByText(ot.name + " " + (ot.description || "")) : null;
  const showClassification = classification && classification.category !== "desconhecido";

  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-1">
      <div>
        <span className="text-muted-foreground">Programa: </span>
        <span className="font-medium">{programName(selectedAccount.programId)}</span>
      </div>
      {showClassification && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Classificação: </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: categoryColor(classification.category) + "20",
              color: categoryColor(classification.category),
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: categoryColor(classification.category) }}
            />
            {categoryLabel(classification.category)}
          </span>
        </div>
      )}
    </div>
  );
}
