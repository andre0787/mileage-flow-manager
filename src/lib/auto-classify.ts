/**
 * auto-classify.ts — Classificação inteligente de entradas de milhas/pontos.
 *
 * Analisa o texto da origem, descrição e metadados para sugerir categorias,
 * agilizando o preenchimento de formulários.
 *
 * Uso:
 *   import { classifyEntry } from "@/lib/auto-classify";
 *   const sugestao = classifyEntry("Azul", "Viagem SP-RJ", 10000);
 *
 * ponytail: sem dependências externas, zero deps
 */

export interface ClassifierSuggestion {
  /** Categoria sugerida */
  category: "compra" | "transferencia" | "bonus" | "viagem" | "desconhecido";
  /** Confiança da classificação (0-1) */
  confidence: number;
  /** Tags extraídas da entrada */
  tags: string[];
  /** Programa sugerido (se identificável) */
  program?: string;
  /** Ícone/material-icon sugerido */
  icon?: string;
}

// ── Dicionários de classificação ────────────────────────────────────

type KeywordMatrix = Record<string, { category: ClassifierSuggestion["category"]; icon: string }>;

const COMPRA_KEYWORDS: KeywordMatrix = {
  compra: { category: "compra", icon: "shopping-cart" },
  comprar: { category: "compra", icon: "shopping-cart" },
  aquisição: { category: "compra", icon: "shopping-cart" },
  aquisicao: { category: "compra", icon: "shopping-cart" },
  "cesta básica": { category: "compra", icon: "shopping-cart" },
  clube: { category: "compra", icon: "card-membership" },
  assinatura: { category: "compra", icon: "card-membership" },
  pagamento: { category: "compra", icon: "payment" },
  pix: { category: "compra", icon: "payment" },
  boleto: { category: "compra", icon: "receipt" },
};

const TRANSFERENCIA_KEYWORDS: KeywordMatrix = {
  transferência: { category: "transferencia", icon: "swap-horiz" },
  transferencia: { category: "transferencia", icon: "swap-horiz" },
  transferir: { category: "transferencia", icon: "swap-horiz" },
  "de:": { category: "transferencia", icon: "swap-horiz" },
  "para:": { category: "transferencia", icon: "swap-horiz" },
  conversão: { category: "transferencia", icon: "swap-horiz" },
  conversao: { category: "transferencia", icon: "swap-horiz" },
  carrinho: { category: "transferencia", icon: "add-shopping-cart" },
};

const BONUS_KEYWORDS: KeywordMatrix = {
  bônus: { category: "bonus", icon: "celebration" },
  bonus: { category: "bonus", icon: "celebration" },
  promoção: { category: "bonus", icon: "celebration" },
  promocao: { category: "bonus", icon: "celebration" },
  campanha: { category: "bonus", icon: "campaign" },
  promocional: { category: "bonus", icon: "campaign" },
  extra: { category: "bonus", icon: "add-circle" },
  "bônus extra": { category: "bonus", icon: "add-circle" },
  cortesia: { category: "bonus", icon: "card-giftcard" },
  brinde: { category: "bonus", icon: "card-giftcard" },
};

const VIAGEM_KEYWORDS: KeywordMatrix = {
  viagem: { category: "viagem", icon: "flight" },
  vôo: { category: "viagem", icon: "flight" },
  voo: { category: "viagem", icon: "flight" },
  passagem: { category: "viagem", icon: "flight" },
  hotel: { category: "viagem", icon: "hotel" },
  reserva: { category: "viagem", icon: "calendar-check" },
  emissão: { category: "viagem", icon: "flight-takeoff" },
  emissao: { category: "viagem", icon: "flight-takeoff" },
  upgrade: { category: "viagem", icon: "arrow-upward" },
  milhas: { category: "viagem", icon: "flight" },
  trecho: { category: "viagem", icon: "flight" },
};

const ALL_KEYWORDS: KeywordMatrix = {
  ...COMPRA_KEYWORDS,
  ...TRANSFERENCIA_KEYWORDS,
  ...BONUS_KEYWORDS,
  ...VIAGEM_KEYWORDS,
};

// Programas reconhecidos e suas categorias padrão
const PROGRAM_PATTERNS: Record<string, { program: string; defaultCategory: ClassifierSuggestion["category"] }> = {
  azul: { program: "Azul Fidelidade", defaultCategory: "compra" },
  "azul fidelidade": { program: "Azul Fidelidade", defaultCategory: "compra" },
  todes: { program: "Todes", defaultCategory: "compra" },
  toddes: { program: "Todes", defaultCategory: "compra" },
  latam: { program: "LATAM Pass", defaultCategory: "compra" },
  "latam pass": { program: "LATAM Pass", defaultCategory: "compra" },
  smile: { program: "Smiles", defaultCategory: "compra" },
  gol: { program: "Smiles", defaultCategory: "compra" },
  "gol smile": { program: "Smiles", defaultCategory: "compra" },
  "smiles gol": { program: "Smiles", defaultCategory: "compra" },
  "tudo azul": { program: "TudoAzul", defaultCategory: "compra" },
  tudoazul: { program: "TudoAzul", defaultCategory: "compra" },
  "livelo": { program: "Livelo", defaultCategory: "compra" },
  "esfera": { program: "Esfera", defaultCategory: "compra" },
  "dotz": { program: "Dotz", defaultCategory: "compra" },
};

// ── Funções de classificação ─────────────────────────────────────────

/**
 * Normaliza texto para comparação: lowercase, remove acentos, trim.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s:-]/g, "")
    .trim();
}

/**
 * Extrai tokens relevantes do texto.
 */
function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Classifica uma entrada baseada em texto livre.
 */
export function classifyByText(text: string): {
  category: ClassifierSuggestion["category"];
  confidence: number;
  tags: string[];
  icon: string;
} {
  const normalized = normalize(text);
  const tokens = tokenize(text);
  const matches: { category: ClassifierSuggestion["category"]; weight: number; icon: string }[] = [];

  // Match de keywords
  for (const [keyword, meta] of Object.entries(ALL_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      matches.push({ category: meta.category, weight: 1, icon: meta.icon });
    }
  }

  // Match de programas
  for (const [pattern, meta] of Object.entries(PROGRAM_PATTERNS)) {
    if (normalized.includes(pattern)) {
      matches.push({ category: meta.defaultCategory, weight: 0.5, icon: "stars" });
    }
  }

  if (matches.length === 0) {
    return { category: "desconhecido", confidence: 0, tags: tokens, icon: "help" };
  }

  // Agregação: categoria mais frequente
  const counts: Record<string, { count: number; icon: string }> = {};
  for (const m of matches) {
    if (!counts[m.category]) counts[m.category] = { count: 0, icon: m.icon };
    counts[m.category].count += m.weight;
    // pega o ícone da match de maior peso
    if (m.weight >= 1) counts[m.category].icon = m.icon;
  }

  const best = Object.entries(counts).sort((a, b) => b[1].count - a[1].count)[0];

  const totalWeight = matches.reduce((s, m) => s + m.weight, 0);
  const confidence = Math.min(best[1].count / totalWeight, 1);

  return {
    category: best[0] as ClassifierSuggestion["category"],
    confidence: Math.round(confidence * 100) / 100,
    tags: tokens,
    icon: best[1].icon,
  };
}

/**
 * Identifica o programa com base no texto.
 */
export function detectProgram(text: string): string | undefined {
  const normalized = normalize(text);
  for (const [pattern, meta] of Object.entries(PROGRAM_PATTERNS)) {
    if (normalized.includes(pattern)) {
      return meta.program;
    }
  }
  return undefined;
}

/**
 * Classificação completa de uma entrada.
 */
export function classifyEntry(
  origemNome: string,
  descricao?: string | null,
  amount?: number
): ClassifierSuggestion {
  const text = [origemNome, descricao].filter(Boolean).join(" ");
  const byText = classifyByText(text);
  const program = detectProgram(text);

  // Regras de negócio
  if (amount && amount > 50000 && byText.category === "desconhecido") {
    // Volumes altos sem classificação → provável transferência
    return {
      category: "transferencia",
      confidence: 0.4,
      tags: byText.tags,
      program,
      icon: "swap-horiz",
    };
  }

  return {
    category: byText.category,
    confidence: byText.confidence,
    tags: byText.tags,
    program,
    icon: byText.icon,
  };
}

/**
 * Retorna label amigável para a categoria.
 */
export function categoryLabel(category: ClassifierSuggestion["category"]): string {
  const labels: Record<string, string> = {
    compra: "Compra",
    transferencia: "Transferência",
    bonus: "Bônus",
    viagem: "Viagem",
    desconhecido: "Outro",
  };
  return labels[category] || "Outro";
}

/**
 * Retorna cor para a categoria (utilitário de UI).
 */
export function categoryColor(category: ClassifierSuggestion["category"]): string {
  const colors: Record<string, string> = {
    compra: "#3b82f6", // blue
    transferencia: "#8b5cf6", // purple
    bonus: "#10b981", // green
    viagem: "#f59e0b", // amber
    desconhecido: "#6b7280", // gray
  };
  return colors[category] || "#6b7280";
}
