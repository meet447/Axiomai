import { NextResponse } from 'next/server';
import { performSearch } from '@/lib/search';
import { openai, MODELS } from '@/lib/llm';

export async function GET() {
    try {
        const categories = [
            { id: 'all', query: 'latest trending world news and technology headlines specific stories', limit: 8 }, // "For You" mix
            { id: 'top', query: 'latest major world news headlines', limit: 6 },
            { id: 'tech', query: 'latest specific technology ai news launches', limit: 5 },
            { id: 'finance', query: 'latest financial market news stocks economy', limit: 5 },
            { id: 'arts', query: 'latest arts culture entertainment news highlights', limit: 4 },
            { id: 'sports', query: 'latest sports news results highlights', limit: 4 },
        ];

        // 1. Fetch search data in parallel
        const searchTasks = categories.map(async (cat) => {
            const res = await performSearch(cat.query, cat.limit, 'web');
            return { ...cat, data: res };
        });

        const rawResults = await Promise.all(searchTasks);

        // 2. Curate with LLM
        // We will do one big LLM call or parallel LLM calls? 
        // Parallel is faster but uses more tokens. One big call context might be too large.
        // Let's do parallel for speed and isolation.

        const curationTasks = rawResults.map(async (catResult) => {
            const context = catResult.data.results.map(r => `- ${r.title}: ${r.content}`).join('\n');
            const prompt = `
            You are a news editor. Given the following raw search results for category "${catResult.id}", 
            extract ${catResult.limit} distinct, specific, and engaging news headlines.
            Avoid generic titles like "Tech News". Use specific subjects like "OpenAI releases GPT-5" or "Apple announces new iPad".
            Return a JSON object with a property "items" which is an array of objects: { "title": "...", "summary": "..." }.
            
            Raw Data:
            ${context}
            `;

            try {
                const completion = await openai.chat.completions.create({
                    model: MODELS.fast,
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: "json_object" }
                });

                const json = JSON.parse(completion.choices[0].message.content || "{}");
                const items = json.items || [];

                // Map back images roughly (index based fallback)
                return {
                    category: catResult.id,
                    items: items.map((item: any, i: number) => ({
                        id: `${catResult.id}-${i}`,
                        title: item.title,
                        summary: item.summary,
                        url: "", // We lose direct URL matching with LLM curation unless we strictly index. 
                        // But since we generate a new article anyway, link is less critical for the CARD itself,
                        // the card title drives the next search.
                        image: catResult.data.images[i] || null
                    }))
                };

            } catch (e) {
                console.error(`Curation failed for ${catResult.id}`, e);
                // Fallback to raw if LLM fails
                return {
                    category: catResult.id,
                    items: catResult.data.results.map((r, i) => ({
                        id: `${catResult.id}-${i}`,
                        title: r.title,
                        summary: r.content,
                        url: r.url,
                        image: catResult.data.images[i] || null
                    }))
                };
            }
        });

        const curatedResults = await Promise.all(curationTasks);

        // Filter out empty items
        const validResults = curatedResults.filter(c => c.items.length > 0);

        return NextResponse.json({
            trends: validResults.find(c => c.category === 'all')?.items || [],
            categories: validResults
        });

    } catch (error) {
        console.error("Discover API error:", error);
        return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
    }
}
