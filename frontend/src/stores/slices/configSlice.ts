import { env } from "@/env.mjs";
import { StateCreator } from "zustand";
import { ChatModel } from "../../../generated";

import { FocusMode } from "@/lib/types/focus";

type State = {
  model: string;
  proMode: boolean;
  focusMode: FocusMode;
};

type Actions = {
  setModel: (model: string) => void;
  toggleProMode: () => void;
  setFocusMode: (mode: FocusMode) => void;
};

export type ConfigStore = State & Actions;

export const createConfigSlice: StateCreator<
  ConfigStore,
  [],
  [],
  ConfigStore
> = (set) => ({
  model: "hyper",
  proMode: false,
  focusMode: "web",
  setModel: (model: string) => set({ model }),
  setFocusMode: (mode: FocusMode) => set({ focusMode: mode }),
  toggleProMode: () =>
    set((state) => {
      const proModeEnabled = env.NEXT_PUBLIC_PRO_MODE_ENABLED;
      if (!proModeEnabled) {
        return { ...state, proMode: false };
      }
      return { ...state, proMode: !state.proMode };
    }),
});
