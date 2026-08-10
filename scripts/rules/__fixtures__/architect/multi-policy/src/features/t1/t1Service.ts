// tabela t1 tem policy própria com auth.uid() — deve passar
export const t1Api = {
  listar: async () => {
    const { data } = await supabase.from("t1").select("*");
    return data;
  },
};
