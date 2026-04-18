/**
 * Utility to fetch data from OpenStreetMap Overpass API
 */

export interface OSMPlace {
  name: string;
  lat: number;
  lon: number;
  type: string;
  osmId: string;
  category: string;
  tags: string[];
  district?: string;
  area?: string;
  elevation?: number;
}

const categoryMap: { [key: string]: string } = {
  // Hill Station: Focus on high-altitude points (>600m), vistas, and core mountain nodes
  'Hill Station': 'node["tourism"~"viewpoint|attraction"](if:number(t["ele"]) > 600); node["natural"="peak"](if:number(t["ele"]) > 800); node["place"~"town|village"]["tourism"="attraction"](if:number(t["ele"]) > 500)',
  
  // Beach: Strictly natural beaches and resorts
  'Beach': 'node["natural"="beach"]; node["leisure"="beach_resort"]',
  
  // Adventure: Nature reserves, campsites, and forested areas
  'Adventure': 'node["leisure"~"nature_reserve|park"]; node["tourism"~"camp_site|zoo"]; node["sport"~"climbing|trekking"]',
  
  // Pilgrimage: Temples and historical religious landmarks
  'Pilgrimage': 'node["historic"~"temple|monastery"]; node["amenity"="place_of_worship"]["religion"="hindu"]',
  
  // Weekend Getaway & Budget: General high-quality tourism nodes
  'Weekend Getaway': 'node["tourism"~"attraction|viewpoint|museum|castle|palace"]',
  'Budget Trip': 'node["tourism"~"attraction|viewpoint|camp_site|gallery"]; node["historic"~"castle|ruins"]',
};

export async function fetchPlacesFromOSM(
  lat: number,
  lon: number,
  category: string,
  radius: number = 300000 // 300km default (Balanced for performance and coverage)
): Promise<OSMPlace[]> {
  const baseQuery = categoryMap[category] || 'node["tourism"~"attraction|viewpoint"]';
  
  // Split the base query (e.g., node[...]; node[...]) and apply the (around:...) filter to each part
  const overpassQuery = baseQuery
    .split(';')
    .filter(part => part.trim())
    .map(part => `${part.trim()}(around:${radius}, ${lat}, ${lon})`)
    .join('; ');

  // Overpass QL query
  const query = `
    [out:json][timeout:60];
    (
      ${overpassQuery};
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`OSM Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.elements
      .filter((el: any) => el.tags && el.tags.name)
      .map((el: any) => ({
        name: el.tags.name,
        lat: el.lat,
        lon: el.lon,
        type: el.type,
        osmId: `osm-${el.id}`,
        category: category,
        tags: Object.keys(el.tags),
        elevation: el.tags.ele ? parseFloat(el.tags.ele) : undefined,
      }));
  } catch (error) {
    console.error('Error fetching from OSM:', error);
    return [];
  }
}
export async function fetchTownsByAreaId(areaId: number): Promise<OSMPlace[]> {
  const query = `
    [out:json][timeout:30];
    area(${areaId})->.searchArea;
    (
      node["place"~"city|town|village"](area.searchArea);
    );
    out body;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    });
    const data = await response.json();
    console.log(`📍 Found ${data.elements?.length || 0} towns/villages for discovery pass.`);
    
    return data.elements.map((el: any) => ({
      name: el.tags.name,
      lat: el.lat,
      lon: el.lon,
      osmId: `osm-${el.id}`,
      type: 'place',
      category: el.tags.place,
      tags: Object.keys(el.tags),
    }));
  } catch (error) {
    console.error('Error fetching towns:', error);
    return [];
  }
}

export async function fetchSettlementsByAreaId(areaId: number): Promise<OSMPlace[]> {
  const query = `
    [out:json][timeout:60];
    area(${areaId})->.searchArea;
    (
      node["place"~"city|town|village"](area.searchArea);
    );
    out body;
  `;

  try {
    const mirrors = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];
    
    const response = await fetch(mirrors[0], {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    });
    
    const data = await response.json();
    return (data.elements || [])
      .filter((el: any) => el.tags && el.tags.name)
      .map((el: any) => ({
        name: el.tags.name,
        lat: el.lat,
        lon: el.lon,
        osmId: `osm-${el.id}`,
        type: 'place',
        category: el.tags.place,
        tags: Object.keys(el.tags),
      }));
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return [];
  }
}

export async function fetchLandmarksAround(lat: number, lon: number, radius: number = 8000): Promise<OSMPlace[]> {
  const query = `
    [out:json][timeout:60];
    (
      node["tourism"~"attraction|viewpoint|museum|theme_park|zoo|artwork|castle|gallery"](around:${radius}, ${lat}, ${lon});
      node["historic"~"monument|memorial|ruins|castle|palace|fort|battlefield|archaeological_site"](around:${radius}, ${lat}, ${lon});
      node["natural"~"waterfall|beach|peak|cave|rock|cliff"](around:${radius}, ${lat}, ${lon});
      node["amenity"="place_of_worship"](around:${radius}, ${lat}, ${lon});
    );
    out body;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.elements || [])
      .filter((el: any) => el.tags && el.tags.name)
      .map((el: any) => ({
        name: el.tags.name,
        lat: el.lat || (el.center ? el.center.lat : 0),
        lon: el.lon || (el.center ? el.center.lon : 0),
        type: el.type,
        osmId: `osm-${el.id}`,
        category: el.tags.tourism || el.tags.historic || el.tags.natural || el.tags.amenity || 'attraction',
        tags: Object.keys(el.tags).map(k => `${k}=${el.tags[k]}`),
        elevation: el.tags.ele ? parseFloat(el.tags.ele) : undefined,
      }));
  } catch (error) {
    return [];
  }
}
