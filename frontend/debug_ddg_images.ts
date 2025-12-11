
import { search, SafeSearchType } from 'duck-duck-scrape';

async function testImages() {
    console.log("Testing DDG Image search...");
    try {
        const results = await search("Groq AI logo", {
            safeSearch: SafeSearchType.STRICT,
        });

        if (results.images && results.images.length > 0) {
            console.log("Images found:", results.images.length);
            console.log("First image:", results.images[0]);
        } else {
            console.log("No images found.");
            // Check if results has images property
            // Depending on version, it might be in results.results with image property? 
            // Actually, usually search() returns mixed, or searchImages.
            // But duck-duck-scrape main export is search. 
            // Let's check keys.
            console.log("Result keys:", Object.keys(results));
        }
    } catch (e) {
        console.error("Image search failed:", e);
    }
}

testImages();
