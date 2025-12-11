
import { search } from 'duck-duck-scrape';

async function run() {
    try {
        console.log("Testing duck-duck-scrape...");
        const results = await search('test query');
        console.log("Results found:", results.results.length);
        if (results.results.length > 0) {
            console.log("First result:", results.results[0].title);
        }
    } catch (e) {
        console.error("Library failed:", e);
    }
}

run();
