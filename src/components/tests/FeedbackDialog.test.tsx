import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/logger";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-123", email: "user@example.com" },
  }),
}));

describe("FeedbackDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("exibe mensagem de erro e invoca logError quando a inserção do Supabase falha", async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: { message: "Database error occurred" },
    });
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);

    render(
      <FeedbackDialog>
        <button>Abrir Feedback</button>
      </FeedbackDialog>,
    );

    // Abre o diálogo
    fireEvent.click(screen.getByText("Abrir Feedback"));

    // Preenche a mensagem de feedback
    const messageInput = screen.getByLabelText("Descreva o problema");
    fireEvent.change(messageInput, { target: { value: "Ocorreu um problema na tela de vendas." } });

    // Submete o formulário
    const submitButton = screen.getByRole("button", { name: "Enviar" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        type: "bug",
        message: "Ocorreu um problema na tela de vendas.",
        email: null,
        logs: null,
      });
      expect(logError).toHaveBeenCalledWith("feedback_submit", {
        message: "Database error occurred",
      });
      expect(screen.getByText("Não foi possível enviar. Tente novamente.")).toBeDefined();
    });
  });

  it("envia o feedback com sucesso quando Supabase retorna sem erro", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);

    render(
      <FeedbackDialog>
        <button>Abrir Feedback</button>
      </FeedbackDialog>,
    );

    fireEvent.click(screen.getByText("Abrir Feedback"));

    // Alterna para Sugestão
    fireEvent.click(screen.getByRole("button", { name: "Sugestão" }));

    // Preenche mensagem e email
    const messageInput = screen.getByLabelText("Descreva sua sugestão");
    fireEvent.change(messageInput, {
      target: { value: "Adicionar filtro por data nas entradas." },
    });

    const emailInput = screen.getByLabelText(/Email/);
    fireEvent.change(emailInput, { target: { value: "teste@empresa.com" } });

    // Armazena logs no localStorage
    localStorage.setItem("mc_debug_logs", JSON.stringify([{ type: "info", context: "test" }]));

    const submitButton = screen.getByRole("button", { name: "Enviar" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        type: "suggestion",
        message: "Adicionar filtro por data nas entradas.",
        email: "teste@empresa.com",
        logs: JSON.stringify([{ type: "info", context: "test" }]),
      });
      expect(screen.getByText("Obrigado!")).toBeDefined();
      expect(
        screen.getByText(
          "Sua mensagem foi enviada. Sua contribuição nos ajuda a melhorar o MilesControl.",
        ),
      ).toBeDefined();
    });
  });

  it("não chama o Supabase se a mensagem for vazia", async () => {
    const mockInsert = vi.fn();
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);

    render(
      <FeedbackDialog>
        <button>Abrir Feedback</button>
      </FeedbackDialog>,
    );

    fireEvent.click(screen.getByText("Abrir Feedback"));

    const submitButton = screen.getByRole("button", { name: "Enviar" });
    fireEvent.click(submitButton);

    // O campo required impede submit ou a ação retorna message: null sem chamar insert
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
