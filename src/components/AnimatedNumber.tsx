import { useState, useEffect, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
}

export function AnimatedNumber({ value }: AnimatedNumberProps) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);
  const duration = 800;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count.toLocaleString("pt-BR")}</>;
}
