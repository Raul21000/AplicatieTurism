// AI Service pentru generarea descrierilor cu vibe
// Folosește Google Gemini API (gratuit pentru studenți)

import { getFormattedAppContext, getLocationRecommendationContext } from './app-context';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyDabDp_Y5nHNImaZNII1f_NhVQrD_iAkcE'; // Setează EXPO_PUBLIC_GEMINI_API_KEY în .env
// Use gemini-2.5-flash (fastest) or gemini-2.5-pro (better quality)
const GEMINI_MODEL = 'gemini-2.5-flash'; // Fast and efficient
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Generate a base description (2-3 sentences) themed around the location name
 * This serves as the foundation description for each location
 */
export async function generateBaseDescription(
  locationName: string,
  originalDescription?: string
): Promise<string> {
  // Check if API key is configured
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY' || GEMINI_API_KEY.length < 20) {
    console.error('GEMINI_API_KEY not configured properly');
    // Return fallback base description (shorter - 2 sentences)
    return `${locationName} este o destinație turistică remarcabilă situată în inima României. Această locație oferă o experiență autentică care combină perfect istoria, cultura și frumusețea naturală a țării.`;
  }

  try {
    // Get app context for better descriptions
    const appContext = await getFormattedAppContext();
    
    // Analyze location name to create themed prompt
    const locationTheme = analyzeLocationTheme(locationName);
    
    // Create unique identifier based on location name to ensure uniqueness
    const locationHash = locationName.toLowerCase().replace(/\s+/g, '_');
    const uniqueElements = extractUniqueElements(locationName);
    
    const prompt = `Creează o descriere de bază UNICĂ și SPECIFICĂ (2-3 propoziții) pentru locația turistică "${locationName}" din România.

CONTEXT APLICAȚIE:
${appContext}

${locationTheme}

${originalDescription ? `Informații existente despre locație: "${originalDescription}"` : ''}

ELEMENTE UNICE IDENTIFICATE DIN NUME:
${uniqueElements}

CRITICAL REQUIREMENTS - DESCRIEREA TREBUIE SĂ FIE:
- ABSOLUT UNICĂ - nicio altă locație nu poate avea aceeași descriere exactă
- SPECIFICĂ pentru "${locationName}" - reflectă caracteristicile unice ale acestui nume
- 2-3 propoziții, concise dar informative
- Tematică și relevantă pentru numele EXACT "${locationName}"
- Include informații despre caracteristicile DISTINCTIVE care fac această locație diferită de altele
- Descrie ce face această locație SPECIALĂ și de ce merită vizitată
- Scrisă în română, stil informativ dar accesibil
- Fii SPECIFIC și oferă detalii concrete despre locație care reflectă numele ei
- Folosește elementele unice identificate din nume pentru a crea o descriere personalizată
- Evită formulări generice care s-ar putea aplica oricărei locații

IMPORTANT: Această descriere trebuie să fie complet diferită de orice altă descriere pentru alte locații. Fiecare locație are caracteristici unice care trebuie evidențiate.

Răspunde DOAR cu descrierea de bază UNICĂ, fără titluri sau explicații suplimentare.`;

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
          generationConfig: {
            temperature: 0.9, // Higher temperature for more unique descriptions
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', response.status, errorData);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    }

    if (data.error) {
      console.error('API returned error:', data.error);
      throw new Error(data.error.message || 'Eroare de la API');
    }

    throw new Error('Invalid response from AI');
  } catch (error: any) {
    console.error('AI base description generation error:', error);
    // Return fallback base description
    return `${locationName} este o destinație turistică remarcabilă situată în inima României. Această locație oferă o experiență autentică care combină perfect istoria, cultura și frumusețea naturală a țării. Vizitatorii pot descoperi atracții unice, savura bucătăria locală și se bucura de peisaje spectaculoase care rămân în amintire mult timp după vizită.`;
  }
}

/**
 * Analyze location name to create themed context for AI
 */
function analyzeLocationTheme(locationName: string): string {
  const name = locationName.toLowerCase();
  
  // Castle/Fortress themes
  if (name.includes('castel') || name.includes('cetate') || name.includes('fort')) {
    return `Această locație este un castel sau fortificație istorică. Concentrează-te pe:
- Istoria și perioada de construcție SPECIFICĂ acestui castel
- Arhitectura și stilul arhitectonic UNIC
- Legende și povești asociate SPECIFICE acestei locații
- Importanța strategică sau culturală PARTICULARĂ
- Ce poți vedea și explora acolo care este UNIC pentru această locație`;
  }
  
  // Monastery/Church themes
  if (name.includes('mănăstire') || name.includes('biseric') || name.includes('schit')) {
    return `Această locație este un lăcaș de cult sau mănăstire. Concentrează-te pe:
- Istoria religioasă și fondarea SPECIFICĂ acestui lăcaș
- Arhitectura și iconografia UNICĂ
- Importanța spirituală și culturală PARTICULARĂ
- Artefacte și opere de artă SPECIFICE acestei locații
- Peisajul și locația geografică DISTINCTIVĂ`;
  }
  
  // Natural/Mountain themes
  if (name.includes('munte') || name.includes('deal') || name.includes('pădure') || name.includes('lac') || name.includes('cascad')) {
    return `Această locație este o destinație naturală. Concentrează-te pe:
- Caracteristicile geografice și geologice UNICE ale acestei locații
- Flora și fauna locală SPECIFICĂ
- Trasee și activități disponibile PARTICULAR acestei destinații
- Peisajul și vederile spectaculoase DISTINCTIVE
- Sezonul ideal pentru vizitare și ce face această locație NATURALĂ specială`;
  }
  
  // City/Town themes
  if (name.includes('oraș') || name.includes('cetate') || name.includes('burg')) {
    return `Această locație este un oraș sau localitate istorică. Concentrează-te pe:
- Istoria și evoluția SPECIFICĂ a acestui oraș
- Arhitectura și monumentele UNICE
- Cultura și tradițiile locale PARTICULAR acestei localități
- Atracțiile principale DISTINCTIVE
- Atmosfera și vibe-ul UNIC al locației`;
  }
  
  // Museum/Exhibition themes
  if (name.includes('muzeu') || name.includes('expoziție') || name.includes('galerie')) {
    return `Această locație este un muzeu sau spațiu expozițional. Concentrează-te pe:
- Colecțiile și exponatele SPECIFICE acestui muzeu
- Tema și scopul PARTICULAR al muzeului
- Importanța culturală și istorică UNICĂ
- Ce poți învăța și descoperi DISTINCTIV aici
- Experiența de vizitare SPECIFICĂ`;
  }
  
  // Default theme
  return `Această locație este o destinație turistică din România. Concentrează-te pe:
- Caracteristicile ABSOLUT UNICE și distinctive care o diferențiază de orice altă locație
- Istoria și contextul cultural SPECIFIC acestei locații
- Ce face această locație SPECIALĂ și de neînlocuit
- Experiențe pe care le poți avea DOAR aici
- De ce merită vizitată și ce o face DIFERITĂ de altele`;
}

/**
 * Extract unique elements from location name to ensure description uniqueness
 */
function extractUniqueElements(locationName: string): string {
  const name = locationName.toLowerCase().trim();
  const words = name.split(/\s+/);
  const uniqueWords: string[] = [];
  
  // Extract key words that make this location unique
  words.forEach(word => {
    // Skip common words
    const commonWords = ['de', 'la', 'din', 'pe', 'cu', 'și', 'sau', 'pentru', 'către'];
    if (!commonWords.includes(word) && word.length > 2) {
      uniqueWords.push(word);
    }
  });
  
  // Identify location type
  let locationType = 'destinație turistică';
  if (name.includes('castel')) locationType = 'castel';
  else if (name.includes('mănăstire')) locationType = 'mănăstire';
  else if (name.includes('biseric')) locationType = 'biserică';
  else if (name.includes('muzeu')) locationType = 'muzeu';
  else if (name.includes('palat')) locationType = 'palat';
  else if (name.includes('cetate')) locationType = 'cetate';
  else if (name.includes('lac')) locationType = 'lac';
  else if (name.includes('cascad')) locationType = 'cascadă';
  else if (name.includes('munte')) locationType = 'munte';
  
  // Extract geographic/name-specific elements
  const geographicElements = words.filter(w => 
    w.length > 3 && 
    !['castel', 'mănăstire', 'biseric', 'muzeu', 'palat', 'cetate'].includes(w)
  );
  
  return `Tip locație: ${locationType}
Cuvinte cheie unice: ${uniqueWords.join(', ')}
Elemente geografice/nume: ${geographicElements.join(', ') || 'N/A'}
Nume complet: "${locationName}"

Folosește aceste elemente pentru a crea o descriere care reflectă SPECIFIC numele "${locationName}" și nu ar putea fi aplicată altor locații.`;
}

/**
 * Generate a short creative vibe description (2-3 sentences)
 */
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

/**
 * Fallback detailed description generator (no external AI).
 * Creates 3-4 extra sentences based on the location name and the existing base description,
 * without copying the base text.
 */
function buildFallbackDetailedDescription(locationName: string, baseDescription: string): string {
  const trimmedBase = baseDescription.trim();
  const baseHint =
    trimmedBase.length > 140 ? `${trimmedBase.slice(0, 140).trim()}...` : trimmedBase;

  return (
    `Pornind de la atmosfera descrisă mai sus pentru „${locationName}”, ` +
    `locul atrage prin detaliile sale atent gândite și prin modul în care îmbină confortul cu personalitatea proprie. ` +
    `Fiecare vizită scoate în evidență alte nuanțe – de la modul în care este amenajat spațiul, ` +
    `până la modul în care meniul completează vibe-ul general sugerat de descrierea inițială („${baseHint}”). ` +
    `Pentru cei care caută mai mult decât o simplă oprire rapidă, ${locationName} devine rapid un punct de reper memorabil în oraș.`
  );
}

/**
 * Generate a longer, more in-depth description that extends the base description.
 * Uses the base description as context, but returns ONLY the new part (full response - base description).
 */
export async function generateDetailedDescription(
  locationName: string,
  baseDescription: string
): Promise<string> {
  // Check if API key is configured
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY' || GEMINI_API_KEY.length < 20) {
    console.error('GEMINI_API_KEY not configured properly');
    // Return unique fallback based on name + existing description
    return buildFallbackDetailedDescription(locationName, baseDescription);
  }

  try {
    // Get app context for better descriptions
    const appContext = await getFormattedAppContext();
    const locationContext = await getLocationRecommendationContext();
    
    const prompt = `Ești un editor de travel și gastronomie cu o vastă experiență, care scrie pentru un ghid turistic premium.

Ai deja următoarea descriere de bază (short_description) pentru locația "${locationName}":

"${baseDescription}"

CONTEXT APLICAȚIE:
${appContext}

CONTEXT LOCAȚII RECOMANDATE:
${locationContext}

SCOP:
Continuă și extinde această descriere cu un paragraf suplimentar de 3-4 fraze, mai profund și mai specific, FĂRĂ să repeți formulările din descrierea de bază.

REGULI STRICTE PENTRU A ASIGURA UNICITATEA:
1) ADAPTARE TONALĂ:
   - Determină tipul locației din nume și descrierea de bază (cafenea studențească, cafenea literară, restaurant rafinat, pub, fast-food, bistro vegan etc.).
   - Dacă este cafenea studențească sau lângă campus: ton vibrant, accesibil, energic.
   - Dacă este restaurant rafinat / trattorie elegantă: ton rafinat, elegant, orientat pe experiență culinară.
   - Dacă este pub sau bar: ton distractiv, gălăgios, social.

2) FĂRĂ CLIȘEE REPETITIVE:
   - Nu începe frazele cu "Acest loc", "Acest restaurant", "Restaurantul este", "Locația oferă", "Aici poți".
   - Variază structura propozițiilor și punctul de plecare (atmosferă, clientelă, sunet, lumină, miros, moment al zilei).

3) DETALII SENZORIALE:
   - Pornește de la nume și descrierea de bază pentru a imagina mirosuri, lumini și sunete specifice.
   - Dacă apare ceva de tip "cuptor cu lemne" sau referințe la pizza/paste: menționează mirosul de lemn ars, aluat copt sau sos de roșii.
   - Dacă este ceainărie sau cafenea: vorbește despre aroma boabelor de cafea, aburul ceaiului, sunetul ceștilor.
   - Dacă este lângă mare: descrie briza, sunetul valurilor sau reflexia luminii pe apă.

4) LOCALIZARE ȘI VIBE:
   - Dacă din nume sau descriere reiese că e "lângă campus" sau zonă studențească: accent pe energie tânără, agitație, conversații animate.
   - Dacă este în centru, aproape de piață sau de o zonă istorică: accent pe atmosferă urbană, plină de viață, sau pe farmec istoric.
   - Integrează subtil orașul în descriere (de ex.: "în ritmul alert al Bucureștiului", "în liniștea Sibiului vechi").

5) LUNGIME:
   - Scrie DOAR 3-4 fraze noi (fără descrierea de bază), suficient de detaliate dar nu exagerat de lungi.

CERINȚE FINALE:
- Scrie DOAR CONTINUAREA, nu copia descrierea de bază.
- Folosește româna, stil natural, ca într-un ghid turistic premium.
- Fii foarte specific și evită repetițiile evidente față de descrierea de bază.
- Nu adăuga titluri, bullet points sau explicații despre ce faci.

RĂSPUNDE DOAR CU ACESTE 3-4 FRAZE NOI (fără descrierea de bază).`;

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
          generationConfig: {
            temperature: 0.85, // Higher temperature for more variation
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024, // Allow longer responses
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', response.status, errorData);
      
      if (response.status === 400) {
        throw new Error(`API key invalid sau cerere incorectă: ${errorData.error?.message || 'Bad Request'}`);
      } else if (response.status === 403) {
        throw new Error(`API key invalid sau fără permisiuni: ${errorData.error?.message || 'Forbidden'}`);
      } else if (response.status === 404) {
        throw new Error(`Endpoint not found (404). Verifică că API key-ul este valid.`);
      } else if (response.status === 429) {
        throw new Error('Prea multe cereri. Te rog așteaptă puțin.');
      }
      throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('API response data:', JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const fullResponse = data.candidates[0].content.parts[0].text.trim();
      
      // Remove base description from the response to get only the new part
      const newPartOnly = removeBaseDescription(fullResponse, baseDescription);
      
      return newPartOnly;
    }

    // Check for error in response
    if (data.error) {
      console.error('API returned error:', data.error);
      throw new Error(data.error.message || 'Eroare de la API');
    }

    throw new Error('Invalid response from AI');
  } catch (error: any) {
    console.error('AI detailed generation error:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Fallback: generate a unique, deterministic extra description based on name + base description
    return buildFallbackDetailedDescription(locationName, baseDescription);
  }
}

/**
 * Remove base description from full response to get only the new part
 */
function removeBaseDescription(fullResponse: string, baseDescription: string): string {
  // Normalize both strings for comparison (remove extra spaces, lowercase for matching)
  const normalizedBase = baseDescription.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedFull = fullResponse.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Try to find base description at the beginning of full response
  if (normalizedFull.startsWith(normalizedBase)) {
    // Remove base description from the beginning
    const remaining = fullResponse.substring(baseDescription.length).trim();
    
    // Remove common connecting words/phrases
    const cleaned = remaining
      .replace(/^[.,;:\s]+/g, '') // Remove leading punctuation/whitespace
      .replace(/^(Această|Aceasta|Acest|Acești|Această locație|Locația|Acest loc)/i, '')
      .trim();
    
    return cleaned || remaining;
  }
  
  // If base description is not at the start, try to find and remove it
  const baseIndex = normalizedFull.indexOf(normalizedBase);
  if (baseIndex !== -1) {
    const beforeBase = fullResponse.substring(0, baseIndex).trim();
    const afterBase = fullResponse.substring(baseIndex + baseDescription.length).trim();
    
    // Return the part after base description
    const cleaned = afterBase
      .replace(/^[.,;:\s]+/g, '')
      .replace(/^(Această|Aceasta|Acest|Acești|Această locație|Locația|Acest loc)/i, '')
      .trim();
    
    return cleaned || afterBase;
  }
  
  // If we can't find exact match, return full response (fallback)
  console.warn('Could not find base description in full response, returning full response');
  return fullResponse;
}

