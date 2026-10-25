import { Users, Search, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { ClientTableRow } from "@/components/clientes/ClientTableRow";
import { ClientMobileCard } from "@/components/clientes/ClientMobileCard";
import { Client } from "@/types";

interface ClientTableProps {
  filteredClients: Client[];
  paginatedClients: Client[];
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onOpenCreateDialog: () => void;
  onOpenAdvanceDrawer: (client: { id: string; name: string }) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string, name: string) => void;
}

export function ClientTable({
  filteredClients,
  paginatedClients,
  searchTerm,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onOpenCreateDialog,
  onOpenAdvanceDrawer,
  onEditClient,
  onDeleteClient,
}: ClientTableProps) {
  return (
    <Card className="shadow-card animate-appear animate-delay-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Lista de Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead className="hidden md:table-cell">CPF</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden md:table-cell">Compras</TableHead>
                <TableHead className="hidden md:table-cell text-right">Saldo</TableHead>
                <TableHead className="hidden md:table-cell">Histórico de Uso</TableHead>
                <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <ClientTableRow
                  key={client.id}
                  client={client}
                  onOpenAdvanceDrawer={onOpenAdvanceDrawer}
                  onEditClient={onEditClient}
                  onDeleteClient={onDeleteClient}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-3 mt-4">
          {paginatedClients.map((client) => (
            <ClientMobileCard
              key={client.id}
              client={client}
              onOpenAdvanceDrawer={onOpenAdvanceDrawer}
              onEditClient={onEditClient}
              onDeleteClient={onDeleteClient}
            />
          ))}
        </div>

        {filteredClients.length > itemsPerPage && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredClients.length)} de{" "}
              {filteredClients.length}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}

        {filteredClients.length === 0 && (
          <div className="py-8">
            <EmptyState
              icon={searchTerm ? Search : UserPlus}
              title={searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              description={
                searchTerm
                  ? "Tente alterar o termo ou limpar a busca."
                  : "Clientes são o coração do negócio. Cadastre o primeiro e comece a vender."
              }
              action={
                searchTerm ? undefined : { label: "Cadastrar Cliente", onClick: onOpenCreateDialog }
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
