// feature contas — SEM index.ts (barrel ausente → violação A)
export const contasApi = {
  listar: async () => {
    const { data } = await supabase.from("contas").select("*");
    return data;
  },
};
