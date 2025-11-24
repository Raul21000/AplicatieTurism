import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { getDatabase, generateAccountId, initDatabase } from './database';

const SESSION_KEY = '@user_session';

export interface Account {
  accid: string;
  username: string;
  email: string;
  created_at: string;
}

export interface Session {
  account: Account;
  email: string;
}

// Store session in AsyncStorage
export async function storeSession(session: Session) {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error storing session:', error);
    throw error;
  }
}

// Get session from AsyncStorage
export async function getSession(): Promise<Session | null> {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Verify session against database - ensures account still exists
export async function verifySession(session: Session | null): Promise<Session | null> {
  if (!session) {
    return null;
  }

  try {
    await initDatabase();
    const db = await getDatabase();
    
    // Check if account still exists in database
    const account = await db.getFirstAsync<{
      accid: string;
      username: string;
      email: string;
      created_at: string;
    }>(
      'SELECT accid, username, email, created_at FROM accounts WHERE accid = ? AND email = ?',
      [session.account.accid, session.email]
    );

    if (!account) {
      // Account doesn't exist anymore, clear session
      await clearSession();
      return null;
    }

    // Return valid session
    return session;
  } catch (error) {
    console.error('Error verifying session:', error);
    // On error, clear session to be safe
    await clearSession();
    return null;
  }
}

// Clear session
export async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
}

// Sign out
export async function signOut() {
  try {
    await clearSession();
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return {
      error: { message: error.message || 'Eroare la deconectare' },
    };
  }
}

// Hash password
function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

// Verify password
function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sign in with email and password
export async function signInWithAccount(email: string, password: string) {
  try {
    await initDatabase();
    const db = await getDatabase();
    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      throw new Error('Format email invalid');
    }

    // Get account by email
    const result = await db.getFirstAsync<{
      accid: string;
      username: string;
      email: string;
      password_hash: string;
      created_at: string;
    }>(
      'SELECT accid, username, email, password_hash, created_at FROM accounts WHERE email = ?',
      [normalizedEmail]
    );

    if (!result) {
      throw new Error('Email sau parolă incorectă');
    }

    // Verify password
    const passwordVerified = verifyPassword(password, result.password_hash);
    if (!passwordVerified) {
      throw new Error('Email sau parolă incorectă');
    }

    // Create session
    const session: Session = {
      account: {
        accid: result.accid,
        username: result.username,
        email: result.email,
        created_at: result.created_at,
      },
      email: result.email,
    };

    await storeSession(session);
    return { session, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      session: null,
      error: { message: error.message || 'Eroare la autentificare' },
    };
  }
}

// Sign up - create new account
export async function signUpWithAccount(
  email: string,
  password: string,
  username?: string
) {
  try {
    await initDatabase();
    const db = await getDatabase();
    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      throw new Error('Format email invalid (trebuie să fie name@domain.com)');
    }

    // Check if email already exists
    const existing = await db.getFirstAsync<{ email: string }>(
      'SELECT email FROM accounts WHERE email = ?',
      [normalizedEmail]
    );

    if (existing) {
      throw new Error('Acest email este deja înregistrat');
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Generate account ID
    const accid = generateAccountId();

    // Insert new account
    await db.runAsync(
      'INSERT INTO accounts (accid, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [accid, username || normalizedEmail.split('@')[0], normalizedEmail, passwordHash]
    );

    // Get created account
    const newAccount = await db.getFirstAsync<{
      accid: string;
      username: string;
      email: string;
      created_at: string;
    }>(
      'SELECT accid, username, email, created_at FROM accounts WHERE accid = ?',
      [accid]
    );

    if (!newAccount) {
      throw new Error('Eroare la crearea contului');
    }

    // Create session
    const session: Session = {
      account: {
        accid: newAccount.accid,
        username: newAccount.username,
        email: newAccount.email,
        created_at: newAccount.created_at,
      },
      email: newAccount.email,
    };

    await storeSession(session);
    return { session, error: null };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      session: null,
      error: { message: error.message || 'Eroare la înregistrare' },
    };
  }
}
