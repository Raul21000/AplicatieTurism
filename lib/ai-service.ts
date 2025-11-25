// AI Service pentru generarea descrierilor cu vibe
// Folosește Google Gemini API (gratuit pentru studenți)
// IMPORTANT: cheia NU mai are fallback hardcodat; trebuie setată doar prin .env

import { getFormattedAppContext } from './app-context';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''; // Setează EXPO_PUBLIC_GEMINI_API_KEY în .env
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

  const nameLower = locationName.toLowerCase();

  // Determine a coarse "type" of place from its name
  let type: 'pub' | 'coffee' | 'italian' | 'vegan' | 'fastfood' | 'bistro' | 'generic' = 'generic';
  if (nameLower.includes('pub') || nameLower.includes('bar') || nameLower.includes('shamrock')) {
    type = 'pub';
  } else if (
    nameLower.includes('coffee') ||
    nameLower.includes('cafe') ||
    nameLower.includes('caf\u00e9') ||
    nameLower.includes('tea') ||
    nameLower.includes('ceai')
  ) {
    type = 'coffee';
  } else if (
    nameLower.includes('pizzeria') ||
    nameLower.includes('trattoria') ||
    nameLower.includes('pizza') ||
    nameLower.includes('ristorante')
  ) {
    type = 'italian';
  } else if (nameLower.includes('vegan') || nameLower.includes('green')) {
    type = 'vegan';
  } else if (nameLower.includes('d\u00f6ner') || nameLower.includes('doner') || nameLower.includes('fast-food')) {
    type = 'fastfood';
  } else if (nameLower.includes('bistro')) {
    type = 'bistro';
  }

  // Simple deterministic hash from name to pick a variant
  const hash =
    locationName
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 3;

  switch (type) {
    case 'coffee':
      if (hash === 0) {
        return (
          `În minte rămâne mai ales felul în care miroase aerul când deschizi ușa la „${locationName}”: ` +
          `amestec de cafea proaspăt râșnită și dulciuri scoase din cuptor, exact cum sugerează descrierea inițială („${baseHint}”). ` +
          `Zumzetul de conversații și clinchetul ceștilor creează un fundal sonor cald, ` +
          `iar lumina filtrată prin geamuri transformă mesele din colț în locuri perfecte pentru lucru, povești sau introspecție.`
        );
      } else if (hash === 1) {
        return (
          `Primele minute petrecute în „${locationName}” trec aproape neobservate, ` +
          `pentru că atenția îți este furată de rafturile cu căni, de espressorul care toarce constant și de mirosul dens de cafea tare. ` +
          `Descrierea de bază („${baseHint}”) prinde viață în detaliile mici: barista care știe deja comanda clienților fideli, ` +
          `laptopurile aliniate pe mese și senzația că aici ai putea petrece ore întregi fără să observi cum trece timpul.`
        );
      } else {
        return (
          `„${locationName}” funcționează ca un mic nod social al cartierului, ` +
          `unde aroma boabelor prăjite și sunetul espressoarelor se împletesc cu discuțiile în șoaptă de la mesele din colț. ` +
          `Continuând ideea din descrierea inițială („${baseHint}”), locul pare gândit atât pentru studiu, cât și pentru întâlniri improvizate, ` +
          `iar fiecare colțișor are propria lui poveste, de la mesele lângă priză la fotoliile rezervate cititorilor împătimiți.`
        );
      }

    case 'pub':
      if (hash === 0) {
        return (
          `Pe măsură ce se lasă seara, „${locationName}” se umple de râsete, muzică dată un pic prea tare și pahare care ciocnesc ritmic, ` +
          `continuând atmosfera sugerată de descrierea de bază („${baseHint}”). ` +
          `E genul de loc în care e greu să stai singur la bar prea mult timp, pentru că în câteva minute intri deja în vorbă cu cineva, ` +
          `iar povestitul se întinde până târziu în noapte.`
        );
      } else if (hash === 1) {
        return (
          `Lumina caldă, lemnul închis la culoare și muzica de fundal transformă „${locationName}” într-un decor perfect pentru seri lungi cu gașca. ` +
          `Descrierea ta inițială („${baseHint}”) prinde aici un plus de culoare prin micile ritualuri ale casei: ` +
          `quiz nights, meciuri urmărite la ecrane mari și momentele în care tot localul cântă aceeași piesă.`
        );
      } else {
        return (
          `Dacă treci pe lângă „${locationName}” într-o vineri seară, auzi din stradă mixul de voci, muzică și veselie ` +
          `care confirmă tot ce spune descrierea de bază („${baseHint}”). ` +
          `Aici nu vii neapărat pentru liniște sau pentru mâncare sofisticată, ci pentru energia unui pub adevărat, ` +
          `unde mesele se lungesc, glumele circulă repede și nopțile se termină mai târziu decât ai planificat.`
        );
      }

    case 'italian':
      if (hash === 0) {
        return (
          `În spatele numelui „${locationName}” se ascunde genul acela de local unde mirosul de aluat copt și sos de roșii te lovește imediat ce intri. ` +
          `Descrierea inițială („${baseHint}”) e completată de imaginea cuptoarelor încins, a pizzei scoase direct pe lemn și a discuțiilor animate dintre mese, ` +
          `care dau impresia unei seri petrecute într-o trattorie mică din Italia.`
        );
      } else if (hash === 1) {
        return (
          `„${locationName}” se joacă cu toate clișeele bune ale unei seri italiene: ` +
          `pahare de vin care se ciocnesc discret, farfurii colorate pline cu paste și pizza și un zumzet constant de conversații. ` +
          `Dincolo de descrierea de bază („${baseHint}”), locul câștigă prin ritmul lui relaxat, ` +
          `unde mesele nu se grăbesc, iar desertul pare mereu o idee bună.`
        );
      } else {
        return (
          `Dacă închizi ochii câteva secunde în „${locationName}”, ` +
          `ai putea jura că ești într-o străduță aglomerată din Roma sau Napoli: ` +
          `tacâmuri care se lovesc de farfurii, miros de busuioc și ulei de măsline, fragmente de conversații în mai multe limbi. ` +
          `Toate aceste detalii dau profunzime imaginilor conturate deja în descrierea de bază („${baseHint}”).`
        );
      }

    case 'vegan':
      if (hash === 0) {
        return (
          `„${locationName}” arată exact cum îți imaginezi un loc dedicat celor care caută mâncare pe bază de plante: ` +
          `multă lumină naturală, culori deschise și farfurii care arată ca niște mici tablouri. ` +
          `Descrierea inițială („${baseHint}”) se continuă cu smoothie bowl-uri intense la culoare, sucuri fresh și detalii de lemn și plante verzi care dau spațiului un aer proaspăt.`
        );
      } else if (hash === 1) {
        return (
          `În „${locationName}” se aud mai degrabă râsete și conversații relaxate decât zgomotul tacâmurilor grele, ` +
          `pentru că totul aici gravitează în jurul ideii de lejeritate și energie bună. ` +
          `Pornind de la descrierea de bază („${baseHint}”), poți să-ți imaginezi mesele pline de boluri colorate, ` +
          `meniuri scrise cu markere pe tăblițe negre și oameni care stau la povești după antrenament sau după birou.`
        );
      } else {
        return (
          `Atmosfera din „${locationName}” e genul acela care te face să uiți că tot ce e în farfurie e vegan: ` +
          `miros de ierburi aromatice, plating atent și combinații de texturi care contrazic prejudecata că „mâncarea sănătoasă e plictisitoare”. ` +
          `Descrierea inițială („${baseHint}”) se transformă astfel într-o experiență completă, ` +
          `unde fiecare preparat pare gândit să arate bine pe Instagram, dar și să te țină sătul până seara.`
        );
      }

    case 'fastfood':
      if (hash === 0) {
        return (
          `La orele de vârf, „${locationName}” funcționează ca un mic mecanism bine uns: ` +
          `comenzi strigate rapid, miros de carne la rotisor și cartofi prăjiți, tăvi care se mișcă într-un flux continuu. ` +
          `Descrierea ta de bază („${baseHint}”) e completată de imaginea studenților sau trecătorilor grăbiți ` +
          `care își iau porția consistentă înainte să fugă mai departe prin oraș.`
        );
      } else if (hash === 1) {
        return (
          `„${locationName}” nu se preface a fi altceva decât este: ` +
          `un loc unde porțiile sunt mari, gusturile intense și mâncarea ajunge repede în fața ta. ` +
          `Continuând vibe-ul din descrierea inițială („${baseHint}”), ` +
          `zgomotul de coji de cartofi care se prăjesc și de sosuri turnate generos peste carne creează un soundtrack specific de fast-food apreciat de localnici.`
        );
      } else {
        return (
          `Când foamea e mare și timpul puțin, „${locationName}” sare în evidență cu mirosul inconfundabil de kebab proaspăt și lipie caldă. ` +
          `Descrierea de bază („${baseHint}”) prinde și mai mult sens când vezi șirul de oameni de la tejghea seara târziu, ` +
          `fiecare cu propria variantă preferată de sosuri și toppinguri.`
        );
      }

    case 'bistro':
      if (hash === 0) {
        return (
          `„${locationName}” are ritmul lui propriu: ` +
          `dimineața cu mic dejunuri lente și cafele lungi, seara cu pahare de vin și farfurii atent aranjate. ` +
          `Descrierea inițială („${baseHint}”) e completată de atmosfera intimă și de lumina caldă ` +
          `care transformă bistroul într-un loc unde conversațiile curg natural și timpul pare să încetinească.`
        );
      } else if (hash === 1) {
        return (
          `Meniul de la „${locationName}” pare gândit pentru cei care se plictisesc repede de aceleași feluri de mâncare: ` +
          `câteva preparate bine alese, schimbate sezonier, și o atenție specială la plating. ` +
          `Pe lângă ce ai descris deja („${baseHint}”), bistroul câștigă prin senzația că te afli într-un loc „mic, dar serios” despre ceea ce pune în farfurie.`
        );
      } else {
        return (
          `În „${locationName}”, zgomotul de fundal e un mix plăcut de tacâmuri, muzică discretă și fragmente de conversații, ` +
          `tipic pentru un bistro care a găsit echilibrul între casual și rafinat. ` +
          `Descrierea de bază („${baseHint}”) e doar punctul de plecare pentru o experiență în care ` +
          `poți veni la prânz pentru un meniu rapid sau seara pentru o cină ceva mai specială.`
        );
      }

    case 'generic':
    default:
      if (hash === 0) {
        return (
          `„${locationName}” nu încearcă să fie altceva decât ceea ce descrierea de bază sugerează („${baseHint}”), ` +
          `dar tocmai sinceritatea asta îl face memorabil. ` +
          `Decorul, luminile și felul în care se așază oamenii la mese dau locului un caracter propriu, ` +
          `ușor de recunoscut după doar câteva vizite.`
        );
      } else if (hash === 1) {
        return (
          `Ceea ce începe ca o simplă oprire la „${locationName}” se transformă adesea într-o pauză mai lungă decât ai planificat, ` +
          `pentru că spațiul te prinde cu atmosfera lui și cu micile detalii observate doar de aproape. ` +
          `Descrierea inițială („${baseHint}”) e doar schița; restul vine din lumină, zgomot și felul în care locul este trăit de cei care îl vizitează.`
        );
      } else {
        return (
          `Fiecare oraș are câteva locuri care devin repere fără să-și propună asta, iar „${locationName}” ` +
          `pare să fie unul dintre ele. ` +
          `Pornind de la ceea ce ai menționat deja în descriere („${baseHint}”), ` +
          `spațiul se completează cu senzațiile greu de pus în cuvinte: aerul, luminile, vocile și mirosul specific care te întâmpină de la primii pași.`
        );
      }
  }
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
    
    // Different creative angles to force variety between locations
    const angles = [
      'descrie atmosfera serii de vineri văzută prin ochii unui student obosit după cursuri',
      'povestește locul ca și cum ai recomanda unui cuplu la prima întâlnire în oraș',
      'privește totul din perspectiva unui turist străin pasionat de gastronomie locală',
      'concentrează-te pe detaliile vizuale și sonore care te lovesc când intri prima dată',
      'scrie ca un foodie pretențios care compară locul cu cele mai bune adrese din oraș',
      'descrie-l ca pe refugiul secret al unui localnic care vine aici de ani de zile',
      'abordează-l ca pe un loc „de după muncă”, unde oamenii scapă de stresul zilei',
      'gândește-l ca pe un hotspot studențesc, plin de discuții, laptopuri și căni de cafea',
    ];
    const randomAngle = angles[Math.floor(Math.random() * angles.length)];

    const prompt = `Ești un scriitor creativ de travel, cunoscut pentru stilul neconvențional.



DATE INTRARE:

- Nume locație: "${locationName}"

- Descriere tehnică (bază): "${baseDescription}"

- Oraș/Zonă: Dedu din contextul locației.



SARCINA TA UNICĂ:
Scrie o continuare de 3-4 fraze care completează descrierea de bază, DAR privită prin următoarea lentilă specifică:

👉 UNGHI DE ABORDARE: ${randomAngle}



REGULI CRITICE (Anti-Repetiție):
1. NU repeta informația din descrierea de bază. Dacă scrie deja că e pizza, tu descrie gustul, nu faptul că au pizza.
2. INTERZIS să începi frazele cu subiectul standard ("Locația", "Restaurantul", "Această cafenea", "Aici"). Începe direct cu acțiunea, detaliul vizual sau senzația.
3. EVITĂ cuvintele de umplutură tipice ghidurilor slabe: "situat", "amplasat", "oază de liniște", "personal amabil", "te îmbie". Fii specific, nu generic.
4. Daca unghiul de abordare cere poezie, fii poetic. Daca cere pragmatism, fii direct. Respectă strict tonul impus mai sus.



CONTEXT (Dacă e relevant pentru atmosferă):
${appContext}



RĂSPUNDE DOAR CU TEXTUL GENERAT (fără ghilimele, fără introduceri).`;

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

