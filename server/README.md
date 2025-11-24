# Tourism App Backend Server

Backend server pentru sincronizarea datelor între dispozitive.

## Setup

1. Instalează dependențele:
```bash
cd server
npm install
```

2. Pornește serverul:
```bash
npm start
```

Sau pentru development cu auto-reload:
```bash
npm run dev
```

Serverul va rula pe `http://localhost:3000`

## API Endpoints

### Auth
- `POST /api/auth/signup` - Înregistrare cont
- `POST /api/auth/signin` - Autentificare

### Locations
- `GET /api/locations` - Obține toate locațiile
- `GET /api/locations/:id` - Obține o locație specifică
- `POST /api/locations` - Creează o locație nouă

### Reviews
- `GET /api/locations/:locationId/reviews` - Obține recenziile pentru o locație
- `GET /api/accounts/:accountId/reviews` - Obține recenziile unui utilizator
- `POST /api/reviews` - Creează o recenzie

### Sync
- `POST /api/sync/account` - Sincronizează un cont
- `POST /api/sync/location` - Sincronizează o locație
- `POST /api/sync/review` - Sincronizează o recenzie

### Health
- `GET /api/health` - Verifică statusul serverului

## Deployment

Pentru production, poți deploya pe:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS

Setări recomandate:
- Variabilă de mediu `PORT` pentru port
- Baza de date SQLite va fi creată automat

## Notă

Baza de date SQLite este stocată în `tourism_app_shared.db` în directorul server.

