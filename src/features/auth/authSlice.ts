import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    clear(state) {
      state.session = null;
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setSession, setLoading, clear } = authSlice.actions;
export const authReducer = authSlice.reducer;

// ponytail: seletor com parâmetro estrutural (não importa RootState) — evita
// o ciclo authSlice → store → authSlice registrado pelo generate-graph.
type AuthRootState = { auth: AuthState };

export const selectUser = (state: AuthRootState) => state.auth.user;
export const selectSession = (state: AuthRootState) => state.auth.session;
export const selectLoading = (state: AuthRootState) => state.auth.loading;
