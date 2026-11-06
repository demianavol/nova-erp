import { useState, type ReactNode } from "react";
import { ArrowRight, Star } from "lucide-react";
import type { CompanySceneKind } from "../data/company-history";
import {
  getProductEvidence,
  marketplaceSnapshot,
  ratingLabel,
  ratingsLabel,
} from "../data/product-evidence";

const asset = (name: string) => `${import.meta.env.BASE_URL}brand/${name}`;
const photos = {
  stripe: ["products/shirt-burgundy-stripe.webp", "Рубашка Enmoone в полоску"],
  white: ["products/blouse-slim-sand.webp", "Деталь блузки Enmoone"],
  look: ["products/blouse-white-fitted.webp", "Образ с белой блузкой Enmoone"],
  blue: ["products/shirt-sky-blue.webp", "Голубая рубашка Enmoone"],
} as const;

export function SceneTransition({
  sceneKey,
  children,
  className = "",
}: {
  sceneKey: string | number;
  children: ReactNode;
  className?: string;
}) {
  // A keyed entrance has no queued callbacks: the most recent selection always wins.
  return (
    <div className={`company-scene-transition ${className}`}>
      <div className="company-scene-enter" key={sceneKey}>
        {children}
      </div>
    </div>
  );
}

export function AnimatedCompanyMark({
  replayable = false,
}: {
  replayable?: boolean;
}) {
  const [replay, setReplay] = useState(0);
  const graphic = (
    <svg viewBox="0 0 110 125" fill="none" aria-hidden="true" key={replay}>
      <path className="company-mark-piece mark-one" d="M18 3 59 47 42 58Z" />
      <path
        className="company-mark-piece mark-two"
        d="m68 45 20-11q4-2 5 3l13 48q3 16-3 25L57 60Z"
      />
      <path
        className="company-mark-piece mark-three"
        d="M42 66 13 83C1 90-2 107 11 111h45c5 0 7-4 4-9Z"
      />
    </svg>
  );
  return replayable ? (
    <button
      className="company-mark"
      type="button"
      aria-label="Повторить анимацию знака Young Unicorn"
      onClick={() => setReplay((value) => value + 1)}
    >
      {graphic}
    </button>
  ) : (
    <span className="company-mark" role="img" aria-label="Знак Young Unicorn">
      {graphic}
    </span>
  );
}

export function RatingEvidence() {
  const proof = getProductEvidence("shirt-burgundy-stripe");
  return (
    <div className="company-rating">
      <span className="rating-eyebrow">Оценка товара</span>
      <p className="rating-score">
        <Star size={22} strokeWidth={1.4} aria-hidden="true" />
        <strong>{ratingLabel(proof.rating)}</strong> <span>из 5</span>
      </p>
      <p className="rating-count">
        <strong>{proof.ratings.toLocaleString("ru-RU")}</strong>
        <span>оценки у рубашки в полоску</span>
      </p>
      <small className="rating-source">
        Wildberries / {marketplaceSnapshot.dateLabel}
      </small>
    </div>
  );
}

function ScenePhoto({ name }: { name: keyof typeof photos }) {
  const [path, alt] = photos[name];
  return (
    <img src={asset(path)} alt={alt} width="300" height="390" loading="lazy" />
  );
}

export function CompanyScene({
  kind,
  illustration = false,
  showRating = true,
}: {
  kind: CompanySceneKind;
  illustration?: boolean;
  showRating?: boolean;
}) {
  let visual: ReactNode;
  switch (kind) {
    case "founding":
      visual = (
        <div className="scene-founding">
          <AnimatedCompanyMark />
          <span>YOUNG UNICORN</span>
          <small>Собственный путь в e-commerce</small>
        </div>
      );
      break;
    case "collection":
      visual = (
        <div className="scene-photo-grid">
          <ScenePhoto name="stripe" />
          <ScenePhoto name="white" />
        </div>
      );
      break;
    case "assortment":
      visual = (
        <div className="scene-photo-grid three">
          <ScenePhoto name="stripe" />
          <ScenePhoto name="blue" />
          <ScenePhoto name="white" />
        </div>
      );
      break;
    case "brand":
      visual = (
        <div className="scene-brand">
          <span>Enmoone</span>
          <div className="scene-photo-grid">
            <ScenePhoto name="stripe" />
            <ScenePhoto name="look" />
          </div>
        </div>
      );
      break;
    case "scale":
      visual = (
        <div className="scene-scale">
          <span>Спрос</span>
          <ArrowRight aria-hidden="true" />
          <span>Ассортимент</span>
          <ArrowRight aria-hidden="true" />
          <strong>Развитие бренда</strong>
          <small>От отклика рынка к следующей коллекции</small>
        </div>
      );
      break;
    case "development":
      visual = (
        <div className="scene-development">
          {[
            ["selfcare-editorial.webp", "Self-care"],
            ["oralcare-editorial.png", "Oral care"],
          ].map(([path, label]) => (
            <div key={label}>
              <img
                src={asset(path)}
                alt={`Концепция направления ${label}`}
                width="1536"
                height="1024"
                loading="lazy"
              />
              <strong>{label}</strong>
              <small>В разработке</small>
            </div>
          ))}
        </div>
      );
      break;
    case "content":
      visual = (
        <div className="scene-content">
          <span>Образы Enmoone</span>
          <div className="scene-photo-grid three">
            <ScenePhoto name="look" />
            <ScenePhoto name="stripe" />
            <ScenePhoto name="white" />
          </div>
        </div>
      );
      break;
    case "marketing":
      visual = (
        <div className="scene-marketing">
          <ScenePhoto name="look" />
          <div>
            <strong>Enmoone</strong>
            <span>Бренд</span>
            <ArrowRight aria-hidden="true" />
            <span>Аудитория</span>
            <ArrowRight aria-hidden="true" />
            <span>Продвижение</span>
          </div>
        </div>
      );
      break;
    case "feedback":
      visual = (
        <div className={showRating ? "scene-feedback" : "scene-enmoone"}>
          <ScenePhoto name="stripe" />
          {showRating ? <RatingEvidence /> : <span>Enmoone</span>}
        </div>
      );
      break;
  }
  return (
    <figure className={`company-scene company-scene-${kind}`} data-scene={kind}>
      <div className="company-scene-visual">{visual}</div>
      <figcaption>
        {illustration
          ? "Иллюстрация этапа"
          : kind === "feedback"
            ? `${ratingsLabel(getProductEvidence("shirt-burgundy-stripe").ratings)} / снимок ${marketplaceSnapshot.dateLabel}`
            : kind === "founding"
              ? "Основание компании"
              : "Собственные бренды Young Unicorn"}
      </figcaption>
    </figure>
  );
}
