// tabela t2 só tem policy com USING (true) — deve FALHAR mesmo com a
// policy auth.uid() da t1 no mesmo arquivo de migração
export const t2Api = {
  listar: async () => {
    const { data } = await supabase.from("t2").select("*");
    return data;
  },
};
