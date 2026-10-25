import { useActionState, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth";
import { logError } from "@/lib/logger";

export type FeedbackType = "bug" | "suggestion";

export function useFeedbackForm() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const [submitError, formAction] = useActionState<{ message: string | null }, FormData>(
    async (_prev, formData) => {
      const msg = String(formData.get("message") ?? "").trim();
      if (!msg) return { message: null };

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
    setTimeout(() => {
      setType("bug");
      setMessage("");
      setEmail("");
      setSent(false);
    }, 300);
  };

  return {
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
  };
}
