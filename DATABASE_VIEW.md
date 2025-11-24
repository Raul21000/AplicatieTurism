# 📊 Cum să vezi baza de date SQLite

## 📍 Locația fișierului

Baza de date SQLite este stocată local pe dispozitivul tău:
- **Nume fișier**: `tourism_app.db`
- **Locație**: Directorul documentelor aplicației

### Pe Android:
```
/data/data/com.yourapp.name/databases/tourism_app.db
```

### Pe iOS (Simulator):
```
~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Documents/tourism_app.db
```

### Pe iOS (Device):
Accesibil doar prin Xcode sau instrumente de dezvoltare.

## 🔧 Opțiuni pentru vizualizare

### 1. **Folosind aplicația (Debug Screen)**
Adaugă un buton în profil pentru a vedea datele din baza de date.

### 2. **Folosind SQLite Browser (Recomandat)**
1. Descarcă [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Extrage fișierul `tourism_app.db` de pe dispozitiv
3. Deschide-l în DB Browser

### 3. **Folosind ADB (Android)**
```bash
# Conectează-te la dispozitiv
adb shell

# Navighează la directorul aplicației
cd /data/data/com.yourapp.name/databases

# Copiază fișierul
adb pull /data/data/com.yourapp.name/databases/tourism_app.db ./
```

### 4. **Folosind Expo Dev Tools**
Poți adăuga console.log-uri în cod pentru a afișa datele.

## 📱 Funcții disponibile în cod

Folosește funcțiile din `lib/database.ts`:

```typescript
import { getAllAccounts, getAllLocations, getAllReviews, getDatabaseStats } from '@/lib/database';

// Obține toate conturile
const accounts = await getAllAccounts();

// Obține toate locațiile
const locations = await getAllLocations();

// Obține toate recenziile
const reviews = await getAllReviews();

// Obține statistici
const stats = await getDatabaseStats();
```

## 🛠️ Vizualizare rapidă în aplicație

Adaugă un buton de debug în ecranul de profil pentru a vedea datele direct în aplicație.

