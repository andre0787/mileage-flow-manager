import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-transparent bg-secondary/60 px-4 py-2 text-base ring-offset-background transition-[color,background-color,border-color,box-shadow] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // Dark: vidro translúcido (bg-secondary/60 + blur) + borda nítida —
          // mesmo tratamento dos filtros (#367); hover levanta a opacidade.
          // Light mantém o estilo borderless/filled (hover/borda só no dark).
          "dark:bg-secondary/60 dark:backdrop-blur-sm dark:border-input/70 dark:hover:bg-secondary/80 dark:hover:border-ring/50 dark:focus-visible:border-ring",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
