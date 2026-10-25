import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFeedbackForm } from "@/hooks/useFeedbackForm";
import { FeedbackSuccessState, FeedbackTypeSelector } from "./FeedbackDialogViews";

interface FeedbackDialogProps {
  children: React.ReactNode;
}

// React 19 compliance rule-45: form submit handled with useActionState in useFeedbackForm
export function FeedbackDialog({ children }: FeedbackDialogProps) {
  const {
    open,
    setOpen,
    type,
    setType,
    message,
    setMessage,
    email,
    setEmail,
    sent,
    submitError,
    formAction,
    handleClose,
  } = useFeedbackForm();

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {sent ? (
          <FeedbackSuccessState onClose={handleClose} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reportar problema / Sugerir melhoria</DialogTitle>
              <DialogDescription>
                Compartilhe sua experiência — bugs, ideias ou sugestões.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="space-y-4">
              <FeedbackTypeSelector type={type} onSelectType={setType} />

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
