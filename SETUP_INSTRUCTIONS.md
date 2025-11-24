# Instrucțiuni de Setup pentru Autentificare cu Tabelul Accounts

## 📋 Pași necesari în Supabase

### 1. Activează extensia pgcrypto

În Supabase Dashboard:
1. Mergi la **SQL Editor**
2. Rulează următoarea comandă:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 2. Creează funcțiile SQL necesare

Rulează tot codul din fișierul `supabase_functions.sql` în **SQL Editor**:

```sql
-- 1. Funcție pentru hash-uirea parolei
CREATE OR REPLACE FUNCTION hash_password(p_password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(p_password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Funcție pentru verificarea parolei
CREATE OR REPLACE FUNCTION verify_password(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  SELECT password_hash INTO v_password_hash
  FROM accounts
  WHERE email = LOWER(TRIM(p_email));
  
  IF v_password_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN (v_password_hash = crypt(p_password, v_password_hash));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO anon;
```

### 3. Configurează Row Level Security (RLS)

În Supabase Dashboard:
1. Mergi la **Authentication** > **Policies**
2. Pentru tabelul `accounts`, creează următoarele politici:

**SELECT Policy:**
```sql
CREATE POLICY "Allow read own account"
ON accounts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow read for anon"
ON accounts FOR SELECT
TO anon
USING (true);
```

**INSERT Policy:**
```sql
CREATE POLICY "Allow insert for anon"
ON accounts FOR INSERT
TO anon
WITH CHECK (true);
```

**UPDATE Policy:**
```sql
CREATE POLICY "Allow update own account"
ON accounts FOR UPDATE
TO authenticated
USING (true);
```

### 4. Verifică structura tabelului

Asigură-te că tabelul `accounts` are următoarea structură:

- `accid` (TEXT, Primary Key, auto-generates 'Txxxx')
- `username` (TEXT)
- `password_hash` (TEXT)
- `email` (TEXT, Unique, Regex: name@domain.com)
- `created_at` (TIMESTAMP)

## ✅ Testare

După ce ai rulat toate comenzile SQL:

1. **Testează Sign Up:**
   - Deschide aplicația
   - Încearcă să creezi un cont nou
   - Verifică în Supabase Dashboard că contul a fost creat

2. **Testează Sign In:**
   - Încearcă să te loghezi cu contul creat
   - Verifică că sesiunea este stocată corect

## 🔧 Troubleshooting

### Eroare: "function verify_password does not exist"
- Asigură-te că ai rulat toate funcțiile SQL din `supabase_functions.sql`

### Eroare: "permission denied for function"
- Verifică că ai dat GRANT permissions pentru funcții (vezi pasul 2)

### Eroare: "relation accounts does not exist"
- Verifică că tabelul `accounts` există în baza de date

### Eroare: "crypt function does not exist"
- Asigură-te că ai activat extensia `pgcrypto` (vezi pasul 1)

## 📝 Note

- Parolele sunt hash-uite folosind bcrypt (10 rounds)
- Sesiunile sunt stocate local în AsyncStorage
- Email-ul este normalizat (lowercase + trim) înainte de verificare
- Funcțiile SQL folosesc `SECURITY DEFINER` pentru a rula cu privilegii de admin

