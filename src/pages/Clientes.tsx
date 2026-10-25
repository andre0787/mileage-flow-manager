import { useState, useMemo } from "react";
import { useClientManagement } from "./useClientManagement";
import {
  ClientHeader,
  ClientSearchInput,
  ClientFormDrawer,
  ClientFormData,
  ClientAdvanceDrawer,
  DeleteClientBlockedDialog,
  ClientStatsCards,
  ClientTable,
} from "@/components/clientes";

export default function Clientes() {
  const {
    clients,
    isLoading,
    newClient,
    setNewClient,
    editClientData,
    setEditClientData,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    advanceClient,
    setAdvanceClient,
    advanceForm,
    setAdvanceForm,
    deleteBlocked,
    setDeleteBlocked,
    filteredClients,
    totalPages,
    paginatedClients,
    itemsPerPage,
    handleCreateClient,
    handleEditClient,
    handleSaveEdit,
    handleDeleteClient,
    handleAdvance,
    openAdvanceDrawer,
    advanceM,
  } = useClientManagement();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-appear">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
        </div>
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="h-48 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-appear">
      <ClientHeader onOpenCreate={() => setIsCreateDialogOpen(true)} />

      <ClientFormDrawer
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Cadastrar Novo Cliente"
        formData={newClient}
        setFormData={setNewClient}
        onSubmit={handleCreateClient}
        submitLabel="Cadastrar"
      />

      <ClientFormDrawer
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditClientData(null);
        }}
        title="Editar Cliente"
        formData={editClientData ?? { name: "", cpf: "", email: "", phone: "", telegram: "" }}
        setFormData={setEditClientData as React.Dispatch<React.SetStateAction<ClientFormData>>}
        onSubmit={handleSaveEdit}
        submitLabel="Salvar"
      />

      <ClientAdvanceDrawer
        client={advanceClient}
        onClose={() => setAdvanceClient(null)}
        advanceForm={advanceForm}
        setAdvanceForm={setAdvanceForm}
        onSubmit={handleAdvance}
        isPending={advanceM.isPending}
      />

      <ClientSearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <ClientStatsCards clients={clients} />

      <ClientTable
        filteredClients={filteredClients}
        paginatedClients={paginatedClients}
        searchTerm={searchTerm}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
        onOpenAdvanceDrawer={openAdvanceDrawer}
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
      />

      <DeleteClientBlockedDialog
        open={deleteBlocked.open}
        onOpenChange={(open) => setDeleteBlocked((prev) => ({ ...prev, open }))}
        clientName={deleteBlocked.clientName}
        relatedSales={deleteBlocked.relatedSales}
      />
    </div>
  );
}
