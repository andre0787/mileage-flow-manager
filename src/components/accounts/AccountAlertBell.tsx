import { Bell } from "lucide-react";

interface AccountAlertBellProps {
  accountName: string;
  unreadCount: number;
  onOpen: () => void;
}

/** Sino de alertas com contador — reusado no card e na tabela. */
export function AccountAlertBell({ accountName, unreadCount, onOpen }: AccountAlertBellProps) {
  return (
    <button
      type="button"
      className="relative inline-flex items-center justify-center rounded-md p-1.5 hover:bg-muted transition-colors"
      onClick={onOpen}
      aria-label={`Alertas de ${accountName}`}
      title="Alertas da conta"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white px-1">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
