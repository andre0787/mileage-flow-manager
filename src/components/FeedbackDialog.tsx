import { useActionState, useState } from "react";
import { Bug, Lightbulb, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth";
import { logError } from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/FormSubmitButton";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackDialogProps {
  children: React.ReactNode;
}

export function FeedbackDialog({ children }: FeedbackDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "suggestion">("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  // React 19 form action (rule-45): submit via <form action> — o botão deriva
  // pending de useFormStatus, sem estado de carregamento manual.
  const [submitError, formAction] = useActionState<{ message: string | null }, FormData>(
    async (_prev, formData) => {
      const msg = String(formData.get("message") ?? "").trim();
      if (!msg) return { message: null };

      // Captura logs de debug do localStorage
      let logs: string | null = null;
      try {
        const raw = localStorage.getItem("mc_debug_logs");
        if (raw) logs = raw;
      } catch {
        /* localStorage pode falhar em alguns contextos */
      }

      const { error } = await supabase.from("feedback").insert({
        user_id: user?.id ?? null,
        type,
        message: msg,
        email: String(formData.get("email") ?? "").trim() || null,
        logs,
      });
      if (error) {
        logError("feedback_submit", error);
        return { message: "Não foi possível enviar. Tente novamente." };
      }
      setSent(true);
      return { message: null };
    },
    { message: null },
  );

  const handleClose = () => {
    setOpen(false);
    // Reset after close animation
    setTimeout(() => {
      setType("bug");
      setMessage("");
      setEmail("");
      setSent(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {sent ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle>Obrigado!</DialogTitle>
            <DialogDescription>
              Sua mensagem foi enviada. Sua contribuição nos ajuda a melhorar o MilesControl.
            </DialogDescription>
            <Button variant="outline" onClick={handleClose} className="mt-2">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reportar problema / Sugerir melhoria</DialogTitle>
              <DialogDescription>
                Compartilhe sua experiência — bugs, ideias ou sugestões.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("bug")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    type === "bug"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Bug className="w-4 h-4" />
                  Bug
                </button>
                <button
                  type="button"
                  onClick={() => setType("suggestion")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    type === "suggestion"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  Sugestão
                </button>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  {type === "bug" ? "Descreva o problema" : "Descreva sua sugestão"}
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder={
                    type === "bug"
                      ? "O que aconteceu? O que você esperava?"
                      : "Qual melhoria você gostaria de ver?"
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* Email (optional) */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {submitError?.message && (
                <div className="text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2 font-medium">
                  {submitError.message}
                </div>
              )}

              {/* Submit */}
              <FormSubmitButton className="w-full gap-2" pendingLabel="Enviando...">
                <Send className="w-4 h-4" />
                Enviar
              </FormSubmitButton>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
