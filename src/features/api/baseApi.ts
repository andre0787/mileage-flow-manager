import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Base RTK Query API — placeholder para a migração Blueprint v4.0 P1.
// Os domínios de dados (P3-28+) definem `injectEndpoints` sobre esta base;
// enquanto nenhum endpoint existir, o `reducerPath` é registrado no store
// apenas quando um domínio o importar (lazy via barrel da feature).
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
  }),
  tagTypes: [],
  endpoints: () => ({}),
});
