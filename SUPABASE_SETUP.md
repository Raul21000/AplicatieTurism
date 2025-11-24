# Ghid de conectare la Supabase Database

## ✅ Conexiunea este deja configurată!

Clientul Supabase este deja inițializat în `lib/supabase.ts` cu:
- URL: `https://bbnoamjnhtdvltbwngug.supabase.co`
- API Key: Configurat

## 📋 Pași pentru a folosi baza de date:

### 1. Creează tabele în Supabase Dashboard

1. Mergi la [Supabase Dashboard](https://supabase.com/dashboard)
2. Selectează proiectul tău
3. Mergi la **Table Editor**
4. Creează un tabel nou (ex: `locations`)

**Exemplu SQL pentru tabel `locations`:**
```sql
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  rating DECIMAL(3,1),
  coordinates JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Configurează Row Level Security (RLS)

În Supabase Dashboard:
1. Mergi la **Authentication** > **Policies**
2. Pentru fiecare tabel, creează politici:
   - **SELECT**: Permite citirea pentru utilizatori autentificați
   - **INSERT**: Permite inserarea pentru utilizatori autentificați
   - **UPDATE**: Permite actualizarea pentru utilizatori autentificați
   - **DELETE**: Permite ștergerea pentru utilizatori autentificați

**Exemplu SQL pentru politici:**
```sql
-- Permite citirea pentru toți utilizatorii autentificați
CREATE POLICY "Users can read locations"
ON locations FOR SELECT
TO authenticated
USING (true);

-- Permite inserarea pentru utilizatori autentificați
CREATE POLICY "Users can insert locations"
ON locations FOR INSERT
TO authenticated
WITH CHECK (true);
```

### 3. Folosește funcțiile din `lib/database.ts`

**Exemplu de utilizare într-un component:**

```typescript
import { getLocations, insertLocation } from '@/lib/database';
import { useEffect, useState } from 'react';

export default function MyComponent() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const addLocation = async () => {
    try {
      const newLocation = {
        name: 'Nume locație',
        image_url: 'https://example.com/image.jpg',
        rating: 4.5,
        coordinates: { lat: 44.4268, long: 26.1025 },
        description: 'Descriere locație'
      };
      
      await insertLocation(newLocation);
      loadLocations(); // Reîncarcă lista
    } catch (error) {
      console.error('Error adding location:', error);
    }
  };

  return (
    // UI-ul tău
  );
}
```

### 4. Operații directe cu Supabase

Dacă vrei să faci query-uri directe:

```typescript
import { supabase } from '@/lib/supabase';

// Citire
const { data, error } = await supabase
  .from('locations')
  .select('*')
  .eq('rating', 5)
  .order('created_at', { ascending: false });

// Inserare
const { data, error } = await supabase
  .from('locations')
  .insert([{ name: 'Test', rating: 4.5 }])
  .select();

// Actualizare
const { data, error } = await supabase
  .from('locations')
  .update({ rating: 5 })
  .eq('id', 'some-id')
  .select();

// Ștergere
const { error } = await supabase
  .from('locations')
  .delete()
  .eq('id', 'some-id');
```

## 🔐 Securitate

- **Row Level Security (RLS)** trebuie activat pentru toate tabelele
- Folosește politici pentru a controla accesul
- Nu expune chei secrete în cod (folosește variabile de mediu dacă e necesar)

## 📚 Resurse

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

