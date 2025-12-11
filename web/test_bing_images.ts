
import * as cheerio from 'cheerio';

async function searchBingImages(query: string) {
    console.log("Fetching Bing Images with headers...");
    const res = await fetch(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    });

    if (!res.ok) {
        console.log("Status:", res.status);
        return [];
    }

    const html = await res.text();
    // console.log("HTML length:", html.length);

    // Bing embeds images in 'murl' or 'iusc' json attributes often.
    // Simple regex for looking for "murl":"http..."

    const regex = /"murl":"([^"]+)"/g;
    const images: string[] = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
        if (images.length < 10) {
            images.push(match[1]);
        }
    }

    console.log("Bing Images found:", images.length);
    if (images.length > 0) console.log(images[0]);
    return images;
}

searchBingImages('scarlett johansson');
