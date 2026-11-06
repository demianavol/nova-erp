import type { CSSProperties } from "react";

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  sheenColor?: string;
  noiseIntensity?: number;
  rotation?: number;
  sheen?: number;
  depth?: number;
  glow?: number;
  ripple?: number;
  wave?: number;
  variation?: number;
  mouseInteraction?: boolean;
  interactionStrength?: number;
  clickRipple?: boolean;
  intro?: boolean;
  fade?: number;
  lightMode?: boolean;
  paused?: boolean;
  /** Hold the complete frame and stop pointer updates, without losing GL resources. */
  frozen?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}
export default function Silk(props: SilkProps): import("react").ReactElement;
