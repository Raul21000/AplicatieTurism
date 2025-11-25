# 🔄 Explicație: De ce nu se sincronizează conturile între telefoane

## ❌ Problema Actuală

Aplicația folosește **SQLite local** pentru stocarea datelor. Aceasta înseamnă:

- ✅ **Funcționează offline** - nu necesită internet
- ✅ **Rapid** - datele sunt stocate local pe dispozitiv
- ❌ **NU se sincronizează** - fiecare telefon are propria bază de date
- ❌ **Date separate** - contul creat pe telefonul 1 nu apare pe telefonul 2

## 📱 Cum funcționează acum

```
Telefon 1                    Telefon 2
┌─────────────┐              ┌─────────────┐
│ SQLite      │              │ SQLite      │
│ Local       │              │ Local       │
│             │              │             │
│ Cont A      │              │ Cont B      │
│ Cont B      │              │ Cont C      │
└─────────────┘              └─────────────┘
     ❌ NU SE SINCRONIZEAZĂ
```

## ✅ Soluția: Migrare la Supabase

Pentru sincronizare între telefoane, trebuie să folosești **Supabase** (care este deja configurat în proiect).

### Avantaje Supabase:
- ✅ **Sincronizare în timp real** între toate dispozitivele
- ✅ **Cloud database** - datele sunt în cloud
- ✅ **Autentificare integrată** - Supabase Auth
- ✅ **Backup automat** - datele sunt salvate în cloud

### Cum arată cu Supabase:

```
Telefon 1                    Telefon 2
┌─────────────┐              ┌─────────────┐
│             │              │             │
│   App       │              │   App       │
└──────┬──────┘              └──────┬──────┘
       │                            │
       │    Internet                │
       │    ⬇️ ⬆️                    │
       └──────────┬──────────────────┘
                  │
         ┌────────▼────────┐
         │   Supabase      │
         │   Cloud DB      │
         │                 │
         │  Cont A         │
         │  Cont B         │
         │  Cont C         │
         └─────────────────┘
    ✅ TOATE DISPOZITIVELE VĂD ACELAȘI DATABASE
```

## 🔧 Cum să vezi conturile actuale (SQLite Local)

1. **Din aplicație:**
   - Mergi la **Profile** tab
   - Apasă pe butonul **"🔧 Admin - Vezi Baza de Date"**
   - Vei vedea toate conturile create pe **acest telefon**

2. **Din cod:**
   - Funcția `getAllAccounts()` din `lib/database.ts` returnează toate conturile
   - Ecranul `app/admin.tsx` afișează aceste date

## 🚀 Pași pentru Migrare la Supabase (Opțional)

Dacă vrei să migrezi la Supabase pentru sincronizare:

1. **Creează tabele în Supabase Dashboard:**
   ```sql
   CREATE TABLE accounts (
     accid TEXT PRIMARY KEY,
     username TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Modifică `lib/auth-helpers.ts`:**
   - Înlocuiește apelurile SQLite cu apeluri Supabase
   - Folosește `supabase.from('accounts').select()...`

3. **Actualizează `app/login.tsx` și `app/signup.tsx`:**
   - Folosește `supabase.auth.signInWithPassword()` și `supabase.auth.signUp()`
   - (Deja implementat parțial)

## 📊 Comparație

| Caracteristică | SQLite Local | Supabase |
|----------------|--------------|----------|
| Offline | ✅ Da | ❌ Nu (necesită internet) |
| Sincronizare | ❌ Nu | ✅ Da |
| Viteză | ✅ Foarte rapid | ✅ Rapid |
| Backup | ❌ Nu | ✅ Automat |
| Multi-dispozitiv | ❌ Nu | ✅ Da |

## 💡 Recomandare

Pentru **hackathon** și **testare rapidă**: SQLite local este perfect.

Pentru **producție** și **sincronizare reală**: migrează la Supabase.

