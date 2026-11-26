import { create } from "zustand";

interface CallerStore {
  open: boolean;
  /** Number to look up when the dialog opens. */
  phone: string;
  /** True when opened by a real incoming call (Android app). */
  incoming: boolean;
  /** Call-log entry for this call, so a resulting order can be linked to it. */
  callLogId: string | null;
  /** Bumped on every open so the dialog re-runs the lookup for the same number. */
  requestId: number;
  showCaller: (phone: string, options?: { incoming?: boolean; callLogId?: string | null }) => void;
  openEmpty: () => void;
  close: () => void;
}

/** Opens the caller lookup dialog from anywhere (header, call history, customers page). */
export const useCaller = create<CallerStore>((set) => ({
  open: false,
  phone: "",
  incoming: false,
  callLogId: null,
  requestId: 0,
  showCaller: (phone, options) =>
    set((state) => ({
      open: true,
      phone,
      incoming: options?.incoming ?? false,
      callLogId: options?.callLogId ?? null,
      requestId: state.requestId + 1,
    })),
  openEmpty: () =>
    set((state) => ({ open: true, phone: "", incoming: false, callLogId: null, requestId: state.requestId + 1 })),
  close: () => set({ open: false }),
}));
