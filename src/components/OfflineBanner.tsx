import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/contexts/OnlineContext";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-400 animate-appear">
      <WifiOff className="h-4 w-4" />
      <span>Sem conexão — dados exibidos do cache local</span>
    </div>
  );
}
