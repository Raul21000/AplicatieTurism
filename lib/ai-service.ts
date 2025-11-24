// AI Service pentru generarea descrierilor cu vibe
// Folosește Google Gemini API (gratuit pentru studenți)

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
    // Analyze location name to create themed prompt
    const locationTheme = analyzeLocationTheme(locationName);
    
    const prompt = `Creează o descriere de bază (2-3 propoziții) pentru locația turistică "${locationName}" din România.

${locationTheme}

${originalDescription ? `Informații existente despre locație: "${originalDescription}"` : ''}

Creează o descriere de bază care să fie:
- 2-3 propoziții, concise dar informative
- Tematică și relevantă pentru numele locației "${locationName}"
- Include informații despre caracteristicile distinctive, istorie sau context cultural (dacă e relevant)
- Descrie ce face această locație specială și de ce merită vizitată
- Scrisă în română, stil informativ dar accesibil
- Fii specific și oferă detalii concrete despre locație

Răspunde DOAR cu descrierea de bază, fără titluri sau explicații suplimentare.`;

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
            temperature: 0.7,
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
- Istoria și perioada de construcție
- Arhitectura și stilul arhitectonic
- Legende și povești asociate
- Importanța strategică sau culturală
- Ce poți vedea și explora acolo`;
  }
  
  // Monastery/Church themes
  if (name.includes('mănăstire') || name.includes('biseric') || name.includes('schit')) {
    return `Această locație este un lăcaș de cult sau mănăstire. Concentrează-te pe:
- Istoria religioasă și fondarea
- Arhitectura și iconografia
- Importanța spirituală și culturală
- Artefacte și opere de artă
- Peisajul și locația geografică`;
  }
  
  // Natural/Mountain themes
  if (name.includes('munte') || name.includes('deal') || name.includes('pădure') || name.includes('lac') || name.includes('cascad')) {
    return `Această locație este o destinație naturală. Concentrează-te pe:
- Caracteristicile geografice și geologice
- Flora și fauna locală
- Trasee și activități disponibile
- Peisajul și vederile spectaculoase
- Sezonul ideal pentru vizitare`;
  }
  
  // City/Town themes
  if (name.includes('oraș') || name.includes('cetate') || name.includes('burg')) {
    return `Această locație este un oraș sau localitate istorică. Concentrează-te pe:
- Istoria și evoluția orașului
- Arhitectura și monumentele
- Cultura și tradițiile locale
- Atracțiile principale
- Atmosfera și vibe-ul locației`;
  }
  
  // Museum/Exhibition themes
  if (name.includes('muzeu') || name.includes('expoziție') || name.includes('galerie')) {
    return `Această locație este un muzeu sau spațiu expozițional. Concentrează-te pe:
- Colecțiile și exponatele
- Tema și scopul muzeului
- Importanța culturală și istorică
- Ce poți învăța și descoperi
- Experiența de vizitare`;
  }
  
  // Default theme
  return `Această locație este o destinație turistică din România. Concentrează-te pe:
- Caracteristicile unice și distinctive
- Istoria și contextul cultural
- Ce face locația specială
- Experiențe pe care le poți avea
- De ce merită vizitată`;
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
 * Generate a longer, more in-depth description that extends the base description
 * Uses the base description as context, but returns ONLY the new part (full response - base description)
 */
export async function generateDetailedDescription(
  locationName: string,
  baseDescription: string
): Promise<string> {
  // Check if API key is configured
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY' || GEMINI_API_KEY.length < 20) {
    console.error('GEMINI_API_KEY not configured properly');
    // Return fallback - only the new part (without base)
    return `Această locație oferă și multe alte oportunități de explorare și descoperire. Vizitatorii pot participa la tururi ghidate, evenimente culturale și activități sezoniere care aduc la viață istoria și tradițiile locale. Infrastructura turistică este bine dezvoltată, oferind facilități moderne care se integrează perfect cu autenticitatea locului.`;
  }

  try {
    const prompt = `Ai deja următoarea descriere de bază pentru locația turistică "${locationName}":

"${baseDescription}"

ACȚIUNE: Creează o descriere COMPLETĂ care include descrierea de bază și o extinde cu informații mai detaliate și profunde.

Creează o descriere completă (bază + extindere) care să includă:
- Descrierea de bază existentă (la început)
- Apoi adaugă 4-6 propoziții noi cu:
  * Detalii suplimentare despre atracții specifice și ce poți vedea/face acolo
  * Informații despre experiențe unice pe care le poți avea
  * Context istoric sau cultural mai profund
  * Informații practice: ce sezon e ideal, durata recomandată pentru vizită
  * Recomandări specifice pentru vizitatori
  * Detalii despre atmosfera și ce face locația să fie memorabilă

IMPORTANT:
- Începe cu descrierea de bază exactă (copiază-o)
- Apoi continuă natural cu informații noi
- Nu repeta informațiile deja menționate în descrierea de bază
- Fii specific și oferă detalii concrete
- Scrie în română, stil informativ dar accesibil
- Menține același ton și stil

Răspunde cu descrierea COMPLETĂ (bază + extindere), fără titluri sau explicații suplimentare.`;

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
            temperature: 0.7,
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
    
    // Fallback: return only the new part (without base)
    return `Această locație oferă și multe alte oportunități de explorare și descoperire. Vizitatorii pot participa la tururi ghidate, evenimente culturale și activități sezoniere care aduc la viață istoria și tradițiile locale. Infrastructura turistică este bine dezvoltată, oferind facilități moderne care se integrează perfect cu autenticitatea locului.`;
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

