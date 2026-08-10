import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createElement, type ReactElement } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider, useAuth } from "@/features/auth";
import { authReducer, setSession } from "@/features/auth/authSlice";

// ─── Mock de @/lib/supabase ──────────────────────────────────────────
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}));

const makeSession = (): Session =>
  ({
    access_token: "token",
    refresh_token: "refresh",
    expires_at: 9999999999,
    user: {
      id: "user-1",
      email: "user@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00Z",
    },
  }) as Session;

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

// Harness: consumidor real de useAuth() via createElement (arquivo .ts, sem JSX)
function AuthHarness({ onResult }: { onResult: (r: unknown) => void }) {
  const auth = useAuth();
  onResult(auth);
  return null;
}

function renderHarness(store = makeStore()) {
  const results: Record<string, unknown>[] = [];
  const harness = createElement(AuthHarness, {
    onResult: (r) => results.push(r),
  });
  const tree = createElement(
    Provider,
    { store },
    createElement(AuthProvider, null, harness),
  ) as ReactElement;
  render(tree);
  return results;
}

describe("AuthProvider + useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it("getSession resolve e hidrata o store (session + user, loading false)", async () => {
    const session = makeSession();
    mockGetSession.mockResolvedValue({ data: { session } });
    const results = renderHarness();

    await waitFor(() => {
      const last = results[results.length - 1] as { loading?: boolean };
      expect(last?.loading).toBe(false);
    });
    const last = results[results.length - 1] as { user?: { email?: string }; session?: { access_token?: string } };
    expect(last.user?.email).toBe("user@example.com");
    expect(last.session?.access_token).toBe("token");
  });

  it("getSession null deixa user/session vazios e finaliza loading", async () => {
    const results = renderHarness();

    await waitFor(() => {
      const last = results[results.length - 1] as { loading?: boolean };
      expect(last?.loading).toBe(false);
    });
    const last = results[results.length - 1] as { user?: unknown; session?: unknown };
    expect(last.user).toBeNull();
    expect(last.session).toBeNull();
  });

  it("onAuthStateChange é registrado e o subscription é limpo no unmount", async () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    const { unmount } = render(
      createElement(
        Provider,
        { store: makeStore() },
        createElement(AuthProvider, null, createElement(AuthHarness, { onResult: () => {} })),
      ),
    );

    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1));
    expect(unsubscribe).not.toHaveBeenCalled();

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("signIn retorna mensagem de erro do supabase (ou null quando sucesso)", async () => {
    const session = makeSession();
    mockGetSession.mockResolvedValue({ data: { session } });
    const results = renderHarness();
    await waitFor(() => {
      const last = results[results.length - 1] as { loading?: boolean };
      expect(last?.loading).toBe(false);
    });

    const { signIn } = results[results.length - 1] as {
      signIn: (e: string, p: string) => Promise<string | null>;
    };

    mockSignInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials" },
    });
    const errMsg = await signIn("a@b.com", "pw");
    expect(errMsg).toBe("Invalid login credentials");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: "a@b.com", password: "pw" });

    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });
    expect(await signIn("a@b.com", "pw")).toBeNull();
  });

  it("signOut chama supabase.auth.signOut", async () => {
    const session = makeSession();
    mockGetSession.mockResolvedValue({ data: { session } });
    const results = renderHarness();
    await waitFor(() => {
      const last = results[results.length - 1] as { loading?: boolean };
      expect(last?.loading).toBe(false);
    });

    const { signOut } = results[results.length - 1] as { signOut: () => Promise<void> };
    mockSignOut.mockResolvedValue({ error: null });
    await signOut();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("sessão pré-existente no store é lida por useAuth na render inicial", async () => {
    const session = makeSession();
    const store = makeStore();
    store.dispatch(setSession(session));
    const results = renderHarness(store);

    // A primeira render le o estado pré-existente do store (antes do efeito
    // getSession(null) do provider sobrescrever com o mock do beforeEach).
    const first = results[0] as { user?: { email?: string }; session?: { access_token?: string } };
    expect(first.user?.email).toBe("user@example.com");
    expect(first.session?.access_token).toBe("token");
  });
});
