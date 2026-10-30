import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, ChevronDown, X } from "lucide-react";
import { company } from "../data/company";
import {
  catalogCategories,
  fashionProducts,
  type CatalogCategoryId,
  type CatalogProduct,
} from "../data/fashion-catalog";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
const plural = new Intl.PluralRules("ru");
const countLabel = (count: number) =>
  `${count} ${{ one: "модель", few: "модели", many: "моделей", other: "модели", zero: "моделей", two: "модели" }[plural.select(count)]}`;

export function FashionShowcaseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedCategory, setSelectedCategory] =
    useState<CatalogCategoryId>("all");
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(
    null,
  );
  const scroll = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const productOpener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory("all");
      setPreviewProduct(null);
    }
  }, [isOpen]);
  const filtered =
    selectedCategory === "all"
      ? fashionProducts
      : fashionProducts.filter((item) => item.category === selectedCategory);
  const select = (category: CatalogCategoryId) => {
    setSelectedCategory(category);
    scroll.current?.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <div className="landing fsm-theme">
          <Dialog.Overlay className="fsm-backdrop" />
          <Dialog.Content
            className="fsm-dialog"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              opener.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
              close.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (opener.current?.isConnected) opener.current.focus();
            }}
          >
            <header className="fsm-header">
              <div className="fsm-header-brand">
                <span className="fsm-brand-tag">Каталог</span>
                <Dialog.Title className="fsm-title">Enmoone</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Подборка женской одежды бренда Enmoone Выберите категорию или
                  откройте фотографию модели
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  ref={close}
                  type="button"
                  className="fsm-close"
                  aria-label="Закрыть подборку товаров"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </header>
            <div className="fsm-body">
              <nav className="fsm-categories" aria-label="Категории товаров">
                {catalogCategories.map((category) => {
                  const count =
                    category.id === "all"
                      ? fashionProducts.length
                      : fashionProducts.filter(
                          (item) => item.category === category.id,
                        ).length;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`fsm-category-tab${selectedCategory === category.id ? " is-active" : ""}`}
                      aria-pressed={selectedCategory === category.id}
                      onClick={() => select(category.id)}
                    >
                      <span>{category.label}</span>
                      <span className="fsm-tab-count">{count}</span>
                    </button>
                  );
                })}
              </nav>
              <label className="fsm-mobile-filter">
                <select
                  aria-label="Категория товаров"
                  value={selectedCategory}
                  onChange={(event) =>
                    select(event.target.value as CatalogCategoryId)
                  }
                >
                  {catalogCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </label>
              <div ref={scroll} className="fsm-scroll-area">
                <div className="fsm-grid">
                  {filtered.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="fsm-card"
                      aria-label={`Просмотреть: ${product.title}`}
                      onClick={(event) => {
                        productOpener.current = event.currentTarget;
                        setPreviewProduct(product);
                      }}
                    >
                      <div className="fsm-image-wrap">
                        <img
                          src={asset(product.image)}
                          alt={product.alt}
                          width="300"
                          height="390"
                          loading="lazy"
                          className="fsm-image"
                        />
                      </div>
                      <div className="fsm-card-body">
                        <h3 className="fsm-card-title">{product.title}</h3>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <footer className="fsm-footer">
              <span className="fsm-footer-note" role="status">
                {countLabel(filtered.length)}
              </span>
              <a
                href={company.partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fsm-cta"
              >
                Обсудить поставки <ArrowUpRight size={16} />
              </a>
            </footer>
            <Dialog.Root
              open={!!previewProduct}
              onOpenChange={(next) => {
                if (!next) setPreviewProduct(null);
              }}
            >
              <Dialog.Portal>
                <div className="landing fsm-theme">
                  <Dialog.Overlay className="fsm-lightbox" />
                  <Dialog.Content
                    className="fsm-lightbox-content"
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                      productOpener.current?.focus();
                    }}
                  >
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="fsm-lightbox-close"
                        aria-label="Закрыть просмотр"
                      >
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                    {previewProduct && (
                      <>
                        <img
                          src={asset(previewProduct.image)}
                          alt={previewProduct.alt}
                          className="fsm-lightbox-img"
                        />
                        <div className="fsm-lightbox-caption">
                          <Dialog.Title>{previewProduct.title}</Dialog.Title>
                          <Dialog.Description>
                            {previewProduct.categoryLabel}
                          </Dialog.Description>
                        </div>
                      </>
                    )}
                  </Dialog.Content>
                </div>
              </Dialog.Portal>
            </Dialog.Root>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
