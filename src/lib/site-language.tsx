import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { siteTranslations } from "./site-translations";

export const siteLanguages = [
  { id: "ru", code: "RU", label: "Русский" },
  { id: "en", code: "EN", label: "English" },
  { id: "zh-CN", code: "中文", label: "简体中文" },
] as const;

export type SiteLanguage = (typeof siteLanguages)[number]["id"];
export type SiteTranslate = (
  source: string,
  ...values: (string | number)[]
) => string;
const storageKey = "yuc-site-language";

function isSiteLanguage(value: string | null): value is SiteLanguage {
  return siteLanguages.some(({ id }) => id === value);
}

function readLanguage(): SiteLanguage {
  try {
    const saved = localStorage.getItem(storageKey);
    if (isSiteLanguage(saved)) return saved;
  } catch {
    // The site still works when browser storage is unavailable.
  }
  return "ru";
}

function translate(
  language: SiteLanguage,
  source: string,
  values: (number | string)[],
) {
  const index = language === "en" ? 0 : 1;
  const message =
    language !== "ru" && Object.hasOwn(siteTranslations, source)
      ? siteTranslations[source][index]
      : source;
  return values.length
    ? message.replace(/\{(\d+)\}/g, (placeholder, index) =>
        String(values[Number(index)] ?? placeholder),
      )
    : message;
}

const translators = {
  ru: (source: string, ...values: (string | number)[]) =>
    translate("ru", source, values),
  en: (source: string, ...values: (string | number)[]) =>
    translate("en", source, values),
  "zh-CN": (source: string, ...values: (string | number)[]) =>
    translate("zh-CN", source, values),
};

export const russianSiteCopy = translators.ru;

const SiteLanguageContext = createContext<{
  language: SiteLanguage;
  changeLanguage: (value: string) => void;
}>({ language: "ru", changeLanguage: () => {} });

export function SiteLanguageProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [saved, setSaved] = useState(readLanguage);
  const language = enabled ? saved : "ru";

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function changeLanguage(value: string) {
    if (!isSiteLanguage(value)) return;
    setSaved(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // The selection remains active for this visit.
    }
  }

  return (
    <SiteLanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </SiteLanguageContext.Provider>
  );
}

export function useSiteLanguage() {
  const context = useContext(SiteLanguageContext);
  return { ...context, t: translators[context.language] };
}
