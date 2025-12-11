import { search } from 'google-sr';
import * as cheerio from 'cheerio';

export interface SearchResult {
    title: string;
    url: string;
    content: string;
}

export interface SearchResponse {
    results: SearchResult[];
    images: string[];
}

const SEARCH_PROVIDER = process.env.SEARCH_PROVIDER || 'google-scraper';
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;

export async function performSearch(query: string, maxText: number = 7, focusMode: string = 'web'): Promise<SearchResponse> {
    try {
        let results: SearchResult[] = [];
        let images: string[] = [];

        let searchQuery = query;
        if (focusMode === 'social') searchQuery += ' site:reddit.com OR site:twitter.com';
        if (focusMode === 'academic') searchQuery += ' site:arxiv.org OR site:scholar.google.com';
        if (focusMode === 'video') searchQuery += ' site:youtube.com';

        if (SEARCH_PROVIDER === 'serper' && SEARCH_API_KEY) {
            results = await searchSerper(searchQuery);
        } else if (SEARCH_PROVIDER === 'tavily' && SEARCH_API_KEY) {
            results = await searchTavily(searchQuery);
        } else {
            // Fallback to DuckDuckGo HTML (Most reliable free option)
            results = await searchDuckDuckGoHtml(searchQuery);

            // Fallback to DDG Lite if HTML fails (often bypasses captcha)
            if (results.length === 0) {
                results = await searchDuckDuckGoLite(searchQuery);
            }

            // Fallback to Google Scraper
            if (results.length === 0) {
                results = await searchGoogleScraper(searchQuery);
            }
        }

        // Limit results
        // Fetch images using GIS (Google Image Search) fallback if not provided by API
        // For writing/academic modes, maybe skip images or keep them? Let's keep them for now.
        if (images.length === 0 && focusMode !== 'writing') {
            images = await searchImagesGis(searchQuery);
        }

        // Limit results
        results = results.slice(0, maxText);
        images = images.slice(0, 6);

        // Enrich with content scraping if needed, but for speed usually snippets are enough 
        // or we scrape top 2. Let's scrape top 2 for better context if snippet is short.
        // basic/expert logic might differ, but let's keep it simple for now.
        // For now we will rely on the snippets returned by search engines as they are usually decent.
        // If we need deep scraping, we can re-enable `fetchAndProcessUrl`.

        // Construct response
        return {
            results: results,
            images: images // Images require specific API calls or scraping, keeping empty for now unless provider gives them
        };

    } catch (error) {
        console.error("Search failed:", error);
        return { results: [], images: [] };
    }
}

async function searchDuckDuckGoHtml(query: string): Promise<SearchResult[]> {
    try {
        const formData = new URLSearchParams();
        formData.append('q', query);

        const res = await fetch('https://html.duckduckgo.com/html/', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // Mimic a browser to avoid some checks
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) return [];

        const html = await res.text();
        const $ = cheerio.load(html);
        const results: SearchResult[] = [];

        $('.result__body').each((i, el) => {
            const title = $(el).find('.result__a').text().trim();
            const url = $(el).find('.result__a').attr('href');
            const snippet = $(el).find('.result__snippet').text().trim();

            if (title && url && snippet) {
                results.push({ title, url, content: snippet });
            }
        });

        return results;
    } catch (e) {
        console.error("DDG HTML search failed", e);
        return [];
    }
}

async function searchSerper(query: string): Promise<SearchResult[]> {
    try {
        const res = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': SEARCH_API_KEY!,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: query })
        });

        if (!res.ok) throw new Error(`Serper error: ${res.statusText}`);

        const data = await res.json();
        return (data.organic || []).map((r: any) => ({
            title: r.title,
            url: r.link,
            content: r.snippet
        }));
    } catch (e) {
        console.error("Serper search failed", e);
        return [];
    }
}

async function searchTavily(query: string): Promise<SearchResult[]> {
    try {
        const res = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: SEARCH_API_KEY,
                query: query,
                search_depth: "basic",
                include_images: false
            })
        });

        if (!res.ok) throw new Error(`Tavily error: ${res.statusText}`);

        const data = await res.json();
        return (data.results || []).map((r: any) => ({
            title: r.title,
            url: r.url,
            content: r.content
        }));
    } catch (e) {
        console.error("Tavily search failed", e);
        return [];
    }
}

async function searchGoogleScraper(query: string): Promise<SearchResult[]> {
    try {
        // @ts-ignore - google-sr types might be slightly off or version mismatch
        const searchResults = await search({
            query: query,
            // safeMode: true, // safeMode might not be valid in this version, avoiding for now
        });

        return searchResults.map((r: any) => ({
            title: r.title || 'No Title',
            url: r.link || '',
            content: r.description || r.snippet || '' // fallback
        }));
    } catch (e) {
        console.error("Google scraper failed", e);
        return [];
    }
}

async function searchImagesGis(query: string): Promise<string[]> {
    return new Promise((resolve) => {
        try {
            // @ts-ignore
            const gis = require('g-i-s');
            const opts = {
                searchTerm: query,
                queryStringAddition: '&tbs=isz:m', // Medium images
                filterOutDomains: [
                    'pinterest.com',
                    'deviantart.com'
                ]
            };

            gis(opts, (error: any, results: any[]) => {
                if (error) {
                    console.error("GIS error:", error);
                    resolve([]);
                    return;
                }
                // Extract URLs
                const imageUrls = results.map(r => r.url).filter(u => u.startsWith('http'));
                resolve(imageUrls);
            });
        } catch (e) {
            console.error("GIS failed to load or run", e);
            resolve([]);
        }
    });
}

export async function fetchAndProcessUrl(url: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) return "";

        const html = await res.text();
        const $ = cheerio.load(html);

        // Remove unwanted elements
        $('script, style, noscript, header, footer, nav, meta').remove();

        // Extract text
        let text = $('body').text();
        text = text.replace(/\s+/g, ' ').trim();

        return text.slice(0, 4000);
    } catch (e) {
        return "";
    }
}

async function searchDuckDuckGoLite(query: string): Promise<SearchResult[]> {
    try {
        const formData = new URLSearchParams();
        formData.append('q', query);

        const res = await fetch('https://lite.duckduckgo.com/lite/', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) return [];

        const html = await res.text();
        const $ = cheerio.load(html);
        const results: SearchResult[] = [];

        // Lite has table rows. 
        // Tricky structure. Usually: 
        // <tr><td><a href="...">Title</a></td></tr>
        // <tr><td>Snippet</td></tr>

        const rows = $('table').last().find('tr');

        let currentTitle = '';
        let currentUrl = '';

        rows.each((i, el) => {
            const link = $(el).find('a.result-link');
            if (link.length > 0) {
                currentTitle = link.text().trim();
                currentUrl = link.attr('href') || '';
            } else {
                const snippet = $(el).find('td.result-snippet').text().trim();
                if (snippet && currentTitle && currentUrl) {
                    results.push({ title: currentTitle, url: currentUrl, content: snippet });
                    currentTitle = '';
                    currentUrl = '';
                }
            }
        });

        return results;
    } catch (e) {
        console.error("DDG Lite search failed", e);
        return [];
    }
}
