import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useData } from "@/contexts/DataContext";
import {
  useAddClientMutation,
  useAddClientAdvanceMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "@/hooks/useDatabase";
import { todayISODate } from "@/lib/dateUtils";
import { RelatedSaleInfo } from "@/components/clientes";
import { Client } from "@/types";
import { useClientForms } from "./useClientForms";

const ITEMS_PER_PAGE = 20;

export function useClientManagement() {
  const { clients, sales, isLoading } = useData();

  const addClientM = useAddClientMutation();
  const advanceM = useAddClientAdvanceMutation();
  const updateClientM = useUpdateClientMutation();
  const deleteClientM = useDeleteClientMutation();

  const forms = useClientForms();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [advanceClient, setAdvanceClient] = useState<{ id: string; name: string } | null>(null);
  const [advanceForm, setAdvanceForm] = useState({ amount: "", note: "", date: todayISODate() });
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [deleteBlocked, setDeleteBlocked] = useState<{
    open: boolean;
    clientName: string;
    relatedSales: RelatedSaleInfo[];
  }>({ open: false, clientName: "", relatedSales: [] });

  const filteredClients = useMemo(() => {
    if (!debouncedSearch) return clients;
    const q = debouncedSearch.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        (client.cpf && client.cpf.includes(q)) ||
        (client.email && client.email.toLowerCase().includes(q)),
    );
  }, [clients, debouncedSearch]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleCreateClient = () => {
    if (forms.newClient.name) {
      addClientM.mutate({
        id: crypto.randomUUID(),
        name: forms.newClient.name,
        cpf: forms.newClient.cpf,
        email: forms.newClient.email,
        phone: forms.newClient.phone,
        telegram: forms.newClient.telegram,
        totalPurchases: 0,
        usageHistory: [],
      });
      forms.resetNewClient();
      forms.setIsCreateDialogOpen(false);
    }
  };

  const handleEditClient = (client: Client) => {
    forms.setEditClientData({
      id: client.id,
      name: client.name,
      cpf: client.cpf ?? "",
      email: client.email ?? "",
      phone: client.phone,
      telegram: client.telegram ?? "",
    });
    forms.setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (forms.editClientData && forms.editClientData.name && forms.editClientData.id) {
      updateClientM.mutate({
        id: forms.editClientData.id,
        name: forms.editClientData.name,
        cpf: forms.editClientData.cpf,
        email: forms.editClientData.email,
        phone: forms.editClientData.phone,
        telegram: forms.editClientData.telegram,
      });
      forms.setEditClientData(null);
      forms.setIsEditDialogOpen(false);
    }
  };

  const handleDeleteClient = (id: string, name: string) => {
    const relatedSales = sales
      .filter((sale) => sale.clientId === id)
      .map((sale) => ({
        id: sale.id,
        ticketLocator: sale.ticketLocator,
        date: sale.date,
        milesUsed: sale.milesUsed,
      }));

    if (relatedSales.length > 0) {
      setDeleteBlocked({ open: true, clientName: name, relatedSales });
    } else {
      deleteClientM.mutate(id);
    }
  };

  const handleAdvance = () => {
    if (!advanceClient) return;
    advanceM.mutate(
      {
        clientId: advanceClient.id,
        amount: Number(advanceForm.amount),
        note: advanceForm.note,
        date: advanceForm.date || undefined,
      },
      {
        onSuccess: () => {
          setAdvanceClient(null);
          setAdvanceForm({ amount: "", note: "", date: todayISODate() });
        },
      },
    );
  };

  const openAdvanceDrawer = (client: { id: string; name: string }) => {
    setAdvanceForm({ amount: "", note: "", date: todayISODate() });
    setAdvanceClient(client);
  };

  return {
    clients,
    isLoading,
    ...forms,
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
    itemsPerPage: ITEMS_PER_PAGE,
    handleCreateClient,
    handleEditClient,
    handleSaveEdit,
    handleDeleteClient,
    handleAdvance,
    openAdvanceDrawer,
    advanceM,
  };
}
