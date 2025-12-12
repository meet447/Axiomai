import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ConfigStore, createConfigSlice } from "./slices/configSlice";
import { createMessageSlice, ChatStore } from "./slices/messageSlice";

type StoreState = ChatStore & ConfigStore;

const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createMessageSlice(...a),
      ...createConfigSlice(...a),
    }),
    {
      name: "store",
      partialize: (state) => ({
        model: state.model,
        proMode: state.proMode,
        agenticMode: state.agenticMode,
        focusMode: state.focusMode,
      }),
    },
  ),
);

export const useChatStore = () =>
  useStore((state) => ({
    messages: state.messages,
    addMessage: state.addMessage,
    setMessages: state.setMessages,
    threadId: state.threadId,
    setThreadId: state.setThreadId,
    guestMessageCount: state.guestMessageCount,
    incrementGuestMessageCount: state.incrementGuestMessageCount,
    resetGuestMessageCount: state.resetGuestMessageCount,
  }));

export const useConfigStore = () =>
  useStore((state) => ({
    model: state.model,
    setModel: state.setModel,
    proMode: state.proMode,
    toggleProMode: state.toggleProMode,
    agenticMode: state.agenticMode,
    toggleAgenticMode: state.toggleAgenticMode,
    focusMode: state.focusMode,
    setFocusMode: state.setFocusMode,
  }));
