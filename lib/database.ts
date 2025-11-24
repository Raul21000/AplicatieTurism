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

  // Create indexes for better performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
    CREATE INDEX IF NOT EXISTS idx_visits_account ON visits_and_reviews(account_id);
    CREATE INDEX IF NOT EXISTS idx_visits_location ON visits_and_reviews(location_id);
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
