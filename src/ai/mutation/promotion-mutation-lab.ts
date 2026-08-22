/**
 * P12.6-23 — Promotion Mutation Lab
 *
 * Criar dados promocionais deliberadamente defeituosos:
 *   wrong date, expired marked active, wrong bonus percentage,
 *   duplicate promotion, conflicting terms, incomplete promotion,
 *   wrong program, invalid source, fake/untrusted source.
 *
 * Fluxo: Promotion Mutation → Scout → Extraction → Validation → Dedup → Alert
 * Medir: detection recall, validation precision, false positive, false negative,
 *        dedup accuracy, alert accuracy.
 * O agente NÃO recebe o gabarito.
 */

import type { Promotion, PromotionSource, ConfidenceLevel } from "./promotion/types";

// ─── Promotion Mutation Types ──────────────────────────────────

export type PromotionMutationType =
  | "wrong_date"
  | "expired_marked_active"
  | "wrong_bonus_percentage"
  | "duplicate_promotion"
  | "conflicting_terms"
  | "incomplete_promotion"
  | "wrong_program"
  | "invalid_source"
  | "fake_source";

export interface PromotionMutation {
  id: string;
  type: PromotionMutationType;
  description: string;
  promotion: Partial<Promotion>;
  expectedDetection: string;
  expectedValidation: string;
}

// ─── Promotion Mutation Catalog ────────────────────────────────

export const PROMOTION_MUTATION_CATALOG: PromotionMutation[] = [
  {
    id: "PM01",
    type: "wrong_date",
    description: "Promoção com data de término no passado",
    promotion: {
      id: "promo-wrong-date",
      title: "Bônus Livelo 100%",
      program: "Livelo",
      startDate: "2025-01-01",
      endDate: "2025-06-30", // expired
      bonusPercentage: 100,
      status: "active", // wrong — should be expired
    },
    expectedDetection: "should detect expired status mismatch",
    expectedValidation: "should reject as LOW confidence",
  },
  {
    id: "PM02",
    type: "expired_marked_active",
    description: "Promoção expirada marcada como ativa",
    promotion: {
      id: "promo-expired-active",
      title: "Smiles Bônus 50%",
      program: "Smiles",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      bonusPercentage: 50,
      status: "active", // wrong — expired
    },
    expectedDetection: "should detect expired date vs active status",
    expectedValidation: "should flag as suspicious",
  },
  {
    id: "PM03",
    type: "wrong_bonus_percentage",
    description: "Percentual de bônus incorreto (10x o real)",
    promotion: {
      id: "promo-wrong-bonus",
      title: "Transferência LATAM 200%",
      program: "LATAM Pass",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      bonusPercentage: 2000, // 10x the real 200%
      status: "active",
    },
    expectedDetection: "should flag suspicious bonus percentage",
    expectedValidation: "should warn about unusual bonus",
  },
  {
    id: "PM04",
    type: "duplicate_promotion",
    description: "Mesma promoção com dados idênticos em duas fontes",
    promotion: {
      id: "promo-dup-1",
      title: "Azul Fidelidade 30% Bônus",
      program: "Azul Fidelidade",
      startDate: "2026-03-01",
      endDate: "2026-06-30",
      bonusPercentage: 30,
      status: "active",
    },
    expectedDetection: "should deduplicate with existing",
    expectedValidation: "should merge into single promotion",
  },
  {
    id: "PM05",
    type: "conflicting_terms",
    description: "Termos conflitantes entre título e descrição",
    promotion: {
      id: "promo-conflict",
      title: "Bônus 100% para novos membros",
      program: "Livelo",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      bonusPercentage: 100,
      terms: "Oferta válida apenas para membros existentes há mais de 1 ano",
      eligibility: ["existing_members_1yr"],
      status: "active",
    },
    expectedDetection: "should flag conflicting eligibility",
    expectedValidation: "should downgrade confidence",
  },
  {
    id: "PM06",
    type: "incomplete_promotion",
    description: "Promoção com dados incompletos (sem datas, sem bônus)",
    promotion: {
      id: "promo-incomplete",
      title: "Promoção Especial",
      program: "Smiles",
      status: "active",
    },
    expectedDetection: "should flag missing critical fields",
    expectedValidation: "should be LOW confidence",
  },
  {
    id: "PM07",
    type: "wrong_program",
    description: "Promoção de programa errado (dados de Livelo em Smiles)",
    promotion: {
      id: "promo-wrong-program",
      title: "Livelo Bônus Transferência",
      program: "Smiles", // wrong — title says Livelo
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      bonusPercentage: 80,
      status: "active",
    },
    expectedDetection: "should detect program/title mismatch",
    expectedValidation: "should flag inconsistency",
  },
  {
    id: "PM08",
    type: "invalid_source",
    description: "Fonte não confiável para promoção de alto valor",
    promotion: {
      id: "promo-invalid-source",
      title: "200% Bônus Transferência",
      program: "LATAM Pass",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      bonusPercentage: 200,
      status: "active",
    },
    expectedDetection: "should flag high bonus from untrusted source",
    expectedValidation: "should downgrade confidence based on source",
  },
  {
    id: "PM09",
    type: "fake_source",
    description: "Fonte falsa/forjada para promoção inexistente",
    promotion: {
      id: "promo-fake-source",
      title: "Cashback 500% Milhas",
      program: "Esfera",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      bonusPercentage: 500,
      status: "active",
    },
    expectedDetection: "should verify source authenticity",
    expectedValidation: "should reject fake/unverifiable source",
  },
  {
    id: "PM10",
    type: "wrong_date",
    description: "Data de início posterior à data de término",
    promotion: {
      id: "promo-inverted-dates",
      title: "Bônus Especial",
      program: "LATAM Pass",
      startDate: "2026-12-31",
      endDate: "2026-01-01", // inverted
      bonusPercentage: 50,
      status: "active",
    },
    expectedDetection: "should detect inverted date range",
    expectedValidation: "should reject as invalid dates",
  },
];

// ─── Promotion Mutation Lab Runner ─────────────────────────────

export interface PromotionMutationResult {
  mutationId: string;
  detected: boolean;
  validated: boolean;
  deduplicationCorrect: boolean;
  alertTriggered: boolean;
  confidence: ConfidenceLevel;
  duration: number;
}

export class PromotionMutationLab {
  private results: PromotionMutationResult[] = [];

  /**
   * Execute the full pipeline on a mutated promotion.
   */
  async evaluateMutation(
    mutation: PromotionMutation,
    _pipeline: unknown,
  ): Promise<PromotionMutationResult> {
    const startTime = Date.now();

    // The actual pipeline execution would happen here.
    // This records the structure for evaluation.
    const result: PromotionMutationResult = {
      mutationId: mutation.id,
      detected: false,
      validated: false,
      deduplicationCorrect: false,
      alertTriggered: false,
      confidence: "LOW",
      duration: Date.now() - startTime,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Calculate detection recall.
   */
  getDetectionRecall(): number {
    if (this.results.length === 0) return 0;
    const detected = this.results.filter((r) => r.detected).length;
    return detected / this.results.length;
  }

  /**
   * Calculate validation precision.
   */
  getValidationPrecision(): number {
    if (this.results.length === 0) return 0;
    const validatedCorrectly = this.results.filter(
      (r) => r.validated && r.confidence !== "HIGH",
    ).length;
    return validatedCorrectly / this.results.length;
  }

  /**
   * Get all results.
   */
  getAllResults(): PromotionMutationResult[] {
    return [...this.results];
  }

  /**
   * Get catalog.
   */
  getCatalog(): PromotionMutation[] {
    return PROMOTION_MUTATION_CATALOG;
  }
}
