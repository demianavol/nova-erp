import type { ComponentType } from "react";

declare const HoloCard: ComponentType<{
  image: string;
  alt: string;
  className?: string;
  preset?:
    | "bursts"
    | "stars"
    | "shards"
    | "cosmos"
    | "rainbow"
    | "swirl"
    | "glitter"
    | "gold";
  width?: number;
  radius?: number;
  tiltMax?: number;
  hoverScale?: number;
  intensity?: number;
  glare?: number;
  frame?: number;
  edgeSparkle?: number;
  idle?: boolean;
  shadow?: boolean;
}>;

export default HoloCard;
