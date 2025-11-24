# 🔑 Configurare API Key pentru AI Chatbot

## Problema
Chatbot-ul returnează "Nu pot răspunde acum" pentru că API key-ul Gemini nu este configurat.

## Soluție

### Opțiunea 1: Setare directă în cod (pentru testare rapidă)

1. Obține un API key gratuit de la Google Gemini:
   - Mergi la: https://makersuite.google.com/app/apikey
   - Creează un cont (dacă nu ai)
   - Generează un API key

2. Actualizează fișierul `lib/chatbot-service.ts`:
   ```typescript
   const GEMINI_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
   ```

3. Actualizează și `lib/ai-service.ts` cu același API key:
   ```typescript
   const GEMINI_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
   ```

### Opțiunea 2: Folosind variabile de mediu (recomandat)

1. Creează un fișier `.env` în root-ul proiectului:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```

2. Instalează `expo-constants` (deja instalat) și folosește:
   ```typescript
   import Constants from 'expo-constants';
   const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || 'YOUR_GEMINI_API_KEY';
   ```

3. Actualizează `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "geminiApiKey": process.env.EXPO_PUBLIC_GEMINI_API_KEY
       }
     }
   }
   ```

## Verificare

După configurare:
1. Reîncarcă aplicația
2. Încearcă să trimiți un mesaj în chatbot
3. Verifică console-ul pentru erori
4. Ar trebui să primești răspunsuri reale de la AI

## Note importante

- **Nu comitați API key-ul în Git!** Adăugați `.env` în `.gitignore`
- API key-ul Gemini este gratuit pentru utilizare limitată
- Dacă vezi erori 403 sau 400, verifică că API key-ul este corect

