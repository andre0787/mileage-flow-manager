import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Base RTK Query API — domínios de dados (P3-28+) definem `injectEndpoints`
// sobre esta base. O reducer + middleware são registrados no store assim que
// o primeiro domínio injeta endpoints (ver src/features/store.ts).
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
  }),
  tagTypes: [
    "entries",
    "accounts",
    "sales",
    "clients",
    "alerts",
    "programs",
    "origem_types",
  ],
  endpoints: () => ({}),
});
