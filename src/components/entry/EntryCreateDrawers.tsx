import { EntryAccountDrawer } from "@/components/entry/EntryAccountDrawer";
import { EntryOrigemTypeDrawer } from "@/components/entry/EntryOrigemTypeDrawer";
import type { OrigemType, Owner, Program } from "@/types";

interface EntryCreateDrawersProps {
  type: "milhas" | "pontos";
  origemTypes: OrigemType[];
  owners: Owner[];
  programs: Program[];
  origemTypeOpen: boolean;
  onOrigemTypeOpenChange: (open: boolean) => void;
  accountOpen: boolean;
  onAccountOpenChange: (open: boolean) => void;
  onOrigemTypeCreated: (id: string) => void;
  onAccountCreated: (id: string) => void;
  onCreateOrigemType?: (data: {
    name: string;
    color: string;
    hasRecurrence: boolean;
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

export function EntryCreateDrawers({
  type,
  origemTypes,
  owners,
  programs,
  origemTypeOpen,
  onOrigemTypeOpenChange,
  accountOpen,
  onAccountOpenChange,
  onOrigemTypeCreated,
  onAccountCreated,
  onCreateOrigemType,
  onCreateAccount,
  onCreateOwner,
  onCreateProgram,
}: EntryCreateDrawersProps) {
  return (
    <>
      <EntryOrigemTypeDrawer
        open={origemTypeOpen}
        onOpenChange={onOrigemTypeOpenChange}
        type={type}
        onCreated={onOrigemTypeCreated}
        onCreate={onCreateOrigemType}
      />
      <EntryAccountDrawer
        open={accountOpen}
        onOpenChange={onAccountOpenChange}
        owners={owners}
        programs={programs}
        onCreated={onAccountCreated}
        onCreate={onCreateAccount}
        onCreateOwner={onCreateOwner}
        onCreateProgram={onCreateProgram}
      />
    </>
  );
}
