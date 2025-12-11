
import * as cheerio from 'cheerio';

async function searchImagesCustom(query: string) {
    console.log("Fetching Google Images with headers...");
    const res = await fetch(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
    });

    if (!res.ok) {
        console.log("Status:", res.status);
        return [];
    }

    const html = await res.text();
    // console.log("HTML:", html.slice(0, 500));

    // Google Images (basic HTML version) usually puts images in <img> tags inside tables or divs
    // Modern Google Images uses complex JS.
    // But with that User-Agent, we might get the heavy JS version or the simple one.

    // Let's try getting <img> sources.
    const $ = cheerio.load(html);
    const images: string[] = [];

    $('img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.startsWith('http')) {
            images.push(src);
        }
    });

    console.log("Images found:", images.length);
    if (images.length > 0) console.log(images[0]);
    return images;
}

searchImagesCustom('scarlett johansson');
