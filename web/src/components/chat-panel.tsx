"use client";

import { useChat } from "@/hooks/chat";
import { useChatStore } from "@/stores";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AskInput } from "./ask-input";

import { useChatThread } from "@/hooks/threads";
import { LoaderIcon } from "lucide-react";
import { MessageRole } from "../../generated";
import MessagesList from "./messages-list";
import { StarterQuestionsList } from "./starter-questions";

const useAutoScroll = (ref: React.RefObject<HTMLDivElement>) => {
  const { messages } = useChatStore();

  useEffect(() => {
    if (messages.at(-1)?.role === MessageRole.USER) {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, ref]);
};

const useAutoFocus = (ref: React.RefObject<HTMLTextAreaElement>) => {
  useEffect(() => {
    ref.current?.focus();
  }, [ref]);
};

export const ChatPanel = ({ threadId }: { threadId?: number }) => {
  const searchParams = useSearchParams();
  const queryMessage = searchParams.get("q");
  const hasRun = useRef(false);

  const {
    handleSend,
    streamingMessage,
    isStreamingMessage,
    isStreamingProSearch,
  } = useChat();
  const { messages, setMessages, setThreadId } = useChatStore();
  const { data: thread, isLoading, error } = useChatThread(threadId);

  const messageBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useAutoScroll(messageBottomRef);
  useAutoFocus(inputRef);

  useEffect(() => {
    if (queryMessage && !hasRun.current) {
      setThreadId(null);
      hasRun.current = true;
      handleSend(queryMessage);
    }
  }, [queryMessage, handleSend, setThreadId]);

  useEffect(() => {
    if (!thread) return;
    setThreadId(thread.thread_id);
    setMessages(thread.messages || []);
  }, [threadId, thread, setMessages, setThreadId]);

  useEffect(() => {
    if (!threadId && !queryMessage) {
      setThreadId(null);
      setMessages([]);
    }
  }, [threadId, queryMessage, setThreadId, setMessages]);

  return (
    <>
      {messages.length > 0 || threadId ? (
        isLoading ? (
          <div className="w-full flex justify-center items-center">
            <LoaderIcon className="animate-spin w-8 h-8" />
          </div>
        ) : (
          <div className="pt-10 pb-40 w-full relative">
            <MessagesList
              messages={messages}
              streamingMessage={streamingMessage}
              isStreamingMessage={isStreamingMessage}
              isStreamingProSearch={isStreamingProSearch}
              onRelatedQuestionSelect={handleSend}
            />
            <div ref={messageBottomRef} className="h-0" />
            <div className="fixed bottom-8 left-0 right-0 md:left-16 flex justify-center px-4 z-10">
              <div className="w-full max-w-2xl">
                <AskInput isFollowingUp sendMessage={handleSend} />
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="w-full flex flex-col justify-center items-center px-4">
          <div className="flex items-center justify-center mb-8">
            <span className="text-3xl">Ask anything</span>
          </div>
          <div className="w-full max-w-2xl">
            <AskInput sendMessage={handleSend} />
          </div>
          <div className="w-full max-w-2xl flex flex-row justify-between space-y-2 pt-1">
            <StarterQuestionsList handleSend={handleSend} />
          </div>
        </div>
      )}
    </>
  );
};
