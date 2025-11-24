# 🤖 Multi-AI Service Setup Guide

Acest sistem permite utilizarea mai multor API-uri AI simultan pentru performanță și redundanță îmbunătățită.

## 📋 Caracteristici

✅ **Multiple API Providers** - Suportă Gemini, OpenAI, și altele  
✅ **3 Strategii** - Fallback, Parallel, Load Balance  
✅ **Auto-failover** - Schimbă automat la alt provider dacă unul eșuează  
✅ **Performance Tracking** - Măsoară timpul de răspuns pentru fiecare provider  
✅ **Quota Management** - Distribuie cererile pentru a evita depășirea limitelor  

## 🎯 Strategii Disponibile

### 1. **Fallback** (Implicit - Recomandat pentru fiabilitate)
```typescript
const AI_STRATEGY = 'fallback';
```
- Încearcă providerii în ordinea priorității
- Dacă primul eșuează, încearcă următorul
- **Best for**: Fiabilitate maximă, costuri minime

### 2. **Parallel** (Recomandat pentru viteză)
```typescript
const AI_STRATEGY = 'parallel';
```
- Trimite cereri la toți providerii simultan
- Folosește primul răspuns care sosește
- **Best for**: Viteză maximă, redundanță

### 3. **Load Balance** (Recomandat pentru quota)
```typescript
const AI_STRATEGY = 'load-balance';
```
- Distribuie cererile rotativ între provideri
- Evită depășirea limitelor de quota
- **Best for**: Management quota, utilizare echilibrată

## ⚙️ Configurare

### 1. Configurare API Keys în `lib/multi-ai-service.ts`

```typescript
const AI_PROVIDERS: AIProviderConfig[] = [
  // Gemini - Primary (fast)
  {
    provider: 'gemini',
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_KEY_HERE',
    model: 'gemini-2.5-flash',
    priority: 1,
    enabled: true,
  },
  // Gemini - Secondary (backup)
  {
    provider: 'gemini',
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY_2 || '', // Optional
    model: 'gemini-2.5-pro',
    priority: 2,
    enabled: false, // Set to true if you have a second key
  },
  // OpenAI - Optional fallback
  {
    provider: 'openai',
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    priority: 3,
    enabled: false, // Set to true if you have OpenAI key
  },
];
```

### 2. Setare Variabile de Mediu (Opțional)

Creează un fișier `.env` în root-ul proiectului:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
EXPO_PUBLIC_GEMINI_API_KEY_2=your_second_gemini_key_here
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
```

### 3. Schimbare Strategie în `lib/chatbot-service.ts`

```typescript
// Pentru viteză maximă:
const AI_STRATEGY = 'parallel';

// Pentru fiabilitate maximă (implicit):
const AI_STRATEGY = 'fallback';

// Pentru management quota:
const AI_STRATEGY = 'load-balance';
```

## 📊 Utilizare

### Exemplu Basic
```typescript
import { generateAIResponse } from '@/lib/multi-ai-service';

const result = await generateAIResponse('Ce locații recomanzi în România?', 'fallback');
console.log(`Răspuns de la ${result.provider} în ${result.responseTime}ms`);
console.log(result.text);
```

### Verificare Statistici
```typescript
import { getAIProviderStats } from '@/lib/multi-ai-service';

const stats = getAIProviderStats();
console.log(`Total providers: ${stats.total}`);
console.log(`Enabled: ${stats.enabled}`);
console.log('Providers:', stats.providers);
```

## 🚀 Beneficii

### Performanță
- **Parallel Strategy**: Răspunsuri mai rapide (folosește cel mai rapid răspuns)
- **Load Balance**: Distribuie cererile pentru a evita bottleneck-uri

### Fiabilitate
- **Fallback Strategy**: Dacă un provider eșuează, folosește automat altul
- **Redundanță**: Multiple backup-uri pentru disponibilitate maximă

### Cost Management
- **Quota Distribution**: Distribuie cererile pentru a evita depășirea limitelor
- **Smart Routing**: Folosește providerii mai ieftini primul (prin priority)

## 🔧 Adăugare Provider Nou

Pentru a adăuga un nou provider (ex: Anthropic Claude):

1. Adaugă funcție de apelare în `lib/multi-ai-service.ts`:
```typescript
async function callAnthropicAPI(prompt: string, apiKey: string): Promise<string> {
  // Implementation here
}
```

2. Adaugă caz în `callAIProvider`:
```typescript
case 'anthropic':
  return await callAnthropicAPI(prompt, config.apiKey);
```

3. Adaugă configurare în `AI_PROVIDERS`:
```typescript
{
  provider: 'anthropic',
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
  model: 'claude-3-sonnet',
  priority: 4,
  enabled: false,
}
```

## 📝 Note

- **Priority**: Număr mai mic = prioritate mai mare
- **Timeout**: Implicit 10 secunde per request
- **Error Handling**: Auto-retry cu fallback automat
- **Logging**: Toate cererile sunt loggate pentru debugging

## 🐛 Troubleshooting

### "No enabled AI providers configured"
- Verifică că cel puțin un provider are `enabled: true`
- Verifică că API key-ul are minim 20 caractere

### "All AI providers failed"
- Verifică conectivitatea internet
- Verifică validitatea API key-urilor
- Verifică logs pentru detalii despre erori

### Performance Issues
- Folosește `parallel` strategy pentru viteză
- Reduce timeout-ul pentru răspunsuri mai rapide
- Verifică că folosești modele rapide (ex: `gemini-2.5-flash`)

