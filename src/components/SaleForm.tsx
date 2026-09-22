import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { FormDrawer } from "@/components/FormDrawer";
import { ClientCreationDrawer, type NewClientData } from "@/components/ClientCreationDrawer";
import { todayISODate } from "@/lib/dateUtils";
import { useSaleFormState, emptyForm } from "./sales/form/useSaleFormState";
import { SaleFormCommonFields } from "./sales/form/SaleFormCommonFields";
import { SaleFormMilesFields } from "./sales/form/SaleFormMilesFields";
import { SaleFormServiceFields } from "./sales/form/SaleFormServiceFields";
import type {
  Account,
  Owner,
  Program,
  Client,
  Sale,
  SaleFormData,
  SaleKind,
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
  // formAction is managed via useActionState inside useSaleFormState
  const {
    form,
    setForm,
    update,
    switchKind,
    isClientDialogOpen,
    setIsClientDialogOpen,
    ownersList,
    selectedOwnerStock,
    selectedProgramStock,
    effectiveAvailableMiles,
    additionalCostsTotal,
    profitPreview,
    handlePassengerClientChange,
    formAction,
    canSubmit,
    usedPassengersInCycle,
    newPassengersCount,
    totalPassengersInCycle,
    maxPassengersAllowed,
    passengerLimitExceeded,
  } = useSaleFormState({
    accounts,
    owners,
    programs,
    clients,
    sales,
    onSubmit,
    mode,
    initialData,
    editingSaleId,
  });

  const isServico = form.kind === "servico";

  return (
    <>
      <FormDrawer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) setForm({ ...emptyForm, date: todayISODate() });
          onOpenChange(isOpen);
        }}
        title={mode === "edit" ? "Editar Venda" : "Registrar Nova Venda"}
      >
        <form className="grid gap-4 py-4" action={formAction}>
          {/* Tipo da venda: Milhas | Serviço */}
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

          {!isServico ? (
            <SaleFormMilesFields
              form={form}
              update={update}
              ownersList={ownersList}
              selectedOwnerStock={selectedOwnerStock}
              selectedProgramStock={selectedProgramStock}
              effectiveAvailableMiles={effectiveAvailableMiles}
              additionalCostsTotal={additionalCostsTotal}
              clients={clients}
              handlePassengerClientChange={handlePassengerClientChange}
              passengerLimitExceeded={passengerLimitExceeded}
              maxPassengersAllowed={maxPassengersAllowed}
              usedPassengersInCycle={usedPassengersInCycle}
              newPassengersCount={newPassengersCount}
              totalPassengersInCycle={totalPassengersInCycle}
            />
          ) : null}

          <SaleFormCommonFields
            form={form}
            update={update}
            clients={clients}
            isServico={isServico}
            onOpenClientDialog={() => setIsClientDialogOpen(true)}
          />

          {isServico ? <SaleFormServiceFields form={form} update={update} /> : null}

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

      <ClientCreationDrawer
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        onCreateClient={onCreateClient}
        onClientCreated={({ id, name }) => update({ clientId: id, clientName: name })}
      />
    </>
  );
}
