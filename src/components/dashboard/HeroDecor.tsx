import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriftDot {
  sizeClass: string;
  animClass: string;
  colorClass: string;
  positionClass: string;
  delay: string;
}

const DRIFTS: Record<"milhas" | "pontos", DriftDot[]> = {
  milhas: [
    { sizeClass: "w-2 h-2", animClass: "animate-drift", colorClass: "bg-primary/30", positionClass: "top-[15%] left-[10%]", delay: "" },
    { sizeClass: "w-1.5 h-1.5", animClass: "animate-drift-slow", colorClass: "bg-gold/40", positionClass: "top-[25%] right-[20%]", delay: "-2s" },
    { sizeClass: "w-1 h-1", animClass: "animate-drift", colorClass: "bg-teal/30", positionClass: "top-[60%] left-[30%]", delay: "-3s" },
    { sizeClass: "w-2.5 h-2.5", animClass: "animate-drift-slow", colorClass: "bg-primary/20", positionClass: "bottom-[20%] right-[15%]", delay: "-1s" },
    { sizeClass: "w-1.5 h-1.5", animClass: "animate-drift", colorClass: "bg-gold/25", positionClass: "top-[70%] right-[40%]", delay: "-4s" },
    { sizeClass: "w-1 h-1", animClass: "animate-drift-slow", colorClass: "bg-white/20", positionClass: "top-[40%] left-[60%]", delay: "-5s" },
  ],
  pontos: [
    { sizeClass: "w-2 h-2", animClass: "animate-drift", colorClass: "bg-teal/40", positionClass: "top-[15%] left-[10%]", delay: "" },
    { sizeClass: "w-1.5 h-1.5", animClass: "animate-drift-slow", colorClass: "bg-gold/30", positionClass: "top-[25%] right-[20%]", delay: "-2s" },
    { sizeClass: "w-1 h-1", animClass: "animate-drift", colorClass: "bg-teal/40", positionClass: "top-[60%] left-[30%]", delay: "-3s" },
    { sizeClass: "w-2.5 h-2.5", animClass: "animate-drift-slow", colorClass: "bg-teal/30", positionClass: "bottom-[20%] right-[15%]", delay: "-1s" },
    { sizeClass: "w-1.5 h-1.5", animClass: "animate-drift", colorClass: "bg-gold/20", positionClass: "top-[70%] right-[40%]", delay: "-4s" },
    { sizeClass: "w-1 h-1", animClass: "animate-drift-slow", colorClass: "bg-white/10", positionClass: "top-[40%] left-[60%]", delay: "-5s" },
  ],
};

const BLOSS: Record<"milhas" | "pontos", { blob1: string; blob2: string; planeClass: string }> = {
  milhas: { blob1: "bg-primary/[0.06]", blob2: "bg-gold/[0.05]", planeClass: "text-foreground/[0.025]" },
  pontos: { blob1: "bg-teal/[0.10]", blob2: "bg-gold/[0.04]", planeClass: "text-foreground/[0.02]" },
};

export function HeroDecor({ variant }: { variant: "milhas" | "pontos" }) {
  const blobs = BLOSS[variant];

  return (
    <>
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        {DRIFTS[variant].map((d, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-full",
              d.sizeClass,
              d.animClass,
              d.colorClass,
              d.positionClass,
            )}
            style={d.delay ? { animationDelay: d.delay } : undefined}
          />
        ))}
      </div>
      <div
        className={cn(
          "hidden sm:block absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl",
          blobs.blob1,
        )}
      />
      <div
        className={cn(
          "hidden sm:block absolute bottom-0 left-1/3 w-96 h-96 rounded-full blur-3xl",
          blobs.blob2,
        )}
      />
      <div
        className={cn(
          "hidden sm:block absolute right-6 bottom-4 pointer-events-none select-none",
          blobs.planeClass,
        )}
      >
        <Plane className="w-32 h-32 md:w-48 md:h-48" />
      </div>
    </>
  );
}
