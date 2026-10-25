import { ownerColor, ownerColorSoft } from "@/lib/ownerColors";

interface OwnerBadgeProps {
  ownerName: string;
  customColorHex?: string | null;
}

export function OwnerBadge({ ownerName, customColorHex = null }: OwnerBadgeProps) {
  return (
    <span
      className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: ownerColorSoft(ownerName, customColorHex),
        color: ownerColor(ownerName, customColorHex),
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: ownerColor(ownerName, customColorHex),
        }}
      />
      {ownerName}
    </span>
  );
}
