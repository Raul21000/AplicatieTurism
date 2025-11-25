// Chatbot AI Service
// Folosește Multi-AI Service pentru răspunsuri despre locații turistice
// Suportă multiple API-uri AI pentru performanță și redundanță îmbunătățită

import { getFormattedAppContext, getLocationRecommendationContext } from './app-context';
import { generateAIResponse, getAIProviderStats } from './multi-ai-service';

// Strategy options: 'fallback' | 'parallel' | 'load-balance'
// - fallback: Try providers in order until one succeeds (best for reliability)
// - parallel: Call all providers simultaneously, use fastest response (best for speed)
// - load-balance: Distribute requests across providers (best for quota management)
const AI_STRATEGY: 'fallback' | 'parallel' | 'load-balance' = 'fallback'; // Change to 'parallel' for speed

export async function generateChatbotResponse(userMessage: string): Promise<string> {
  try {
    // Check if any providers are available
    const stats = getAIProviderStats();
    if (stats.enabled === 0) {
      return 'Scuze, serviciul AI nu este configurat. Te rog contactează administratorul aplicației.';
    }

    // Get app context (locations, features, etc.)
    const appContext = await getFormattedAppContext();
    const locationContext = await getLocationRecommendationContext();

    const prompt = `Ești un asistent AI prietenos și expert în turism pentru o aplicație mobilă de turism din România.

${appContext}

${locationContext}

ÎNTREBAREA UTILIZATORULUI: "${userMessage}"

INSTRUCȚIUNI PENTRU RĂSPUNS:
- Prietenos și conversațional (folosește "tu")
- Util și informativ
- Scurt și la obiect (maxim 3-4 propoziții)
- În română
- Dacă întreabă despre locații, recomandă locații REALE din aplicație (folosește lista de locații disponibile)
- Dacă întreabă despre funcționalități, menționează funcționalitățile disponibile în aplicație
- Dacă nu știi răspunsul, sugerează să exploreze aplicația pentru a găsi locații
- Poți recomanda locații specifice din lista disponibilă când e relevant

Răspunde DOAR cu răspunsul tău, fără explicații suplimentare.`;

    // Use multi-AI service with selected strategy
    const result = await generateAIResponse(prompt, AI_STRATEGY);
    console.log(`[Chatbot] Response from ${result.provider} in ${result.responseTime}ms`);
    return result.text;
  } catch (error: any) {
    console.error('Chatbot error:', error);
    console.error('Error details:', error.message, error.stack);
    
    // More specific error messages
    if (error.message?.includes('API key') || error.message?.includes('403') || error.message?.includes('401')) {
      console.error('API Key issue - check if keys are valid');
      return 'Scuze, API key-ul nu este valid sau nu are permisiuni. Verifică configurația API key-ului.';
    }
    
    if (error.message?.includes('404')) {
      console.error('404 Error - Endpoint or model not found');
      return 'Scuze, endpoint-ul API nu a fost găsit. Verifică că modelul Gemini este disponibil.';
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
    
    console.error('Returning fallback response due to error:', error.message);
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

