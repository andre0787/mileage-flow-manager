import { describe, it, expect } from "vitest";
import { PERIOD_OPTIONS } from "@/lib/dates";

describe("dates", () => {
  describe("PERIOD_OPTIONS", () => {
    it("deve ter 4 opções", () => {
      expect(PERIOD_OPTIONS).toHaveLength(4);
    });

    it("cada opção deve ter value string e label string", () => {
      for (const opt of PERIOD_OPTIONS) {
        expect(typeof opt.value).toBe("string");
        expect(typeof opt.label).toBe("string");
      }
    });

    it("deve conter período de 7 dias", () => {
      const opt = PERIOD_OPTIONS.find((o) => o.value === "7");
      expect(opt).toBeDefined();
      expect(opt!.label).toContain("7 dias");
    });

    it("deve conter período de 30 dias", () => {
      const opt = PERIOD_OPTIONS.find((o) => o.value === "30");
      expect(opt).toBeDefined();
      expect(opt!.label).toContain("30 dias");
    });

    it("deve conter período de 365 dias (último ano)", () => {
      const opt = PERIOD_OPTIONS.find((o) => o.value === "365");
      expect(opt).toBeDefined();
      expect(opt!.label).toContain("ano");
    });
  });
});
