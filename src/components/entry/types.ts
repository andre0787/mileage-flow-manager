import type { Account, OrigemType, Program, Owner, EntryFormData } from "@/types";

export interface EntryFormProps {
  type: "milhas" | "pontos";
  mode: "create" | "edit";
  initialData?: Partial<EntryFormData>;
  onSubmit: (data: EntryFormData) => void;
  onCancel: () => void;
  accounts: Account[];
  origemTypes: OrigemType[];
  programs: Program[];
  owners: Owner[];
  onCreateOrigemType?: (data: {
    name: string;
    color: string;
    hasRecurrence: boolean;
    accountType?: "pontos" | "milhas";
  }) => Promise<string | undefined>;
  onCreateAccount?: (data: {
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
