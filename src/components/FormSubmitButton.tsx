import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * FormSubmitButton — botão de submit com feedback instantâneo (React 19, rule-45).
 *
 * Usa `useFormStatus` para derivar o estado `pending` do <form action> pai —
 * sem estados de carregamento manuais. Deve ser renderizado DENTRO de um
 * <form> que usa form action (useActionState).
 */
export function FormSubmitButton({
  children,
  className,
  pendingLabel = "Salvando...",
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className={className}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
