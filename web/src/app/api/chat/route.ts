import { NextRequest, NextResponse } from 'next/server';
import { openai, MODELS } from '@/lib/llm';
import { performSearch, SearchResult } from '@/lib/search';
import {
    CHAT_PROMPT,
    HISTORY_QUERY_REPHRASE,
    AGENT_QUERY_PROMPT
} from '@/lib/agent/prompts';
import { generatePlan } from '@/lib/agent/plan';
import { generateSearchQueries, generateRelatedQuestions } from '@/lib/agent/questions';

export const runtime = 'nodejs'; // Use nodejs runtime for robust scraping/cheerio

interface ChatRequest {
    thread_id?: number;
    query: string;
    history: any[];
    model: string;
    pro_search: boolean;
    focusMode: string;
    agentic: boolean;
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
    controller: ReadableStreamDefaultController
) {
    let currentQuery = query;

    // 1. Begin Stream
    sendEvent(controller, 'begin-stream', { event_type: 'begin-stream', query });

    // 2. Rephrase if history exists
    if (history && history.length > 0) {
        // ... (rephrase logic same)
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
    sendEvent(controller, 'stream-end', { thread_id: 125 }); // Mock thread ID since we don't have DB
}

async function handleExpertMode(
    query: string,
    history: any[],
    focusMode: string,
    controller: ReadableStreamDefaultController
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
    const plan = await generatePlan(currentQuery);
    const simplifiedPlan = plan.map(p => p.step);
    sendEvent(controller, 'agent-query-plan', { steps: simplifiedPlan });

    const stepContexts: Record<number, string> = {};
    const stepSources: Record<number, SearchResult[]> = {};
    const stepImages: Record<number, string[]> = {};

    // 4. Execute Steps
    const lastStepId = plan[plan.length - 1]?.id;

    for (const step of plan) {
        if (step.id === lastStepId) continue;

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

        searchResults.forEach(res => {
            allResults.push(...res.results);
            allImages.push(...res.images);
        });

        // Store
        stepSources[step.id] = allResults; // Should filter unique urls if crucial
        stepImages[step.id] = allImages;
        stepContexts[step.id] = formatContext(allResults);

        sendEvent(controller, 'agent-read-results', { step_number: step.id, results: allResults });
    }

    // 5. Final Synthesis
    const lastStep = plan.find(s => s.id === lastStepId);
    if (!lastStep) {
        // Fallback if plan empty
        sendEvent(controller, 'final-response', { response: "Failed to generate plan." });
        return;
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

    sendEvent(controller, 'stream-end', { thread_id: 125 });
}



import { fetchAndProcessUrl } from '@/lib/search';
import { REACT_AGENT_PROMPT } from '@/lib/agent/prompts';

async function handleAgenticMode(
    query: string,
    history: any[],
    controller: ReadableStreamDefaultController
) {
    sendEvent(controller, 'begin-stream', { event_type: 'begin-stream', query });

    let currentQuery = query;
    // Optional: Rephrase logic here if needed (skipping for brevity)

    let steps = 0;
    const maxSteps = 10;
    let agentHistory: string[] = [];
    let finalAnswer = "";

    // 0. Generate Initial Plan (Intelligence Boost)
    try {
        const plan = await generatePlan(currentQuery);
        const planText = plan.map(p => `${p.id + 1}. ${p.step}`).join('\n');
        agentHistory.push(`**SUGGESTED PLAN:**\n${planText}\n(You can follow this plan or adapt it based on new findings.)`);
    } catch (e) {
        console.warn("Failed to generate initial plan for agent", e);
    }

    const allSources: SearchResult[] = [];

    while (steps < maxSteps) {
        await new Promise(r => setTimeout(r, 2000)); // Rate limit protection
        steps++;
        const historyLog = agentHistory.join('\n');

        // 1. Think / Decide Action
        const prompt = REACT_AGENT_PROMPT(currentQuery, historyLog);
        const completion = await openai.chat.completions.create({
            model: MODELS.powerful, // Use powerful model for reasoning
            messages: [{ role: 'user', content: prompt }],
            stream: false,
            response_format: { type: "json_object" } // Force JSON if supported, or rely on prompt
        });

        const text = completion.choices[0].message.content || "{}";
        let action: any = {};
        try {
            action = JSON.parse(text);
        } catch (e) {
            // regex fallback
            const match = text.match(/\{[\s\S]*\}/);
            if (match) action = JSON.parse(match[0]);
        }

        // 2. Stream Action to UI
        sendEvent(controller, 'agent-action', { step: steps, action: action });

        // 3. Execute Action
        if (action.action === 'search') {
            const q = action.query;
            const res = await performSearch(q, 4, 'web');
            const summary = res.results.map(r => `[${r.title}](${r.url}): ${r.content}`).join('\n');

            allSources.push(...res.results);
            agentHistory.push(`Step ${steps}: Searched for "${q}". Found:\n${summary}`);

            // Send observations to UI? 
            // Ideally we show the user what we found.
            // But 'agent-read-results' expects a different format. 
            // Let's rely on 'agent-action' to show intent, then maybe 'search-results' later?
            // Actually, let's emit a generic log event if we had one.
            // For now, the UI will just see the action.

        } else if (action.action === 'visit') {
            const url = action.url;
            const content = await fetchAndProcessUrl(url);
            const snippet = content.slice(0, 1000); // Limit context
            agentHistory.push(`Step ${steps}: Visited ${url}. Content:\n${snippet}...`);

        } else if (action.action === 'answer') {
            finalAnswer = action.text;
            break;
        } else {
            agentHistory.push(`Step ${steps}: Invalid action generated. trying again.`);
        }
    }

    // 4. Final Response
    if (!finalAnswer) finalAnswer = "I could not complete the research in time.";

    // Unify sources
    const uniqueSources = Array.from(new Map(allSources.map(s => [s.url, s])).values());
    sendEvent(controller, 'search-results', { results: uniqueSources, images: [] });

    // Stream final answer
    const chunks = finalAnswer.split(/(?=[,.\s])/); // Split by words/punctuation
    for (const chunk of chunks) {
        sendEvent(controller, 'text-chunk', { text: chunk });
        await new Promise(resolve => setTimeout(resolve, 15)); // 15ms delay for typing effect
    }
    // sendEvent(controller, 'final-response', { response: finalAnswer }); // Optional, legacy

    const related = await generateRelatedQuestions(currentQuery, finalAnswer);
    sendEvent(controller, 'related-queries', { related_queries: related });
    sendEvent(controller, 'stream-end', { thread_id: 125 });
}

export async function POST(req: NextRequest) {
    try {
        const payload: ChatRequest = await req.json();
        const { query, history, model, pro_search, focusMode, agentic } = payload;

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    if (agentic) {
                        await handleAgenticMode(query, history, controller);
                    } else if (pro_search) {
                        await handleExpertMode(query, history, focusMode, controller);
                    } else {
                        await handleBasicMode(query, history, model, focusMode, controller);
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
