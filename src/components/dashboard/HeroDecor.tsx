import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

// [size, anim, color, position, delay]
type Dot = [string, string, string, string, string];

const DRIFTS: Record<"milhas" | "pontos", Dot[]> = {
  milhas: [
    ["w-2 h-2", "animate-drift", "bg-primary/30", "top-[15%] left-[10%]", ""],
    ["w-1.5 h-1.5", "animate-drift-slow", "bg-gold/40", "top-[25%] right-[20%]", "-2s"],
    ["w-1 h-1", "animate-drift", "bg-teal/30", "top-[60%] left-[30%]", "-3s"],
    ["w-2.5 h-2.5", "animate-drift-slow", "bg-primary/20", "bottom-[20%] right-[15%]", "-1s"],
    ["w-1.5 h-1.5", "animate-drift", "bg-gold/25", "top-[70%] right-[40%]", "-4s"],
    ["w-1 h-1", "animate-drift-slow", "bg-white/20", "top-[40%] left-[60%]", "-5s"],
  ],
  pontos: [
    ["w-2 h-2", "animate-drift", "bg-teal/40", "top-[15%] left-[10%]", ""],
    ["w-1.5 h-1.5", "animate-drift-slow", "bg-gold/30", "top-[25%] right-[20%]", "-2s"],
    ["w-1 h-1", "animate-drift", "bg-teal/40", "top-[60%] left-[30%]", "-3s"],
    ["w-2.5 h-2.5", "animate-drift-slow", "bg-teal/30", "bottom-[20%] right-[15%]", "-1s"],
    ["w-1.5 h-1.5", "animate-drift", "bg-gold/20", "top-[70%] right-[40%]", "-4s"],
    ["w-1 h-1", "animate-drift-slow", "bg-white/10", "top-[40%] left-[60%]", "-5s"],
  ],
};

const BLOSS: Record<"milhas" | "pontos", [string, string, string]> = {
  milhas: ["bg-primary/[0.06]", "bg-gold/[0.05]", "text-foreground/[0.025]"],
  pontos: ["bg-teal/[0.10]", "bg-gold/[0.04]", "text-foreground/[0.02]"],
};

export function HeroDecor({ variant }: { variant: "milhas" | "pontos" }) {
  const [blob1, blob2, planeClass] = BLOSS[variant];

  return (
    <>
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        {DRIFTS[variant].map(([size, anim, color, pos, delay], i) => (
          <div
            key={i}
            className={cn("absolute rounded-full", size, anim, color, pos)}
            style={delay ? { animationDelay: delay } : undefined}
          />
        ))}
      </div>
      <div
        className={cn(
          "hidden sm:block absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl",
          blob1,
        )}
      />
      <div
        className={cn(
          "hidden sm:block absolute bottom-0 left-1/3 w-96 h-96 rounded-full blur-3xl",
          blob2,
        )}
      />
      <div
        className={cn(
          "hidden sm:block absolute right-6 bottom-4 pointer-events-none select-none",
          planeClass,
        )}
      >
        <Plane className="w-32 h-32 md:w-48 md:h-48" />
      </div>
    </>
  );
}
