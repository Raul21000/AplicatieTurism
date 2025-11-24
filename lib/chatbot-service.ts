// Chatbot AI Service
// Folosește Google Gemini API pentru răspunsuri despre locații turistice

const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Același API key ca pentru vibe generator
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateChatbotResponse(userMessage: string): Promise<string> {
  try {
    const prompt = `Ești un asistent AI prietenos și expert în turism pentru o aplicație mobilă de turism din România. 
    
Utilizatorul te întreabă: "${userMessage}"

Răspunde într-un mod:
- Prietenos și conversațional (folosește "tu")
- Util și informativ
- Scurt și la obiect (maxim 3-4 propoziții)
- În română
- Dacă întreabă despre locații, recomandări sau turism, oferă răspunsuri practice
- Dacă nu știi răspunsul, sugerează să exploreze aplicația pentru a găsi locații

Răspunde DOAR cu răspunsul tău, fără explicații suplimentare.`;

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
    console.error('Chatbot error:', error);
    
    // Fallback responses
    const fallbackResponses = [
      'Scuze, am întâmpinat o problemă tehnică. Te rog încearcă din nou sau explorează aplicația pentru a găsi locații interesante!',
      'Nu pot răspunde acum, dar poți explora harta și lista de locații pentru a găsi ce cauți!',
      'Te rog încearcă din nou sau folosește funcțiile de căutare din aplicație.',
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

