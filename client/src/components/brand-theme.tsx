import { useEffect } from "react";
import type { RestaurantSettings } from "@shared/schema";

/** "#ea580c" → "21 90% 48%" (the HSL format the theme's CSS variables use). */
export function hexToHslTriplet(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Applies the restaurant's saved brand colour to the whole page (buttons, highlights, focus rings). */
export function BrandTheme({ settings }: { settings: RestaurantSettings | null | undefined }) {
  const color = settings?.primaryColor;

  useEffect(() => {
    const triplet = color ? hexToHslTriplet(color) : null;
    const root = document.documentElement;
    if (triplet) {
      root.style.setProperty("--primary", triplet);
      root.style.setProperty("--ring", triplet);
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
    }
  }, [color]);

  return null;
}
