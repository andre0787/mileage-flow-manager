import type { Client, SaleFormData } from "@/types";
import { SaleFormOwnerAccount, type StockInfoItem } from "./SaleFormOwnerAccount";
import { SaleFormMilesInputs } from "./SaleFormMilesInputs";
import { SaleFormAdditionalCosts } from "./SaleFormAdditionalCosts";
import { SaleFormPassengers } from "./SaleFormPassengers";

interface SaleFormMilesFieldsProps {
  form: SaleFormData;
  update: (partial: Partial<SaleFormData>) => void;
  ownersList: string[];
  selectedOwnerStock: StockInfoItem[];
  selectedProgramStock?: StockInfoItem;
  effectiveAvailableMiles: number;
  additionalCostsTotal: number;
  clients: Client[];
  handlePassengerClientChange: (index: number, selectedClientId: string) => void;
  passengerLimitExceeded: boolean;
  maxPassengersAllowed?: number;
  usedPassengersInCycle: number;
  newPassengersCount: number;
  totalPassengersInCycle: number;
}

export function SaleFormMilesFields({
  form,
  update,
  ownersList,
  selectedOwnerStock,
  selectedProgramStock,
  effectiveAvailableMiles,
  additionalCostsTotal,
  clients,
  handlePassengerClientChange,
  passengerLimitExceeded,
  maxPassengersAllowed,
  usedPassengersInCycle,
  newPassengersCount,
  totalPassengersInCycle,
}: SaleFormMilesFieldsProps) {
  return (
    <>
      <SaleFormOwnerAccount
        form={form}
        update={update}
        ownersList={ownersList}
        selectedOwnerStock={selectedOwnerStock}
        selectedProgramStock={selectedProgramStock}
      />

      <SaleFormMilesInputs
        form={form}
        update={update}
        selectedProgramStock={selectedProgramStock}
        effectiveAvailableMiles={effectiveAvailableMiles}
      />

      <SaleFormAdditionalCosts
        additionalCosts={form.additionalCosts}
        update={update}
        additionalCostsTotal={additionalCostsTotal}
      />

      <SaleFormPassengers
        passengers={form.passengers}
        clients={clients}
        update={update}
        handlePassengerClientChange={handlePassengerClientChange}
        passengerLimitExceeded={passengerLimitExceeded}
        maxPassengersAllowed={maxPassengersAllowed}
        usedPassengersInCycle={usedPassengersInCycle}
        newPassengersCount={newPassengersCount}
        totalPassengersInCycle={totalPassengersInCycle}
      />
    </>
  );
}
