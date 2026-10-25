import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Perfil from "@/pages/Perfil";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: {
      id: "u123",
      email: "user@example.com",
      user_metadata: { name: "Usuario Teste" },
    },
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Perfil Page & Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza as três seções de informações do perfil", () => {
    render(<Perfil />);
    expect(screen.getByText("Informações Pessoais")).toBeDefined();
    expect(screen.getByRole("heading", { name: /Email/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /Alterar Senha/i })).toBeDefined();
    expect(screen.getByDisplayValue("Usuario Teste")).toBeDefined();
    expect(screen.getByDisplayValue("user@example.com")).toBeDefined();
  });

  it("exibe erro se tentar atualizar nome em branco", async () => {
    render(<Perfil />);
    const nameInput = screen.getByDisplayValue("Usuario Teste");
    fireEvent.change(nameInput, { target: { value: "   " } });

    const saveNameButton = screen.getAllByRole("button", { name: "Salvar" })[0];
    await act(async () => {
      fireEvent.click(saveNameButton);
    });

    expect(toast.error).toHaveBeenCalledWith("Nome não pode ficar vazio");
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("atualiza nome com sucesso", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.updateUser>>);

    render(<Perfil />);
    const saveNameButton = screen.getAllByRole("button", { name: "Salvar" })[0];
    await act(async () => {
      fireEvent.click(saveNameButton);
    });

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ data: { name: "Usuario Teste" } });
  });

  it("exibe erro se tentar alterar senha sem preencher senha atual", async () => {
    render(<Perfil />);
    const updatePasswordBtn = screen.getByRole("button", { name: "Alterar Senha" });
    await act(async () => {
      fireEvent.click(updatePasswordBtn);
    });

    expect(toast.error).toHaveBeenCalledWith("Digite sua senha atual");
  });
});
