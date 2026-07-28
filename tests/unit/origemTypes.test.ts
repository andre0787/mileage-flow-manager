import { describe, it, expect } from "vitest";
import {
  serializeOrigemTypeDescription,
  parseOrigemTypeDescription,
  buildMonthlyRecurrence,
} from "@/lib/origemTypes";

describe("origemTypes", () => {
  describe("serializeOrigemTypeDescription", () => {
    it("deve serializar com hasRecurrence true", () => {
      const result = serializeOrigemTypeDescription(true);
      expect(result).toBe('{"hasRecurrence":true}');
    });

    it("deve serializar com hasRecurrence false", () => {
      const result = serializeOrigemTypeDescription(false);
      expect(result).toBe('{"hasRecurrence":false}');
    });
  });

  describe("parseOrigemTypeDescription", () => {
    it("deve retornar { hasRecurrence: false } para null", () => {
      expect(parseOrigemTypeDescription(null)).toEqual({ hasRecurrence: false });
    });

    it("deve retornar { hasRecurrence: false } para undefined", () => {
      expect(parseOrigemTypeDescription(undefined)).toEqual({ hasRecurrence: false });
    });

    it("deve retornar { hasRecurrence: false } para string vazia", () => {
      expect(parseOrigemTypeDescription("")).toEqual({ hasRecurrence: false });
    });

    it("deve parsear JSON com hasRecurrence true", () => {
      const result = parseOrigemTypeDescription('{"hasRecurrence":true}');
      expect(result).toEqual({ hasRecurrence: true });
    });

    it("deve parsear JSON com hasRecurrence false", () => {
      const result = parseOrigemTypeDescription('{"hasRecurrence":false}');
      expect(result).toEqual({ hasRecurrence: false });
    });

    it("deve considerar recurrenceInterval como hasRecurrence true", () => {
      const result = parseOrigemTypeDescription('{"recurrenceInterval":30}');
      expect(result).toEqual({ hasRecurrence: true });
    });

    it("deve retornar false para JSON inválido", () => {
      const result = parseOrigemTypeDescription("json-invalido");
      expect(result).toEqual({ hasRecurrence: false });
    });

    it("deve retornar false para JSON mal formatado", () => {
      const result = parseOrigemTypeDescription('{"broken": true');
      expect(result).toEqual({ hasRecurrence: false });
    });
  });

  describe("buildMonthlyRecurrence", () => {
    it("deve retornar objeto vazio quando disabled", () => {
      expect(buildMonthlyRecurrence(false)).toEqual({});
      expect(buildMonthlyRecurrence(false, "6")).toEqual({});
    });

    it("deve criar recorrência com intervalo 30 e data fim", () => {
      const result = buildMonthlyRecurrence(true, "6");
      expect(result.recurrenceInterval).toBe(30);
      expect(result.recurrenceEnd).toBeDefined();
      // deve ser uma data válida no futuro
      const endDate = new Date(result.recurrenceEnd!);
      expect(endDate.getTime()).toBeGreaterThan(Date.now() - 86400000);
    });

    it("deve usar valor default (30) para meses inválidos", () => {
      const result = buildMonthlyRecurrence(true, "abc");
      expect(result.recurrenceInterval).toBe(30);
    });

    it("deve usar valor default (30) para meses <= 0", () => {
      const result = buildMonthlyRecurrence(true, "0");
      expect(result.recurrenceInterval).toBe(30);
    });

    it("deve usar valor default (30) para meses negativos", () => {
      const result = buildMonthlyRecurrence(true, "-1");
      expect(result.recurrenceInterval).toBe(30);
    });

    it("deve aceitar meses sem parâmetro", () => {
      const result = buildMonthlyRecurrence(true);
      expect(result.recurrenceInterval).toBe(30);
    });
  });
});
