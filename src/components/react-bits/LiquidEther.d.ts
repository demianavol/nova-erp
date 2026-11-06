import type { ComponentType } from "react";

declare const LiquidEther: ComponentType<{
  className?: string;
  colors?: string[];
  intensity?: number;
  mouseForce?: number;
  cursorSize?: number;
  persistence?: number;
  resolution?: number;
  clickBurst?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  intro?: boolean;
  lightMode?: boolean;
  maxDevicePixelRatio?: number;
}>;

export default LiquidEther;
