import { useSiteLanguage } from "../lib/site-language";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import type { BrandProfile } from "../data/brand-portfolio";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;

function BrandMark({ brand }: { brand: BrandProfile }) {
  return brand.logo ? (
    <img
      className="bex-brand-mark"
      src={asset(brand.logo.image)}
      alt={brand.name}
    />
  ) : (
    <span>{brand.name}</span>
  );
}

export function BrandSwitcher({
  brands,
  selected,
  onSelect,
}: {
  brands: readonly BrandProfile[];
  selected: BrandProfile;
  onSelect: (brand: BrandProfile) => void;
}) {
  const { t } = useSiteLanguage();
  // A single real brand is an identity, not a disabled or empty menu.
  if (brands.length < 2)
    return (
      <div className="bex-wordmark">
        <BrandMark brand={selected} />
      </div>
    );
  return (
    <div className="bex-wordmark">
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger
          className="bex-brand-trigger"
          aria-label={t("Выбрать бренд: {0}", selected.name)}
        >
          <BrandMark brand={selected} />
          <ChevronDown
            className="bex-brand-chevron"
            size={15}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className="bex-brand-menu"
          align="start"
          sideOffset={8}
          collisionPadding={20}
          aria-label={t("Бренды")}
        >
          <DropdownMenu.RadioGroup
            value={selected.id}
            onValueChange={(id) => {
              const next = brands.find((brand) => brand.id === id);
              if (next && next.id !== selected.id) onSelect(next);
            }}
          >
            {brands.map((brand) => (
              <DropdownMenu.RadioItem
                className="bex-brand-option"
                key={brand.id}
                value={brand.id}
                data-brand-id={brand.id}
              >
                <span className="bex-brand-option-identity">
                  {brand.logo && <img src={asset(brand.logo.image)} alt="" />}
                  <span>{brand.name}</span>
                </span>
                <DropdownMenu.ItemIndicator className="bex-brand-selected">
                  <Check size={15} aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}
