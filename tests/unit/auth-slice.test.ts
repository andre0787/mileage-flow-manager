import { describe, it, expect } from "vitest";
import type { Session, User } from "@supabase/supabase-js";
import {
  authReducer,
  setSession,
  setLoading,
  clear,
  selectUser,
  selectSession,
  selectLoading,
  type AuthState,
} from "@/features/auth/authSlice";
import type { RootState } from "@/features/store";

const makeUser = (id = "user-1"): User =>
  ({
    id,
    email: "user@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00Z",
  }) as User;

const makeSession = (id = "session-1"): Session =>
  ({
    access_token: "token",
    refresh_token: "refresh",
    expires_at: 9999999999,
    user: makeUser(id),
  }) as Session;

const stateWith = (partial: Partial<AuthState>): RootState =>
  ({ auth: { user: null, session: null, loading: true, ...partial } }) as RootState;

describe("authSlice", () => {
  it("parte do estado inicial com loading true e sem usuário", () => {
    expect(authReducer(undefined, { type: "@@INIT" })).toEqual({
      user: null,
      session: null,
      loading: true,
    });
  });

  it("setSession grava session e user derivado", () => {
    const session = makeSession();
    const state = authReducer(undefined, setSession(session));
    expect(state.session).toEqual(session);
    expect(state.user).toEqual(session.user);
  });

  it("setSession(null) limpa session e user", () => {
    const session = makeSession();
    const withSession = authReducer(undefined, setSession(session));
    const state = authReducer(withSession, setSession(null));
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setLoading alterna o flag de loading", () => {
    const state = authReducer(undefined, setLoading(false));
    expect(state.loading).toBe(false);
    expect(authReducer(state, setLoading(true)).loading).toBe(true);
  });

  it("clear zera user/session e finaliza loading", () => {
    const session = makeSession();
    const withData = authReducer(undefined, setSession(session));
    const state = authReducer(withData, clear());
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.loading).toBe(false);
  });

  it("seletores leem user, session e loading do estado", () => {
    const session = makeSession();
    const state = stateWith({ user: session.user, session, loading: false });
    expect(selectUser(state)).toEqual(session.user);
    expect(selectSession(state)).toEqual(session);
    expect(selectLoading(state)).toBe(false);
  });
});
