import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import type { Locale } from "@/lib/i18n";

const languages: { code: Locale; label: string; flag: string }[] = [
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "en-US", label: "English", flag: "🇺🇸" },
];

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  const currentIndex = languages.findIndex((l) => l.code === locale);
  const nextIndex = (currentIndex + 1) % languages.length;
  const nextLang = languages[nextIndex];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-lg"
      title={`Idioma: ${languages[currentIndex].label}`}
      onClick={() => setLocale(nextLang.code)}
    >
      <span className="text-base">{languages[currentIndex].flag}</span>
      <span className="sr-only">Selecionar idioma</span>
    </Button>
  );
}
