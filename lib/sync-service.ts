// Sync Service - Sincronizează datele locale cu serverul
import { getDatabase } from './database';
import {
  syncAccountToServer,
  syncLocationToServer,
  syncReviewToServer,
  getLocationsFromServer,
  getLocationReviews,
  checkServerHealth,
} from './api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_ENABLED_KEY = '@sync_enabled';
const LAST_SYNC_KEY = '@last_sync';

// Check if server is available
export async function isServerAvailable(): Promise<boolean> {
  try {
    const { error } = await checkServerHealth();
    return !error;
  } catch {
    return false;
  }
}

// Enable/disable sync
export async function setSyncEnabled(enabled: boolean) {
  await AsyncStorage.setItem(SYNC_ENABLED_KEY, JSON.stringify(enabled));
}

export async function isSyncEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SYNC_ENABLED_KEY);
    return value ? JSON.parse(value) : false;
  } catch {
    return false;
  }
}

// Sync all local data to server
export async function syncAllToServer(): Promise<{ success: boolean; error?: string }> {
  try {
    const serverAvailable = await isServerAvailable();
    if (!serverAvailable) {
      return { success: false, error: 'Server unavailable' };
    }

    const syncEnabled = await isSyncEnabled();
    if (!syncEnabled) {
      return { success: false, error: 'Sync is disabled' };
    }

    const db = await getDatabase();

    // Sync accounts
    const accounts = await db.getAllAsync<{
      accid: string;
      username: string;
      email: string;
      created_at: string;
    }>('SELECT accid, username, email, created_at FROM accounts');
    
    for (const account of accounts) {
      // Get password hash from local DB
      const accountWithHash = await db.getFirstAsync<{ password_hash: string }>(
        'SELECT password_hash FROM accounts WHERE accid = ?',
        [account.accid]
      );
      
      if (accountWithHash) {
        await syncAccountToServer({
          ...account,
          password_hash: accountWithHash.password_hash,
        });
      }
    }

    // Sync locations
    const locations = await db.getAllAsync<{
      locid: string;
      name: string;
      description: string | null;
      latitude: number;
      longitude: number;
      created_at: string;
    }>('SELECT locid, name, description, latitude, longitude, created_at FROM locations');
    
    for (const location of locations) {
      await syncLocationToServer({
        ...location,
        image_url: null, // Add if you store image_url
        rating: 0, // Add if you calculate ratings
      });
    }

    // Sync reviews
    const reviews = await db.getAllAsync<{
      revid: string;
      account_id: string;
      location_id: string;
      rating: number;
      review_text: string | null;
      visited_at: string;
    }>('SELECT revid, account_id, location_id, rating, review_text, visited_at FROM visits_and_reviews');
    
    for (const review of reviews) {
      await syncReviewToServer(review);
    }

    // Update last sync time
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    return { success: true };
  } catch (error: any) {
    console.error('Sync error:', error);
    return { success: false, error: error.message };
  }
}

// Pull data from server to local
export async function syncFromServer(): Promise<{ success: boolean; error?: string }> {
  try {
    const serverAvailable = await isServerAvailable();
    if (!serverAvailable) {
      return { success: false, error: 'Server unavailable' };
    }

    const syncEnabled = await isSyncEnabled();
    if (!syncEnabled) {
      return { success: false, error: 'Sync is disabled' };
    }

    // Get locations from server
    const { data: serverLocations, error } = await getLocationsFromServer();
    if (error) {
      return { success: false, error };
    }

    if (serverLocations) {
      const db = await getDatabase();
      // Insert or update locations from server
      for (const location of serverLocations) {
        await db.runAsync(
          `INSERT OR REPLACE INTO locations 
           (locid, name, description, latitude, longitude, created_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            location.locid,
            location.name,
            location.description || null,
            location.latitude,
            location.longitude,
            location.created_at,
          ]
        );
      }
    }

    // Update last sync time
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    return { success: true };
  } catch (error: any) {
    console.error('Sync from server error:', error);
    return { success: false, error: error.message };
  }
}

// Get last sync time
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return value ? new Date(value) : null;
  } catch {
    return null;
  }
}

// Sync account on signup/login
export async function syncAccountOnAuth(account: {
  accid: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}): Promise<void> {
  try {
    const serverAvailable = await isServerAvailable();
    const syncEnabled = await isSyncEnabled();
    
    if (serverAvailable && syncEnabled) {
      await syncAccountToServer(account);
    }
  } catch (error) {
    console.error('Error syncing account:', error);
    // Don't throw - auth should work even if sync fails
  }
}

