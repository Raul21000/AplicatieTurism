# 🔍 Debugging API-ul Gemini

## Cum să rulezi scriptul de test

### Opțiunea 1: Direct în terminal (recomandat)

**Windows PowerShell:**
```powershell
$env:EXPO_PUBLIC_GEMINI_API_KEY="cheia_ta_aici"
node scripts/test-gemini-api.js
```

**Windows CMD:**
```cmd
set EXPO_PUBLIC_GEMINI_API_KEY=cheia_ta_aici
node scripts/test-gemini-api.js
```

**Linux/Mac:**
```bash
export EXPO_PUBLIC_GEMINI_API_KEY=cheia_ta_aici
node scripts/test-gemini-api.js
```

### Opțiunea 2: Pune cheia direct în script (doar pentru test)

Editează `scripts/test-gemini-api.js` și înlocuiește:
```javascript
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
```

Cu:
```javascript
const GEMINI_API_KEY = 'cheia_ta_aici'; // TEMPORAR - doar pentru test!
```

Apoi rulează:
```bash
node scripts/test-gemini-api.js
```

## Ce ar trebui să vezi

### ✅ SUCCESS:
```
🔍 Testing Gemini API...
API Key: AIzaSyDabDp_Y5nHNIma...
API Key Length: 39
Model: gemini-2.5-flash
...
✅ SUCCESS! API is working!
📝 Generated Text:
[text generat de AI]
```

### ❌ ERROR 403 (API Key Leaked):
```
🚨 ERROR 403: API key invalid or leaked!
   Solution: Create a NEW API key at https://aistudio.google.com
   Then update EXPO_PUBLIC_GEMINI_API_KEY in .env file
```

### ❌ ERROR: Key not set:
```
❌ ERROR: API key is not set or too short!
   Please set EXPO_PUBLIC_GEMINI_API_KEY in .env file
```

## Soluții pentru probleme comune

### Problema: "API key is not set"
**Soluție:** Setează variabila de mediu înainte de a rula scriptul (vezi Opțiunea 1 de mai sus)

### Problema: "API key was reported as leaked"
**Soluție:**
1. Mergi la https://aistudio.google.com
2. Intră la **API Keys**
3. Șterge cheia veche
4. Creează o **cheie nouă**
5. Actualizează `.env` cu noua cheie
6. Repornește Expo: `npx expo start -c`

### Problema: "Network Error"
**Soluție:** Verifică conexiunea la internet

## Verificare rapidă în aplicație

După ce ai setat cheia corect:
1. Repornește Expo: `npx expo start -c`
2. Deschide aplicația
3. Mergi la o locație și apasă "Extinde descrierea cu AI"
4. Verifică terminalul Expo pentru mesaje `[AI] ...`

Dacă vezi `[AI] 🚨 API KEY LEAKED` → cheia e invalidă, trebuie una nouă
Dacă vezi `[AI] Generating detailed description` → funcționează! ✅

