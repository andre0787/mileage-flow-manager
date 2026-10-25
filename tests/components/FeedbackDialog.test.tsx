import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FeedbackDialog } from "@/components/FeedbackDialog";

const mockInsert = vi.fn();

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-123" },
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

describe("FeedbackDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockInsert.mockResolvedValue({ error: null });
  });

  it("renderiza o trigger e abre o diálogo ao clicar", () => {
    render(
      <FeedbackDialog>
        <button>Abrir Feedback</button>
      </FeedbackDialog>,
    );

    expect(screen.getByText("Abrir Feedback")).toBeDefined();
    fireEvent.click(screen.getByText("Abrir Feedback"));

    expect(screen.getByText("Reportar problema / Sugerir melhoria")).toBeDefined();
    expect(screen.getByRole("button", { name: "Bug" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Sugestão" })).toBeDefined();
  });

  it("permite alternar tipo de feedback entre Bug e Sugestão", () => {
    render(
      <FeedbackDialog>
        <button>Abrir Feedback</button>
      </FeedbackDialog>,
    );

    fireEvent.click(screen.getByText("Abrir Feedback"));

    expect(screen.getByText("Descreva o problema")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Sugestão" }));
    expect(screen.getByText("Descreva sua sugestão")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Bug" }));
    expect(screen.getByText("Descreva o problema")).toBeDefined();
  });

  it("envia o feedback com sucesso e exibe tela de agradecimento", async () => {
    localStorage.setItem("mc_debug_logs", "mock-log-content");

    render(
      <FeedbackDialog>
        <button>Abrir Feedback</button>
      </FeedbackDialog>,
    );

    fireEvent.click(screen.getByText("Abrir Feedback"));

    const textarea = screen.getByLabelText("Descreva o problema");
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(textarea, { target: { value: "O botão de salvar travou" } });
    fireEvent.change(emailInput, { target: { value: "teste@example.com" } });

    const submitBtn = screen.getByRole("button", { name: /Enviar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        type: "bug",
        message: "O botão de salvar travou",
        email: "teste@example.com",
        logs: "mock-log-content",
      });
      expect(screen.getByText("Obrigado!")).toBeDefined();
    });
  });

  it("exibe mensagem de erro se o envio falhar no Supabase", async () => {
    mockInsert.mockResolvedValueOnce({ error: new Error("Db Error") });

    render(
      <FeedbackDialog>
        <button>Abrir Feedback</button>
      </FeedbackDialog>,
    );

    fireEvent.click(screen.getByText("Abrir Feedback"));

    const textarea = screen.getByLabelText("Descreva o problema");
    fireEvent.change(textarea, { target: { value: "Erro na página" } });

    const submitBtn = screen.getByRole("button", { name: /Enviar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Não foi possível enviar. Tente novamente.")).toBeDefined();
    });
  });
});
