import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

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

// Sign in with email and password from accounts table
export async function signInWithAccount(email: string, password: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Sign in attempt for email:', normalizedEmail);

    // First, get the account by email
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('accid, username, email, password_hash, created_at')
      .eq('email', normalizedEmail)
      .single();

    console.log('Account query result:', { accountData, accountError });

    if (accountError) {
      console.error('Account error:', accountError);
      if (accountError.code === 'PGRST116') {
        throw new Error('Email sau parolă incorectă');
      }
      throw new Error(`Eroare la căutarea contului: ${accountError.message}`);
    }

    if (!accountData) {
      throw new Error('Email sau parolă incorectă');
    }

    console.log('Account found:', accountData.accid);

    // Verify password using Supabase RPC function
    console.log('Calling verify_password RPC...');
    let passwordVerified = false;

    // Try the main verify_password function first
    const { data: verifyData, error: verifyError } = await supabase.rpc(
      'verify_password',
      {
        p_email: normalizedEmail,
        p_password: password,
      }
    );

    console.log('Verify password result:', { verifyData, verifyError });

    if (verifyError) {
      console.error('RPC verify_password error:', verifyError);
      console.log('Trying alternative method with verify_password_direct...');
      
      // Alternative: Try to verify using direct password hash comparison
      const { data: directVerify, error: directError } = await supabase.rpc(
        'verify_password_direct',
        {
          p_password_hash: accountData.password_hash,
          p_password: password,
        }
      );

      console.log('Direct verify result:', { directVerify, directError });

      if (directError) {
        console.error('Direct verify error:', directError);
        throw new Error(`Eroare la verificarea parolei: ${directError.message}. Verifică dacă funcțiile SQL sunt create în Supabase.`);
      }

      passwordVerified = directVerify === true;
    } else {
      // RPC function worked
      passwordVerified = verifyData === true;
    }

    if (!passwordVerified) {
      console.log('Password verification failed');
      throw new Error('Email sau parolă incorectă');
    }

    console.log('Password verified successfully');

    // If password is correct, create session
    const session: Session = {
      account: {
        accid: accountData.accid,
        username: accountData.username,
        email: accountData.email,
        created_at: accountData.created_at,
      },
      email: accountData.email,
    };

    await storeSession(session);
    console.log('Session stored successfully');
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
    // Check if email already exists
    const { data: existingAccounts, error: checkError } = await supabase
      .from('accounts')
      .select('email')
      .eq('email', email.toLowerCase().trim());

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is what we want
      throw new Error('Eroare la verificarea email-ului');
    }

    if (existingAccounts && existingAccounts.length > 0) {
      throw new Error('Acest email este deja înregistrat');
    }

    // Hash password using Supabase RPC function
    // Note: You need to create this function in Supabase
    const { data: hashData, error: hashError } = await supabase.rpc(
      'hash_password',
      {
        p_password: password,
      }
    );

    if (hashError || !hashData) {
      throw new Error('Eroare la procesarea parolei');
    }

    // Insert new account
    const { data: newAccount, error: insertError } = await supabase
      .from('accounts')
      .insert([
        {
          email: email.toLowerCase().trim(),
          password_hash: hashData,
          username: username || email.split('@')[0],
        },
      ])
      .select('accid, username, email, created_at')
      .single();

    if (insertError || !newAccount) {
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

