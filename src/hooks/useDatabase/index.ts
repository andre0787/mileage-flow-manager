/**
 * Barrel file — reexporta todos os hooks de banco.
 * Compatível com imports existentes (substitui useDatabase.ts).
 */
export { useUserId, useClearAccountDataMutation } from "./shared";
export { useOwnersQuery, useAddOwnerMutation, useUpdateOwnerMutation, useDeleteOwnerMutation } from "./owners";
export { useProgramsQuery, useAddProgramMutation, useUpdateProgramMutation, useDeleteProgramMutation } from "./programs";
export { useOrigemTypesQuery, useAddOrigemTypeMutation, useUpdateOrigemTypeMutation, useDeleteOrigemTypeMutation } from "./origemTypes";
export { useAccountsQuery, useAddAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation } from "./accounts";
export { useEntriesQuery, useAddEntryMutation, useUpdateEntryMutation, useDeleteEntryMutation, useConfirmEntryMutation } from "./entries";
export { useSalesQuery, useAddSaleMutation, useUpdateSaleMutation, useDeleteSaleMutation, useCancelSaleMutation } from "./sales";
export { useClientsQuery, useAddClientMutation, useUpdateClientMutation, useDeleteClientMutation } from "./clients";