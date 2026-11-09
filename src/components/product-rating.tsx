import { Star } from "lucide-react";
import { useSiteLanguage } from "../lib/site-language";
import {
  getProductEvidence,
  ratingLabel,
  ratingsLabel,
} from "../data/product-evidence";

export function ProductRating({ productId }: { productId: string }) {
  const { language, t } = useSiteLanguage();
  const evidence = getProductEvidence(productId);
  if (!evidence) return null;
  const score = ratingLabel(evidence.rating, language);
  const count = ratingsLabel(evidence.ratings, language);
  return (
    <span
      className="fsm-product-rating"
      aria-label={t("{0} из 5, {1}", score, count)}
    >
      <Star size={13} aria-hidden="true" />
      <strong>{score}</strong>
      <span>{count}</span>
    </span>
  );
}
