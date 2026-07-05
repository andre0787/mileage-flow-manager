/**
 * Hook para feedback tátil (vibração) em dispositivos mobile.
 * Usa navigator.vibrate() com fallback silencioso.
 */
export function useHaptic() {
  const vibrate = (pattern: number | number[] = 10) => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Fallback silencioso — navegador pode não suportar
    }
  };

  return {
    /** Vibração curta para feedback de ação */
    light: () => vibrate(10),
    /** Vibração média para confirmação */
    medium: () => vibrate(20),
    /** Vibração longa para erro/alerta */
    heavy: () => vibrate([30, 50, 30]),
    /** Padrão de sucesso (duas vibrações curtas) */
    success: () => vibrate([10, 30, 10]),
  };
}
