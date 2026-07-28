/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { t, getLocale, setLocale } from "@/lib/i18n";

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

describe("i18n", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("t()", () => {
    it("deve retornar tradução pt-BR padrão", () => {
      expect(t("nav.dashboard")).toBe("Resumo");
      expect(t("common.save")).toBe("Salvar");
    });

    it("deve retornar tradução en-US quando especificado", () => {
      expect(t("nav.dashboard", "en-US")).toBe("Dashboard");
      expect(t("common.save", "en-US")).toBe("Save");
    });

    it("deve retornar a própria chave se tradução não existir", () => {
      expect(t("chave.inexistente")).toBe("chave.inexistente");
    });

    it("deve ter todas as chaves em pt-BR e en-US", () => {
      // Todas as chaves de pt-BR devem existir em en-US
      // (teste de completude)
      const ptKeys = [
        "nav.dashboard", "nav.entries", "nav.sales", "nav.clients",
        "common.save", "common.cancel", "common.delete",
        "action.newEntry", "action.newSale",
        "message.success.create", "message.success.update",
        "dashboard.title", "shortcuts.title", "auth.login",
      ];
      for (const key of ptKeys) {
        expect(t(key, "pt-BR")).not.toBe(key);
        expect(t(key, "en-US")).not.toBe(key);
      }
    });
  });

  describe("getLocale()", () => {
    it("deve retornar pt-BR quando nenhum locale salvo", () => {
      expect(getLocale()).toBe("pt-BR");
    });

    it("deve retornar locale salvo", () => {
      setLocale("en-US");
      expect(getLocale()).toBe("en-US");
    });

    it("deve retornar pt-BR para locale inválido", () => {
      localStorageMock.setItem("mc_locale", "fr-FR");
      expect(getLocale()).toBe("pt-BR");
    });
  });

  describe("setLocale()", () => {
    it("deve salvar locale no localStorage", () => {
      setLocale("en-US");
      expect(localStorageMock.getItem("mc_locale")).toBe("en-US");
    });

    it("deve salvar pt-BR", () => {
      setLocale("pt-BR");
      expect(localStorageMock.getItem("mc_locale")).toBe("pt-BR");
    });
  });
});
