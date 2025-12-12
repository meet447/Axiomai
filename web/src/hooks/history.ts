import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { env } from "@/env.mjs";
import { ChatSnapshot } from "../../generated";

import { getUserId } from "@/lib/user";

const BASE_URL = env.NEXT_PUBLIC_API_URL;

export const fetchChatHistory = async (): Promise<ChatSnapshot[]> => {
  const response = await fetch(`${BASE_URL}/history`, {
    headers: { 'x-user-id': getUserId() }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch chat history");
  }
  const data = await response.json();
  return data.snapshots;
};

export const useChatHistory = () => {
  return useQuery<ChatSnapshot[], Error>({
    queryKey: ["chatHistory"],
    queryFn: fetchChatHistory,
    retry: false,
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (threadId: number) => {
      const response = await fetch(`${BASE_URL}/thread/${threadId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': getUserId() }
      });
      if (!response.ok) throw new Error("Failed to delete chat");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    }
  });
};
