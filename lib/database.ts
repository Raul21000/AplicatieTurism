import { supabase } from './supabase';

// Exemplu: Funcție pentru a citi date dintr-un tabel
export async function getLocations() {
  try {
    const { data, error } = await supabase
      .from('locations') // Numele tabelului tău
      .select('*'); // Selectează toate coloanele

    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getLocations:', error);
    throw error;
  }
}

// Exemplu: Funcție pentru a insera date
export async function insertLocation(location: {
  name: string;
  image_url: string;
  rating: number;
  coordinates: { lat: number; long: number };
  description?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('locations')
      .insert([location])
      .select();

    if (error) {
      console.error('Error inserting location:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in insertLocation:', error);
    throw error;
  }
}

// Exemplu: Funcție pentru a actualiza date
export async function updateLocation(id: string, updates: Partial<{
  name: string;
  image_url: string;
  rating: number;
  description: string;
}>) {
  try {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating location:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateLocation:', error);
    throw error;
  }
}

// Exemplu: Funcție pentru a șterge date
export async function deleteLocation(id: string) {
  try {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting location:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteLocation:', error);
    throw error;
  }
}

// Exemplu: Funcție pentru a citi date cu filtrare
export async function getLocationsByRating(minRating: number) {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .gte('rating', minRating) // Greater than or equal
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching locations by rating:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getLocationsByRating:', error);
    throw error;
  }
}

// Exemplu: Funcție pentru a obține datele utilizatorului curent
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting user:', error);
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error;
  }
}

