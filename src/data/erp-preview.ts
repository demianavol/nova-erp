import { erpPage, type ErpPage } from "./erp-sections";

export const localPreview =
  import.meta.env.DEV && import.meta.env.VITE_ERP_SECTION_PREVIEW === "true";

export function canOpenErpPage(page: ErpPage | undefined) {
  return !!page && (page.ready || localPreview);
}

export function isErpRouteOpen(route: string) {
  return canOpenErpPage(erpPage(route.split(/[?#]/, 1)[0]));
}
