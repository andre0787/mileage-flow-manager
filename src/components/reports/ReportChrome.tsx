import type { ComponentType, ReactNode } from "react";
import { CardTitle } from "@/components/ui/card";

type IconType = ComponentType<{ className?: string }>;

/** Título de seção padronizado (mesmo DOM/classes em todas as abas). */
export function SectionTitle({ icon: Icon, children }: { icon: IconType; children: ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2 border-l-4 border-primary pl-3">
      <Icon className="h-5 w-5 text-primary" aria-hidden />
      {children}
    </CardTitle>
  );
}

/** Empty state padronizado das seções (mesmo texto centralizado). */
export function ReportEmpty({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground text-center py-8">{message}</p>;
}
