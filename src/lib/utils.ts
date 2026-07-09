import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCPF(cpf: string) {
  const numbers = cpf.replace(/\D/g, "").slice(0, 11);
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function isTransferencia(ot: { name: string; accountType: string }): boolean {
  return ot.name === "Transferência" && ot.accountType === "milhas";
}

/** Formata valor monetário em R$ */
export function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Formata número com separador de milhar pt-BR */
export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Formata percentual com 1 casa decimal + % */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
