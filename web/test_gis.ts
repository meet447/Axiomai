
const gis = require('g-i-s');

async function run() {
    console.log("Testing g-i-s...");
    const opts = {
        searchTerm: 'test query',
        queryStringAddition: '&tbs=isz:m',
        filterOutDomains: ['pinterest.com']
    };

    gis(opts, (error, results) => {
        if (error) {
            console.error("GIS Error:", error);
        } else {
            console.log("GIS Results found:", results.length);
            if (results.length > 0) {
                console.log("First Image:", results[0].url);
            }
        }
    });
}

run();
