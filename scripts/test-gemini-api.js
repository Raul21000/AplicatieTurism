// Script de test pentru API-ul Gemini
// Rulează cu: node scripts/test-gemini-api.js
// 
// IMPORTANT: Expo citește automat .env, dar pentru Node.js direct trebuie să setezi manual:
// Windows PowerShell: $env:EXPO_PUBLIC_GEMINI_API_KEY="cheia_ta"
// Windows CMD: set EXPO_PUBLIC_GEMINI_API_KEY=cheia_ta
// Linux/Mac: export EXPO_PUBLIC_GEMINI_API_KEY=cheia_ta

// Try to load .env if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, that's OK - user can set env var manually
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

console.log('🔍 Testing Gemini API...\n');
console.log('API Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 20)}...` : '❌ NOT SET');
console.log('API Key Length:', GEMINI_API_KEY?.length || 0);
console.log('Model:', GEMINI_MODEL);
console.log('URL:', GEMINI_API_URL);
console.log('');

if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
  console.error('❌ ERROR: API key is not set or too short!');
  console.error('   Please set EXPO_PUBLIC_GEMINI_API_KEY in .env file');
  process.exit(1);
}

const testPrompt = 'Scrie o propoziție despre România.';

console.log('📤 Sending test request...');
console.log('Prompt:', testPrompt);
console.log('');

fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: testPrompt,
          },
        ],
      },
    ],
  }),
})
  .then(async (response) => {
    console.log('📥 Response Status:', response.status, response.statusText);
    console.log('');

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error Response:');
      console.error(JSON.stringify(data, null, 2));
      
      if (response.status === 403) {
        console.error('\n🚨 ERROR 403: API key invalid or leaked!');
        console.error('   Solution: Create a NEW API key at https://aistudio.google.com');
        console.error('   Then update EXPO_PUBLIC_GEMINI_API_KEY in .env file');
      } else if (response.status === 400) {
        console.error('\n🚨 ERROR 400: Bad request!');
        console.error('   Check if the API key format is correct');
      } else if (response.status === 429) {
        console.error('\n🚨 ERROR 429: Too many requests!');
        console.error('   Wait a bit and try again');
      }
      
      process.exit(1);
    }

    console.log('✅ SUCCESS! API is working!');
    console.log('');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('');
      console.log('📝 Generated Text:');
      console.log(data.candidates[0].content.parts[0].text);
    }
  })
  .catch((error) => {
    console.error('❌ Network Error:');
    console.error(error.message);
    process.exit(1);
  });

