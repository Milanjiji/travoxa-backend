/**
 * Utility to fetch Instagram metadata (title, thumbnail) from a Reel/Post link.
 */
export async function fetchIGMetadata(url: string) {
    try {
        console.log(`[IGUtils] Fetching metadata for: ${url}`);
        
        // Simple fetch attempt
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const html = await response.text();

        // Extract Open Graph tags
        const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i) || 
                          html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/i);
        
        const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i) || 
                          html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"/i);
        
        const descriptionMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i) || 
                               html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"/i);

        return {
            title: titleMatch ? titleMatch[1] : null,
            image: imageMatch ? imageMatch[1] : null,
            description: descriptionMatch ? descriptionMatch[1] : null,
            success: true
        };
    } catch (error: any) {
        console.error(`[IGUtils] Error fetching IG metadata:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}
