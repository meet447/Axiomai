import { NextRequest, NextResponse } from 'next/server';
import { openai, MODELS } from '@/lib/llm';
import { performSearch, SearchResult, fetchAndProcessUrl } from '@/lib/search';
import {
    CHAT_PROMPT,
    HISTORY_QUERY_REPHRASE,
    AGENT_QUERY_PROMPT
} from '@/lib/agent/prompts';
import { generatePlan } from '@/lib/agent/plan';
import { generateSearchQueries, generateRelatedQuestions } from '@/lib/agent/questions';
import { saveChat } from '@/lib/persistence';

export const runtime = 'nodejs'; // Use nodejs runtime for robust scraping/cheerio

interface ChatRequest {
    thread_id?: number;
    query: string;
    history: any[];
    model: string;
    pro_search: boolean;
    focusMode: string;
    agentic: boolean;
    saveToHistory?: boolean;
    articleMode?: boolean;
}

function formatContext(results: SearchResult[]): string {
    return results.map((r, i) => `
[${i + 1}]
Title: ${r.title}
URL: ${r.url}
Summary: ${r.content}
`).join('\n---\n');
}

// Helper to push SSE events
function sendEvent(controller: ReadableStreamDefaultController, event: string, data: any) {
    const payload = `data: ${JSON.stringify({ event, data })}\n\n`;
    controller.enqueue(new TextEncoder().encode(payload));
}

async function streamChunks(stream: any, controller: ReadableStreamDefaultController, onText: (text: string) => void) {
    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
            onText(text);
            sendEvent(controller, 'text-chunk', { text });
        }
    }
}

async function handleBasicMode(
    query: string,
    history: any[],
    model: string,
    focusMode: string,
    controller: ReadableStreamDefaultController,
    userId: string,
    threadId?: number,
    saveToHistory: boolean = true
) {
    let currentQuery = query;

    // 1. Begin Stream
    sendEvent(controller, 'begin-stream', { event_type: 'begin-stream', query });

    // 2. Rephrase if history exists
    if (history && history.length > 0) {
        const rephrasedStream = await openai.chat.completions.create({
            model: MODELS.fast,
            messages: [{ role: 'user', content: HISTORY_QUERY_REPHRASE(JSON.stringify(history), currentQuery) }],
            stream: false,
        });
        const rephrased = rephrasedStream.choices[0].message.content;
        if (rephrased) {
            currentQuery = rephrased;
        }
    }

    // 3. Search (writing mode skips search)
    let searchResults: any = { results: [], images: [] };
    if (focusMode !== 'writing') {
        searchResults = await performSearch(currentQuery, 7, focusMode);
    }

    sendEvent(controller, 'search-results', {
        event_type: 'search-results',
        results: searchResults.results,
        images: searchResults.images
    });

    // 4. Chat Model Response
    const context = formatContext(searchResults.results);
    const prompt = CHAT_PROMPT(currentQuery, context);

    const completionStream = await openai.chat.completions.create({
        model: model === 'powerful' ? MODELS.powerful : MODELS.fast, // mapping basic keys
        messages: [{ role: 'user', content: prompt }],
        stream: true,
    });

    let fullResponse = "";
    await streamChunks(completionStream, controller, (t) => fullResponse += t);

    // 5. Final Response
    sendEvent(controller, 'final-response', { event_type: 'final-response', response: fullResponse });

    // 6. Related Questions
    const related = await generateRelatedQuestions(currentQuery, fullResponse);
    sendEvent(controller, 'related-queries', { related_queries: related });

    // 7. Final Message & End
    sendEvent(controller, 'final-message', { message: fullResponse });
    let newThreadId = threadId;
    if (saveToHistory) {
        newThreadId = await saveChat(userId, threadId, query, fullResponse, searchResults.results, searchResults.images);
    }
    sendEvent(controller, 'stream-end', { thread_id: newThreadId ?? -1 });
}

async function handleExpertMode(
    query: string,
    history: any[],
    focusMode: string,
    controller: ReadableStreamDefaultController,
    userId: string,
    threadId?: number,
    saveToHistory: boolean = true
) {
    // ... setup
    let currentQuery = query;

    // ... rephrase logic (omitted for brevity in prompt match)

    // 1. Begin Stream
    sendEvent(controller, 'begin-stream', { event_type: 'begin-stream', query });

    // 2. Rephrase
    if (history && history.length > 0) {
        try {
            const rephrasedResp = await openai.chat.completions.create({
                model: MODELS.fast,
                messages: [{ role: 'user', content: HISTORY_QUERY_REPHRASE(JSON.stringify(history), currentQuery) }],
                stream: false
            });
            const rephrased = rephrasedResp.choices[0].message.content;
            if (rephrased) currentQuery = rephrased;
        } catch (e) {
            console.error("Rephrasing failed", e);
        }
    }

    // Writing mode bypasses explicit search steps usually, but Expert mode implies research.
    // We can argue 'Writing' mode shouldn't even trigger Expert Mode, but if it does, 
    // maybe we just skip search steps or treat 'Writing' as 'Creative Agent'.
    // For now, let's respect focusMode in searches.

    // 3. Generate Plan
    let simplifiedPlan: string[] = [];
    try {
        const plan = await generatePlan(currentQuery);
        simplifiedPlan = plan.map(p => p.step);
        sendEvent(controller, 'agent-query-plan', { steps: simplifiedPlan });

        const stepContexts: Record<number, string> = {};
        const stepSources: Record<number, SearchResult[]> = {};
        const stepImages: Record<number, string[]> = {};

        // 4. Execute Steps
        const lastStepId = plan[plan.length - 1]?.id;

        for (const step of plan) {
            if (step.id === lastStepId) continue;
            try {
                // Build context from dependencies
                const prevContexts = step.dependencies
                    .filter(depId => stepContexts[depId])
                    .map(depId => `Step: ${plan.find(p => p.id === depId)?.step}\nContext: ${stepContexts[depId]}`)
                    .join('\n');

                // Generate queries
                const relatedQueries = await generateSearchQueries(currentQuery, prevContexts, step.step);
                sendEvent(controller, 'agent-search-queries', { step_number: step.id, queries: relatedQueries });

                // Search in parallel
                let searchResults: any[] = [];
                if (focusMode !== 'writing') {
                    searchResults = await Promise.all(relatedQueries.map(q => performSearch(q, 4, focusMode)));
                }

                const allResults: SearchResult[] = [];
                const allImages: string[] = [];
                // eslint-disable-next-line
                searchResults.forEach(res => {
                    allResults.push(...res.results);
                    allImages.push(...res.images);
                });


                // Store
                stepSources[step.id] = allResults; // Should filter unique urls if crucial
                stepImages[step.id] = allImages;
                stepContexts[step.id] = formatContext(allResults);

                sendEvent(controller, 'agent-read-results', { step_number: step.id, results: allResults });
            } catch (stepError) {
                console.error(`Error in step ${step.id}:`, stepError);
                // Continue to next step
            }
        }

        // 5. Final Synthesis
        const lastStep = plan.find(s => s.id === lastStepId);
        if (!lastStep) {
            throw new Error("Failed to generate plan.");
        }

        // Combine contexts
        const dependencies = lastStep.dependencies;
        const combinedContexts = dependencies
            .filter(depId => stepContexts[depId])
            .map(depId => `Step: ${plan.find(p => p.id === depId)?.step}\nContext: ${stepContexts[depId]}`)
            .join('\n\n');

        // Gather sources/images for final event
        const combinedSources: SearchResult[] = [];
        const combinedImages: string[] = [];
        dependencies.forEach(depId => {
            if (stepSources[depId]) combinedSources.push(...stepSources[depId]);
            if (stepImages[depId]) combinedImages.push(...stepImages[depId]);
        });

        // Dedupe logic simplified
        const uniqueSources = Array.from(new Map(combinedSources.map(s => [s.url, s])).values());
        const uniqueImages = Array.from(new Set(combinedImages));

        sendEvent(controller, 'search-results', { results: uniqueSources, images: uniqueImages });

        // Generate Final Answer
        const finalPrompt = AGENT_QUERY_PROMPT(currentQuery, combinedContexts, lastStep.step);
        const finalStream = await openai.chat.completions.create({
            model: MODELS.powerful,
            messages: [{ role: 'user', content: finalPrompt }],
            stream: true
        });

        let finalResponse = "";
        await streamChunks(finalStream, controller, (t) => finalResponse += t);

        sendEvent(controller, 'final-response', { response: finalResponse });

        // 6. Related Questions
        const finalRelated = await generateRelatedQuestions(currentQuery, finalResponse);
        sendEvent(controller, 'related-queries', { related_queries: finalRelated });

        let newThreadId = threadId;
        if (saveToHistory) {
            newThreadId = await saveChat(userId, threadId, query, finalResponse, uniqueSources, uniqueImages);
        }
        sendEvent(controller, 'stream-end', { thread_id: newThreadId ?? -1 });

    } catch (e: any) {
        console.error("Expert mode failed", e);
        sendEvent(controller, 'final-response', { response: "An error occurred during expert research. Falling back to basic mode." });
        // Fallback to basic mode logic could go here, or just end
        // check if we can salvage basic mode?
        // For now, just error out gracefully 
    }
}



async function handleArticleMode(
    query: string,
    widthContext: boolean,
    controller: ReadableStreamDefaultController,
    userId: string,
    threadId?: number,
    saveToHistory: boolean = false
) {
    sendEvent(controller, 'begin-stream', { event_type: 'begin-stream', query });

    let searchQuery = query;
    try {
        const extractResp = await openai.chat.completions.create({
            model: MODELS.fast,
            messages: [
                { role: 'system', content: "You are a helper that extracts search queries. Output ONLY the search query." },
                { role: 'user', content: `Extract the main news topic as a search query from: "${query}"` }
            ]
        });
        const extracted = extractResp.choices[0].message.content?.trim();
        if (extracted) searchQuery = extracted.replace(/^"|"$/g, '');
    } catch (e) {
        console.warn("Failed to extract search query", e);
    }

    const searchResults = await performSearch(searchQuery, 5, 'web');

    const contentTasks = searchResults.results.slice(0, 5).map(async (res) => {
        try {
            const content = await fetchAndProcessUrl(res.url);
            return { ...res, content };
        } catch (e) {
            console.error(`Failed to fetch ${res.url}`, e);
            return { ...res, content: "" };
        }
    });

    const detailedResults = await Promise.all(contentTasks);
    const validResults = detailedResults.filter(r => r.content && r.content.length > 200);

    const context = validResults.map((r, i) => `
[SOURCE ${i + 1}]: ${r.title}
URL: ${r.url}
CONTENT:
${r.content.slice(0, 8000)}
`).join('\n\n----------------\n\n');

    const uniqueSources = Array.from(new Map(validResults.map(s => [s.url, s])).values());
    sendEvent(controller, 'search-results', { results: uniqueSources, images: [] });

    const prompt = `You are an expert journalist. Write a comprehensive news article based ONLY on:

Subject: ${query}

Instructions:
- Professional, objective tone. No "I will write" or "Here is".
- Structure with intro, detailed sections, and conclusion.
- Cite sources using [1], [2] notation.
- If context is insufficient, say so.

Research Context:
${context}`;

    const stream = await openai.chat.completions.create({
        model: MODELS.powerful,
        messages: [{ role: 'user', content: prompt }],
        stream: true
    });

    let fullResponse = "";
    await streamChunks(stream, controller, (t) => fullResponse += t);

    sendEvent(controller, 'final-response', { message: fullResponse });

    let newThreadId = threadId;
    if (saveToHistory) {
        newThreadId = await saveChat(userId, threadId, query, fullResponse, uniqueSources, []);
    }
    sendEvent(controller, 'stream-end', { thread_id: newThreadId ?? -1 });
}

export async function POST(req: NextRequest) {
    try {
        const payload: ChatRequest = await req.json();
        const { query, history, model, pro_search, focusMode, thread_id, saveToHistory = true, articleMode } = payload;
        const userId = req.headers.get('x-user-id') || 'anonymous';

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    if (articleMode) {
                        await handleArticleMode(query, true, controller, userId, thread_id, saveToHistory);
                    } else if (pro_search) {
                        await handleExpertMode(query, history, focusMode, controller, userId, thread_id, saveToHistory);
                    } else {
                        await handleBasicMode(query, history, model, focusMode, controller, userId, thread_id, saveToHistory);
                    }
                    controller.close();
                } catch (e: any) {
                    console.error("Stream error:", e);
                    const errorPayload = `data: ${JSON.stringify({ error: e.message || 'Unknown error' })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(errorPayload));
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
            }
        });

    } catch (error) {
        console.error("Route error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
