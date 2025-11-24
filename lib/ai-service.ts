// AI Service pentru generarea descrierilor cu vibe
// Folosește Google Gemini API (gratuit pentru studenți)

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyDabDp_Y5nHNImaZNII1f_NhVQrD_iAkcE'; // Setează EXPO_PUBLIC_GEMINI_API_KEY în .env
// Use gemini-2.5-flash (fastest) or gemini-2.5-pro (better quality)
const GEMINI_MODEL = 'gemini-2.5-flash'; // Fast and efficient
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function generateVibeDescription(
  locationName: string,
  originalDescription: string
): Promise<string> {
    // Check if API key is configured (only check for placeholder, not actual key)
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY' || GEMINI_API_KEY.length < 20) {
      console.error('GEMINI_API_KEY not configured properly');
      // Return enhanced description without AI
      return `✨ ${locationName} - ${originalDescription} Un loc perfect pentru a te relaxa și a te bucura de momente speciale. Atmosfera este primitoare și vibe-ul este exact ce ai nevoie pentru o experiență memorabilă!`;
    }

  try {
    const prompt = `Rescrie următoarea descriere scurtă a locației "${locationName}" într-un stil creativ, atractiv și plin de vibe. Descrierea originală este: "${originalDescription}". 

Creează o descriere de 2-3 propoziții care să fie:
- Creativă și plină de personalitate
- Atractivă pentru turiști
- Care să transmită atmosfera și vibe-ul locației
- Scrisă în română, stil modern și prietenos

Răspunde DOAR cu descrierea, fără explicații suplimentare.`;

    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', response.status, errorData);
      console.error('API URL used:', `${GEMINI_API_URL}?key=${GEMINI_API_KEY.substring(0, 10)}...`);
      
      if (response.status === 400) {
        throw new Error(`API key invalid sau cerere incorectă: ${errorData.error?.message || 'Bad Request'}`);
      } else if (response.status === 403) {
        throw new Error(`API key invalid sau fără permisiuni: ${errorData.error?.message || 'Forbidden'}`);
      } else if (response.status === 404) {
        throw new Error(`Endpoint not found (404). Verifică că API key-ul este valid. Detalii: ${JSON.stringify(errorData)}`);
      } else if (response.status === 429) {
        throw new Error('Prea multe cereri. Te rog așteaptă puțin.');
      }
      throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('API response data:', JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    }

    // Check for error in response
    if (data.error) {
      console.error('API returned error:', data.error);
      throw new Error(data.error.message || 'Eroare de la API');
    }

    throw new Error('Invalid response from AI');
  } catch (error: any) {
    console.error('AI generation error:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Fallback: dacă API-ul eșuează, returnează o descriere îmbunătățită manual
    return `✨ ${locationName} - ${originalDescription} Un loc perfect pentru a te relaxa și a te bucura de momente speciale. Atmosfera este primitoare și vibe-ul este exact ce ai nevoie pentru o experiență memorabilă!`;
  }
}

// Funcție alternativă folosind OpenAI (dacă preferi)
export async function generateVibeWithOpenAI(
  locationName: string,
  originalDescription: string,
  apiKey: string
): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Ești un expert în marketing turistic. Scrii descrieri creative și atractive pentru locații turistice.',
          },
          {
            role: 'user',
            content: `Rescrie descrierea "${originalDescription}" pentru locația "${locationName}" într-un stil creativ și plin de vibe. 2-3 propoziții în română.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('OpenAI generation error:', error);
    throw error;
  }
}

