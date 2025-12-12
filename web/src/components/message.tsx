import React, { FC, memo, useEffect, useState, useMemo } from "react";
import { MemoizedReactMarkdown } from "./markdown";
import rehypeRaw from "rehype-raw";

import _ from "lodash";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { ChatMessage } from "../../generated";
import { SearchResult } from "@/lib/search";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

function chunkString(str: string): string[] {
  const words = str.split(" ");
  const chunks = _.chunk(words, 2).map((chunk) => chunk.join(" ") + " ");
  return chunks;
}

export interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

const Citation = memo(({ index, source }: { index: number; source: SearchResult }) => {
  const domain = new URL(source.url).hostname.replace('www.', '');

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="select-none no-underline inline-flex items-center justify-center align-top ml-0.5" type="button">
          <span className="relative -top-[0.2rem] inline-flex items-center justify-center rounded-full text-center px-1 text-[0.60rem] font-mono bg-muted text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors">
            {index}
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" align="start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?sz=64&domain=${source.url}`}
              className="w-4 h-4 rounded-full"
              alt="favicon"
            />
            <span className="text-xs font-semibold text-muted-foreground">{domain}</span>
          </div>
          <a href={source.url} target="_blank" className="font-medium hover:underline line-clamp-2 text-sm">
            {source.title}
          </a>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {source.content}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});
Citation.displayName = "Citation";

const Text = ({
  children,
  isStreaming,
  containerElement = "p",
}: {
  children: React.ReactNode;
  isStreaming: boolean;
  containerElement: React.ElementType;
}) => {
  const renderText = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") {
      const chunks = isStreaming ? chunkString(node) : [node];
      return chunks.flatMap((chunk, index) => {
        return (
          <span
            key={`${index}-streaming`}
            className={cn(
              isStreaming ? "animate-in fade-in-25 duration-700" : "",
            )}
          >
            {chunk}
          </span>
        );
      });
    } else if (React.isValidElement(node)) {
      return React.cloneElement(
        node,
        // @ts-ignore
        node.props,
        // @ts-ignore
        renderText(node.props.children),
      );
    } else if (Array.isArray(node)) {
      return node.map((child, index) => (
        <React.Fragment key={index}>{renderText(child)}</React.Fragment>
      ));
    }
    return null;
  };

  const text = renderText(children);
  return React.createElement(containerElement, {}, text);
};

const StreamingParagraph = memo(
  ({ children }: React.HTMLProps<HTMLParagraphElement>) => {
    return (
      <Text isStreaming={true} containerElement="p">
        {children}
      </Text>
    );
  },
);
const Paragraph = memo(
  ({ children }: React.HTMLProps<HTMLParagraphElement>) => {
    return (
      <Text isStreaming={false} containerElement="p">
        {children}
      </Text>
    );
  },
);

const ListItem = memo(({ children }: React.HTMLProps<HTMLLIElement>) => {
  return (
    <Text isStreaming={false} containerElement="li">
      {children}
    </Text>
  );
});

const StreamingListItem = memo(
  ({ children }: React.HTMLProps<HTMLLIElement>) => {
    return (
      <Text isStreaming={true} containerElement="li">
        {children}
      </Text>
    );
  },
);

StreamingParagraph.displayName = "StreamingParagraph";
Paragraph.displayName = "Paragraph";
ListItem.displayName = "ListItem";
StreamingListItem.displayName = "StreamingListItem";

export const MessageComponent: FC<MessageProps> = ({
  message,
  isStreaming = false,
}) => {
  const { content, sources } = message;

  // Preprocess content to replace [1] with [1](https://citation.internal/1)
  const processedContent = useMemo(() => {
    return content.replace(/\[(\d+)\]/g, "[$1](https://citation.internal/$1)");
  }, [content]);

  return (
    <div className="prose dark:prose-invert inline leading-relaxed break-words">
      <MemoizedReactMarkdown
        components={{
          // @ts-ignore
          p: isStreaming ? StreamingParagraph : Paragraph,
          // @ts-ignore
          li: isStreaming ? StreamingListItem : ListItem,
          // @ts-ignore
          a: ({ node, href, children, ...props }) => {
            if (href?.startsWith("https://citation.internal/")) {
              const index = parseInt(href.split("/").pop() || "0");
              const source = sources?.find((_, idx) => idx + 1 === index);
              if (source) {
                return <Citation index={index} source={source} />;
              }
              return null;
            }
            return <a href={href} {...props} target="_blank" rel="noopener noreferrer">{children}</a>;
          }
        }}
        rehypePlugins={[rehypeRaw]}
      >
        {processedContent}
      </MemoizedReactMarkdown>
    </div>
  );
};

export const MessageComponentSkeleton = () => {
  return (
    <>
      <Skeleton className="w-full py-4 bg-card">
        <div className="flex flex-col gap-4">
          <Skeleton className="mx-5 h-2 bg-primary/30" />
          <Skeleton className="mx-5 h-2 bg-primary/30 mr-20" />
          <Skeleton className="mx-5 h-2 bg-primary/30 mr-40" />
        </div>
      </Skeleton>
    </>
  );
};
