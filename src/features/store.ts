import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import { authReducer } from "./auth/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// ponytail: base RTK Query exposta pelo barrel da feature api (rule-14: sem
// órfãos em src/) — P3-28+ registra [baseApi.reducerPath] aqui ao injetar endpoints.
export { baseApi } from "./api";

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
