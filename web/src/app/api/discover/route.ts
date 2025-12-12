import { NextResponse } from 'next/server';
import { performSearch } from '@/lib/search';

export async function GET() {
    try {
        // Scrape trending topics (e.g. from a news search)
        const trendingQuery = "latest technology and science news world currently";
        const searchResults = await performSearch(trendingQuery, 5, 'web');

        const trends = searchResults.results.map((r, i) => ({
            id: i,
            title: r.title,
            summary: r.content.slice(0, 150) + "...",
            url: r.url,
            image: searchResults.images[i] || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2940&auto=format&fit=crop"
        }));

        return NextResponse.json({ trends });
    } catch (error) {
        console.error("Discover API error:", error);
        return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
    }
}
