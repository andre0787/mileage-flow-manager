/**
 * P12.6-17 — Promotion Validation
 *
 * Antes de publicar uma promoção, verificar:
 *   promotion exists? date valid? still active? source trustworthy?
 *   terms available? program correct? bonus consistent?
 *   eligibility understood? duplicate?
 *
 * Status: HIGH / MEDIUM / LOW confidence.
 * Promoções de baixa confiança não são apresentadas como fato confirmado.
 */

import type { Promotion, ConfidenceLevel, PromotionSource, PromotionStatus } from "./types";
import { getSourceTrustLevel } from "./types";

// ─── Validation Result ─────────────────────────────────────────

export interface ValidationResult {
  validationId: string;
  promotionId: string;
  overallConfidence: ConfidenceLevel;
  checks: PromotionValidationCheck[];
  passed: boolean;
  validatedAt: string;
  warnings: string[];
}

export interface PromotionValidationCheck {
  name: string;
  passed: boolean;
  confidence: ConfidenceLevel;
  detail: string;
  severity: "info" | "warning" | "error" | "critical";
}

// ─── Promotion Validator ───────────────────────────────────────

export class PromotionValidator {
  /**
   * Validate a promotion before publication.
   */
  validate(promotion: Partial<Promotion>, source: PromotionSource): ValidationResult {
    const checks: PromotionValidationCheck[] = [];
    const warnings: string[] = [];
    const validationId = `val-${promotion.id || "unknown"}-${Date.now()}`;

    // 1. Promotion exists
    checks.push(this.checkExists(promotion));

    // 2. Date valid
    checks.push(this.checkDates(promotion));

    // 3. Still active
    checks.push(this.checkActive(promotion));

    // 4. Source trustworthy
    checks.push(this.checkSourceTrust(source));

    // 5. Terms available
    checks.push(this.checkTerms(promotion));

    // 6. Program correct
    checks.push(this.checkProgram(promotion));

    // 7. Bonus consistent
    checks.push(this.checkBonusConsistency(promotion));

    // 8. Eligibility understood
    checks.push(this.checkEligibility(promotion));

    // Calculate overall confidence
    const passedChecks = checks.filter((c) => c.passed);
    const totalChecks = checks.length;
    const passRate = totalChecks > 0 ? passedChecks.length / totalChecks : 0;

    const sourceTrustScore = getSourceTrustLevel(source);
    const trustFactor =
      sourceTrustScore === 0
        ? 1.0
        : sourceTrustScore === 1
          ? 0.9
          : sourceTrustScore === 2
            ? 0.7
            : 0.5;

    const overallScore = passRate * 0.7 + trustFactor * 0.3;

    let overallConfidence: ConfidenceLevel;
    if (overallScore >= 0.8) overallConfidence = "HIGH";
    else if (overallScore >= 0.5) overallConfidence = "MEDIUM";
    else overallConfidence = "LOW";

    // Collect warnings
    for (const check of checks) {
      if (
        check.severity === "warning" ||
        check.severity === "error" ||
        check.severity === "critical"
      ) {
        warnings.push(`${check.name}: ${check.detail}`);
      }
    }

    return {
      validationId,
      promotionId: promotion.id || "unknown",
      overallConfidence,
      checks,
      passed: overallConfidence !== "LOW",
      validatedAt: new Date().toISOString(),
      warnings,
    };
  }

  // ─── Individual Checks ──────────────────────────────────────

  private checkExists(promotion: Partial<Promotion>): PromotionValidationCheck {
    const exists = !!promotion.id && !!promotion.title;
    return {
      name: "promotion_exists",
      passed: exists,
      confidence: exists ? "HIGH" : "LOW",
      detail: exists
        ? `Promotion ${promotion.id} exists with title`
        : "Promotion missing ID or title",
      severity: exists ? "info" : "critical",
    };
  }

  private checkDates(promotion: Partial<Promotion>): PromotionValidationCheck {
    const hasStart = !!promotion.startDate;
    const hasEnd = !!promotion.endDate;

    if (!hasStart && !hasEnd) {
      return {
        name: "date_valid",
        passed: false,
        confidence: "LOW",
        detail: "No dates provided",
        severity: "warning",
      };
    }

    if (hasStart && hasEnd) {
      const start = new Date(promotion.startDate!);
      const end = new Date(promotion.endDate!);
      const valid = start < end;

      return {
        name: "date_valid",
        passed: valid,
        confidence: valid ? "HIGH" : "LOW",
        detail: valid
          ? `Valid date range: ${promotion.startDate} to ${promotion.endDate}`
          : `Invalid dates: start ${promotion.startDate} > end ${promotion.endDate}`,
        severity: valid ? "info" : "error",
      };
    }

    return {
      name: "date_valid",
      passed: true,
      confidence: "MEDIUM",
      detail: `Partial dates: start=${promotion.startDate || "N/A"}, end=${promotion.endDate || "N/A"}`,
      severity: "warning",
    };
  }

  private checkActive(promotion: Partial<Promotion>): PromotionValidationCheck {
    const now = new Date();
    const endDate = promotion.endDate ? new Date(promotion.endDate) : null;
    const startDate = promotion.startDate ? new Date(promotion.startDate) : null;

    if (endDate && endDate < now) {
      return {
        name: "still_active",
        passed: false,
        confidence: "HIGH",
        detail: `Promotion expired on ${promotion.endDate}`,
        severity: "error",
      };
    }

    if (startDate && startDate > now) {
      return {
        name: "still_active",
        passed: true,
        confidence: "MEDIUM",
        detail: `Promotion starts on ${promotion.startDate} — future`,
        severity: "info",
      };
    }

    return {
      name: "still_active",
      passed: true,
      confidence: endDate ? "HIGH" : "MEDIUM",
      detail: "Promotion is currently active",
      severity: "info",
    };
  }

  private checkSourceTrust(source: PromotionSource): PromotionValidationCheck {
    const trustLevel = getSourceTrustLevel(source);
    const isTrusted = trustLevel <= 1;

    return {
      name: "source_trustworthy",
      passed: isTrusted,
      confidence: isTrusted ? "HIGH" : trustLevel === 2 ? "MEDIUM" : "LOW",
      detail: `Source type: ${source.type} (${source.program}), reliability: ${source.reliability}`,
      severity: isTrusted ? "info" : trustLevel === 2 ? "warning" : "error",
    };
  }

  private checkTerms(promotion: Partial<Promotion>): PromotionValidationCheck {
    const hasTerms = !!promotion.terms && promotion.terms.length > 10;

    return {
      name: "terms_available",
      passed: hasTerms,
      confidence: hasTerms ? "HIGH" : "MEDIUM",
      detail: hasTerms
        ? `Terms available (${promotion.terms!.length} chars)`
        : "Terms not available or too short",
      severity: hasTerms ? "info" : "warning",
    };
  }

  private checkProgram(promotion: Partial<Promotion>): PromotionValidationCheck {
    const validPrograms = ["Livelo", "Smiles", "LATAM Pass", "Azul Fidelidade", "Esfera"];
    const isCorrect = !!promotion.program && validPrograms.includes(promotion.program);

    return {
      name: "program_correct",
      passed: isCorrect,
      confidence: isCorrect ? "HIGH" : "LOW",
      detail: isCorrect
        ? `Program: ${promotion.program}`
        : `Invalid or missing program: ${promotion.program || "N/A"}`,
      severity: isCorrect ? "info" : "error",
    };
  }

  private checkBonusConsistency(promotion: Partial<Promotion>): PromotionValidationCheck {
    const hasBonus = promotion.bonusPercentage !== undefined && promotion.bonusPercentage !== null;
    const bonusValid =
      hasBonus && promotion.bonusPercentage! >= 0 && promotion.bonusPercentage! <= 500;

    return {
      name: "bonus_consistent",
      passed: hasBonus ? bonusValid : false,
      confidence: hasBonus && bonusValid ? "HIGH" : hasBonus ? "LOW" : "MEDIUM",
      detail: hasBonus
        ? bonusValid
          ? `Bonus: ${promotion.bonusPercentage}%`
          : `Suspicious bonus: ${promotion.bonusPercentage}%`
        : "No bonus information",
      severity: hasBonus && bonusValid ? "info" : hasBonus ? "warning" : "warning",
    };
  }

  private checkEligibility(promotion: Partial<Promotion>): PromotionValidationCheck {
    const hasEligibility = promotion.eligibility && promotion.eligibility.length > 0;

    return {
      name: "eligibility_understood",
      passed: !!hasEligibility,
      confidence: hasEligibility ? "HIGH" : "MEDIUM",
      detail: hasEligibility
        ? `${promotion.eligibility!.length} eligibility rules`
        : "No eligibility information",
      severity: hasEligibility ? "info" : "warning",
    };
  }
}
