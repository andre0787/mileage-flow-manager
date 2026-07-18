import { createContext, useContext, useState, type ReactNode } from "react";
import { t as translate, getLocale, setLocale as setLocaleStorage, type Locale } from "@/lib/i18n";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleStorage(newLocale);
  };

  const t = (key: string) => translate(key, locale);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
