import { useState } from "react";
import { ClientFormData } from "@/components/clientes";

export function useClientForms() {
  const [newClient, setNewClient] = useState<ClientFormData>({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    telegram: "",
  });

  const [editClientData, setEditClientData] = useState<ClientFormData | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const resetNewClient = () => {
    setNewClient({ name: "", cpf: "", email: "", phone: "", telegram: "" });
  };

  return {
    newClient,
    setNewClient,
    resetNewClient,
    editClientData,
    setEditClientData,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
  };
}
