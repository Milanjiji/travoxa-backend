/**
 * Utility to fetch data from Wikipedia API
 */

export interface WikipediaData {
  summary: string;
  image: string;
}

export async function fetchPlaceDetails(name: string): Promise<WikipediaData> {
  const searchTerm = encodeURIComponent(name);
  const wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${searchTerm}`;

  try {
    const response = await fetch(wikipediaUrl);
    
    if (!response.ok) {
        // If exact match fails, search for the term
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${searchTerm}&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (searchData.query?.search?.length > 0) {
            const firstResult = searchData.query.search[0].title;
            return fetchPlaceDetails(firstResult); // Try again with the first result title
        }
        throw new Error('Wikipedia page not found');
    }

    const data = await response.json();
    
    return {
      summary: data.extract || '',
      image: data.originalimage?.source || '',
    };
  } catch (error) {
    console.error(`Error fetching Wikipedia details for ${name}:`, error);
    return {
      summary: '',
      image: '',
    };
  }
}
