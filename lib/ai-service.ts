// AI Service pentru generarea descrierilor cu vibe
// Folosește Google Gemini API (gratuit pentru studenți)

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyBcwycLZ_1zU53J5nzivjYclek_86c1tts'; // Setează EXPO_PUBLIC_GEMINI_API_KEY în .env
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateVibeDescription(
  locationName: string,
  originalDescription: string
): Promise<string> {
    // Check if API key is configured
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      console.error('GEMINI_API_KEY not configured');
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
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    }

    throw new Error('Invalid response from AI');
  } catch (error: any) {
    console.error('AI generation error:', error);
    
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

