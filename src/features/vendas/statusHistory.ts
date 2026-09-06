import { supabase } from "./shared";
import { logError } from "@/lib/logger";
import { planStatusTransition } from "@/lib/saleStatus";

/**
 * Registra transição de status no histórico (F3 telemetria).
 * Best-effort por desenho: nunca quebra o fluxo principal —
 * falha de escrita gera só log, sem propagar erro.
 */
export async function recordStatusChange(
  userId: string,
  saleId: string,
  fromStatus: unknown,
  toStatus: unknown,
): Promise<void> {
  const transition = planStatusTransition(fromStatus, toStatus);
  if (!transition || !userId || !saleId) return;
  const { error } = await supabase.from("sale_status_history").insert({
    user_id: userId,
    sale_id: saleId,
    from_status: transition.from,
    to_status: transition.to,
  });
  if (error) logError("saleStatusHistory", error);
}
