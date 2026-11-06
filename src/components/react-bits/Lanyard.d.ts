import type { CSSProperties, ReactElement } from "react";

export interface LanyardProps {
  frontImage?: string;
  backImage?: string;
  imageFit?: "cover" | "contain";
  cardColor?: string;
  orientation?: "portrait" | "landscape";
  finish?: "glossy" | "matte" | "holographic" | "metallic" | "glass";
  cornerRadius?: number;
  size?: number;
  anchor?: "left" | "center" | "right";
  strapLength?: number;
  strapImage?: string;
  strapColor?: string;
  strapWidth?: number;
  metal?: "graphite" | "silver" | "gold";
  gravity?: number;
  damping?: number;
  elasticity?: number;
  breeze?: number;
  interactive?: boolean;
  intro?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Expand the local camera to a fixed screen layer; preserve the local anchor. */
  renderSpace?: "local" | "viewport";
  /** Keep the complete badge and clip inside a local canvas, including during drag. */
  constrainToCanvas?: boolean;
  ariaDescribedBy?: string;
  /** Local adapter callbacks. Glass is also a local finish extension. */
  onReady?: () => void;
  onError?: () => void;
}
export default function Lanyard(props: LanyardProps): ReactElement | null;
