import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

const DECOR = {
  milhas: {
    blobs: ["bg-primary/[0.06]", "bg-gold/[0.05]"],
    planeClass: "text-foreground/[0.025]",
    drifts: [
      { className: "bg-primary/30 top-[15%] left-[10%]", delay: "" },
      { className: "bg-gold/40 top-[25%] right-[20%]", delay: "-2s" },
      { className: "bg-teal/30 top-[60%] left-[30%]", delay: "-3s" },
      { className: "bg-primary/20 bottom-[20%] right-[15%]", delay: "-1s" },
      { className: "bg-gold/25 top-[70%] right-[40%]", delay: "-4s" },
      { className: "bg-white/20 top-[40%] left-[60%]", delay: "-5s" },
    ],
  },
  pontos: {
    blobs: ["bg-teal/[0.10]", "bg-gold/[0.04]"],
    planeClass: "text-foreground/[0.02]",
    drifts: [
      { className: "bg-teal/40 top-[15%] left-[10%]", delay: "" },
      { className: "bg-gold/30 top-[25%] right-[20%]", delay: "-2s" },
      { className: "bg-teal/40 top-[60%] left-[30%]", delay: "-3s" },
      { className: "bg-teal/30 bottom-[20%] right-[15%]", delay: "-1s" },
      { className: "bg-gold/20 top-[70%] right-[40%]", delay: "-4s" },
      { className: "bg-white/10 top-[40%] left-[60%]", delay: "-5s" },
    ],
  },
} as const;

export function HeroDecor({ variant }: { variant: "milhas" | "pontos" }) {
  const v = DECOR[variant];

  return (
    <>
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        {v.drifts.map((d, i) => (
          <div
            key={i}
            className={cn("absolute w-1 h-1 rounded-full animate-drift", d.className)}
            style={d.delay ? { animationDelay: d.delay } : undefined}
          />
        ))}
      </div>
      <div
        className={cn(
          "hidden sm:block absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl",
          v.blobs[0],
        )}
      />
      <div
        className={cn(
          "hidden sm:block absolute bottom-0 left-1/3 w-96 h-96 rounded-full blur-3xl",
          v.blobs[1],
        )}
      />
      <div
        className={cn(
          "hidden sm:block absolute right-6 bottom-4 pointer-events-none select-none",
          v.planeClass,
        )}
      >
        <Plane className="w-32 h-32 md:w-48 md:h-48" />
      </div>
    </>
  );
}
