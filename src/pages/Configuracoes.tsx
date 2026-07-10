import { useState } from "react";
import { AlertTriangle, RotateCcw, Trash2, User, Building2, Palette, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import {
  useAddOwnerMutation, useUpdateOwnerMutation, useDeleteOwnerMutation,
  useAddProgramMutation, useUpdateProgramMutation, useDeleteProgramMutation,
  useAddOrigemTypeMutation, useUpdateOrigemTypeMutation, useDeleteOrigemTypeMutation,
} from "@/hooks/useDatabase";
import OwnerSection from "@/components/OwnerSection";
import ProgramSection from "@/components/ProgramSection";
import OrigemTypeSection from "@/components/OrigemTypeSection";

export default function Configuracoes() {
  const { owners, programs, origemTypes, accounts, entries, clearCache, clearAccountData, isLoading } = useData();

  const addOwnerM = useAddOwnerMutation();
  const updateOwnerM = useUpdateOwnerMutation();
  const deleteOwnerM = useDeleteOwnerMutation();

  const addProgramM = useAddProgramMutation();
  const updateProgramM = useUpdateProgramMutation();
  const deleteProgramM = useDeleteProgramMutation();

  const addOrigemTypeM = useAddOrigemTypeMutation();
  const updateOrigemTypeM = useUpdateOrigemTypeMutation();
  const deleteOrigemTypeM = useDeleteOrigemTypeMutation();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-appear">
        <div className="space-y-2 mb-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-2 mb-6">
          <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-appear">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie donos, programas e tipos de operação</p>
        </div>
      </div>

      <Tabs defaultValue="owners" className="space-y-6">
        <div className="-mx-4 sm:mx-0 overflow-x-auto pb-1 -mb-1 px-4 sm:px-0">
          <TabsList className="inline-flex gap-1 w-max sm:w-auto sm:flex-wrap sm:justify-center">
            <TabsTrigger value="owners" className="gap-2 whitespace-nowrap"><User className="h-4 w-4 shrink-0" /> Donos</TabsTrigger>
            <TabsTrigger value="programs" className="gap-2 whitespace-nowrap"><Building2 className="h-4 w-4 shrink-0" /> Programas</TabsTrigger>
            <TabsTrigger value="origem-milhas" className="gap-2 whitespace-nowrap"><Palette className="h-4 w-4 shrink-0" /> Tipo de Operação</TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 whitespace-nowrap"><Settings className="h-4 w-4 shrink-0" /> Preferências</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="owners" className="animate-appear animate-delay-200">
          <OwnerSection
            owners={owners}
            accounts={accounts}
            onAdd={(data) => addOwnerM.mutate(data)}
            onUpdate={(data) => updateOwnerM.mutate(data)}
            onDelete={(id) => deleteOwnerM.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="programs" className="animate-appear animate-delay-200">
          <ProgramSection
            programs={programs}
            accounts={accounts}
            onAdd={(data) => addProgramM.mutate(data)}
            onUpdate={(data) => updateProgramM.mutate(data)}
            onDelete={(id) => deleteProgramM.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="origem-milhas" className="animate-appear animate-delay-200">
          <OrigemTypeSection
            origemTypes={origemTypes}
            entries={entries}
            onAdd={(data) => addOrigemTypeM.mutate(data)}
            onUpdate={(data) => updateOrigemTypeM.mutate(data)}
            onDelete={(id) => deleteOrigemTypeM.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4 animate-appear animate-delay-200">
          <Card className="shadow-card border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Gerenciamento de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Ações de manutenção dos dados da sua conta.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2" onClick={clearCache}>
                  <RotateCcw className="h-4 w-4" /> Limpar Cache
                </Button>
                <Button variant="destructive" className="gap-2" onClick={() => setShowClearConfirm(true)}>
                  <Trash2 className="h-4 w-4" /> Limpar Conta
                </Button>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" /> Limpar Conta
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-foreground">Tem certeza que deseja limpar todos os dados da sua conta?</p>
                <p className="text-sm text-muted-foreground">Esta ação irá remover permanentemente todas as contas, entradas, vendas, clientes, donos, programas e tipos de operação. O tipo "Transferência" será preservado. Esta operação não pode ser desfeita.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={() => { setShowClearConfirm(false); clearAccountData(); }}>Sim, limpar tudo</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}