
import gis from 'g-i-s';

async function testImages() {
    console.log("Testing GIS...");
    gis('fast car', (error, results) => {
        if (error) {
            console.error("GIS failed:", error);
        } else {
            console.log("Images found:", results.length);
            if (results.length > 0) {
                console.log("First image:", results[0]);
            }
        }
    });
}

testImages();
