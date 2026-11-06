import {
  catalogCategories,
  fashionProducts,
  type CatalogProduct,
} from "./fashion-catalog";

export interface BrandProfile {
  id: string;
  directionId: string;
  name: string;
  // Supply only an approved original asset; absent logos use the brand name.
  logo?: { image: string };
  status: "active" | "historical" | "planned";
  introduction: string;
  channel: string | null;
  categories: {
    id: string;
    label: string;
    products: Pick<CatalogProduct, "id" | "title" | "image" | "alt">[];
  }[];
  identityNote: string | null;
  evidence: { productId: string; productLabel: string } | null;
  caseStudy: {
    title: string;
    challenge: string;
    work: string;
    result: string;
    source: string;
  } | null;
  hasCatalog: boolean;
}

// Only a confirmed brand is listed. Future/history entries require supplied names,
// assets and facts; an empty case or identity field remains an explicit placeholder.
export const brandPortfolio: BrandProfile[] = [
  {
    id: "enmoone",
    directionId: "fashion",
    name: "Enmoone",
    status: "active",
    introduction:
      "Собственный бренд женской одежды на Wildberries. Соединяем работу над ассортиментом, образами и подачей продукта.",
    channel: "Wildberries",
    categories: catalogCategories
      .filter((category) => category.id !== "all")
      .map((category) => ({
        id: category.id,
        label: category.label,
        products: fashionProducts
          .filter((product) => product.category === category.id)
          .sort(
            (a, b) =>
              Number(b.id === "shirt-burgundy-stripe") -
              Number(a.id === "shirt-burgundy-stripe"),
          )
          .map(({ id, title, image, alt }) => ({ id, title, image, alt })),
      })),
    identityNote: null,
    evidence: {
      productId: "shirt-burgundy-stripe",
      productLabel: "Рубашка в полоску Enmoone",
    },
    caseStudy: null,
    hasCatalog: true,
  },
];
