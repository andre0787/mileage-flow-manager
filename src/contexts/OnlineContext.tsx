import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface OnlineContextValue {
  isOnline: boolean;
}

const OnlineContext = createContext<OnlineContextValue>({ isOnline: true });

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <OnlineContext.Provider value={{ isOnline }}>
      {children}
    </OnlineContext.Provider>
  );
}

export function useOnlineStatus() {
  return useContext(OnlineContext);
}
