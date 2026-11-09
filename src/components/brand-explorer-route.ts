import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { company } from "../data/company";
import { brandPortfolio } from "../data/brand-portfolio";

export interface ExplorerPosition {
  directionId: string;
  brandId?: string;
  categoryId?: string;
  productId?: string;
}
export const explorerPath = (position: ExplorerPosition) =>
  [
    position.directionId,
    position.brandId,
    position.categoryId,
    position.productId,
  ]
    .filter(Boolean)
    .join("/");

export function parseExplorerPath(
  path: string | null,
): ExplorerPosition | null {
  if (!path) return null;
  const [requestedDirection, brandId, categoryId, productId, extra] =
    path.split("/");
  const directionId =
    requestedDirection === "oralcare" ? "selfcare" : requestedDirection;
  if (
    extra !== undefined ||
    !company.directions.some((item) => item.id === directionId)
  )
    return null;
  const brand = brandPortfolio.find(
    (item) => item.directionId === directionId && item.id === brandId,
  );
  if (brandId !== undefined && !brand) return null;
  const category = brand?.categories.find((item) => item.id === categoryId);
  if (
    categoryId !== undefined &&
    !category &&
    !(categoryId === "all" && brand?.hasCatalog)
  )
    return null;
  const products =
    categoryId === "all"
      ? brand?.categories.flatMap((item) => item.products)
      : category?.products;
  if (
    productId !== undefined &&
    !products?.some((item) => item.id === productId)
  )
    return null;
  return { directionId, brandId, categoryId, productId };
}

interface ExplorerHistory {
  steps: number;
}
export interface ExplorerNavigationOptions {
  replace?: boolean;
}
export function useExplorerRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const raw = params.get("explorer");
  const position = parseExplorerPath(raw);
  const metadata = location.state?.youngUnicornExplorer as
    ExplorerHistory | undefined;
  const cleanAfterBack = useRef(false);
  const [closing, setClosing] = useState(false);
  const clean = useCallback(() => {
    const next = new URLSearchParams(location.search);
    next.delete("explorer");
    return {
      pathname: location.pathname,
      search: next.toString() ? `?${next}` : "",
      hash: location.hash,
    };
  }, [location.pathname, location.search, location.hash]);
  const valid = Boolean(position);
  useEffect(() => {
    const returnedFromClose = cleanAfterBack.current;
    cleanAfterBack.current = false;
    if ((raw !== null && !valid) || (returnedFromClose && raw !== null)) {
      navigate(clean(), { replace: true, state: null });
    }
    if (!raw || (valid && !returnedFromClose)) setClosing(false);
  }, [location.key, raw, valid, metadata, clean, navigate]);
  const go = (
    next: ExplorerPosition,
    options: ExplorerNavigationOptions = {},
  ) => {
    const search = new URLSearchParams(location.search);
    search.set("explorer", explorerPath(next));
    setClosing(false);
    navigate(
      {
        pathname: location.pathname,
        search: `?${search}`,
        hash: location.hash,
      },
      {
        replace: options.replace,
        state: {
          ...location.state,
          youngUnicornExplorer: {
            steps: (metadata?.steps ?? 0) + (options.replace ? 0 : 1),
          } satisfies ExplorerHistory,
        },
      },
    );
  };
  const close = () => {
    setClosing(true);
    if (metadata?.steps && window.history.length > 1) {
      // Browsers may evict the original entry after a long exploration session.
      // Clear the explorer state on the oldest retained entry in that case.
      cleanAfterBack.current = true;
      navigate(-Math.min(metadata.steps, window.history.length - 1));
    } else navigate(clean(), { replace: true, state: null });
  };
  return { position, go, close, open: Boolean(position) && !closing };
}
