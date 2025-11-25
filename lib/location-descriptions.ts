// Location Descriptions Service
// Manages base descriptions for locations and generates them if missing

import { generateBaseDescription } from './ai-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_DESCRIPTIONS_KEY = '@location_base_descriptions';
// Bump VERSION every time you want to invalidate / delete ALL stored descriptions
// Existing cached descriptions with older versions will be ignored completely.
const DESCRIPTION_CACHE_VERSION = '3.0';

interface LocationDescriptions {
  version: string;
  descriptions: Record<string, string>; // location_id -> base_description
}

/**
 * Get base description for a location (from cache or generate)
 */
export async function getBaseDescriptionForLocation(
  locationId: string,
  locationName: string,
  originalDescription?: string
): Promise<string> {
  try {
    // Try to get from cache first
    const cached = await getCachedBaseDescription(locationId);
    if (cached) {
      console.log(`[Descriptions] Using cached base description for ${locationName}`);
      return cached;
    }

    // Generate if not cached
    console.log(`[Descriptions] Generating base description for ${locationName}`);
    const generated = await generateBaseDescription(locationName, originalDescription);
    
    // Cache it
    await cacheBaseDescription(locationId, generated);
    
    return generated;
  } catch (error) {
    console.error('Error getting base description:', error);
    // Fallback
    return `${locationName} este o destinație turistică remarcabilă situată în inima României. Această locație oferă o experiență autentică care combină perfect istoria, cultura și frumusețea naturală a țării.`;
  }
}

/**
 * Get cached base description (exported for use in other files)
 */
export async function getCachedBaseDescription(locationId: string): Promise<string | null> {
  try {
    const cached = await AsyncStorage.getItem(BASE_DESCRIPTIONS_KEY);
    if (!cached) return null;

    const data: LocationDescriptions = JSON.parse(cached);
    
    // Check version
    if (data.version !== DESCRIPTION_CACHE_VERSION) {
      return null; // Invalidate old cache
    }

    return data.descriptions[locationId] || null;
  } catch (error) {
    console.error('Error reading cached description:', error);
    return null;
  }
}

/**
 * Cache base description
 */
async function cacheBaseDescription(locationId: string, description: string): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(BASE_DESCRIPTIONS_KEY);
    let data: LocationDescriptions = {
      version: DESCRIPTION_CACHE_VERSION,
      descriptions: {},
    };

    if (cached) {
      try {
        data = JSON.parse(cached);
        // Reset if version mismatch
        if (data.version !== DESCRIPTION_CACHE_VERSION) {
          data = {
            version: DESCRIPTION_CACHE_VERSION,
            descriptions: {},
          };
        }
      } catch {
        // If parse fails, start fresh
        data = {
          version: DESCRIPTION_CACHE_VERSION,
          descriptions: {},
        };
      }
    }

    data.descriptions[locationId] = description;
    
    // Limit cache size (keep last 100 locations)
    const entries = Object.entries(data.descriptions);
    if (entries.length > 100) {
      // Keep most recent 100
      const recent = entries.slice(-100);
      data.descriptions = Object.fromEntries(recent);
    }

    await AsyncStorage.setItem(BASE_DESCRIPTIONS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching description:', error);
  }
}

/**
 * Pre-generate base descriptions for all locations
 * Call this when locations are first loaded
 */
export async function pregenerateBaseDescriptions(locations: Array<{
  id: string;
  name: string;
  description?: string;
}>): Promise<void> {
  console.log(`[Descriptions] Pre-generating descriptions for ${locations.length} locations...`);
  
  // Process in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (location) => {
        try {
          // Check if already cached
          const cached = await getCachedBaseDescription(location.id);
          if (cached) {
            console.log(`[Descriptions] Already cached: ${location.name}`);
            return;
          }

          // Generate and cache
          const description = await generateBaseDescription(
            location.name,
            location.description
          );
          await cacheBaseDescription(location.id, description);
          console.log(`[Descriptions] Generated: ${location.name}`);
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`[Descriptions] Error generating for ${location.name}:`, error);
        }
      })
    );
  }
  
  console.log('[Descriptions] Pre-generation complete');
}

/**
 * Clear all cached descriptions
 */
export async function clearDescriptionCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BASE_DESCRIPTIONS_KEY);
    console.log('[Descriptions] Cache cleared - all descriptions will be regenerated');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear all cached descriptions and force regeneration
 * This will invalidate all existing descriptions
 */
export async function clearAllDescriptions(): Promise<void> {
  try {
    // Clear the cache
    await AsyncStorage.removeItem(BASE_DESCRIPTIONS_KEY);
    console.log('[Descriptions] All cached descriptions cleared');
    console.log('[Descriptions] Descriptions will be regenerated with unique prompts on next load');
  } catch (error) {
    console.error('Error clearing descriptions:', error);
    throw error;
  }
}

