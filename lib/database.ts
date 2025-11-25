import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

// Initialize database
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync('tourism_app.db');
  
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create accounts table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      accid TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create locations table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS locations (
      locid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create visits_and_reviews table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS visits_and_reviews (
      revid TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review_text TEXT,
      visited_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(accid),
      FOREIGN KEY (location_id) REFERENCES locations(locid)
    );
  `);

  // Create saved_locations table for saving favorite locations
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS saved_locations (
      saved_id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      location_name TEXT NOT NULL,
      location_image_url TEXT,
      location_rating REAL,
      location_description TEXT,
      saved_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(accid)
    );
  `);

  // Create indexes for better performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
    CREATE INDEX IF NOT EXISTS idx_visits_account ON visits_and_reviews(account_id);
    CREATE INDEX IF NOT EXISTS idx_visits_location ON visits_and_reviews(location_id);
    CREATE INDEX IF NOT EXISTS idx_saved_account ON saved_locations(account_id);
    CREATE INDEX IF NOT EXISTS idx_saved_location ON saved_locations(location_id);
  `);

  return db;
}

// Helper function to generate ID (Txxxx, Lxxxx, Rxxxx)
function generateId(prefix: string): string {
  const random = Math.floor(1000 + Math.random() * 9000); // 1000-9999
  return `${prefix}${random}`;
}

export function generateAccountId(): string {
  return generateId('T');
}

export function generateLocationId(): string {
  return generateId('L');
}

export function generateReviewId(): string {
  return generateId('R');
}

export function generateSavedId(): string {
  return generateId('S');
}

// Get database instance
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return await initDatabase();
  }
  return db;
}

// Get database path (for viewing)
export async function getDatabasePath(): Promise<string> {
  const dbInstance = await getDatabase();
  // In Expo, the database is stored in the app's document directory
  // The path is typically: <app-documents>/tourism_app.db
  return 'tourism_app.db';
}

// Get all accounts
export async function getAllAccounts() {
  const db = await getDatabase();
  return await db.getAllAsync<{
    accid: string;
    username: string;
    email: string;
    created_at: string;
  }>('SELECT accid, username, email, created_at FROM accounts');
}

// Get all locations
export async function getAllLocations() {
  const db = await getDatabase();
  return await db.getAllAsync<{
    locid: string;
    name: string;
    description: string | null;
    latitude: number;
    longitude: number;
    created_at: string;
  }>('SELECT locid, name, description, latitude, longitude, created_at FROM locations');
}

// Get all reviews
export async function getAllReviews() {
  const db = await getDatabase();
  return await db.getAllAsync<{
    revid: string;
    account_id: string;
    location_id: string;
    rating: number;
    review_text: string | null;
    visited_at: string;
  }>('SELECT revid, account_id, location_id, rating, review_text, visited_at FROM visits_and_reviews');
}

// Get database statistics
export async function getDatabaseStats() {
  const db = await getDatabase();
  const accountsResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM accounts');
  const locationsResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM locations');
  const reviewsResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM visits_and_reviews');
  
  return {
    accounts: accountsResult?.count || 0,
    locations: locationsResult?.count || 0,
    reviews: reviewsResult?.count || 0,
  };
}

// Get username by email
export async function getUsernameByEmail(email: string): Promise<string | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ username: string }>(
      'SELECT username FROM accounts WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    return result?.username || null;
  } catch (error) {
    console.error('Error getting username by email:', error);
    return null;
  }
}

// Save location for user
export async function saveLocation(
  accountId: string,
  locationId: string,
  locationName: string,
  locationImageUrl: string,
  locationRating: number,
  locationDescription?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    
    // Check if location is already saved
    const existing = await db.getFirstAsync<{ saved_id: string }>(
      'SELECT saved_id FROM saved_locations WHERE account_id = ? AND location_id = ?',
      [accountId, locationId]
    );

    if (existing) {
      return { success: false, error: 'Locația este deja salvată' };
    }

    // Generate saved_id
    const savedId = generateSavedId();

    // Insert saved location
    await db.runAsync(
      `INSERT INTO saved_locations 
       (saved_id, account_id, location_id, location_name, location_image_url, location_rating, location_description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [savedId, accountId, locationId, locationName, locationImageUrl, locationRating, locationDescription || null]
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error saving location:', error);
    return { success: false, error: error.message || 'Eroare la salvarea locației' };
  }
}

// Get saved locations for user
export async function getSavedLocations(accountId: string) {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<{
      saved_id: string;
      location_id: string;
      location_name: string;
      location_image_url: string | null;
      location_rating: number;
      location_description: string | null;
      saved_at: string;
    }>(
      `SELECT saved_id, location_id, location_name, location_image_url, location_rating, location_description, saved_at
       FROM saved_locations 
       WHERE account_id = ? 
       ORDER BY saved_at DESC`,
      [accountId]
    );
  } catch (error) {
    console.error('Error getting saved locations:', error);
    return [];
  }
}

// Remove saved location
export async function removeSavedLocation(accountId: string, locationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM saved_locations WHERE account_id = ? AND location_id = ?',
      [accountId, locationId]
    );
    return { success: true };
  } catch (error: any) {
    console.error('Error removing saved location:', error);
    return { success: false, error: error.message || 'Eroare la ștergerea locației' };
  }
}

// Check if location is saved
export async function isLocationSaved(accountId: string, locationId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ saved_id: string }>(
      'SELECT saved_id FROM saved_locations WHERE account_id = ? AND location_id = ?',
      [accountId, locationId]
    );
    return !!result;
  } catch (error) {
    console.error('Error checking if location is saved:', error);
    return false;
  }
}

// Save visit and review for a location
export async function saveVisitAndReview(
  accountId: string,
  locationId: string,
  locationName: string,
  locationImageUrl: string,
  rating: number,
  reviewText?: string
): Promise<{ success: boolean; error?: string; revid?: string }> {
  try {
    const db = await getDatabase();
    
    // Check if location is already visited by this user
    const existing = await db.getFirstAsync<{ revid: string }>(
      'SELECT revid FROM visits_and_reviews WHERE account_id = ? AND location_id = ?',
      [accountId, locationId]
    );

    if (existing) {
      // Update existing review
      await db.runAsync(
        'UPDATE visits_and_reviews SET rating = ?, review_text = ?, visited_at = datetime("now") WHERE revid = ?',
        [rating, reviewText || null, existing.revid]
      );
      return { success: true, revid: existing.revid };
    }

    // Generate review ID
    const revid = generateReviewId();

    // Insert new visit and review
    await db.runAsync(
      `INSERT INTO visits_and_reviews 
       (revid, account_id, location_id, rating, review_text, visited_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [revid, accountId, locationId, rating, reviewText || null]
    );

    // Also ensure location exists in locations table (if not already there)
    const locationExists = await db.getFirstAsync<{ locid: string }>(
      'SELECT locid FROM locations WHERE locid = ?',
      [locationId]
    );

    if (!locationExists) {
      // Extract coordinates from location data if available
      // For now, we'll use default coordinates (can be improved later)
      await db.runAsync(
        `INSERT INTO locations (locid, name, description, latitude, longitude)
         VALUES (?, ?, ?, ?, ?)`,
        [locationId, locationName, null, 44.4268, 26.1025] // Default Bucharest coordinates
      );
    }

    return { success: true, revid };
  } catch (error: any) {
    console.error('Error saving visit and review:', error);
    return { success: false, error: error.message || 'Eroare la salvarea vizitei' };
  }
}

// Get visited locations for a user
export async function getVisitedLocations(accountId: string) {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<{
      revid: string;
      location_id: string;
      location_name: string;
      location_image_url: string | null;
      rating: number;
      review_text: string | null;
      visited_at: string;
    }>(
      `SELECT 
        vr.revid,
        vr.location_id,
        COALESCE(l.name, sl.location_name, 'Locație necunoscută') as location_name,
        COALESCE(sl.location_image_url, '') as location_image_url,
        vr.rating,
        vr.review_text,
        vr.visited_at
       FROM visits_and_reviews vr
       LEFT JOIN locations l ON vr.location_id = l.locid
       LEFT JOIN saved_locations sl ON vr.location_id = sl.location_id AND vr.account_id = sl.account_id
       WHERE vr.account_id = ?
       ORDER BY vr.visited_at DESC`,
      [accountId]
    );
  } catch (error) {
    console.error('Error getting visited locations:', error);
    return [];
  }
}

// Get visit statistics for a user
export async function getVisitStats(accountId: string): Promise<{ visited: number; reviews: number }> {
  try {
    const db = await getDatabase();
    
    const visitedResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(DISTINCT location_id) as count FROM visits_and_reviews WHERE account_id = ?',
      [accountId]
    );
    
    const reviewsResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM visits_and_reviews WHERE account_id = ? AND review_text IS NOT NULL AND review_text != ""',
      [accountId]
    );
    
    return {
      visited: visitedResult?.count || 0,
      reviews: reviewsResult?.count || 0,
    };
  } catch (error) {
    console.error('Error getting visit stats:', error);
    return { visited: 0, reviews: 0 };
  }
}

// Check if location is visited
export async function isLocationVisited(accountId: string, locationId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ revid: string }>(
      'SELECT revid FROM visits_and_reviews WHERE account_id = ? AND location_id = ?',
      [accountId, locationId]
    );
    return !!result;
  } catch (error) {
    console.error('Error checking if location is visited:', error);
    return false;
  }
}
