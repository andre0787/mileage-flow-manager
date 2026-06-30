import { useCounter } from "@/hooks/useCounter";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
}

export function AnimatedNumber({ value, duration = 800, formatter }: AnimatedNumberProps) {
  const count = useCounter(value, duration, true);

  if (formatter) {
    return <>{formatter(count)}</>;
  }

  return <>{count.toLocaleString("pt-BR")}</>;
}
