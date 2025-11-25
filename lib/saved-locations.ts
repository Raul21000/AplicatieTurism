import {
  getSavedLocations as getSavedLocationsFromDb,
  removeSavedLocation as removeSavedLocationFromDb,
  saveLocation as saveLocationToDb,
  isLocationSaved as isLocationSavedInDb,
} from './database';

export interface SavedLocationRecord {
  id: string;
  user_id: string;
  location_id: string;
  location_name: string;
  location_image_url: string | null;
  location_rating: number | null;
  location_description: string | null;
  saved_at: string;
}

export async function fetchSavedLocations(userId: string): Promise<SavedLocationRecord[]> {
  try {
    const records = await getSavedLocationsFromDb(userId);
    return records.map((record) => ({
      id: record.saved_id,
      user_id: userId,
      location_id: record.location_id,
      location_name: record.location_name,
      location_image_url: record.location_image_url,
      location_rating: record.location_rating,
      location_description: record.location_description,
      saved_at: record.saved_at,
    }));
  } catch (error: any) {
    console.error('Error fetching saved locations:', error);
    return [];
  }
}

export async function saveLocation(
  userId: string,
  location: {
    id: string;
    name: string;
    image_url: string;
    rating: number;
    description?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return saveLocationToDb(
    userId,
    location.id,
    location.name,
    location.image_url,
    location.rating,
    location.description
  );
}

export async function removeSavedLocation(
  userId: string,
  locationId: string
): Promise<{ success: boolean; error?: string }> {
  return removeSavedLocationFromDb(userId, locationId);
}

export async function isLocationSaved(userId: string, locationId: string): Promise<boolean> {
  return isLocationSavedInDb(userId, locationId);
}

