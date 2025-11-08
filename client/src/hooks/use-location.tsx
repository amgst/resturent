import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationStore {
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string) => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      selectedLocationId: null,
      setSelectedLocationId: (id: string) => set({ selectedLocationId: id }),
    }),
    {
      name: "location-storage",
    }
  )
);
