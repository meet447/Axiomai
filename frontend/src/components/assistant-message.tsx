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

import { ClarificationForm } from "./clarification-form";



export const AssistantMessageContent = ({
  message,
  isStreaming = false,
  onRelatedQuestionSelect,
  isLast = false,
  onClarificationSubmit,
  originalQuery = "",
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  onRelatedQuestionSelect: (question: string) => void;
  isLast?: boolean;
  onClarificationSubmit?: (query: string, answers: string[]) => void;
  originalQuery?: string;
}) => {
  const {
    sources,
    content,
    related_queries,
    images,
    is_error_message = false,
    clarification_questions,
  } = message;

  if (is_error_message) {
    return <ErrorMessage content={message.content} />;
  }

  // Deep Research Clarification Logic
  if (clarification_questions && clarification_questions.length > 0) {
    if (isLast && onClarificationSubmit) {
      return (
        <ClarificationForm
          questions={clarification_questions}
          originalQuery={originalQuery}
          onSubmit={onClarificationSubmit}
        />
      );
    } else {
      return (
        <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Clarification provided. Researching...
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col">
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
