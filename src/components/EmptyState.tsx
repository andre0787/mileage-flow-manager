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
  className?: string
}

/**
 * Componente de estado vazio com ilustração (ícone), título,
 * descrição opcional e CTA opcional.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center animate-appear",
        className,
      )}
    >
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground font-display mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
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
