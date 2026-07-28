/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatCPF, isTransferencia, downloadCSV } from "@/lib/utils";

describe("utils", () => {
  describe("cn()", () => {
    it("deve mesclar classes tailwind", () => {
      const result = cn("px-4", "py-2");
      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
    });

    it("deve aceitar arrays", () => {
      const result = cn(["px-4", "py-2"]);
      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
    });

    it("deve aceitar objetos condicionais", () => {
      const result = cn("base", { active: true });
      expect(result).toContain("base");
      expect(result).toContain("active");
    });

    it("deve remover valores falsy", () => {
      const result = cn("px-4", false && "hidden", undefined, null, "py-2");
      expect(result).toBe("px-4 py-2");
    });
  });

  describe("formatCPF()", () => {
    it("deve formatar CPF de 11 dígitos", () => {
      expect(formatCPF("12345678901")).toBe("123.456.789-01");
    });

    it("deve ignorar caracteres não numéricos", () => {
      expect(formatCPF("123.456.789-01")).toBe("123.456.789-01");
    });

    it("deve truncar mais de 11 dígitos", () => {
      expect(formatCPF("123456789011234")).toBe("123.456.789-01");
    });

    it("deve aceitar CPF com menos de 11 dígitos", () => {
      const result = formatCPF("123");
      expect(result).toBe("123");
    });
  });

  describe("isTransferencia()", () => {
    it("deve retornar true para transferência de milhas", () => {
      expect(
        isTransferencia({ name: "Transferência", accountType: "milhas" })
      ).toBe(true);
    });

    it("deve retornar false para transferência de pontos", () => {
      expect(
        isTransferencia({ name: "Transferência", accountType: "pontos" })
      ).toBe(false);
    });

    it("deve retornar false para outro tipo", () => {
      expect(
        isTransferencia({ name: "Compra", accountType: "milhas" })
      ).toBe(false);
    });
  });

  describe("downloadCSV()", () => {
    beforeEach(() => {
      // Mock URL.createObjectURL e link click
      globalThis.URL.createObjectURL = vi.fn(() => "blob:mock");
      globalThis.URL.revokeObjectURL = vi.fn();
      document.body.innerHTML = "";
    });

    it("deve criar link de download e clicar", () => {
      const clickSpy = vi.spyOn(HTMLElement.prototype, "click");
      const data = [
        { nome: "João", valor: 100 },
        { nome: "Maria", valor: 200 },
      ];

      downloadCSV(data, "test.csv");

      expect(clickSpy).toHaveBeenCalled();
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it("deve retornar sem fazer nada para array vazio", () => {
      const clickSpy = vi.spyOn(HTMLElement.prototype, "click");
      downloadCSV([], "vazio.csv");
      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it("deve criar CSV com BOM e cabeçalhos", () => {
      const appendSpy = vi.spyOn(document.body, "appendChild");
      downloadCSV([{ a: 1 }], "dados.csv");
      expect(appendSpy).toHaveBeenCalled();
      const addedLink = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(addedLink.tagName).toBe("A");
      expect(addedLink.download).toBe("dados.csv");
      appendSpy.mockRestore();
    });
  });
});
