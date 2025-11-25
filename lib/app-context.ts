// App Context Service
// Provides app structure and data context to AI services

import { getDatabase } from './database';

export interface Location {
  id: string;
  name: string;
  description?: string;
  base_description?: string; // Pre-generated base description
  image_url: string;
  rating: number;
  coordinates: {
    lat: number;
    long: number;
  };
}

export interface AppContext {
  appName: string;
  appDescription: string;
  features: string[];
  locationCount: number;
  locations: Location[];
  locationCategories: string[];
  averageRating: number;
}

/**
 * Fetch locations from the API/JSON source
 */
export async function fetchLocationsFromAPI(): Promise<Location[]> {
  try {
    // Try hackathon URL first, fallback to original
    let response = await fetch('https://thecon.ro/hackathon/locatii.json').catch(() => null);
    if (!response || !response.ok) {
      response = await fetch('https://thecon.ro/wp-content/uploads/2025/11/locatii.json');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching locations from API:', error);
    return [];
  }
}

/**
 * Get locations from local database
 */
export async function getLocationsFromDatabase(): Promise<Location[]> {
  try {
    const db = await getDatabase();
    const locations = await db.getAllAsync<{
      locid: string;
      name: string;
      description: string | null;
      latitude: number;
      longitude: number;
    }>('SELECT locid, name, description, latitude, longitude FROM locations');
    
    return locations.map(loc => ({
      id: loc.locid,
      name: loc.name,
      description: loc.description || undefined,
      image_url: '', // Database doesn't store image_url
      rating: 0, // Database doesn't store rating
      coordinates: {
        lat: loc.latitude,
        long: loc.longitude,
      },
    }));
  } catch (error) {
    console.error('Error fetching locations from database:', error);
    return [];
  }
}

/**
 * Get comprehensive app context for AI services
 */
export async function getAppContext(): Promise<AppContext> {
  // Fetch locations from API (primary source)
  let locations = await fetchLocationsFromAPI();
  
  // If no locations from API, try database
  if (locations.length === 0) {
    locations = await getLocationsFromDatabase();
  }
  
  // Extract categories from location names
  const locationCategories = extractCategories(locations);
  
  // Calculate average rating
  const ratings = locations.map(loc => loc.rating).filter(r => r > 0);
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0;
  
  return {
    appName: 'AplicatieTurism',
    appDescription: 'Aplicație mobilă de turism pentru descoperirea și explorarea locațiilor turistice din România',
    features: [
      'Harta interactivă cu pin-uri pentru locații',
      'Listă de locații cu imagini și rating-uri',
      'Detalii complete pentru fiecare locație',
      'Căutare și filtrare locații',
      'Salvare locații favorite',
      'Chatbot AI pentru recomandări',
      'Generare descrieri AI pentru locații',
      'Rezervare prin WhatsApp',
      'Sincronizare date între dispozitive',
    ],
    locationCount: locations.length,
    locations: locations.slice(0, 50), // Limit to 50 for context size
    locationCategories,
    averageRating: Math.round(averageRating * 10) / 10,
  };
}

/**
 * Extract categories/types from location names
 */
function extractCategories(locations: Location[]): string[] {
  const categories = new Set<string>();
  
  locations.forEach(location => {
    const name = location.name.toLowerCase();
    
    if (name.includes('castel') || name.includes('cetate') || name.includes('fort')) {
      categories.add('Castele și Cetăți');
    }
    if (name.includes('mănăstire') || name.includes('biseric') || name.includes('schit')) {
      categories.add('Lăcașe de Cult');
    }
    if (name.includes('munte') || name.includes('deal') || name.includes('pădure')) {
      categories.add('Destinații Naturale');
    }
    if (name.includes('lac') || name.includes('râu') || name.includes('cascad')) {
      categories.add('Ape și Cascade');
    }
    if (name.includes('muzeu') || name.includes('expoziție')) {
      categories.add('Muzee și Expoziții');
    }
    if (name.includes('oraș') || name.includes('cetate')) {
      categories.add('Orașe și Localități');
    }
  });
  
  return Array.from(categories);
}

/**
 * Get formatted context string for AI prompts
 */
export async function getFormattedAppContext(): Promise<string> {
  const context = await getAppContext();
  
  const locationsList = context.locations
    .slice(0, 20) // Limit to 20 for prompt size
    .map(loc => {
      const desc = loc.description ? ` - ${loc.description.substring(0, 100)}...` : '';
      return `- ${loc.name} (Rating: ${loc.rating.toFixed(1)}⭐)${desc}`;
    })
    .join('\n');
  
  return `CONTEXT APLICAȚIE TURISM:

Nume aplicație: ${context.appName}
Descriere: ${context.appDescription}

Funcționalități disponibile:
${context.features.map(f => `- ${f}`).join('\n')}

Statistici:
- Total locații: ${context.locationCount}
- Rating mediu: ${context.averageRating}⭐
- Categorii disponibile: ${context.locationCategories.join(', ')}

Locații disponibile în aplicație (exemple):
${locationsList}

${context.locationCount > 20 ? `...și încă ${context.locationCount - 20} locații` : ''}

Utilizează aceste informații pentru a oferi răspunsuri relevante și precise despre locațiile disponibile în aplicație.`;
}

/**
 * Get context specifically for location recommendations
 */
export async function getLocationRecommendationContext(): Promise<string> {
  const context = await getAppContext();
  
  // Group locations by rating
  const topRated = context.locations
    .filter(loc => loc.rating >= 4.5)
    .slice(0, 10)
    .map(loc => `${loc.name} (${loc.rating.toFixed(1)}⭐)`)
    .join(', ');
  
  const categories = context.locationCategories.join(', ');
  
  return `Locații disponibile în aplicație:
- Total: ${context.locationCount} locații
- Rating mediu: ${context.averageRating}⭐
- Categorii: ${categories}
- Top locații (rating ≥4.5): ${topRated || 'N/A'}

Poți recomanda aceste locații utilizatorilor când cer recomandări.`;
}

