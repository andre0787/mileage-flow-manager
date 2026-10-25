import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { FormDrawer } from "@/components/FormDrawer";
import { ClientCreationDrawer, type NewClientData } from "@/components/ClientCreationDrawer";
import { todayISODate } from "@/lib/dateUtils";
import { useSaleFormState, emptyForm } from "./sales/form/useSaleFormState";
import { SaleFormCommonFields } from "./sales/form/SaleFormCommonFields";
import { SaleFormMilesFields } from "./sales/form/SaleFormMilesFields";
import { SaleFormServiceFields } from "./sales/form/SaleFormServiceFields";
import { SaleFormKindToggle } from "./sales/form/SaleFormKindToggle";
import { SaleFormProfitPreview } from "./sales/form/SaleFormProfitPreview";
import type {
  Account,
  Owner,
  Program,
  Client,
  Sale,
  SaleFormData,
  AdditionalCostItem,
} from "@/types";

export type { NewClientData, AdditionalCostItem, SaleFormData };

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
  editingSaleId?: string;
}

export function SaleForm(props: SaleFormProps) {
  const { open, onOpenChange, onCreateClient, mode = "create" } = props;
  const s = useSaleFormState(props);
  const isServico = s.form.kind === "servico";

  return (
    <>
      <FormDrawer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) s.setForm({ ...emptyForm, date: todayISODate() });
          onOpenChange(isOpen);
        }}
        title={mode === "edit" ? "Editar Venda" : "Registrar Nova Venda"}
      >
        <form className="grid gap-4 py-4" action={s.formAction}>
          <SaleFormKindToggle kind={s.form.kind} mode={mode} onSwitchKind={s.switchKind} />

          {!isServico && (
            <SaleFormMilesFields
              form={s.form}
              update={s.update}
              ownersList={s.ownersList}
              selectedOwnerStock={s.selectedOwnerStock}
              selectedProgramStock={s.selectedProgramStock}
              effectiveAvailableMiles={s.effectiveAvailableMiles}
              additionalCostsTotal={s.additionalCostsTotal}
              clients={props.clients}
              handlePassengerClientChange={s.handlePassengerClientChange}
              passengerLimitExceeded={s.passengerLimitExceeded}
              maxPassengersAllowed={s.maxPassengersAllowed}
              usedPassengersInCycle={s.usedPassengersInCycle}
              newPassengersCount={s.newPassengersCount}
              totalPassengersInCycle={s.totalPassengersInCycle}
            />
          )}

          <SaleFormCommonFields
            form={s.form}
            update={s.update}
            clients={props.clients}
            isServico={isServico}
            onOpenClientDialog={() => s.setIsClientDialogOpen(true)}
          />

          {isServico && <SaleFormServiceFields form={s.form} update={s.update} />}

          <SaleFormProfitPreview
            profitPreview={s.profitPreview}
            additionalCostsTotal={s.additionalCostsTotal}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <FormSubmitButton
              className="bg-gradient-primary hover:opacity-90"
              disabled={!s.canSubmit || !!s.passengerLimitExceeded}
            >
              {mode === "edit" ? "Atualizar Venda" : "Registrar Venda"}
            </FormSubmitButton>
          </div>
        </form>
      </FormDrawer>

      <ClientCreationDrawer
        open={s.isClientDialogOpen}
        onOpenChange={s.setIsClientDialogOpen}
        onCreateClient={onCreateClient}
        onClientCreated={({ id, name }) => s.update({ clientId: id, clientName: name })}
      />
    </>
  );
}
