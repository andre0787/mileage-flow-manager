import { Plane } from "lucide-react";

export function LoginBrandHeader() {
  return (
    <>
      <div className="absolute inset-0 bg-grid opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/[0.04] rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/[0.04] rounded-full blur-3xl" />

      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl shadow-elegant mb-4">
          <Plane className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground font-display">MilesControl</h1>
        <p className="text-sm text-muted-foreground mt-1 font-body">
          Gestão inteligente de milhas aéreas
        </p>
      </div>
    </>
  );
}
