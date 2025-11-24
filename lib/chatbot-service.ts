// Chatbot AI Service
// Folosește Google Gemini API pentru răspunsuri despre locații turistice

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyBcwycLZ_1zU53J5nzivjYclek_86c1tts'; // Setează EXPO_PUBLIC_GEMINI_API_KEY în .env
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateChatbotResponse(userMessage: string): Promise<string> {
  // Check if API key is configured
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    console.error('GEMINI_API_KEY not configured');
    return 'Scuze, serviciul AI nu este configurat. Te rog contactează administratorul aplicației.';
  }

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
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', response.status, errorData);
      
      if (response.status === 400) {
        throw new Error('API key invalid sau cerere incorectă');
      } else if (response.status === 403) {
        throw new Error('API key invalid sau fără permisiuni');
      } else if (response.status === 429) {
        throw new Error('Prea multe cereri. Te rog așteaptă puțin.');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response data:', JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text.trim();
      return responseText;
    }

    // Check for error in response
    if (data.error) {
      console.error('API returned error:', data.error);
      throw new Error(data.error.message || 'Eroare de la API');
    }

    throw new Error('Invalid response from AI');
  } catch (error: any) {
    console.error('Chatbot error:', error);
    console.error('Error details:', error.message, error.stack);
    
    // More specific error messages
    if (error.message?.includes('API key')) {
      return 'Scuze, serviciul AI nu este configurat corect. Te rog contactează administratorul.';
    }
    
    if (error.message?.includes('429')) {
      return 'Prea multe cereri în acest moment. Te rog așteaptă puțin și încearcă din nou.';
    }
    
    // Fallback responses
    const fallbackResponses = [
      'Scuze, am întâmpinat o problemă tehnică. Te rog încearcă din nou sau explorează aplicația pentru a găsi locații interesante!',
      'Nu pot răspunde acum, dar poți explora harta și lista de locații pentru a găsi ce cauți!',
      'Te rog încearcă din nou sau folosește funcțiile de căutare din aplicație.',
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

