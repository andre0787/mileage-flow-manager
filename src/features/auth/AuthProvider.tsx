import { useEffect, useRef, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAppDispatch, useAppSelector } from "@/features/store";
import {
  setSession,
  setLoading,
  setIsAdmin,
  selectUser,
  selectSession,
  selectLoading,
  selectIsAdmin,
} from "./authSlice";
import type { User, Session } from "@supabase/supabase-js";

// Contrato público preservado do AuthContext migrado (mesma interface).
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (newPassword: string) => Promise<string | null>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const initialized = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      dispatch(setSession(session));
      // Fetch admin status from profiles table
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();
        dispatch(setIsAdmin(profile?.is_admin ?? false));
      }
      initialized.current = true;
      dispatch(setLoading(false));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // ponytail: ignore auth events during initialization to avoid race
      // between getSession() and the listener — the listener delivers the
      // same session that getSession() is already fetching, and on first
      // load a stale SIGNED_IN event can arrive before getSession() resolves.
      if (!initialized.current) return;
      dispatch(setSession(session));
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}

export function useAuth(): AuthContextType {
  const user = useAppSelector(selectUser);
  const session = useAppSelector(selectSession);
  const loading = useAppSelector(selectLoading);
  const isAdmin = useAppSelector(selectIsAdmin);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUp = async (email: string, password: string, name: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return error?.message ?? null;
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    const redirectTo = window.location.origin + "/reset-password";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return error?.message ?? null;
  };

  const updatePassword = async (newPassword: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error?.message ?? null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
}
