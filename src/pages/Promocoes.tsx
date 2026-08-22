/**
 * P12.6-20 — Promotion UI
 *
 * Aba "Promoções" com:
 *   🔥 Em destaque
 *   Filtros por programa
 *   Tipos: Transferência, Compra, Bônus, Resgate
 *   Ordenação: Mais recentes, Maior bônus, Expira primeiro
 *   Status: 🟢 Verificada, 🟡 Evidência parcial, 🔴 Expirada
 *   Cada promoção: status, confidence, source, validity, terms
 */

import { useState, useMemo } from "react";
import { promotionsApi } from "@/features/promotions";

// ─── Types (local copies to avoid circular deps) ───────────────

type SourceHealth = "FRESH" | "STALE" | "DEGRADED" | "OFFLINE";
type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
type PromotionStatus = "candidate" | "active" | "updated" | "expired" | "rejected";
type PromotionType = "transferencia" | "compra" | "bonus" | "resgate" | "parceria" | "cashback";

interface PromotionItem {
  id: string;
  program: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  bonusPercentage?: number;
  promotionType: PromotionType;
  confidence: ConfidenceLevel;
  status: PromotionStatus;
  freshness: SourceHealth;
  sourceUrl: string;
  terms?: string;
}

// ─── Filter Options ────────────────────────────────────────────

const PROGRAMS = ["Todos", "Livelo", "Smiles", "LATAM Pass", "Azul Fidelidade", "Esfera"] as const;
const TYPES = ["Todos", "Transferência", "Compra", "Bônus", "Resgate"] as const;
const SORT_OPTIONS = ["Mais recentes", "Maior bônus", "Expira primeiro"] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

// ─── Status Badge ──────────────────────────────────────────────

function StatusBadge({ confidence, freshness }: { confidence: ConfidenceLevel; freshness: SourceHealth }) {
  const getStatusIcon = () => {
    if (freshness === "OFFLINE") return "🔴";
    if (confidence === "HIGH" && freshness === "FRESH") return "🟢";
    if (confidence === "MEDIUM") return "🟡";
    return "🔴";
  };

  const getLabel = () => {
    if (freshness === "OFFLINE") return "Offline";
    if (confidence === "HIGH" && freshness === "FRESH") return "Verificada";
    if (confidence === "MEDIUM") return "Evidência parcial";
    if (confidence === "LOW") return "Baixa confiança";
    return "Expirada";
  };

  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span>{getStatusIcon()}</span>
      <span>{getLabel()}</span>
    </span>
  );
}

// ─── Promotion Card ────────────────────────────────────────────

function PromotionCard({ promo }: { promo: PromotionItem }) {
  const daysLeft = promo.endDate
    ? Math.ceil((new Date(promo.endDate).getTime() - Date.now()) / 86400000)
    : null;

  const isExpiring = daysLeft !== null && daysLeft <= 3 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  return (
    <div className={`border rounded-lg p-4 ${isExpired ? "opacity-60 bg-gray-50" : "bg-white"}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-500">{promo.program}</span>
            <span className="text-gray-300">→</span>
            {promo.bonusPercentage !== undefined && (
              <span className="font-bold text-blue-600">{promo.bonusPercentage}% bônus</span>
            )}
          </div>

          <h3 className="font-medium text-gray-900">{promo.title}</h3>

          {promo.description && (
            <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {promo.startDate && promo.endDate && (
              <span>
                {promo.startDate} → {promo.endDate}
              </span>
            )}
            {daysLeft !== null && daysLeft > 0 && (
              <span className={isExpiring ? "text-orange-500 font-medium" : ""}>
                termina em {daysLeft}d
              </span>
            )}
            {isExpired && <span className="text-red-500">expirada</span>}
          </div>
        </div>

        <div className="text-right">
          <StatusBadge confidence={promo.confidence} freshness={promo.freshness} />
        </div>
      </div>

      {promo.terms && (
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            Ver termos
          </summary>
          <p className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded">{promo.terms}</p>
        </details>
      )}

      <div className="mt-3 flex justify-end">
        <a
          href={promo.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:text-blue-700 underline"
        >
          Ver promoção →
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function Promocoes() {
  const [selectedProgram, setSelectedProgram] = useState<string>("Todos");
  const [selectedType, setSelectedType] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("Mais recentes");

  // Placeholder data — in production, fetched from Promotion Intelligence
  const promotions: PromotionItem[] = useMemo(
    () => [
      {
        id: "1",
        program: "Livelo",
        title: "Transferência para LATAM Pass com 100% bônus",
        description: "Ganhe o dobro de pontos ao transferir para LATAM Pass",
        startDate: "2026-08-01",
        endDate: "2026-09-30",
        bonusPercentage: 100,
        promotionType: "transferencia",
        confidence: "HIGH",
        status: "active",
        freshness: "FRESH",
        sourceUrl: "https://www.livelo.com.br/promocoes",
        terms: "Válido para transferências acima de 5.000 pontos. Limite de 100.000 pontos bônus por membro.",
      },
      {
        id: "2",
        program: "Smiles",
        title: "Bônus 50% em compras de milhas",
        description: "Compre milhas e ganhe 50% de bônus",
        startDate: "2026-08-15",
        endDate: "2026-08-25",
        bonusPercentage: 50,
        promotionType: "compra",
        confidence: "HIGH",
        status: "active",
        freshness: "FRESH",
        sourceUrl: "https://www.smiles.com.br/promocoes",
      },
      {
        id: "3",
        program: "LATAM Pass",
        title: "Bônus 80% transferência do Livelo",
        startDate: "2026-07-01",
        endDate: "2026-12-31",
        bonusPercentage: 80,
        promotionType: "transferencia",
        confidence: "MEDIUM",
        status: "active",
        freshness: "STALE",
        sourceUrl: "https://www.latamairlines.com/br/pt/latam-pass",
      },
      {
        id: "4",
        program: "Azul Fidelidade",
        title: "30% bônus em resgate de voos",
        startDate: "2026-08-01",
        endDate: "2026-08-31",
        bonusPercentage: 30,
        promotionType: "resgate",
        confidence: "HIGH",
        status: "active",
        freshness: "FRESH",
        sourceUrl: "https://www.voegol.com.br/azulfidelidade",
      },
      {
        id: "5",
        program: "Livelo",
        title: "Cashback 20% em parceiros selecionados",
        startDate: "2026-06-01",
        endDate: "2026-07-31",
        bonusPercentage: 20,
        promotionType: "cashback",
        confidence: "LOW",
        status: "expired",
        freshness: "DEGRADED",
        sourceUrl: "https://www.livelo.com.br/promocoes",
      },
    ],
    [],
  );

  // Filter and sort
  const filteredPromotions = useMemo(() => {
    let result = [...promotions];

    if (selectedProgram !== "Todos") {
      result = result.filter((p) => p.program === selectedProgram);
    }

    switch (sortBy) {
      case "Maior bônus":
        result.sort((a, b) => (b.bonusPercentage || 0) - (a.bonusPercentage || 0));
        break;
      case "Expira primeiro":
        result.sort((a, b) => {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        });
        break;
      case "Mais recentes":
      default:
        result.sort((a, b) => {
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
    }

    return result;
  }, [promotions, selectedProgram, sortBy]);

  const activePromotions = filteredPromotions.filter(
    (p) => p.status === "active" && p.freshness !== "OFFLINE",
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Promoções</h1>
        <p className="text-gray-600 mt-1">
          Central de promoções de programas de pontos e milhas
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm"
          >
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border rounded-md px-3 py-1.5 text-sm"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Featured */}
      {activePromotions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔥 Em destaque</h2>
          <div className="grid gap-4">
            {activePromotions.slice(0, 3).map((promo) => (
              <PromotionCard key={promo.id} promo={promo} />
            ))}
          </div>
        </div>
      )}

      {/* All Promotions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Todas as Promoções ({filteredPromotions.length})
        </h2>
        <div className="grid gap-4">
          {filteredPromotions.map((promo) => (
            <PromotionCard key={promo.id} promo={promo} />
          ))}
        </div>
      </div>

      {filteredPromotions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhuma promoção encontrada para os filtros selecionados.
        </div>
      )}
    </div>
  );
}
