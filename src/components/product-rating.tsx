import { Star } from "lucide-react";
import {
  getProductEvidence,
  ratingLabel,
  ratingsLabel,
} from "../data/product-evidence";

export function ProductRating({ productId }: { productId: string }) {
  const evidence = getProductEvidence(productId);
  if (!evidence) return null;
  return (
    <span
      className="fsm-product-rating"
      aria-label={`${ratingLabel(evidence.rating)} из 5, ${ratingsLabel(evidence.ratings)}`}
    >
      <Star size={13} aria-hidden="true" />
      <strong>{ratingLabel(evidence.rating)}</strong>
      <span>{ratingsLabel(evidence.ratings)}</span>
    </span>
  );
}
