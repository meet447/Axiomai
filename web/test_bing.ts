
import * as cheerio from 'cheerio';

interface SearchResult {
    title: string;
    url: string;
    content: string;
}

async function searchBingScraper(query: string): Promise<SearchResult[]> {
    try {
        const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&cc=US&setmkt=en-US`;
        console.log(`Searching: ${url}`);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        if (!res.ok) {
            console.error(`Status: ${res.status}`);
            return [];
        }

        const html = await res.text();
        console.log(`HTML Length: ${html.length}`);
        // console.log(html.slice(0, 1000)); 

        const $ = cheerio.load(html);
        const results: SearchResult[] = [];

        $('li.b_algo').each((i, el) => {
            const titleEl = $(el).find('h2 a');
            const title = titleEl.text().trim();
            const url = titleEl.attr('href');

            const captionEl = $(el).find('.b_caption p');
            const snippet = captionEl.text().trim();

            if (title && url && snippet) {
                results.push({ title, url, content: snippet });
            }
        });

        return results;
    } catch (e) {
        console.error("Bing scraper failed", e);
        return [];
    }
}

(async () => {
    const query = "atsu.moe latest manga releases";
    const results = await searchBingScraper(query);
    console.log(`Found ${results.length} results:`);
    results.forEach((r, i) => {
        console.log(`\n[${i + 1}] ${r.title}\n${r.url}`);
    });
})();
