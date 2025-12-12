"use client";

import { useEffect, useRef, useState } from "react";
import { MessageRole } from "../../../../generated";
import { useChat } from "@/hooks/chat";
import { MemoizedReactMarkdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Share2, Newspaper } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import rehypeRaw from "rehype-raw";
import { Separator } from "@/components/ui/separator";

export default function NewsArticlePage({ params }: { params: { slug: string } }) {
    const title = decodeURIComponent(params.slug);
    const hasFetched = useRef(false);

    // We reuse the existing chat hook but only for one "interaction"
    const { handleSend, streamingMessage, isStreamingMessage } = useChat();

    // Track if we have initiated the request
    const [hasStarted, setHasStarted] = useState(false);

    // Derived state
    const content = streamingMessage?.content || "";
    // Loading is true if we started but no content has arrived yet
    const isLoading = hasStarted && !content;

    useEffect(() => {
        if (!hasFetched.current && title) {
            hasFetched.current = true;
            setHasStarted(true);

            // Trigger the agent with a specific instruction to write an article
            handleSend(`Research and write a comprehensive article about: "${title}". 
            Format it as a professional news story with an introduction, detailed body paragraphs, and conclusion. 
            Do not include a title/headline at the top.
            Do not use "I" or "Here is a report". Write objectively like a journalist. 
            Include citations.`,
                { articleMode: true, saveToHistory: false });
        }
    }, [title, handleSend]);

    // Simple word count / read time estimator
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    return (
        <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            {/* Nav / Header */}
            <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center max-w-4xl mx-auto px-4">
                    <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
                        <Link href="/discover">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Discover
                        </Link>
                    </Button>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <main className="container max-w-3xl mx-auto py-10 px-4">

                {/* Article Header */}
                <div className="mb-8 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest font-semibold">
                        <Newspaper className="w-4 h-4 text-primary" />
                        <span>Article Brief</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight text-foreground">
                        {title}
                    </h1>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {readTime} min read
                        </span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span>•</span>
                        <span className="text-primary font-medium">Axiom AI</span>
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Article Content */}
                <article className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-serif prose-headings:font-medium">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-[90%]" />
                            <Skeleton className="h-6 w-[95%]" />
                            <Skeleton className="h-40 w-full rounded-xl my-8" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-[85%]" />
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-5 duration-700">
                            <MemoizedReactMarkdown
                                components={{
                                    p: ({ children }) => <p className="leading-relaxed text-lg text-foreground/90 mb-6">{children}</p>,
                                    h1: ({ children }) => <h2 className="text-3xl font-bold mt-10 mb-4">{children}</h2>, // Demote h1 to h2 inside article
                                    h2: ({ children }) => <h2 className="text-2xl font-bold mt-10 mb-4">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-xl font-bold mt-8 mb-3">{children}</h3>,
                                    ul: ({ children }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>,
                                    ol: ({ children }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>,
                                    blockquote: ({ children }) => <blockquote className="mt-6 border-l-2 pl-6 italic text-muted-foreground">{children}</blockquote>,
                                }}
                                rehypePlugins={[rehypeRaw]}
                            >
                                {content}
                            </MemoizedReactMarkdown>
                        </div>
                    )}

                    {/* Streaming Indicator */}
                    {isStreamingMessage && !isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            Generating article...
                        </div>
                    )}
                </article>

                <Separator className="my-12" />

                {/* Sources / Citations area could go here if parsed from the message */}

            </main>
        </div>
    );
}
