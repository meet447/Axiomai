
import { search } from 'google-sr';

async function test() {
    console.log("Testing google-sr...");
    try {
        // @ts-ignore
        const results = await search({
            query: "Can Groq be used with data sources other than Sanity.io?",
        });
        console.log("Results found:", results.length);
        if (results.length > 0) {
            console.log("First result:", results[0]);
        } else {
            console.log("No results returned.");
        }
    } catch (e) {
        console.error("Search failed:", e);
    }
}

test();
