# 🔄 Ghid de Sincronizare - Backend Server

## Arhitectură

Aplicația folosește un sistem **hibrid**:
- **SQLite local** pe fiecare dispozitiv (pentru offline)
- **Backend server** pentru sincronizare între dispozitive (pentru online)

## Setup Backend Server

### 1. Instalează dependențele serverului

```bash
cd server
npm install
```

### 2. Pornește serverul

```bash
npm start
```

Serverul va rula pe `http://localhost:3000`

### 3. Configurează URL-ul în aplicație

În `lib/api-client.ts`, actualizează:
```typescript
const API_BASE_URL = 'http://YOUR_SERVER_IP:3000/api';
```

Pentru testare locală pe emulator Android:
```typescript
const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Android emulator
```

Pentru testare locală pe iOS Simulator:
```typescript
const API_BASE_URL = 'http://localhost:3000/api'; // iOS Simulator
```

Pentru dispozitiv fizic, folosește IP-ul computerului tău:
```typescript
const API_BASE_URL = 'http://192.168.1.XXX:3000/api'; // IP-ul tău local
```

## Cum funcționează sincronizarea

### La Sign Up / Sign In:
1. Contul este creat/stocat local în SQLite
2. Dacă serverul este disponibil → contul este sincronizat cu serverul
3. Dacă serverul nu este disponibil → funcționează doar local

### Sincronizare manuală:
Poți adăuga un buton în profil pentru sincronizare manuală:
```typescript
import { syncAllToServer, syncFromServer } from '@/lib/sync-service';

// Sincronizează datele locale cu serverul
await syncAllToServer();

// Descarcă datele de pe server
await syncFromServer();
```

## Deployment Production

Pentru production, deployează serverul pe:
- **Heroku**: `heroku create` + `git push heroku main`
- **Railway**: Conectează repo-ul GitHub
- **Render**: Deploy din GitHub
- **DigitalOcean**: Droplet cu Node.js

După deployment, actualizează `API_BASE_URL` cu URL-ul serverului tău:
```typescript
const API_BASE_URL = 'https://your-app.herokuapp.com/api';
```

## Avantaje

✅ **Offline-first**: Funcționează fără internet (SQLite local)
✅ **Sincronizare**: Datele se sincronizează când serverul este disponibil
✅ **Scalabil**: Poți adăuga mai multe funcționalități pe server
✅ **Flexibil**: Poți dezactiva sincronizarea dacă nu ai server

## Notă importantă

- Baza de date locală (SQLite) rămâne principală
- Serverul este opțional - aplicația funcționează și fără el
- Sincronizarea este automată la login/signup dacă serverul este disponibil

