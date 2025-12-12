import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AgentQueryPlanStream,
  AgentReadResultsStream,
  AgentSearchFullResponse,
  AgentSearchQueriesStream,
  AgentSearchStep,
  AgentSearchStepStatus,
  ChatMessage,
  ChatRequest,
  ChatResponseEvent,
  ChatModel,  // <-- Import ChatModel here
  ErrorStream,
  Message,
  MessageRole,
  RelatedQueriesStream,
  SearchResult,
  SearchResultStream,
  StreamEndStream,
  StreamEvent,
  TextChunkStream,
  AgentActionStream,
  FinalResponseStream,
} from "../../generated";
import { createParser } from "eventsource-parser";




import {
  fetchEventSource,
  FetchEventSourceInit,
} from "@microsoft/fetch-event-source";
import { useState } from "react";
import { useConfigStore, useChatStore } from "@/stores";
import { env } from "../env.mjs";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";

const BASE_URL = env.NEXT_PUBLIC_API_URL;

const streamChat = async ({
  request,
  onMessage,
}: {
  request: ChatRequest;
  onMessage?: FetchEventSourceInit["onmessage"];
}): Promise<void> => {
  return await fetchEventSource(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": getUserId(),
    },
    keepalive: true,
    openWhenHidden: true,
    body: JSON.stringify({ ...request }),
    onmessage: onMessage,
    onerror: (error) => {
      console.error("Stream error:", error);
      throw error;
    },
    onclose: () => {
      return;
    }
  });
};

const convertToChatRequest = (query: string, history: ChatMessage[]) => {
  const newHistory: Message[] = history.map((message) => ({
    role:
      message.role === MessageRole.USER
        ? MessageRole.USER
        : MessageRole.ASSISTANT,
    content: message.content,
  }));
  return { query, history: newHistory };
};

export const useChat = () => {
  const queryClient = useQueryClient();
  const { addMessage, messages, threadId, setThreadId } = useChatStore();
  const { model, proMode, agenticMode } = useConfigStore();

  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [isStreamingProSearch, setIsStreamingProSearch] = useState(false);
  const [isStreamingMessage, setIsStreamingMessage] = useState(false);

  let steps_details: AgentSearchStep[] = [];

  const handleEvent = (eventItem: ChatResponseEvent, state: ChatMessage) => {
    switch (eventItem.event) {
      case StreamEvent.BEGIN_STREAM:
        setIsStreamingMessage(true);
        setStreamingMessage({
          ...state,
          role: MessageRole.ASSISTANT,
          content: "",
          related_queries: [],
          sources: [],
          images: [],
          agent_actions: [],
        });
        break;
      case StreamEvent.SEARCH_RESULTS:
        const data = eventItem.data as SearchResultStream;
        state.sources = data.results ?? [];
        state.images = data.images ?? [];
        break;
      case StreamEvent.TEXT_CHUNK:
        const chunkText = (eventItem.data as TextChunkStream).text;
        // console.log("Received chunk:", chunkText);
        state.content += chunkText;

        if (!state.agent_response) {
          break;
        }
        // Hide the pro search once we start streaming
        steps_details = steps_details.map((step) => ({
          ...step,
          status: AgentSearchStepStatus.DONE,
        }));
        state.agent_response = {
          steps_details: steps_details,
        };

        break;
      case StreamEvent.RELATED_QUERIES:
        state.related_queries =
          (eventItem.data as RelatedQueriesStream).related_queries ?? [];
        break;
      case StreamEvent.FINAL_RESPONSE: // Handle final response update
        const finalMsg = (eventItem.data as FinalResponseStream).message;
        if (finalMsg) state.content = finalMsg;
        break;
      case StreamEvent.STREAM_END:
        const endData = eventItem.data as StreamEndStream;
        addMessage({ ...state });
        setStreamingMessage(null);
        setIsStreamingMessage(false);
        setIsStreamingProSearch(false);

        // Only if the backend is using the DB
        if (endData.thread_id) {
          setThreadId(endData.thread_id);
          window.history.pushState({}, "", `/search/${endData.thread_id}`);
        }
        return;
      case StreamEvent.AGENT_QUERY_PLAN:
        const { steps } = eventItem.data as AgentQueryPlanStream;
        steps_details =
          steps?.map((step, index) => ({
            step: step,
            queries: [],
            results: [],
            status: AgentSearchStepStatus.DEFAULT,
            step_number: index,
          })) ?? [];

        if (steps_details.length > 0) {
          steps_details[0].status = AgentSearchStepStatus.CURRENT;
        }
        state.agent_response = {
          steps_details: steps_details,
        };
        break;
      case StreamEvent.AGENT_SEARCH_QUERIES:
        const { queries, step_number: queryStepNumber } =
          eventItem.data as AgentSearchQueriesStream;
        steps_details[queryStepNumber].queries = queries;
        steps_details[queryStepNumber].status = AgentSearchStepStatus.CURRENT;
        if (queryStepNumber !== 0) {
          steps_details[queryStepNumber - 1].status =
            AgentSearchStepStatus.DONE;
        }
        state.agent_response = {
          steps_details: steps_details,
        };
        break;
      case StreamEvent.AGENT_READ_RESULTS:
        const { results, step_number: resultsStepNumber } =
          eventItem.data as AgentReadResultsStream;
        steps_details[resultsStepNumber].results = results;

        break;
      case StreamEvent.AGENT_ACTION:
        const actionData = eventItem.data as AgentActionStream;
        if (!state.agent_actions) state.agent_actions = [];
        state.agent_actions.push({ step: actionData.step, action: actionData.action });
        break;
      case StreamEvent.AGENT_FINISH:
        break;
      case StreamEvent.ERROR:
        const errorData = eventItem.data as ErrorStream;
        addMessage({
          role: MessageRole.ASSISTANT,
          content: errorData.detail,
          related_queries: [],
          sources: [],
          images: [],
          agent_response: state.agent_response,
          is_error_message: true,
        });
        setStreamingMessage(null);
        setIsStreamingMessage(false);
        setIsStreamingProSearch(false);
        return;
    }
    setStreamingMessage({
      role: MessageRole.ASSISTANT,
      content: state.content,
      related_queries: state.related_queries,
      sources: state.sources,
      images: state.images,
      agent_actions: state.agent_actions,
      agent_response:
        state.agent_response !== null
          ? {
            steps: steps_details.map((step) => step.step),
            steps_details: steps_details,
          }
          : null,
    });
  };


  const { mutateAsync: chat } = useMutation<void, Error, ChatRequest>({
    retry: false,
    onSuccess: () => {
      // Invalidate history query to update sidebar
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    },
    mutationFn: async (request) => {
      const state: ChatMessage = {
        role: MessageRole.ASSISTANT,
        content: "",
        related_queries: null,
        sources: null,
        images: null,
        is_error_message: false,
        agent_response: null,
        agent_actions: []
      };

      setStreamingMessage(state);

      const response = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": getUserId(),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // ... rest of the stream handling
      if (!response.body) return;
      const reader = response.body.getReader();

      const parser = createParser({
        onEvent: (event: any) => {
          if (event.type === 'event') {
            try {
              const data = JSON.parse(event.data);
              // console.log("Parsed Event:", data.event);
              handleEvent(data, state);
            } catch (e) {
              console.error("Event parsing error", e);
            }
          }
        }
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(new TextDecoder().decode(value));
      }
    },
  });

  const handleSend = async (query: string, options?: Partial<ChatRequest>) => {
    // ... existing logic to add user message ...
    const userMsg: ChatMessage = {
      role: MessageRole.USER,
      content: query,
      related_queries: null,
      sources: null,
      images: null,
      is_error_message: false,
      agent_response: null
    };

    // Optimistic update
    addMessage(userMsg);

    // Prepare history
    const history = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    await chat({
      query,
      history,
      model: model as any, // default from store
      pro_search: proMode, // default from store
      focusMode: 'web', // default
      agentic: agenticMode, // default from store
      thread_id: threadId ?? undefined,
      ...options // Override with custom options
    });
  };

  return {
    handleSend,
    messages,
    streamingMessage,
    isStreamingMessage,
    isStreamingProSearch,
  };
};
