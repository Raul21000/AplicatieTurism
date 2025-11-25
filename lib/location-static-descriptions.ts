// Static location descriptions provided by the user.
// These are shown on the details screen when a location is opened.

const STATIC_DESCRIPTIONS: Record<string, string> = {
  "The Literary Coffee House 'Citadel' (București)": "Un refugiu liniștit în inima orașului, perfect pentru cei care caută un loc de studiu sau lectură în tihnă. Atmosfera calmă este completată de un espresso excelent, preparat cu grijă. Este locul ideal pentru a te deconecta de agitația urbană și a te bucura de o carte bună.",
  "Restaurant 'The Old Inn' (Cluj-Napoca)": "Acest restaurant te întâmpină cu ospitalitatea specifică Ardealului și porții generoase de mâncare tradițională românească. Muzica populară live întregește atmosfera rustică, oferind o experiență autentică și voioasă. Este destinația perfectă pentru o masă copioasă alături de familie sau prieteni.",
  "The Global Wok Bistro (Timișoara)": "Un bistro vibrant și rapid, foarte apreciat de studenți pentru preparatele asiatice pline de gust. Meniul se concentrează pe mâncare gătită la wok, oferind o alternativă delicioasă și sățioasă la fast-food-ul clasic. Este locul ideal pentru o pauză de prânz energizantă și accesibilă.",
  "Café 'New World' (Iași)": "O locație cu un design modern și sofisticat, specializată în brunch-uri relaxate și cafea de specialitate. Sunt renumiți în tot orașul pentru prăjiturile și torturile lor delicioase, care arată la fel de bine precum gustă. Atmosfera chic o face perfectă pentru întâlniri sociale sau momente de răsfăț.",
  "Pizzeria 'Il Drago' (Brașov)": "Aici poți savura o pizza autentică, coaptă în cuptor cu lemne, folosind ingrediente de calitate importate din Italia. Spațiul generos și atmosfera prietenoasă fac din acest loc o alegere excelentă pentru grupurile mari. Este un colț de Italia adus chiar la poalele Tâmpei.",
  "Vegan Restaurant 'The Green Garden' (București)": "Un paradis pentru cei care adoptă un stil de viață sănătos, oferind un meniu creativ bazat exclusiv pe plante. Smoothie-urile proaspete și supele creme sunt vedetele meniului, fiind pline de nutrienți și culoare. Atmosfera este una fresh și luminoasă, reflectând prospețimea ingredientelor folosite.",
  "Coffee Shop 'By The Faculty' (Cluj-Napoca)": "Situată strategic lângă campus, această cafenea este punctul de întâlnire zilnic al studenților clujeni. Meniul de prânz este conceput să fie rapid și foarte prietenos cu bugetul, fără a compromite gustul. Este locul unde energia tinerilor se îmbină cu aroma cafelei proaspete.",
  "Burger Shack (București)": "Dacă ești în căutarea burgerilor artizanali, acesta este locul unde carnea de vită Black Angus este gătită la perfecțiune. Localul are un vibe urban și relaxat, fiind renumit pentru combinațiile inedite de sosuri și ingrediente. O experiență culinară obligatorie pentru orice iubitor de burgeri din capitală.",
  "Tea House 'Sunset' (Sibiu)": "O oază de calm în centrul Sibiului, unde timpul pare să stea în loc printre aromele a peste 50 de tipuri de ceai. Muzica ambientală și decorul intim creează cadrul perfect pentru conversații liniștite sau momente de introspecție. Este locul ideal pentru a te relaxa după o plimbare prin oraș.",
  "Restaurant Pescaresc 'The Sea' (Constanța)": "Situat chiar pe malul mării, acest restaurant oferă o priveliște superbă care completează perfect preparatele din pește și fructe de mare. Ingredientele sunt mereu proaspete, aducând gustul autentic al Mării Negre direct în farfurie. Este locația ideală pentru o cină romantică sau o masă festivă cu specific marin.",
  "Bistro 'At The Forest' (Oradea)": "Un bistro elegant ce propune un meniu internațional rafinat, servit pe o terasă înconjurată de verdeață. Atmosfera este intimă și romantică, fiind o alegere populară pentru cuplurile care doresc o seară specială. Calitatea serviciilor și a preparatelor transformă orice vizită într-o experiență memorabilă.",
  "Gaming Coffee Shop 'Restart' (Galați)": "Locul perfect pentru socializare și distracție, combinând aroma cafelei cu o colecție impresionantă de board games și console. Este un spațiu plin de energie, unde prietenii se adună pentru a concura și a se relaxa împreună. O alternativă excelentă la ieșirile clasice în oraș.",
  "Trattoria 'Bella Vita' (Craiova)": "Această trattorie aduce spiritul mediteranean în Craiova prin pastele de casă delicioase și o selecție atentă de vinuri italienești. Atmosfera este caldă și primitoare, te face să te simți ca într-o mică vacanță în Italia. Este locul unde simplitatea și gustul bun sunt la ele acasă.",
  "Bread and Coffee (Ploiești)": "O brutărie artizanală care te atrage instantaneu cu mirosul de pâine proaspăt scoasă din cuptor și cafea de specialitate. Este destinația ideală pentru un mic dejun delicios sau o gustare rapidă de calitate. Produsele de patiserie sunt pregătite cu pasiune, oferind un început de zi perfect.",
  "Fast-Food 'Döner King' (Timișoara)": "Cunoscut pentru cel mai bun Döner Kebab și Shawarma din zonă, acest loc este salvarea studenților după cursuri lungi. Servirea este rapidă, iar porțiile sunt consistente și gustoase, potolind orice foame. Este un punct de reper pentru mâncarea stradală de calitate în Timișoara.",
  "Restaurant 'The Citadel' (Târgu Mureș)": "Amplasat lângă Cetatea Medievală, restaurantul oferă o incursiune culinară în bucătăria tradițională transilvăneană. Decorul rustic și preparatele locale creează o atmosferă istorică și autentică. Este locul unde tradiția se întâlnește cu ospitalitatea într-un cadru de poveste.",
  "Smoothie Bar 'Energy' (Alba Iulia)": "Un bar modern dedicat sănătății, unde poți savura sucuri naturale, smoothie-uri și boluri de acai pline de vitamine. Este opțiunea perfectă pentru un boost de energie în timpul zilei sau după un antrenament. Ingredientele proaspete garantează o explozie de gust și vitalitate.",
  "Restaurant 'Grandma's House' (Brașov)": "Aici găsești gustul inconfundabil al mâncării gătite \"ca la mama acasă\", într-un cadru simplu și primitor. Meniul de prânz este foarte accesibil și variat, fiind preferat de localnici pentru pauza de masă. Este locul unde te simți răsfățat cu preparate calde și sățioase.",
  "Irish Pub 'The Shamrock' (Iași)": "Un pub autentic, plin de viață, unde berea artizanală curge valuri, iar serile de quiz și meciurile live sunt la ordinea zilei. Atmosfera este mereu prietenoasă și zgomotoasă, tipică unui pub studențesc de succes. Este locul ideal pentru a petrece o seară distractivă alături de gașcă.",
  "Coffee Shop 'Zen' (Cluj-Napoca)": "O cafenea cu design minimalist care pune accent pe arta preparării cafelei și pe starea de bine a clienților. Muzica ambientală și decorul simplu creează spațiul perfect pentru relaxare, lucru sau conversații discrete. Este un refugiu urban modern pentru pasionații de cafea de calitate.",
};

/**
 * Normalize a location name so that we can match even if:
 * - the city in parentheses is missing or different,
 * - quotes / punctuation differ,
 * - there are diacritics or case differences.
 */
function normalizeLocationName(name: string): string {
  return name
    .toLowerCase()
    // Remove diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove anything in parentheses (usually the city)
    .replace(/\(.*?\)/g, '')
    // Remove quotes
    .replace(/['"’`]+/g, '')
    // Replace non-alphanumeric with spaces
    .replace(/[^a-z0-9]+/g, ' ')
    // Trim and collapse spaces
    .trim()
    .replace(/\s+/g, ' ');
}

export function getStaticDescriptionForLocation(name: string): string | null {
  const normalizedTarget = normalizeLocationName(name);

  for (const key of Object.keys(STATIC_DESCRIPTIONS)) {
    const normalizedKey = normalizeLocationName(key);
    if (normalizedKey === normalizedTarget) {
      return STATIC_DESCRIPTIONS[key];
    }
  }

  return null;
}

