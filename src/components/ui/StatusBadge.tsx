/**
 * StatusBadge — Badge de status consistente para todo o app.
 *
 * Cores seguem o design system (UI-GUIDE.md):
 *   confirmada → success (green)
 *   aguardando → warning (amber)
 *   pendente   → warning (amber)
 *   pago       → primary (navy)
 *   concluido  → success (green)
 *   cancelado  → destructive (red)
 *
 * Uso:
 *   <StatusBadge status="confirmada" />
 *   <StatusBadge status="pendente" size="sm" />
 *
 * ponytail: dependência only shadcn Badge, zero estado
 */

import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

// Mapeamento de status → variante do Badge
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  confirmada: "default", // green (via --success)
  aguardando: "secondary", // amber (via --warning)
  pendente: "secondary", // amber (via --warning)
  pago: "outline", // navy (via --primary)
  concluido: "default", // green (via --success)
  cancelado: "destructive", // red
};

const STATUS_LABELS: Record<string, string> = {
  confirmada: "Confirmada",
  aguardando: "Aguardando",
  pendente: "Pendente",
  pago: "Pago",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}

export function StatusBadge({ status, size = "default", showLabel = true }: StatusBadgeProps) {
  const variant = STATUS_VARIANTS[status] || "outline";
  const label = STATUS_LABELS[status] || status;

  const sizeClasses: Record<string, string> = {
    sm: "text-xs px-1.5 py-0",
    default: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <Badge variant={variant} className={`${sizeClasses[size]} font-medium`}>
      {showLabel ? label : null}
    </Badge>
  );
}
