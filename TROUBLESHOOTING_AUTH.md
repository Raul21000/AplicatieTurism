# Troubleshooting Autentificare

## Probleme comune și soluții

### 1. "Email sau parolă incorectă" chiar dacă datele sunt corecte

#### Verificări:

**a) Funcțiile SQL sunt create?**
- Mergi la Supabase Dashboard → SQL Editor
- Rulează toate comenzile din `supabase_functions.sql`
- Verifică că funcțiile există: `SELECT * FROM pg_proc WHERE proname IN ('verify_password', 'hash_password', 'verify_password_direct');`

**b) Extensia pgcrypto este activată?**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

**c) Parola din baza de date este hash-uită corect?**
- Verifică în Supabase Dashboard → Table Editor → accounts
- `password_hash` ar trebui să arate ca: `$2a$10$...` (bcrypt format)
- Dacă parola este plain text, trebuie să o hash-uiți

**d) Verifică formatul email-ului:**
- Email-ul este stocat lowercase în baza de date?
- Verifică: `SELECT email FROM accounts WHERE email = 'your@email.com';`

### 2. Eroare: "function verify_password does not exist"

**Soluție:**
```sql
-- Rulează această funcție în SQL Editor:
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

GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO authenticated;
```

### 3. Parola din baza de date nu este hash-uită

**Dacă ai parole plain text în baza de date:**

```sql
-- Hash-ui toate parolele existente:
UPDATE accounts 
SET password_hash = crypt(password_hash, gen_salt('bf', 10))
WHERE password_hash NOT LIKE '$2a$%';
```

**SAU dacă ai o coloană separată pentru parola plain text:**

```sql
-- Dacă ai o coloană 'password' cu parola plain text:
UPDATE accounts 
SET password_hash = crypt(password, gen_salt('bf', 10))
WHERE password_hash IS NULL;
```

### 4. Testează funcțiile manual

**Test verify_password:**
```sql
-- Test cu un email și parolă cunoscute
SELECT verify_password('test@example.com', 'yourpassword');
-- Ar trebui să returneze: true sau false
```

**Test hash_password:**
```sql
-- Test hash-uire
SELECT hash_password('testpassword');
-- Ar trebui să returneze un hash bcrypt
```

### 5. Verifică console logs

În aplicație, deschide console-ul și verifică:
- "Sign in attempt for email: ..."
- "Account query result: ..."
- "Verify password result: ..."

Acestea te ajută să vezi exact unde se oprește procesul.

### 6. Verifică Row Level Security (RLS)

Asigură-te că RLS permite citirea din tabelul `accounts`:

```sql
-- Verifică dacă RLS este activat
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'accounts';

-- Dacă rowsecurity = true, verifică politiciile:
SELECT * FROM pg_policies WHERE tablename = 'accounts';
```

### 7. Test direct în Supabase

**Test query direct:**
```sql
-- Verifică dacă email-ul există
SELECT accid, email, username 
FROM accounts 
WHERE email = LOWER('your@email.com');

-- Verifică parola hash-uită
SELECT password_hash 
FROM accounts 
WHERE email = LOWER('your@email.com');
```

## Debugging în cod

Adaugă aceste log-uri temporare în `lib/auth-helpers.ts` pentru debugging:

```typescript
console.log('Email normalizat:', normalizedEmail);
console.log('Account data:', JSON.stringify(accountData, null, 2));
console.log('Password hash from DB:', accountData.password_hash);
console.log('RPC call result:', { verifyData, verifyError });
```

## Soluție rapidă: Re-hash parola

Dacă parola din baza de date nu este hash-uită corect:

1. Șterge contul vechi
2. Creează unul nou prin Sign Up (va hash-ui automat)
3. Sau rulează SQL pentru a hash-ui manual:

```sql
-- Pentru un cont specific
UPDATE accounts 
SET password_hash = crypt('yourplainpassword', gen_salt('bf', 10))
WHERE email = 'your@email.com';
```

