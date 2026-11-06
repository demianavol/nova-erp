import type { ComponentType, RefObject } from "react";

declare const TechText: ComponentType<{
  text: string;
  inline?: boolean;
  nativeMetrics?: boolean;
  pointerTarget?: RefObject<HTMLElement | null>;
  fontWeight?: number;
  letterSpacing?: number;
  align?: "left" | "center" | "right";
  accentColor?: string;
  intro?: "none" | "type" | "metrics";
  introDuration?: number;
  specks?: number;
  dashLength?: number;
  dashGap?: number;
  strokeWidth?: number;
  sweep?: boolean;
  labels?: boolean;
  draggable?: boolean;
  clickKick?: boolean;
}>;

export default TechText;
