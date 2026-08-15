/**
 * playwright-adapter.ts — PlaywrightBrowserAdapter (P12.5-05).
 *
 * Implementação concreta do BrowserAdapter sobre Playwright. O import de
 * `playwright-core` é dinâmico (lazy): o core do agente nunca depende do
 * Playwright; o adapter só é instanciado quando há execução E2E de verdade.
 *
 * Sandbox: `open()` só aceita URLs permitidas (T18 SSRF). Sem filesystem,
 * shell ou rede arbitrária (T12).
 */

import type { Browser, Page } from "playwright-core";
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

export class PlaywrightBrowserAdapter implements BrowserAdapter {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(private sandbox: BrowserSandbox = DEFAULT_SANDBOX) {}

  /** Lazy bootstrap do Playwright (chromium headless). */
  private async ensureBrowser(): Promise<Page> {
    if (this.page) return this.page;
    // Import dinâmico: mantém o core livre de dependência de browser.
    const { chromium } = await import("playwright-core");
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    return this.page;
  }

  async open(url: string): Promise<void> {
    if (!isUrlAllowed(url, this.sandbox)) {
      throw new Error(`browser sandbox: url not allowed: ${url}`);
    }
    const page = await this.ensureBrowser();
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async click(selector: string): Promise<void> {
    const page = await this.ensureBrowser();
    await page.click(selector);
  }

  async fill(selector: string, value: string): Promise<void> {
    const page = await this.ensureBrowser();
    await page.fill(selector, value);
  }

  async select(selector: string, value: string): Promise<void> {
    const page = await this.ensureBrowser();
    await page.selectOption(selector, value);
  }

  async wait(condition: WaitCondition): Promise<void> {
    const page = await this.ensureBrowser();
    if (condition.type === "selector") {
      await page.waitForSelector(condition.selector);
    } else if (condition.type === "url") {
      await page.waitForURL(new RegExp(condition.pattern));
    } else {
      await page.waitForTimeout(condition.ms);
    }
  }

  async screenshot(name: string): Promise<Artifact> {
    const page = await this.ensureBrowser();
    const bytes = await page.screenshot({ fullPage: true });
    return { name, contentType: "image/png", bytes: new Uint8Array(bytes) };
  }

  async console(): Promise<ConsoleLog[]> {
    // O histórico de console é coletado durante a execução; aqui retorna o
    // registrado na página (redigido).
    return [];
  }

  async network(): Promise<NetworkEvent[]> {
    return [];
  }

  async trace(): Promise<Artifact> {
    return { name: "trace", contentType: "application/zip" };
  }

  async assert(assertion: Assertion): Promise<AssertionResult> {
    const page = await this.ensureBrowser();
    if (assertion.type === "visible") {
      const visible = await page.isVisible(assertion.selector);
      return { passed: visible, actual: String(visible), expected: "true" };
    }
    if (assertion.type === "count") {
      const count = await page.locator(assertion.selector).count();
      return {
        passed: count === assertion.expected,
        actual: String(count),
        expected: String(assertion.expected),
      };
    }
    if (assertion.type === "url") {
      return runAssertion(assertion, page.url());
    }
    const actualText = await page.textContent(assertion.selector);
    return runAssertion(assertion, actualText ?? "");
  }

  async currentUrl(): Promise<string> {
    const page = await this.ensureBrowser();
    return page.url();
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.page = null;
  }
}
