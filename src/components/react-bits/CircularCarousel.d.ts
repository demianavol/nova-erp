import type { ComponentType, ReactNode } from "react";

export interface CarouselItem {
  id: string;
  src: string;
  alt: string;
  title: string;
}

declare const CircularCarousel: ComponentType<{
  items: CarouselItem[];
  initialIndex?: number;
  label?: string;
  className?: string;
  preset?: "orbit";
  intro?: "none";
  autoplay?: "off";
  cardWidth?: number;
  aspectRatio?: number;
  tilt?: number;
  gap?: number;
  perspective?: number;
  parallax?: number;
  focusOnClick?: boolean;
  renderCard: (item: CarouselItem, active: boolean) => ReactNode;
  onItemClick: (item: CarouselItem) => void;
}>;

export default CircularCarousel;
