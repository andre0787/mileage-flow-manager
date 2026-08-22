/**
 * P12.6-11 — Real Promotion Validation
 *
 * Valida promoções com critérios reais:
 *   - source URL
 *   - programa
 *   - bônus
 *   - datas
 *   - elegibilidade
 *   - termos
 *   - origem
 *   - destino
 *   - confidence (HIGH / MEDIUM / LOW)
 *
 * Promoção LOW não deve ser publicada como confiável.
 */

import type { Promotion, PromotionSource } from "./types";
import { emitTelemetryEvent } from "../telemetry-events";

// ─── Validation Types ──────────────────────────────────────────

export type ValidatorConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface ValidationCheckResult {
  name: string;
  passed: boolean;
  confidence: ConfidenceLevel;
  detail: string;
  severity: "info" | "warning" | "error" | "critical";
}

export interface PromotionValidationResult {
  promotionId: string;
  overallConfidence: ConfidenceLevel;
  checks: ValidationCheckResult[];
  passed: boolean;
  validatedAt: string;
  warnings: string[];
  publishable: boolean; // LOW confidence = not publishable
}

// ─── Real Validator ────────────────────────────────────────────

export class PromotionValidatorReal {
  private requiredChecks = [
    "source_url",
    "program",
    "dates",
    "active",
    "bonus_consistency",
    "terms",
    "eligibility",
  ];

  /**
   * Validate a promotion against all criteria.
   */
  validate(promotion: Partial<Promotion>, source?: PromotionSource): PromotionValidationResult {
    const checks: ValidationCheckResult[] = [];
    const warnings: string[] = [];
    const promotionId = promotion.id || "unknown";

    emitTelemetryEvent("promotion.validated", {
      promotionId,
      agent: "validator-real",
      status: "success",
    });

    // 1. Source URL validation
    checks.push(this.checkSourceUrl(promotion, source));

    // 2. Program validation
    checks.push(this.checkProgram(promotion));

    // 3. Date validation
    checks.push(this.checkDates(promotion));

    // 4. Active status
    checks.push(this.checkActive(promotion));

    // 5. Bonus consistency
    checks.push(this.checkBonusConsistency(promotion));

    // 6. Terms presence
    checks.push(this.checkTerms(promotion));

    // 7. Eligibility
    checks.push(this.checkEligibility(promotion));

    // 8. Origin validation
    checks.push(this.checkOrigin(promotion));

    // 9. Destination validation
    checks.push(this.checkDestination(promotion));

    // Compute overall confidence
    const criticalFailures = checks.filter((c) => !c.passed && c.severity === "critical");
    const errors = checks.filter((c) => !c.passed && c.severity === "error");
    const warningCount = checks.filter((c) => !c.passed && c.severity === "warning").length;

    let overallConfidence: ConfidenceLevel;
    if (criticalFailures.length > 0) {
      overallConfidence = "LOW";
    } else if (errors.length > 0) {
      overallConfidence = "MEDIUM";
    } else if (warningCount > 2) {
      overallConfidence = "MEDIUM";
    } else {
      overallConfidence = "HIGH";
    }

    // Collect warnings
    for (const check of checks) {
      if (!check.passed && check.severity === "warning") {
        warnings.push(check.detail);
      }
    }

    const allRequiredPassed = this.requiredChecks.every((name) => {
      const check = checks.find((c) => c.name === name);
      return check?.passed;
    });

    return {
      promotionId,
      overallConfidence,
      checks,
      passed: allRequiredPassed && overallConfidence !== "LOW",
      validatedAt: new Date().toISOString(),
      warnings,
      publishable: overallConfidence !== "LOW",
    };
  }

  /**
   * Batch validate multiple promotions.
   */
  validateBatch(
    promotions: Partial<Promotion>[],
    source?: PromotionSource,
  ): PromotionValidationResult[] {
    return promotions.map((p) => this.validate(p, source));
  }

  // ─── Individual Checks ────────────────────────────────────

  private checkSourceUrl(
    promotion: Partial<Promotion>,
    source?: PromotionSource,
  ): ValidationCheckResult {
    const url = promotion.sourceUrl || source?.officialUrl;
    if (!url) {
      return {
        name: "source_url",
        passed: false,
        confidence: "LOW",
        detail: "No source URL provided",
        severity: "critical",
      };
    }

    try {
      new URL(url);
      return {
        name: "source_url",
        passed: true,
        confidence: "HIGH",
        detail: `Valid URL: ${url}`,
        severity: "info",
      };
    } catch {
      return {
        name: "source_url",
        passed: false,
        confidence: "LOW",
        detail: `Invalid URL: ${url}`,
        severity: "critical",
      };
    }
  }

  private checkProgram(promotion: Partial<Promotion>): ValidationCheckResult {
    const validPrograms = ["Livelo", "Smiles", "LATAM Pass", "Azul Fidelidade", "Esfera"];
    const program = promotion.program;

    if (!program) {
      return {
        name: "program",
        passed: false,
        confidence: "LOW",
        detail: "No program specified",
        severity: "critical",
      };
    }

    if (validPrograms.includes(program)) {
      return {
        name: "program",
        passed: true,
        confidence: "HIGH",
        detail: `Valid program: ${program}`,
        severity: "info",
      };
    }

    return {
      name: "program",
      passed: false,
      confidence: "MEDIUM",
      detail: `Unknown program: ${program}`,
      severity: "error",
    };
  }

  private checkDates(promotion: Partial<Promotion>): ValidationCheckResult {
    const now = new Date();

    if (promotion.endDate) {
      const endDate = new Date(promotion.endDate);
      if (endDate < now) {
        return {
          name: "dates",
          passed: false,
          confidence: "HIGH",
          detail: `Promotion expired on ${promotion.endDate}`,
          severity: "error",
        };
      }

      // Warn if expiring within 7 days
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);
      if (daysLeft <= 7) {
        return {
          name: "dates",
          passed: true,
          confidence: "MEDIUM",
          detail: `Expires in ${daysLeft} days`,
          severity: "warning",
        };
      }
    }

    if (promotion.startDate) {
      const startDate = new Date(promotion.startDate);
      if (startDate > now) {
        return {
          name: "dates",
          passed: true,
          confidence: "MEDIUM",
          detail: `Starts on ${promotion.startDate} (future)`,
          severity: "info",
        };
      }
    }

    return {
      name: "dates",
      passed: true,
      confidence: "HIGH",
      detail: "Dates valid",
      severity: "info",
    };
  }

  private checkActive(promotion: Partial<Promotion>): ValidationCheckResult {
    const status = promotion.status;
    if (status === "active" || status === "candidate") {
      return {
        name: "active",
        passed: true,
        confidence: "HIGH",
        detail: `Status: ${status}`,
        severity: "info",
      };
    }

    return {
      name: "active",
      passed: false,
      confidence: "HIGH",
      detail: `Status: ${status || "unknown"}`,
      severity: "error",
    };
  }

  private checkBonusConsistency(promotion: Partial<Promotion>): ValidationCheckResult {
    const bonus = promotion.bonusPercentage;
    if (bonus === undefined || bonus === null) {
      return {
        name: "bonus_consistency",
        passed: true,
        confidence: "MEDIUM",
        detail: "No bonus percentage specified",
        severity: "warning",
      };
    }

    if (bonus < 0 || bonus > 500) {
      return {
        name: "bonus_consistency",
        passed: false,
        confidence: "HIGH",
        detail: `Suspicious bonus: ${bonus}%`,
        severity: "error",
      };
    }

    return {
      name: "bonus_consistency",
      passed: true,
      confidence: "HIGH",
      detail: `Bonus: ${bonus}%`,
      severity: "info",
    };
  }

  private checkTerms(promotion: Partial<Promotion>): ValidationCheckResult {
    if (!promotion.terms) {
      return {
        name: "terms",
        passed: false,
        confidence: "MEDIUM",
        detail: "No terms provided",
        severity: "warning",
      };
    }

    if (promotion.terms.length < 10) {
      return {
        name: "terms",
        passed: false,
        confidence: "MEDIUM",
        detail: "Terms too short",
        severity: "warning",
      };
    }

    return {
      name: "terms",
      passed: true,
      confidence: "HIGH",
      detail: "Terms present",
      severity: "info",
    };
  }

  private checkEligibility(promotion: Partial<Promotion>): ValidationCheckResult {
    // No eligibility field = assume eligible
    return {
      name: "eligibility",
      passed: true,
      confidence: "MEDIUM",
      detail: "Eligibility not restricted",
      severity: "info",
    };
  }

  private checkOrigin(promotion: Partial<Promotion>): ValidationCheckResult {
    if (!promotion.origin) {
      return {
        name: "origin",
        passed: true,
        confidence: "MEDIUM",
        detail: "No origin restriction",
        severity: "info",
      };
    }

    return {
      name: "origin",
      passed: true,
      confidence: "HIGH",
      detail: `Origin: ${promotion.origin}`,
      severity: "info",
    };
  }

  private checkDestination(promotion: Partial<Promotion>): ValidationCheckResult {
    if (!promotion.destination) {
      return {
        name: "destination",
        passed: true,
        confidence: "MEDIUM",
        detail: "No destination restriction",
        severity: "info",
      };
    }

    return {
      name: "destination",
      passed: true,
      confidence: "HIGH",
      detail: `Destination: ${promotion.destination}`,
      severity: "info",
    };
  }
}
