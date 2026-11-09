import { useSiteLanguage } from "../lib/site-language";
import {
  useMemo,
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowUpRight, X } from "lucide-react";
import { company } from "../data/company";
import { brandPortfolio, type BrandProfile } from "../data/brand-portfolio";
import { fashionProducts } from "../data/fashion-catalog";
import {
  getProductEvidence,
  snapshotDateLabel,
} from "../data/product-evidence";
import { ProductRating } from "./product-rating";
import { BrandSwitcher } from "./brand-switcher";
import CircularCarousel from "./react-bits/CircularCarousel";
import HoloCard from "./react-bits/HoloCard";
import {
  type ExplorerPosition,
  type ExplorerNavigationOptions,
} from "./brand-explorer-route";
import "../brand-explorer-modal.css";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
type Category = BrandProfile["categories"][number];

function Collection({
  category,
  brandName,
  products,
  selectedId,
  onSelect,
  panelId,
  tabId,
}: {
  category: string;
  brandName: string;
  products: Category["products"];
  selectedId: string | null;
  onSelect: (id: string) => void;
  panelId: string;
  tabId: string;
}) {
  const { language, t } = useSiteLanguage();
  const snapshotDate = snapshotDateLabel(language);
  const items = useMemo(
    () =>
      products.map(({ id, title, image, alt }) => ({
        id,
        title: t(title),
        src: asset(image),
        alt: t(alt),
      })),
    [products, t],
  );
  const initialIndex = Math.max(
    0,
    items.findIndex((item) => item.id === selectedId),
  );
  return (
    <div
      className="bex-collection"
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
    >
      {items.length ? (
        <div className="bex-grid-current" data-category={category}>
          <div className="bex-collection-kicker">
            <span>
              {t("Коллекция /") + " "}
              {brandName}
            </span>
            <span>{t("Листайте или тяните карточки")}</span>
          </div>
          <CircularCarousel
            items={items}
            initialIndex={initialIndex}
            className="bex-orbit"
            label={t("Модели коллекции")}
            preset="orbit"
            intro="none"
            autoplay="off"
            cardWidth={242}
            aspectRatio={0.64}
            tilt={0}
            perspective={680}
            gap={-38}
            parallax={0}
            focusOnClick={false}
            onItemClick={(item) => onSelect(item.id)}
            renderCard={(item, active) => (
              <article className="bex-product-card" data-active={active}>
                <div className="bex-card-photo">
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    draggable={false}
                  />
                  {getProductEvidence(item.id) && (
                    <div
                      id={`${panelId}-rating-${item.id}`}
                      className="bex-rating-chip"
                      title={t("Снимок Wildberries · {0}", snapshotDate)}
                    >
                      <ProductRating productId={item.id} />
                    </div>
                  )}
                </div>
                <button
                  className="bex-product-button"
                  type="button"
                  data-product-id={item.id}
                  aria-describedby={
                    getProductEvidence(item.id)
                      ? `${panelId}-rating-${item.id}`
                      : undefined
                  }
                  aria-label={t("Исследовать модель: {0}", item.title)}
                  tabIndex={active ? 0 : -1}
                >
                  <span className="bex-product-name">{item.title}</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </article>
            )}
          />
        </div>
      ) : (
        <p className="bex-empty">
          {t("Товары этой категории пока не представлены")}
        </p>
      )}
    </div>
  );
}

export function BrandExplorerModal({
  position,
  open,
  go,
  close,
}: {
  position: ExplorerPosition | null;
  open: boolean;
  go: (position: ExplorerPosition, options?: ExplorerNavigationOptions) => void;
  close: () => void;
}) {
  const { language, t } = useSiteLanguage();
  const snapshotDate = snapshotDateLabel(language);
  const last = useRef(position);
  if (position) last.current = position;
  const visible = position ?? last.current;
  const direction = company.directions.find(
    (item) => item.id === visible?.directionId,
  );
  const brands = brandPortfolio.filter(
    (item) => item.directionId === direction?.id,
  );
  const brand =
    brands.find((item) => item.id === visible?.brandId) ?? brands[0];
  const category =
    brand?.categories.find((item) => item.id === visible?.categoryId) ??
    brand?.categories[0];
  const allProducts = visible?.categoryId === "all";
  const products = allProducts
    ? (brand?.categories.flatMap((item) => item.products) ?? [])
    : (category?.products ?? []);
  const product = products.find((item) => item.id === visible?.productId);
  const productCategory = brand?.categories.find((item) =>
    item.products.some((model) => model.id === product?.id),
  );
  const catalogProduct = fashionProducts.find(
    (item) => item.id === product?.id,
  );
  const key = `${brand?.id}/${allProducts ? "all" : category?.id}`;
  const id = useId();
  const panelId = `${id}-collection`;
  const tabId = (categoryId: string) => `${id}-${categoryId}`;
  const dialog = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const productOpener = useRef<string | null>(null);
  const collectionScroll = useRef(0);
  const previousProduct = useRef<string | undefined>(undefined);
  const tabs = useRef<HTMLElement>(null);
  const collectionPosition: ExplorerPosition = {
    directionId: direction?.id ?? "fashion",
    brandId: brand?.id,
    categoryId: allProducts ? "all" : category?.id,
  };
  const selectCategory = (categoryId: string) => {
    productOpener.current = null;
    go({ ...collectionPosition, categoryId }, { replace: true });
  };
  const selectProduct = (productId: string) => {
    productOpener.current = productId;
    collectionScroll.current = viewport.current?.scrollTop ?? 0;
    go({ ...collectionPosition, productId });
  };
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const categories = [{ id: "all" }, ...(brand?.categories ?? [])];
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % categories.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + categories.length) % categories.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = categories.length - 1;
    else return;
    event.preventDefault();
    selectCategory(categories[next].id);
    tabs.current
      ?.querySelector<HTMLButtonElement>(
        `[data-category-id="${categories[next].id}"]`,
      )
      ?.focus({ preventScroll: true });
  };
  useLayoutEffect(() => {
    const returning = Boolean(previousProduct.current && !product);
    if (viewport.current)
      viewport.current.scrollTop = returning ? collectionScroll.current : 0;
    if (product) {
      productOpener.current = product.id;
      dialog.current
        ?.querySelector<HTMLElement>(".bex-detail-title")
        ?.focus({ preventScroll: true });
    } else if (returning) {
      const card = [
        ...(dialog.current?.querySelectorAll<HTMLButtonElement>(
          ".bex-grid-current [data-product-id]",
        ) ?? []),
      ].find((item) => item.dataset.productId === productOpener.current);
      (
        card ?? tabs.current?.querySelector<HTMLElement>("[aria-selected=true]")
      )?.focus({ preventScroll: true });
    }
    previousProduct.current = product?.id;
  }, [product?.id, key]);
  const revealActiveTab = () => {
    const nav = tabs.current;
    const active = nav?.querySelector<HTMLElement>("[aria-selected=true]");
    if (nav && active) {
      if (active.offsetLeft < nav.scrollLeft)
        nav.scrollLeft = active.offsetLeft;
      else if (
        active.offsetLeft + active.offsetWidth >
        nav.scrollLeft + nav.clientWidth
      )
        nav.scrollLeft =
          active.offsetLeft + active.offsetWidth - nav.clientWidth;
    }
  };
  useLayoutEffect(revealActiveTab, [key, product?.id]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="bex-backdrop" />
        <Dialog.Content
          ref={dialog}
          className={`landing bex-dialog${!brand ? " bex-dialog-development" : ""}`}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            opener.current =
              document.activeElement instanceof HTMLElement &&
              document.activeElement.matches(".explorer-direction")
                ? document.activeElement
                : null;
            (
              dialog.current?.querySelector<HTMLElement>(".bex-detail-title") ??
              tabs.current?.querySelector<HTMLElement>(
                "[aria-selected=true]",
              ) ??
              dialog.current?.querySelector<HTMLElement>(".bex-close")
            )?.focus({ preventScroll: true });
            revealActiveTab();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const fallback = document.querySelector<HTMLElement>(
              `.explorer-direction[data-direction="${direction?.id ?? "fashion"}"]`,
            );
            if (opener.current?.isConnected)
              opener.current.focus({ preventScroll: true });
            else {
              fallback?.focus({ preventScroll: true });
              fallback?.scrollIntoView({
                block: "center",
                behavior: "instant",
              });
            }
          }}
        >
          <header
            className={`bex-header${!brand ? " bex-development-toolbar" : ""}`}
          >
            {product && (
              <button
                className="bex-back"
                type="button"
                aria-label={t("К коллекции")}
                onClick={() => go(collectionPosition, { replace: true })}
              >
                <ArrowLeft size={19} aria-hidden="true" />
              </button>
            )}
            {brand && (
              <div className="bex-heading">
                <>
                  <Dialog.Title className="sr-only">{brand.name}</Dialog.Title>
                  <BrandSwitcher
                    brands={brands}
                    selected={brand}
                    onSelect={(next) => {
                      productOpener.current = null;
                      collectionScroll.current = 0;
                      go(
                        {
                          directionId: direction!.id,
                          brandId: next.id,
                          categoryId: next.categories[0]?.id,
                        },
                        { replace: true },
                      );
                    }}
                  />
                </>
                <Dialog.Description className="bex-introduction">
                  {brand?.id === "enmoone"
                    ? t("Женская одежда · Wildberries")
                    : t(brand?.introduction ?? "В разработке")}
                </Dialog.Description>
              </div>
            )}
            <Dialog.Close
              className="bex-close"
              aria-label={t("Закрыть коллекцию")}
            >
              <X size={20} strokeWidth={1.5} aria-hidden="true" />
            </Dialog.Close>
          </header>
          {brand && !product && (
            <nav
              className="bex-tabs"
              role="tablist"
              aria-label={t("Категории {0}", brand.name)}
              ref={tabs}
            >
              <button
                role="tab"
                type="button"
                id={tabId("all")}
                data-category-id="all"
                aria-controls={panelId}
                aria-selected={allProducts}
                tabIndex={allProducts ? 0 : -1}
                onClick={() => selectCategory("all")}
                onKeyDown={(event) => onTabKey(event, 0)}
              >
                {t("Все модели")}
              </button>
              {brand.categories.map((item, index) => (
                <button
                  role="tab"
                  type="button"
                  key={item.id}
                  id={tabId(item.id)}
                  data-category-id={item.id}
                  aria-controls={panelId}
                  aria-selected={!allProducts && category?.id === item.id}
                  tabIndex={!allProducts && category?.id === item.id ? 0 : -1}
                  onClick={() => selectCategory(item.id)}
                  onKeyDown={(event) => onTabKey(event, index + 1)}
                >
                  {t(item.label)}
                </button>
              ))}
            </nav>
          )}
          <div ref={viewport} className="bex-body">
            {brand && !product && (
              <Collection
                key={key}
                category={key}
                brandName={brand.name}
                selectedId={productOpener.current}
                products={products}
                onSelect={selectProduct}
                panelId={panelId}
                tabId={tabId(allProducts ? "all" : (category?.id ?? "empty"))}
              />
            )}
            {product && (
              <div className="bex-detail">
                <figure className="bex-detail-media">
                  <HoloCard
                    key={product.id}
                    className="bex-detail-image"
                    image={asset(product.image)}
                    alt={t(product.alt)}
                    preset="shards"
                    radius={20}
                    intensity={0.27}
                    glare={0.26}
                    tiltMax={4}
                    frame={2}
                    edgeSparkle={0.5}
                    hoverScale={1}
                    idle={false}
                    shadow={false}
                  />
                  <figcaption>
                    {brand?.name} /{" "}
                    {productCategory && t(productCategory.label)}
                  </figcaption>
                </figure>
                <div className="bex-detail-copy">
                  <div className="bex-detail-kicker">
                    {brand?.name} <span />{" "}
                    {productCategory && t(productCategory.label)}
                  </div>
                  <h2 className="bex-detail-title" tabIndex={-1}>
                    {t(product.title)}
                  </h2>
                  {getProductEvidence(product.id) && (
                    <div className="bex-detail-evidence">
                      <ProductRating productId={product.id} />
                      <small>
                        {t("Wildberries · снимок {0}", snapshotDate)}
                      </small>
                    </div>
                  )}
                  {catalogProduct && (
                    <>
                      <p className="bex-fabric">{t(catalogProduct.fabric)}</p>
                      <p>{t(catalogProduct.description)}</p>
                    </>
                  )}
                  <a
                    className="bex-detail-link"
                    href={company.partnerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("Обсудить продукт")}{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}
            {!brand && direction && (
              <div className="bex-development">
                <img
                  src={asset(direction.image)}
                  alt={t(
                    "Визуальная концепция направления «{0}», в разработке",
                    t(direction.title),
                  )}
                  width="1536"
                  height="1024"
                />
                <div className="bex-development-copy">
                  <div className="bex-development-heading">
                    <Dialog.Title className="bex-wordmark">
                      {t(direction.title)}
                    </Dialog.Title>
                    <Dialog.Description className="bex-introduction bex-development-status">
                      {t(direction.status)}
                    </Dialog.Description>
                  </div>
                  <p className="bex-development-description">
                    {t(direction.description).split("\n")[0]}
                  </p>
                  <a
                    href={company.partnerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("Обсудить направление")}{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
