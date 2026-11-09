import { useSiteLanguage } from "../lib/site-language";
import { ChevronDown, Type } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import "@fontsource-variable/brygada-1918";
import "@fontsource-variable/commissioner";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/geologica";
import "@fontsource-variable/golos-text";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/literata/standard.css";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/noto-sans-display";
import "@fontsource-variable/onest";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/roboto-condensed";
import "@fontsource-variable/roboto-flex";
import "@fontsource-variable/source-serif-4/standard.css";
import "../landing-font-preview.css";

const fonts = {
  montserrat: "Montserrat",
  manrope: "Manrope",
  onest: "Onest",
  golos: "Golos Text",
  inter: "Inter",
  "roboto-flex": "Roboto Flex",
  "noto-sans-display": "Noto Sans Display",
  "inter-tight": "Inter Tight",
  "roboto-condensed": "Roboto Condensed",
  "playfair-display": "Playfair Display",
  "cormorant-garamond": "Cormorant Garamond",
  "source-serif-4": "Source Serif 4",
  literata: "Literata",
  "brygada-1918": "Brygada 1918",
  geologica: "Geologica",
  commissioner: "Commissioner",
  "sofia-sans": "Sofia Sans",
} as const;

type LandingFont = keyof typeof fonts;
const defaultFont: LandingFont = "sofia-sans";
const scopes = {
  headings: "Только заголовки",
  text: "Текст и подписи",
  all: "Весь лендинг",
} as const;
type FontScope = keyof typeof scopes;
type FontPreview = {
  font: LandingFont;
  scope: FontScope;
};

const fontGroups = {
  "Новые варианты": [
    "geologica",
    "commissioner",
    "sofia-sans",
    "source-serif-4",
    "literata",
    "brygada-1918",
  ],
  "Без засечек": [
    "montserrat",
    "manrope",
    "onest",
    "golos",
    "inter",
    "roboto-flex",
    "noto-sans-display",
  ],
  Компактные: ["inter-tight", "roboto-condensed"],
  "С засечками": ["playfair-display", "cormorant-garamond"],
} as const satisfies Record<string, readonly LandingFont[]>;

function isLandingFont(value: string | null): value is LandingFont {
  return value !== null && Object.hasOwn(fonts, value);
}

function getScope(value: string | null): FontScope {
  return value === "all" || value === "text" ? value : "headings";
}

function getLandingFontPreview(): FontPreview | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("fonts") !== "1") return null;
  const value = params.get("font");
  return {
    font: isLandingFont(value) ? value : defaultFont,
    scope: getScope(params.get("scope")),
  };
}

export async function loadLandingFonts() {
  if (!document.fonts) return;
  const preview = getLandingFontPreview();
  const families = new Set([
    fonts[defaultFont],
    fonts[preview?.font ?? defaultFont],
  ]);
  // Include both primary subsets, even when the current locale uses only one.
  const sample = "Young Unicorn Создаём бренды";
  await Promise.allSettled(
    [...families].map((family) =>
      document.fonts.load(`400 1em "${family} Variable"`, sample),
    ),
  );
}

export function useLandingFontPreview() {
  const [preview, setPreview] = useState(getLandingFontPreview);
  const font = preview?.font;
  useLayoutEffect(() => {
    if (!font) return;
    const rootStyle = document.documentElement.style;
    // The root also supplies the font to landing dialogs rendered in portals.
    rootStyle.setProperty("--yu-preview-font", `"${fonts[font]} Variable"`);
    return () => {
      rootStyle.removeProperty("--yu-preview-font");
    };
  }, [font]);

  function changePreview(next: FontPreview) {
    const url = new URL(window.location.href);
    url.searchParams.set("font", next.font);
    url.searchParams.set("scope", next.scope);
    window.history.replaceState(window.history.state, "", url);
    setPreview(next);
  }

  return { preview, changePreview };
}

export function LandingFontPreview({
  preview,
  onChange,
}: {
  preview: FontPreview;
  onChange: (next: FontPreview) => void;
}) {
  const { t } = useSiteLanguage();
  return (
    <details className="landing-font-preview" open>
      <summary>
        <Type size={17} aria-hidden="true" />
        {t("Подбор шрифта")}
        <ChevronDown
          size={15}
          className="font-preview-chevron"
          aria-hidden="true"
        />
      </summary>
      <div className="font-preview-controls">
        <label htmlFor="landing-font-scope">{t("Где применить")}</label>
        <select
          id="landing-font-scope"
          value={preview.scope}
          onChange={(event) => {
            const scope = getScope(event.currentTarget.value);
            onChange({ ...preview, scope });
          }}
        >
          {Object.entries(scopes).map(([scope, name]) => (
            <option key={scope} value={scope}>
              {t(name)}
            </option>
          ))}
        </select>
        <label htmlFor="landing-font">{t("Шрифт")}</label>
        <select
          id="landing-font"
          value={preview.font}
          onChange={(event) => {
            const font = event.currentTarget.value;
            if (isLandingFont(font)) onChange({ ...preview, font });
          }}
        >
          {Object.entries(fontGroups).map(([label, ids]) => (
            <optgroup key={label} label={t(label)}>
              {ids.map((id) => (
                <option key={id} value={id}>
                  {fonts[id]}
                  {id === defaultFont ? " " + t("· текущий") : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="font-preview-sample">
          <strong>{t("Создаём бренды")}</strong>
          <span>{t("Продукты, которыми пользуются каждый день")}</span>
        </div>
        <p>{t("Выбор сохранится в ссылке предпросмотра.")}</p>
      </div>
    </details>
  );
}
