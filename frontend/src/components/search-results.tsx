/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SearchResult } from "@/lib/search"; // Correct import

export const SearchResultsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full mb-4">
      {[...Array(4)].map((_, index) => (
        <Skeleton key={`skeleton-${index}`} className="h-[75px] w-full rounded-xl" />
      ))}
    </div>
  );
};

export const Logo = ({ url }: { url: string }) => {
  return (
    <div className="rounded-full overflow-hidden shrink-0">
      <img
        className="block w-4 h-4 object-contain"
        src={`https://www.google.com/s2/favicons?sz=64&domain=${url}`}
        alt="favicon"
      />
    </div>
  );
};

export function SearchResults({ results }: { results: SearchResult[] }) {
  const [showAll, setShowAll] = useState(false);

  const displayedResults = showAll ? results : results.slice(0, 4); // Show 4 initially
  const additionalCount = results.length > 4 ? results.length - 4 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full mb-2">
      {displayedResults.map(({ title, url, content }, index) => {
        const hostname = new URL(url).hostname.replace('www.', '');

        return (
          <HoverCard key={`source-${index}`} openDelay={200}>
            <HoverCardTrigger asChild>
              <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full">
                <Card className="h-full rounded-xl bg-muted/40 hover:bg-muted/80 border-none transition-colors duration-200 cursor-pointer shadow-sm">
                  <CardContent className="p-3 flex flex-col justify-between h-[75px]">
                    <p className="text-xs font-medium text-foreground/90 line-clamp-2 leading-snug" title={title}>
                      {title}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Logo url={url} />
                        <span className="text-[10px] text-muted-foreground truncate font-medium">
                          {hostname}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 font-mono flex-shrink-0 bg-background/50 px-1.5 py-0.5 rounded-full">
                        {index + 1}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </HoverCardTrigger>

            <HoverCardContent className="w-80 p-0 overflow-hidden" align="start" sideOffset={8}>
              <div className="p-3 bg-card border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Logo url={url} />
                  <span className="text-xs font-semibold text-muted-foreground">{hostname}</span>
                </div>
                <a href={url} target="_blank" className="text-sm font-semibold hover:underline block mb-1">
                  {title}
                </a>
              </div>
              <div className="p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {content}
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}

      {!showAll && additionalCount > 0 && (
        <div onClick={() => setShowAll(true)} className="cursor-pointer h-full">
          <Card className="h-full rounded-xl bg-muted/40 hover:bg-muted/80 border-none transition-colors duration-200 flex items-center justify-center shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-3 h-[75px]">
              <span className="text-xs font-medium text-muted-foreground">
                View {additionalCount} more
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
