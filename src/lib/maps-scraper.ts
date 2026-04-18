import { chromium } from 'playwright';

/**
 * Scrapes a Google Maps /place/ URL for detailed data
 */
export async function scrapeMapsPlace(url: string) {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        
        // Use a realistic user agent to avoid bot detection
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        });

        console.log(`🚀 Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle' });

        // 1. Wait for H1 to be visible
        await page.waitForSelector('h1', { timeout: 10000 });

        // 2. Extract Basic Info
        const name = await page.$eval('h1', (el: any) => el.textContent?.trim());
        
        // Category is usually the text of a button (e.g. "Tourist attraction", "Viewpoint") 
        // located near the H1 or in the details panel.
        const category = await page.$eval('button[jsaction*="category"]', (el: any) => el.textContent?.trim()).catch(() => 'Sightseeing');

        // Address
        const address = await page.$eval('button[data-item-id="address"]', (el: any) => el.getAttribute('aria-label')?.replace('Address: ', '')).catch(() => '');

        // 3. Extract Coordinates from the final URL
        // Google Maps updates the URL to include @lat,lon after loading
        const currentUrl = page.url();
        const coordMatch = currentUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        
        // 4. Extraction of Description/About (Optional/Harder to pinpoint stable selector)
        // We can try to look for the "About" button or summary text if available
        const description = await page.$eval('div[class*="fontBodyMedium"]', (el: any) => el.textContent?.trim()).catch(() => '');

        // 5. Extract Image (The main imagery-gallery-image)
        const imageUrl = await page.$eval('button[jsaction*="media.viewer"] img', (el: any) => el.getAttribute('src')).catch(() => '');

        return {
            name: name || 'Unknown Place',
            category: category || 'Sightseeing',
            description: description || 'Details from Google Maps.',
            location: {
                type: "Point",
                coordinates: coordMatch ? [parseFloat(coordMatch[2]), parseFloat(coordMatch[1])] : [0, 0]
            },
            area: address.split(',').slice(-3, -2)[0]?.trim() || '',
            district: address.split(',').slice(-2, -1)[0]?.trim() || '',
            image: imageUrl || '',
            tags: [category].filter(Boolean),
            source: 'manual'
        };
    } catch (error) {
        console.error('Error in Playwright scraper:', error);
        throw error;
    } finally {
        await browser.close();
    }
}
