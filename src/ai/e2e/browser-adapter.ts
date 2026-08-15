/**
 * browser-adapter.ts — BrowserAdapter (P12.5-05).
 *
 * Abstração que desacopla o QA Agent do Playwright. A interface define as
 * operações; a implementação concreta PlaywrightBrowserAdapter carrega o
 * Playwright via import dinâmico (lazy) — nunca acopla o core do agente ao
 * driver de browser.
 *
 * O adapter NÃO permite: filesystem arbitrário, shell arbitrário, rede
 * arbitrária nem extração de secrets (T12/T18).
 */

export interface ConsoleLog {
  level: "log" | "info" | "warn" | "error";
  text: string;
}

export interface NetworkEvent {
  url: string;
  method: string;
  status: number;
  /** Redação: corpos sensíveis nunca são retidos. */
  responseBodyRedacted: boolean;
}

export interface Artifact {
  name: string;
  contentType: "image/png" | "application/zip" | "application/json" | "text/plain";
  /** Artefato em memória; persistência segue retention (P12.5-07). */
  bytes?: Uint8Array;
  text?: string;
}

export type WaitCondition =
  | { type: "selector"; selector: string }
  | { type: "timeout"; ms: number }
  | { type: "url"; pattern: string };

export type Assertion =
  | { type: "text"; selector: string; expected: string }
  | { type: "visible"; selector: string }
  | { type: "url"; pattern: string }
  | { type: "count"; selector: string; expected: number };

export interface AssertionResult {
  passed: boolean;
  actual: string;
  expected: string;
}

/** Sandbox de navegação: apenas URLs da aplicação (T18 SSRF). */
export interface BrowserSandbox {
  allowedUrlPrefixes: string[];
}

export const DEFAULT_SANDBOX: BrowserSandbox = {
  allowedUrlPrefixes: [
    "http://localhost:8080",
    "http://localhost:4173",
    "https://mileage-flow-manager.vercel.app",
  ],
};

export interface BrowserAdapter {
  open(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  select(selector: string, value: string): Promise<void>;
  wait(condition: WaitCondition): Promise<void>;
  screenshot(name: string): Promise<Artifact>;
  console(): Promise<ConsoleLog[]>;
  network(): Promise<NetworkEvent[]>;
  trace(): Promise<Artifact>;
  assert(assertion: Assertion): Promise<AssertionResult>;
  /** URL aberta atualmente (para validação de sandbox). */
  currentUrl(): Promise<string>;
}

/** Valida URL contra o sandbox (T18 SSRF). */
export function isUrlAllowed(url: string, sandbox: BrowserSandbox = DEFAULT_SANDBOX): boolean {
  return sandbox.allowedUrlPrefixes.some((p) => url.startsWith(p));
}

/** Assertion runner puro — usado pelo fake e pelo Playwright adapter. */
export async function runAssertion(assertion: Assertion, actual: string): Promise<AssertionResult> {
  switch (assertion.type) {
    case "text":
      return { passed: actual.includes(assertion.expected), actual, expected: assertion.expected };
    case "url":
      return {
        passed: new RegExp(assertion.pattern).test(actual),
        actual,
        expected: assertion.pattern,
      };
    default:
      return { passed: false, actual, expected: JSON.stringify(assertion) };
  }
}
