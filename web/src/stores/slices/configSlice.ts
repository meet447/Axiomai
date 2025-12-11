import { env } from "@/env.mjs";
import { StateCreator } from "zustand";
import { ChatModel } from "../../../generated";

import { FocusMode } from "@/lib/types/focus";

type State = {
  model: string;
  proMode: boolean;
  agenticMode: boolean;
  focusMode: FocusMode;
};

type Actions = {
  setModel: (model: string) => void;
  toggleProMode: () => void;
  toggleAgenticMode: () => void;
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
  agenticMode: false,
  focusMode: "web",
  setModel: (model: string) => set({ model }),
  setFocusMode: (mode: FocusMode) => set({ focusMode: mode }),
  toggleProMode: () =>
    set((state) => {
      const proModeEnabled = env.NEXT_PUBLIC_PRO_MODE_ENABLED;
      // If turning ON Pro Mode, turn OFF Agentic Mode for clarity
      if (!state.proMode && state.agenticMode) {
        return { ...state, proMode: true, agenticMode: false };
      }
      if (!proModeEnabled) {
        return { ...state, proMode: false };
      }
      return { ...state, proMode: !state.proMode };
    }),
  toggleAgenticMode: () =>
    set((state) => {
      // If turning ON Agentic Mode, turn OFF Pro Mode
      if (!state.agenticMode && state.proMode) {
        return { ...state, agenticMode: true, proMode: false };
      }
      return { ...state, agenticMode: !state.agenticMode };
    }),
});
