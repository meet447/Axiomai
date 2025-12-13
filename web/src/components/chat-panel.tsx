"use client";

import { useChat } from "@/hooks/chat";
import { useChatStore } from "@/stores";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AskInput } from "./ask-input";
import { useSession } from "next-auth/react";

import { useChatThread } from "@/hooks/threads";
import { LoaderIcon } from "lucide-react";
import { MessageRole } from "../../generated";
import MessagesList from "./messages-list";
import { StarterQuestionsList } from "./starter-questions";
import { SignUpModal } from "./sign-up-modal";

const GUEST_MESSAGE_LIMIT = 5;

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
  const { data: session, status } = useSession();

  const {
    handleSend: originalHandleSend,
    streamingMessage,
    isStreamingMessage,
    isStreamingProSearch,
  } = useChat();
  const { messages, setMessages, setThreadId, guestMessageCount, incrementGuestMessageCount } = useChatStore();
  const { data: thread, isLoading, error } = useChatThread(threadId);

  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpReason, setSignUpReason] = useState<"limit" | "expert" | "history">("limit");

  const messageBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isGuest = status !== "authenticated";

  useAutoScroll(messageBottomRef);
  useAutoFocus(inputRef);

  // Wrapped handleSend with guest limits
  const handleSend = (message: string) => {
    if (isGuest) {
      // Check if guest has exceeded limit
      if (guestMessageCount >= GUEST_MESSAGE_LIMIT) {
        setSignUpReason("limit");
        setShowSignUpModal(true);
        return;
      }
      incrementGuestMessageCount();
    }
    originalHandleSend(message);
  };

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
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
        reason={signUpReason}
      />
      {messages.length > 0 || threadId ? (
        isLoading ? (
          <div className="w-full flex justify-center items-center">
            <LoaderIcon className="animate-spin w-8 h-8" />
          </div>
        ) : (
          <div className="pt-14 sm:pt-16 pb-40 w-full relative">
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
                {isGuest && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {GUEST_MESSAGE_LIMIT - guestMessageCount} messages remaining •{" "}
                    <button
                      onClick={() => setShowSignUpModal(true)}
                      className="text-primary hover:underline"
                    >
                      Sign up for unlimited
                    </button>
                  </p>
                )}
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
