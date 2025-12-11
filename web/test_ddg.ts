
import * as cheerio from 'cheerio';

interface SearchResult {
    title: string;
    url: string;
    content: string;
}

async function searchDuckDuckGoLite(query: string): Promise<SearchResult[]> {
    try {
        const formData = new URLSearchParams();
        formData.append('q', query);

        console.log(`Searching DDG Lite: ${query}`);
        const res = await fetch('https://lite.duckduckgo.com/lite/', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.error(`DDG Status: ${res.status}`);
            return [];
        }

        const html = await res.text();
        console.log(`DDG HTML Length: ${html.length}`);

        const $ = cheerio.load(html);
        const results: SearchResult[] = [];

        const rows = $('table').last().find('tr');
        console.log(`Found ${rows.length} rows`);

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

(async () => {
    const query = "atsu.moe latest manga releases";
    const results = await searchDuckDuckGoLite(query);
    console.log(`Found ${results.length} results:`);
    results.forEach((r, i) => {
        console.log(`\n[${i + 1}] ${r.title}\n${r.url}`);
    });
})();
