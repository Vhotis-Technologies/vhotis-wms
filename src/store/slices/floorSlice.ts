import { create } from "zustand";

import type { WorkArea } from "@/interfaces/auth";

interface FloorState {
  workArea: WorkArea | null;
  setWorkArea: (area: WorkArea) => void;
  clearWorkArea: () => void;
}

export const useFloorStore = create<FloorState>((set) => ({
  workArea: null,
  setWorkArea: (area) => set({ workArea: area }),
  clearWorkArea: () => set({ workArea: null }),
}));
