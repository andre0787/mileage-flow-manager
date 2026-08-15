/**
 * fake-browser.ts — FakeBrowserAdapter (P12.5-05, testes).
 *
 * Implementação determinística do BrowserAdapter para testes unitários e
 * para o runner de validação — sem browser real. Aplica o MESMO sandbox de
 * URL e as mesmas regras de assertions que o adapter real.
 */

import {
  DEFAULT_SANDBOX,
  isUrlAllowed,
  runAssertion,
  type Artifact,
  type Assertion,
  type AssertionResult,
  type BrowserAdapter,
  type BrowserSandbox,
  type ConsoleLog,
  type NetworkEvent,
  type WaitCondition,
} from "./browser-adapter";

export interface FakePage {
  url: string;
  textBySelector: Map<string, string>;
  visibleSelectors: Set<string>;
  countsBySelector: Map<string, number>;
  clicks: string[];
  fills: Array<{ selector: string; value: string }>;
  selects: Array<{ selector: string; value: string }>;
  consoleLogs: ConsoleLog[];
  networkEvents: NetworkEvent[];
  failOn: {
    click?: string;
    fill?: string;
    submit?: string;
    /** se definido, a página simula erro HTTP 500 no submit */
    http500On?: string;
  };
}

export function createFakePage(init: Partial<FakePage> = {}): FakePage {
  return {
    url: "http://localhost:8080/demo",
    textBySelector: new Map(),
    visibleSelectors: new Set(),
    countsBySelector: new Map(),
    clicks: [],
    fills: [],
    selects: [],
    consoleLogs: [],
    networkEvents: [],
    failOn: {},
    ...init,
  };
}

export class FakeBrowserAdapter implements BrowserAdapter {
  constructor(
    private page: FakePage,
    private sandbox: BrowserSandbox = DEFAULT_SANDBOX,
  ) {}

  get pageState(): FakePage {
    return this.page;
  }

  async open(url: string): Promise<void> {
    if (!isUrlAllowed(url, this.sandbox)) {
      throw new Error(`browser sandbox: url not allowed: ${url}`);
    }
    this.page.url = url;
    this.page.networkEvents.push({ url, method: "GET", status: 200, responseBodyRedacted: true });
  }

  async click(selector: string): Promise<void> {
    if (this.page.failOn.click === selector) {
      this.page.networkEvents.push({
        url: this.page.url,
        method: "POST",
        status: 500,
        responseBodyRedacted: true,
      });
      throw new Error(`click failed on ${selector}: simulated HTTP 500`);
    }
    this.page.clicks.push(selector);
  }

  async fill(selector: string, value: string): Promise<void> {
    if (this.page.failOn.fill === selector) {
      throw new Error(`fill failed on ${selector}`);
    }
    this.page.fills.push({ selector, value });
    this.page.textBySelector.set(selector, value);
  }

  async select(selector: string, value: string): Promise<void> {
    this.page.selects.push({ selector, value });
    this.page.textBySelector.set(selector, value);
  }

  async wait(condition: WaitCondition): Promise<void> {
    if (condition.type === "timeout") {
      // sem delay real em testes
    }
  }

  async screenshot(name: string): Promise<Artifact> {
    return { name, contentType: "image/png", bytes: new Uint8Array([1, 2, 3]) };
  }

  async console(): Promise<ConsoleLog[]> {
    return [...this.page.consoleLogs];
  }

  async network(): Promise<NetworkEvent[]> {
    return [...this.page.networkEvents];
  }

  async trace(): Promise<Artifact> {
    return { name: "trace", contentType: "application/zip", bytes: new Uint8Array([4, 5, 6]) };
  }

  async assert(assertion: Assertion): Promise<AssertionResult> {
    switch (assertion.type) {
      case "visible":
        return {
          passed: this.page.visibleSelectors.has(assertion.selector),
          actual: String(this.page.visibleSelectors.has(assertion.selector)),
          expected: "true",
        };
      case "count":
        return {
          passed: (this.page.countsBySelector.get(assertion.selector) ?? 0) === assertion.expected,
          actual: String(this.page.countsBySelector.get(assertion.selector) ?? 0),
          expected: String(assertion.expected),
        };
      default:
        return runAssertion(
          assertion,
          this.page.textBySelector.get("selector" in assertion ? assertion.selector : ".") ??
            this.page.url,
        );
    }
  }

  async currentUrl(): Promise<string> {
    return this.page.url;
  }
}
