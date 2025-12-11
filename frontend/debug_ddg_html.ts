
import * as cheerio from 'cheerio';

async function searchDDGHtml(query: string) {
    console.log("Testing DDG HTML search...");
    try {
        const formData = new URLSearchParams();
        formData.append('q', query);

        const res = await fetch('https://html.duckduckgo.com/html/', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = await res.text();
        const $ = cheerio.load(html);
        const results: any[] = [];

        $('.result__body').each((i, el) => {
            const title = $(el).find('.result__a').text().trim();
            const url = $(el).find('.result__a').attr('href');
            const snippet = $(el).find('.result__snippet').text().trim();

            if (title && url && snippet) {
                results.push({ title, url, content: snippet });
            }
        });

        console.log("Results found:", results.length);
        if (results.length > 0) {
            console.log("First result:", results[0]);
        } else {
            // Debug: check if we got a captcha or error
            console.log("HTML Preview:", html.slice(0, 500));
        }

    } catch (e) {
        console.error("Search failed:", e);
    }
}

searchDDGHtml("Groq sanity.io");
