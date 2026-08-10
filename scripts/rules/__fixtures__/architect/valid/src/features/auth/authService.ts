// service layer da feature auth — usa supabase.from("perfis_usuario")
export const authApi = {
  getPerfil: async () => {
    const { data } = await supabase.from("perfis_usuario").select("*");
    return data;
  },
};
