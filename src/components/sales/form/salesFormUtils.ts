import { todayISODate } from "@/lib/dateUtils";
import type { Client, SaleFormData, SaleKind } from "@/types";

export const emptyPassenger = () => ({
  name: "",
  passengerId: crypto.randomUUID(),
  cpf: "",
  clientId: undefined as string | undefined,
});

export const emptyForm: SaleFormData = {
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

export interface SwitchKindProps {
  kind: SaleKind;
  update: (partial: Partial<SaleFormData>) => void;
}

export function switchKind({ kind, update }: SwitchKindProps) {
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
}

export interface PassengerClientChangeProps {
  index: number;
  selectedClientId: string;
  clients: Client[];
  passengers: SaleFormData["passengers"];
  update: (partial: Partial<SaleFormData>) => void;
}

export function handlePassengerClientChange({
  index,
  selectedClientId,
  clients,
  passengers,
  update,
}: PassengerClientChangeProps) {
  if (selectedClientId === "__manual__") {
    const upd = passengers.map((p, j) =>
      j === index ? { ...p, clientId: undefined, name: "", cpf: "" } : p,
    );
    update({ passengers: upd });
    return;
  }

  const client = clients.find((c) => c.id === selectedClientId);
  if (!client) return;

  const upd = passengers.map((p, j) =>
    j === index
      ? {
          ...p,
          clientId: client.id,
          name: client.name,
          cpf: client.cpf ?? p.cpf,
        }
      : p,
  );
  update({ passengers: upd });
}
