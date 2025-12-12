import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { env } from "@/env.mjs";
import { ChatSnapshot } from "../../generated";
import { useSession } from "next-auth/react";

import { getUserId } from "@/lib/user";

const BASE_URL = env.NEXT_PUBLIC_API_URL;

// Helper to get effective user ID (session ID or guest ID)
const getEffectiveUserId = (session: any): string => {
  if (session?.user?.id) {
    return session.user.id;
  }
  return getUserId();
};

export const useChatHistory = () => {
  const { data: session, status } = useSession();

  // Get the effective user ID based on session
  const userId = getEffectiveUserId(session);

  return useQuery<ChatSnapshot[], Error>({
    queryKey: ["chatHistory", userId],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/history`, {
        headers: { 'x-user-id': userId }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch chat history");
      }
      const data = await response.json();
      return data.snapshots;
    },
    retry: false,
    // Only fetch when we have a user ID
    enabled: status !== "loading",
  });
};

export const useDeleteChat = () => {
  const { data: session } = useSession();
  const userId = getEffectiveUserId(session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: number) => {
      const response = await fetch(`${BASE_URL}/thread/${threadId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      if (!response.ok) throw new Error("Failed to delete chat");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    }
  });
};

