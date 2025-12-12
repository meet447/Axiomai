import { create, StateCreator } from "zustand";
import { ChatMessage } from "../../../generated";

type State = {
  threadId: number | null;
  messages: ChatMessage[];
  guestMessageCount: number; // Track messages for anonymous users
};

type Actions = {
  addMessage: (message: ChatMessage) => void;
  setThreadId: (threadId: number | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  incrementGuestMessageCount: () => void;
  resetGuestMessageCount: () => void;
};

export type ChatStore = State & Actions;

export const createMessageSlice: StateCreator<ChatStore, [], [], ChatStore> = (
  set,
) => ({
  threadId: null,
  messages: [],
  guestMessageCount: 0,
  addMessage: (message: ChatMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setThreadId: (threadId: number | null) => set((state) => ({ threadId })),
  setMessages: (messages: ChatMessage[]) => set((state) => ({ messages })),
  incrementGuestMessageCount: () =>
    set((state) => ({ guestMessageCount: state.guestMessageCount + 1 })),
  resetGuestMessageCount: () => set({ guestMessageCount: 0 }),
});
