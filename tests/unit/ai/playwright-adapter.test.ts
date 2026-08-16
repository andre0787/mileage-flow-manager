import { describe, expect, it } from "vitest";
import { PlaywrightBrowserAdapter } from "@/ai/e2e/playwright-adapter";
import { isUrlAllowed, DEFAULT_SANDBOX, runAssertion } from "@/ai/e2e/browser-adapter";

describe("P12.5 PlaywrightBrowserAdapter (sandbox)", () => {
  it("rejeita URL fora do sandbox sem abrir browser (T18 SSRF)", async () => {
    const adapter = new PlaywrightBrowserAdapter();
    await expect(adapter.open("http://evil.example.com")).rejects.toThrow(/sandbox/);
  });

  it("permite URL do domínio permitido", () => {
    expect(isUrlAllowed("http://localhost:8080/demo", DEFAULT_SANDBOX)).toBe(true);
  });

  it("assertion url roda via runAssertion (sem browser)", async () => {
    const result = await runAssertion({ type: "url", pattern: "/demo$" }, "http://localhost:8080/demo");
    expect(result.passed).toBe(true);
  });
});
