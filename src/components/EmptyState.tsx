import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: ButtonProps["variant"]
  }
  step?: { current: number; total: number }
  className?: string
}

/**
 * Estado vazio com narrativa — guia o usuário com tom convidativo.
 * storytelling: cada empty state é um "próximo passo", não um beco sem saída.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  step,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center animate-appear",
        className,
      )}
    >
      {step && (
        <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-3">
          Passo {step.current} de {step.total}
        </span>
      )}
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 ring-1 ring-primary/10">
        <Icon className="h-8 w-8 text-primary/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground font-display mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant ?? "default"}
          className={cn(
            "gap-2",
            action.variant !== "outline" && "bg-gradient-primary hover:opacity-90",
          )}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
