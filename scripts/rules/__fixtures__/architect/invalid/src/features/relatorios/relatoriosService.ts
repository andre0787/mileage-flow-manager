// service layer da feature relatorios — usa tabela SEM política RLS
export const relatoriosApi = {
  exportar: async () => {
    const { data } = await supabase.from("tabela_sem_policy").select("*");
    return data;
  },
};
