
import { performSearch } from './src/lib/search';

async function test() {
    console.log("Testing search...");
    try {
        const res = await performSearch("fast ai inference");
        console.log("Results found:", res.results.length);
        console.log(res.results.slice(0, 1));
    } catch (e) {
        console.error("Search failed:", e);
    }
}

test();
