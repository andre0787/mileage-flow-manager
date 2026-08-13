import { useState } from "react";
import { FormDrawer } from "@/components/FormDrawer";
import { AccountDrawerFields, type NewAccountState } from "@/components/entry/AccountDrawerFields";
import { DrawerFooter } from "@/components/entry/DrawerFooter";
import { EntryOwnerDrawer } from "@/components/entry/EntryOwnerDrawer";
import { EntryProgramDrawer } from "@/components/entry/EntryProgramDrawer";
import type { Owner, Program } from "@/types";

interface EntryAccountDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: Owner[];
  programs: Program[];
  onCreated: (id: string) => void;
  onCreate?: (data: {
    name: string;
    ownerId: string;
    programId: string;
  }) => Promise<string | undefined>;
  onCreateOwner?: (data: {
    name: string;
    cpf?: string;
    phone?: string;
  }) => Promise<string | undefined>;
  onCreateProgram?: (data: {
    name: string;
    type: "pontos" | "milhas";
  }) => Promise<string | undefined>;
}

const EMPTY_ACCOUNT: NewAccountState = { name: "", ownerId: "", programId: "" };

export function EntryAccountDrawer({
  open,
  onOpenChange,
  owners,
  programs,
  onCreated,
  onCreate,
  onCreateOwner,
  onCreateProgram,
}: EntryAccountDrawerProps) {
  const [value, setValue] = useState<NewAccountState>(EMPTY_ACCOUNT);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isOwnerOpen, setIsOwnerOpen] = useState(false);
  const [isProgramOpen, setIsProgramOpen] = useState(false);

  const patch = (p: Partial<NewAccountState>) => {
    setValue((prev) => ({ ...prev, ...p }));
    if (p.name) setErrors((prev) => ({ ...prev, name: "" }));
    if (p.ownerId) setErrors((prev) => ({ ...prev, ownerId: "" }));
    if (p.programId) setErrors((prev) => ({ ...prev, programId: "" }));
  };

  const handleCreate = async () => {
    const errs: typeof errors = {};
    if (!value.name.trim()) errs.name = "Nome é obrigatório";
    if (!value.ownerId) errs.ownerId = "Selecione um dono";
    if (!value.programId) errs.programId = "Selecione um programa";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsCreating(true);
    try {
      const id = await onCreate?.({
        name: value.name.trim(),
        ownerId: value.ownerId,
        programId: value.programId,
      });
      if (id) onCreated(id);
      setValue(EMPTY_ACCOUNT);
      setErrors({});
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <FormDrawer
        open={open}
        onOpenChange={(o) => {
          onOpenChange(o);
          if (!o) setErrors({});
        }}
        title="Nova Conta"
      >
        <AccountDrawerFields
          value={value}
          onChange={patch}
          errors={errors}
          owners={owners}
          programs={programs}
          onOpenOwner={() => setIsOwnerOpen(true)}
          onOpenProgram={() => setIsProgramOpen(true)}
        />
        <DrawerFooter
          isCreating={isCreating}
          onCancel={() => onOpenChange(false)}
          onSubmit={handleCreate}
        />
      </FormDrawer>

      <EntryOwnerDrawer
        open={isOwnerOpen}
        onOpenChange={setIsOwnerOpen}
        onCreated={(id) => patch({ ownerId: id })}
        onCreate={onCreateOwner}
      />
      <EntryProgramDrawer
        open={isProgramOpen}
        onOpenChange={setIsProgramOpen}
        onCreated={(id) => patch({ programId: id })}
        onCreate={onCreateProgram}
      />
    </>
  );
}
