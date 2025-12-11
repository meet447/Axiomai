
import * as cheerio from 'cheerio';


import { search } from 'google-sr';

async function searchGoogleScraper(query: string) {
    console.log(`Searching Google for: ${query}`);
    try {
        // @ts-ignore
        const searchResults = await search({
            query: query,
        });

        console.log(`Found ${searchResults.length} results.`);
        console.log(JSON.stringify(searchResults.slice(0, 2), null, 2));

        return searchResults;
    } catch (e) {
        console.error("Google scraper failed", e);
        return [];
    }
}

searchGoogleScraper("How does Yang Kai achieve ascension to the Divine Realm?");
