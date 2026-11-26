import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { RestaurantSettings } from "@shared/schema";
import { useLocationStore } from "@/hooks/use-location";

/**
 * Saved restaurant settings (name, branding, tax, currency) for a location.
 * Without a location id, returns the first restaurant's settings (used on public pages).
 * Resolves to null when nothing has been saved yet.
 */
export function useRestaurantSettings(locationId?: string | null) {
  return useQuery<RestaurantSettings | null>({
    queryKey: ["/api/settings", locationId ?? "default"],
    queryFn: async () => {
      const url = locationId ? `/api/settings?locationId=${encodeURIComponent(locationId)}` : "/api/settings";
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });
}

/** Settings for the location selected in the sidebar. */
export function useCurrentSettings() {
  const { selectedLocationId } = useLocationStore();
  return useRestaurantSettings(selectedLocationId);
}

/** Formats amounts in the selected location's currency, e.g. "A$12.50". */
export function useMoney() {
  const { data: settings } = useCurrentSettings();
  const currency = settings?.currency || "AUD";

  return useCallback(
    (value: string | number | null | undefined) => {
      const amount = typeof value === "number" ? value : parseFloat(value ?? "0");
      try {
        return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(
          Number.isFinite(amount) ? amount : 0,
        );
      } catch {
        return `${currency} ${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
      }
    },
    [currency],
  );
}
