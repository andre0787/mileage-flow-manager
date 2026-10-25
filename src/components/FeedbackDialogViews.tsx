import { Bug, Lightbulb, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { FeedbackType } from "@/hooks/useFeedbackForm";

interface FeedbackSuccessStateProps {
  onClose: () => void;
}

export function FeedbackSuccessState({ onClose }: FeedbackSuccessStateProps) {
  return (
    <div className="py-8 text-center space-y-3">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Send className="w-6 h-6 text-primary" />
      </div>
      <DialogTitle>Obrigado!</DialogTitle>
      <DialogDescription>
        Sua mensagem foi enviada. Sua contribuição nos ajuda a melhorar o MilesControl.
      </DialogDescription>
      <Button variant="outline" onClick={onClose} className="mt-2">
        Fechar
      </Button>
    </div>
  );
}

interface FeedbackTypeSelectorProps {
  type: FeedbackType;
  onSelectType: (type: FeedbackType) => void;
}

export function FeedbackTypeSelector({ type, onSelectType }: FeedbackTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onSelectType("bug")}
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
        onClick={() => onSelectType("suggestion")}
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
  );
}
