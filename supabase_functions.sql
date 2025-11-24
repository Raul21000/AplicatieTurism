-- Supabase SQL Functions pentru autentificare
-- Rulează aceste funcții în Supabase SQL Editor

-- 1. Funcție pentru hash-uirea parolei (folosește pgcrypto)
CREATE OR REPLACE FUNCTION hash_password(p_password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Folosește bcrypt pentru hash-uirea parolei
  -- Notă: Trebuie să ai extensia pgcrypto activată
  RETURN crypt(p_password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Funcție pentru verificarea parolei
CREATE OR REPLACE FUNCTION verify_password(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  -- Obține password_hash pentru email-ul dat
  SELECT password_hash INTO v_password_hash
  FROM accounts
  WHERE email = LOWER(TRIM(p_email));
  
  -- Verifică dacă email-ul există
  IF v_password_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compară parola hash-uită
  RETURN (v_password_hash = crypt(p_password, v_password_hash));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Activează extensia pgcrypto (dacă nu este deja activată)
-- Rulează această comandă în Supabase SQL Editor:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Funcție alternativă pentru verificare directă (folosește password_hash existent)
CREATE OR REPLACE FUNCTION verify_password_direct(p_password_hash TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Compară parola hash-uită direct
  RETURN (p_password_hash = crypt(p_password, p_password_hash));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions pentru funcții
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_password_direct(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password_direct(TEXT, TEXT) TO anon;

