import { MessageComponent, MessageComponentSkeleton } from "./message";
import RelatedQuestions from "./related-questions";
import { SearchResultsSkeleton, SearchResults } from "./search-results";
import { Section } from "./section";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageSection, ImageSectionSkeleton } from "./image-section";
import { ChatMessage } from "../../generated";

export function ErrorMessage({ content }: { content: string }) {
  return (
    <Alert className="bg-red-500/5 border-red-500/15 p-5">
      <AlertCircle className="h-4 w-4 stroke-red-500 stroke-2" />
      <AlertDescription className="text-base text-foreground">
        {content.split(" ").map((word, index) => {
          const urlPattern = /(https?:\/\/[^\s]+)/g;
          if (urlPattern.test(word)) {
            return (
              <a
                key={index}
                href={word}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {word}
              </a>
            );
          }
          return word + " ";
        })}
      </AlertDescription>
    </Alert>
  );
}

export const AssistantMessageContent = ({
  message,
  isStreaming = false,
  onRelatedQuestionSelect,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  onRelatedQuestionSelect: (question: string) => void;
}) => {
  const {
    sources,
    content,
    related_queries,
    images,
    is_error_message = false,
  } = message;

  if (is_error_message) {
    return <ErrorMessage content={message.content} />;
  }

  return (
    <div className="flex flex-col">
      {message.agent_actions && message.agent_actions.length > 0 && (
        <Section title="Agent Actions" animate={isStreaming}>
          <div className="flex flex-col gap-2 mb-4">
            {message.agent_actions.map((act, i) => (
              <div key={i} className="text-sm bg-gray-100 dark:bg-neutral-900 border dark:border-neutral-800 p-2 rounded-md flex items-center">
                <span className="font-bold uppercase text-xs text-indigo-500 min-w-[60px]">
                  {act.action.action}
                </span>
                <span className="ml-2 text-gray-700 dark:text-gray-300 truncate">
                  {act.action.query ? `"${act.action.query}"` : act.action.url || ''}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
      <Section title="Answer" animate={isStreaming} streaming={isStreaming}>
        {content ? (
          <MessageComponent message={message} isStreaming={isStreaming} />
        ) : (
          <MessageComponentSkeleton />
        )}
      </Section>
      <Section title="Sources" animate={isStreaming}>
        {!sources || sources.length === 0 ? (
          <SearchResultsSkeleton />
        ) : (
          <>
            <SearchResults results={sources} />
          </>
        )}
      </Section>
      <Section title="Images" animate={isStreaming}>
        {images && images.length > 0 ? (
          <ImageSection images={images} />
        ) : (
          <ImageSectionSkeleton />
        )}
      </Section>
      {related_queries && related_queries.length > 0 && (
        <Section title="Related" animate={isStreaming}>
          <RelatedQuestions
            questions={related_queries}
            onSelect={onRelatedQuestionSelect}
          />
        </Section>
      )}
    </div>
  );
};
