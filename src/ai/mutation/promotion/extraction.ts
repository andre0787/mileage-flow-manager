/**
 * P12.6-16 — Promotion Extraction / Normalization
 *
 * O Extraction Agent deve transformar HTML, text, structured data,
 * official content em dados normalizados.
 *
 * Não inventar campos ausentes.
 */

import type { Promotion, PromotionStatus, ConfidenceLevel, PromotionType } from "./types";

// ─── Extraction Result ─────────────────────────────────────────

export interface ExtractionResult {
  extractionId: string;
  promotion: Partial<Promotion>;
  confidence: ConfidenceLevel;
  fieldsExtracted: string[];
  fieldsMissing: string[];
  rawContentHash: string;
  extractedAt: string;
  warnings: string[];
}

// ─── Normalization Rules ───────────────────────────────────────

export interface NormalizationRule {
  field: string;
  normalize: (value: unknown) => unknown;
  validate?: (value: unknown) => boolean;
  fallback?: unknown;
}

const NORMALIZATION_RULES: NormalizationRule[] = [
  {
    field: "bonusPercentage",
    normalize: (v) => {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const match = v.match(/(\d+(?:\.\d+)?)\s*%/);
        if (match) return parseFloat(match[1]);
      }
      return undefined;
    },
    validate: (v) => typeof v === "number" && v >= 0 && v <= 1000,
  },
  {
    field: "minimumPoints",
    normalize: (v) => {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const cleaned = v.replace(/[^\d]/g, "");
        const num = parseInt(cleaned, 10);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    },
    validate: (v) => typeof v === "number" && v >= 0,
  },
  {
    field: "startDate",
    normalize: (v) => normalizeDate(v),
    validate: (v) => typeof v === "string" && !isNaN(Date.parse(v)),
  },
  {
    field: "endDate",
    normalize: (v) => normalizeDate(v),
    validate: (v) => typeof v === "string" && !isNaN(Date.parse(v)),
  },
  {
    field: "eligibility",
    normalize: (v) => {
      if (Array.isArray(v)) return v.filter((e) => typeof e === "string");
      if (typeof v === "string") return v.split(/[;,]/).map((s) => s.trim());
      return undefined;
    },
  },
  {
    field: "program",
    normalize: (v) => normalizeProgram(v),
    validate: (v) => typeof v === "string" && v.length > 0,
  },
  {
    field: "promotionType",
    normalize: (v) => normalizePromotionType(v),
    validate: (v) =>
      ["transferencia", "compra", "bonus", "resgate", "parceria", "cashback"].includes(v as string),
  },
];

// ─── Date Normalization ────────────────────────────────────────

function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  // Try ISO format
  const isoMatch = value.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];

  // Try DD/MM/YYYY
  const brMatch = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;

  // Try relative dates
  if (value.includes("hoje") || value.includes("today")) {
    return new Date().toISOString().split("T")[0];
  }

  return undefined;
}

// ─── Program Normalization ─────────────────────────────────────

function normalizeProgram(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const programMap: Record<string, string> = {
    livelo: "Livelo",
    smiles: "Smiles",
    latam: "LATAM Pass",
    "latam pass": "LATAM Pass",
    azul: "Azul Fidelidade",
    "azul fidelidade": "Azul Fidelidade",
    esfera: "Esfera",
  };

  const normalized = value.toLowerCase().trim();
  return programMap[normalized] || value;
}

// ─── Promotion Type Normalization ──────────────────────────────

function normalizePromotionType(value: unknown): PromotionType | undefined {
  if (typeof value !== "string") return undefined;

  const typeMap: Record<string, PromotionType> = {
    transferência: "transferencia",
    transferencia: "transferencia",
    transfer: "transferencia",
    compra: "compra",
    purchase: "compra",
    bonus: "bonus",
    bônus: "bonus",
    resgate: "resgate",
    redemption: "resgate",
    parceria: "parceria",
    partnership: "parceria",
    cashback: "cashback",
  };

  const normalized = value.toLowerCase().trim();
  return typeMap[normalized];
}

// ─── Confidence Assessment ─────────────────────────────────────

function assessConfidence(
  fieldsExtracted: string[],
  fieldsMissing: string[],
  sourceReliability: number,
): ConfidenceLevel {
  const total = fieldsExtracted.length + fieldsMissing.length;
  const completeness = total > 0 ? fieldsExtracted.length / total : 0;
  const score = completeness * 0.7 + sourceReliability * 0.3;

  if (score >= 0.8) return "HIGH";
  if (score >= 0.5) return "MEDIUM";
  return "LOW";
}

// ─── Extractor ─────────────────────────────────────────────────

export class PromotionExtractor {
  /**
   * Extract promotion data from raw content.
   *
   * Parses HTML/text/structured data and normalizes fields.
   * Never invents missing fields.
   */
  extract(
    rawContent: string,
    sourceUrl: string,
    sourceId: string,
    sourceReliability: number,
  ): ExtractionResult {
    const extractionId = `ext-${sourceId}-${Date.now()}`;
    const warnings: string[] = [];

    // Parse content (simplified — real implementation would use
    // DOM parser for HTML, JSON parser for structured data, etc.)
    const parsed = this.parseContent(rawContent);

    // Apply normalization rules
    const promotion: Partial<Promotion> = {};
    const fieldsExtracted: string[] = [];
    const fieldsMissing: string[] = [];

    for (const rule of NORMALIZATION_RULES) {
      const rawValue = parsed[rule.field];
      if (rawValue !== undefined && rawValue !== null) {
        const normalized = rule.normalize(rawValue);
        if (normalized !== undefined) {
          if (rule.validate && !rule.validate(normalized)) {
            warnings.push(`Field '${rule.field}' failed validation: ${JSON.stringify(normalized)}`);
            fieldsMissing.push(rule.field);
          } else {
            (promotion as Record<string, unknown>)[rule.field] = normalized;
            fieldsExtracted.push(rule.field);
          }
        } else {
          fieldsMissing.push(rule.field);
        }
      } else {
        if (rule.fallback !== undefined) {
          (promotion as Record<string, unknown>)[rule.field] = rule.fallback;
          fieldsExtracted.push(rule.field);
        } else {
          fieldsMissing.push(rule.field);
        }
      }
    }

    // Set source metadata
    promotion.sourceUrl = sourceUrl;
    promotion.collectedAt = new Date().toISOString();

    const confidence = assessConfidence(fieldsExtracted, fieldsMissing, sourceReliability);

    return {
      extractionId,
      promotion,
      confidence,
      fieldsExtracted,
      fieldsMissing,
      rawContentHash: simpleHash(rawContent),
      extractedAt: new Date().toISOString(),
      warnings,
    };
  }

  /**
   * Parse raw content into structured data.
   */
  private parseContent(rawContent: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Try JSON first
    try {
      const json = JSON.parse(rawContent);
      Object.assign(result, json);
      return result;
    } catch {
      // Not JSON, continue
    }

    // Extract from HTML/text using regex patterns
    const titleMatch = rawContent.match(
      /<(?:h[1-6]|title|strong|b)[^>]*>([^<]+)<\/(?:h[1-6]|title|strong|b)>/i,
    );
    if (titleMatch) result.title = titleMatch[1].trim();

    const bonusMatch = rawContent.match(/(\d+(?:\.\d+)?)\s*%\s*(?:bonus|bônus|de bônus)/i);
    if (bonusMatch) result.bonusPercentage = parseFloat(bonusMatch[1]);

    const dateMatch = rawContent.match(
      /(?:de|from|até|until|válido|valid)\s*(?:\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
    );
    if (dateMatch) {
      const dates = dateMatch.map((d) =>
        normalizeDate(d.replace(/^(de|from|até|until|válido|valid)\s*/i, "")),
      );
      if (dates[0]) result.startDate = dates[0];
      if (dates[1]) result.endDate = dates[1];
    }

    const programMatch = rawContent.match(/(livelo|smiles|latam\s*pass|azul\s*fidelidade|esfera)/i);
    if (programMatch) result.program = programMatch[1];

    // Detect promotion type
    const typeMatch = rawContent.match(
      /(transferência|transferencia|transfer|compra|purchase|bônus|bonus|resgate|redemption|parceria|cashback)/i,
    );
    if (typeMatch) result.promotionType = typeMatch[1];

    return result;
  }
}

// ─── Hash Utility ──────────────────────────────────────────────

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
